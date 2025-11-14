import { motion } from 'framer-motion';

const Progress = ({ value, max = 100, className = '', showLabel = false }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
          className="bg-primary-600 h-2 rounded-full"
        />
      </div>
    </div>
  );
};

export default Progress;
