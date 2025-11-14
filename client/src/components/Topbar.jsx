import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Topbar = ({ title, user, actions }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        <div className="flex items-center gap-4">
          {actions}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{user.name || user.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
