import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { Home, Users, BookOpen, Settings, BarChart3 } from 'lucide-react';

const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/owner/login');
  };

  const sidebarItems = [
    { path: '/owner/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { path: '/owner/admins', label: 'Admin Management', icon: <Users className="w-5 h-5" /> },
    { path: '/owner/students', label: 'Students', icon: <Users className="w-5 h-5" /> },
    { path: '/owner/tests', label: 'Tests', icon: <BookOpen className="w-5 h-5" /> },
    { path: '/owner/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar items={sidebarItems} onLogout={handleLogout} title="Owner Panel" />
      <div className="flex-1 flex flex-col">
        <Topbar title="Owner Dashboard" user={user} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;
