import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { Home, User, BookOpen, Award } from 'lucide-react';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { path: '/student/profile', label: 'My Profile', icon: <User className="w-5 h-5" /> },
    { path: '/student/tests', label: 'Available Tests', icon: <BookOpen className="w-5 h-5" /> },
    { path: '/student/results', label: 'My Results', icon: <Award className="w-5 h-5" /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar items={sidebarItems} onLogout={handleLogout} title="Student Panel" />
      <div className="flex-1 flex flex-col">
        <Topbar title="Student Dashboard" user={user} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
