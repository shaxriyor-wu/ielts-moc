import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { Home, BookOpen, Key, Users, BarChart3, Settings } from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const sidebarItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { path: '/admin/tests', label: 'Tests', icon: <BookOpen className="w-5 h-5" /> },
    { path: '/admin/generate-key', label: 'Generate Key', icon: <Key className="w-5 h-5" /> },
    { path: '/admin/students', label: 'Students', icon: <Users className="w-5 h-5" /> },
    { path: '/admin/results', label: 'Results', icon: <BarChart3 className="w-5 h-5" /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar items={sidebarItems} onLogout={handleLogout} title="Admin Panel" />
      <div className="flex-1 flex flex-col">
        <Topbar title="Admin Dashboard" user={user} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
