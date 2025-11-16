import { useEffect, useState } from 'react';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import { Clock, Loader as LoaderIcon } from 'lucide-react';
import { showToast } from '../../components/Toast';

const WaitingRoom = ({ queueStatus, onStatusUpdate, onStartTest }) => {
  const [preparationTime, setPreparationTime] = useState(60);
  const [status, setStatus] = useState(queueStatus?.status || 'waiting');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await studentApi.checkQueueStatus();
        const newStatus = response.data.status;
        setStatus(newStatus);
        onStatusUpdate(response.data);

        if (newStatus === 'preparation' && response.data.preparation_time_remaining !== undefined) {
          setPreparationTime(response.data.preparation_time_remaining);
        }

        // If preparation time is over, start test
        if (newStatus === 'preparation' && response.data.preparation_time_remaining <= 0) {
          setTimeout(() => {
            handleStartTest();
          }, 1000);
        }
        
        if (newStatus === 'started') {
          handleStartTest();
        }
      } catch (error) {
        console.error('Failed to check queue status:', error);
      }
    };

    // Check status every second
    const interval = setInterval(checkStatus, 1000);

    // Also check immediately
    checkStatus();

    return () => clearInterval(interval);
  }, [onStatusUpdate, onStartTest]);

  const handleStartTest = async () => {
    try {
      await studentApi.startTest();
      onStartTest();
    } catch (error) {
      // If already started or error, just proceed
      onStartTest();
    }
  };

  useEffect(() => {
    if (status === 'preparation' && preparationTime > 0) {
      const timer = setInterval(() => {
        setPreparationTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Start test when countdown reaches 0
            setTimeout(() => {
              handleStartTest();
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-2xl w-full text-center">
        {status === 'waiting' && (
          <div className="py-12">
            <LoaderIcon className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 animate-spin mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Test Starting Soon
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              Please Wait
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You will be assigned a test variant shortly...
            </p>
          </div>
        )}

        {status === 'assigned' && (
          <div className="py-12">
            <LoaderIcon className="w-16 h-16 mx-auto text-green-600 dark:text-green-400 animate-spin mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Test Assigned
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Preparing to start...
            </p>
          </div>
        )}

        {status === 'preparation' && (
          <div className="py-12">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
              <Clock className="w-16 h-16 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Preparation Time
            </h2>
            <div className="text-6xl font-mono font-bold text-primary-600 dark:text-primary-400 mb-4">
              {formatTime(preparationTime)}
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              The test will begin automatically when the timer reaches 0:00
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Please prepare yourself and ensure you have a quiet environment
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WaitingRoom;

