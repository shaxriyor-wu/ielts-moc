import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/Button';
import { AlertCircle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

const ErrorPage = ({ 
  statusCode, 
  title, 
  message, 
  icon: Icon = AlertCircle,
  showHomeButton = true,
  showBackButton = true,
  showRefreshButton = false 
}) => {
  const navigate = useNavigate();

  const getStatusColor = (code) => {
    if (code === 400) return 'text-yellow-600 dark:text-yellow-400';
    if (code === 404) return 'text-blue-600 dark:text-blue-400';
    if (code === 500) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getStatusBg = (code) => {
    if (code === 400) return 'bg-yellow-50 dark:bg-yellow-900/20';
    if (code === 404) return 'bg-blue-50 dark:bg-blue-900/20';
    if (code === 500) return 'bg-red-50 dark:bg-red-900/20';
    return 'bg-gray-50 dark:bg-gray-900/20';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getStatusBg(statusCode)} mb-8`}
        >
          <Icon className={`w-16 h-16 ${getStatusColor(statusCode)}`} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-8xl font-bold ${getStatusColor(statusCode)} mb-4`}
        >
          {statusCode}
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-semibold text-gray-900 dark:text-white mb-4"
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto"
        >
          {message}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          {showBackButton && (
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          )}

          {showHomeButton && (
            <Button
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          )}

          {showRefreshButton && (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;

