import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { showToast } from '../components/Toast';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch users from API
    const fetchUsers = useCallback(async () => {
        // Only admins can fetch users
        const currentUserStr = localStorage.getItem('user');
        if (!currentUserStr) return;

        try {
            const currentUser = JSON.parse(currentUserStr);
            if (currentUser.role !== 'admin') return;

            setLoading(true);
            const response = await adminApi.getStudents();
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            // Don't toast for 403s on auto-fetch
            if (error.response?.status !== 403) {
                showToast('Failed to load users', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Add new user
    const addUser = useCallback(async (userData) => {
        try {
            const response = await adminApi.createUser(userData);
            const newUser = response.data;

            // Update local state or refetch
            setUsers(prev => [newUser, ...prev]);
            return newUser;
        } catch (error) {
            console.error('Add user error:', error);
            throw error; // Re-throw to be handled by component
        }
    }, []);

    // Update existing user
    const updateUser = useCallback(async (userId, updates) => {
        try {
            const response = await adminApi.updateUser(userId, updates);
            const updatedUser = response.data;

            setUsers(prev => prev.map(user =>
                user.id === userId ? updatedUser : user
            ));
            return updatedUser;
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    }, []);

    // Delete user
    const deleteUser = useCallback(async (userId) => {
        try {
            await adminApi.deleteUser(userId);
            setUsers(prev => prev.filter(user => user.id !== userId));
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }, []);

    // Toggle user status
    const toggleUserStatus = useCallback(async (userId) => {
        try {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            const newStatus = user.status === 'active' ? 'inactive' : 'active';
            const response = await adminApi.updateUser(userId, { status: newStatus });
            const updatedUser = response.data;

            setUsers(prev => prev.map(u =>
                u.id === userId ? updatedUser : u
            ));
        } catch (error) {
            console.error('Toggle status error:', error);
            showToast('Failed to update status', 'error');
        }
    }, [users]);

    // Regenerate test code for user
    const regenerateTestCode = useCallback(async (userId) => {
        try {
            // Assuming generic generate code endpoint or implementing user specific one later
            // For now, we mock this as stored locally or implment endpoint if needed
            // Currently using mock generator as placeholder until backend endpoint exists for user code
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            showToast(`Generated new code locally: ${newCode}`, 'info');
            return newCode;
        } catch (error) {
            console.error('Regenerate code error:', error);
            throw error;
        }
    }, []);

    // Get filtered users based on search query
    const getFilteredUsers = useCallback(() => {
        if (!searchQuery.trim()) return users;

        const query = searchQuery.toLowerCase();
        return users.filter(user =>
            user.username.toLowerCase().includes(query) ||
            (user.name && user.name.toLowerCase().includes(query)) ||
            (user.email && user.email.toLowerCase().includes(query))
        );
    }, [users, searchQuery]);

    // Get user by ID
    const getUserById = useCallback((userId) => {
        return users.find(user => user.id === userId);
    }, [users]);

    // Get user by username
    const getUserByUsername = useCallback((username) => {
        return users.find(user => user.username.toLowerCase() === username.toLowerCase());
    }, [users]);

    return (
        <UserContext.Provider value={{
            users,
            loading,
            searchQuery,
            setSearchQuery,
            addUser,
            updateUser,
            deleteUser,
            toggleUserStatus,
            regenerateTestCode,
            getFilteredUsers,
            getUserById,
            getUserByUsername,
            refreshUsers: fetchUsers
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUsers = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUsers must be used within UserProvider');
    }
    return context;
};
