import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { CheckCircle, Award } from 'lucide-react';
import Loader from '../../components/Loader';

const Finish = () => {
  const { key } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Redirect to results page after 3 seconds
    const timer = setTimeout(() => {
      navigate('/student/results');
    }, 3000);

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev > 1 ? prev - 1 : 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

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
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your answers have been saved and submitted.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400">
              <Loader className="w-5 h-5" />
              <span className="text-sm font-medium">Processing your results...</span>
            </div>
          </motion.div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to results in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
            <Button
              onClick={() => navigate('/student/results')}
              className="w-full"
            >
              <Award className="w-4 h-4 mr-2" />
              View Results Now
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Finish;
