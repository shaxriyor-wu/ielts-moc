import { motion } from 'framer-motion';

const Toggle = ({ enabled, onChange, label, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <motion.span
          animate={{
            x: enabled ? 20 : 2,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg"
        />
      </button>
    </div>
  );
};

export default Toggle;

