import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const AlertBanner = ({ type = 'info', message, onClose, className = '' }) => {
  const types = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`border rounded-lg p-4 ${config.bg} ${config.border} ${config.text} ${className}`}
        >
          <div className="flex items-start gap-3">
            <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className={`${config.text} hover:opacity-70 transition-opacity`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertBanner;

