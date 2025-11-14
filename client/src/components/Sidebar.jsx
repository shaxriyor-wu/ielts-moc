import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Sidebar = ({ items, onLogout, title = 'IELTS Platform' }) => {
  const location = useLocation();

  return (
    <div className="w-64 bg-gray-900 dark:bg-gray-950 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <nav className="mt-6 flex-1 px-3">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-3 rounded-lg mb-1 transition-colors relative ${
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-600 rounded-lg"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <div className="relative flex items-center gap-3">
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      {onLogout && (
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
