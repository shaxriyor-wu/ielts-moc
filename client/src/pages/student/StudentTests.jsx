import { useEffect, useState } from 'react';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const response = await studentApi.getAllTests();
      setTests(response.data || []);
    } catch (error) {
      showToast('Failed to load tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTest = async (testKey) => {
    try {
      const response = await studentApi.joinTest(testKey);
      if (response.data.status === 'waiting') {
        showToast('Test boshlanishini kutib turing...', 'info');
        checkTestStatus(testKey);
      } else {
        navigate(`/exam/${testKey}`);
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to join test', 'error');
    }
  };

  const checkTestStatus = async (testKey) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await studentApi.checkTestStatus(testKey);
        if (response.data.isActive) {
          clearInterval(interval);
          showToast('Test boshlandi!', 'success');
          navigate(`/exam/${testKey}`);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          showToast('Test hali boshlanmadi', 'warning');
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }
    }, 2000);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Tests</h2>
      </div>

      {tests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No tests available</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {tests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {test.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration || 180} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.isActive ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleJoinTest(test.testKey)}
                  disabled={!test.testKey}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {test.isActive ? 'Start Test' : 'Join Test'}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTests;
