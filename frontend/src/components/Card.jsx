import { motion } from 'framer-motion';

const Card = ({ children, className = '', title, actions, hover = false, onClick }) => {
  const Component = onClick ? motion.div : 'div';
  const props = onClick ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    onClick,
    className: 'cursor-pointer',
  } : {};

  return (
    <Component
      {...props}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${hover ? 'hover:shadow-lg transition-shadow' : ''} ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </Component>
  );
};

export default Card;
