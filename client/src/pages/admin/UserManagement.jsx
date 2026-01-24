import { useState, useMemo, useEffect } from 'react';
import { useUsers } from '../../context/UserContext';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import {
    UserPlus,
    Search,
    Trash2,
    CheckCircle,
    XCircle,
    Users,
    Wifi
} from 'lucide-react';

const UserManagement = () => {
    const {
        searchQuery,
        setSearchQuery,
        addUser,
        deleteUser,
        getFilteredUsers,
        users,
    } = useUsers();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [onlineUsers, setOnlineUsers] = useState(0);

    const filteredUsers = useMemo(() => getFilteredUsers(), [getFilteredUsers]);

    // Form validation
    const validateForm = () => {
        const errors = {};

        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password.trim()) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 4) {
            errors.password = 'Password must be at least 4 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Reset form
    const resetForm = () => {
        setFormData({ username: '', password: '', fullName: '' });
        setFormErrors({});
        setSelectedUser(null);
    };

    // Handle create user
    const handleCreateUser = async () => {
        if (!validateForm()) return;

        try {
            const newUser = await addUser(formData);
            showToast(`User "${newUser.username}" created successfully!`, 'success');
            setShowCreateModal(false);
            resetForm();
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to create user';
            showToast(msg, 'error');
        }
    };

    // Handle delete user
    const handleDeleteUser = async () => {
        try {
            await deleteUser(selectedUser.id);
            showToast(`User "${selectedUser.username}" deleted`, 'success');
            setShowDeleteModal(false);
            resetForm();
        } catch (error) {
            showToast('Failed to delete user', 'error');
        }
    };

    // Open delete modal
    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    // Fetch online users count (simulated real-time with polling)
    useEffect(() => {
        const fetchOnlineUsers = async () => {
            try {
                const response = await adminApi.getOnlineUsers?.();
                setOnlineUsers(response?.data?.count || 0);
            } catch {
                // If endpoint doesn't exist yet, use 0
                setOnlineUsers(0);
            }
        };

        fetchOnlineUsers();
        const interval = setInterval(fetchOnlineUsers, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-7 h-7 text-primary-600" />
                        User Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Create and manage student accounts
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateModal(true);
                    }}
                    className="flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" />
                    Add New User
                </Button>
            </div>

            {/* Search and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by username or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <Card className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">All Users</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {users.length}
                        </p>
                    </div>
                </Card>
                <Card className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Online Users</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {onlineUsers}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {searchQuery ? 'No users found' : 'No users yet'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {searchQuery
                                ? 'Try adjusting your search terms'
                                : 'Click "Add New User" to create your first user account'}
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={() => {
                                    resetForm();
                                    setShowCreateModal(true);
                                }}
                                className="inline-flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add New User
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {user.username}
                                                </p>
                                                {user.fullName && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {user.fullName}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {user.status === 'active' ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3" />
                                                        Inactive
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => openDeleteModal(user)}
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Create User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    resetForm();
                }}
                title="Create New User"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder="Enter username"
                        />
                        {formErrors.username && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.username}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder="Enter password"
                        />
                        {formErrors.password && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowCreateModal(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateUser}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create User
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    resetForm();
                }}
                title="Delete User"
            >
                <div className="space-y-4">
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Are you sure?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            You are about to delete user <strong>{selectedUser?.username}</strong>.
                            This action cannot be undone.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteUser}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagement;
