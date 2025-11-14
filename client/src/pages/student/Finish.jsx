import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { CheckCircle } from 'lucide-react';

const Finish = () => {
  const { key } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      logout();
      navigate('/exam-access');
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Test Submitted Successfully
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your answers have been saved and submitted.
            </p>
          </motion.div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You will be redirected to the login page in 10 seconds.
            </p>
            <Button 
              onClick={() => { logout(); navigate('/exam-access'); }} 
              className="w-full"
            >
              Return to Login
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Finish;
