import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Timer = ({ initialSeconds, onTimeout, autoSubmit = false, showWarning = true }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || seconds <= 0) {
      if (seconds <= 0 && onTimeout) {
        onTimeout();
        if (autoSubmit) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('autoSubmit'));
          }, 1000);
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, isRunning, onTimeout, autoSubmit]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getColor = () => {
    if (seconds < 300) return 'text-red-600 dark:text-red-400';
    if (seconds < 600) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-900 dark:text-gray-100';
  };

  const getBgColor = () => {
    if (seconds < 300) return 'bg-red-100 dark:bg-red-900';
    if (seconds < 600) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={`px-4 py-2 rounded-lg ${getBgColor()} ${getColor()} font-mono font-bold text-lg`}
    >
      {formatTime(seconds)}
    </motion.div>
  );
};

export default Timer;
