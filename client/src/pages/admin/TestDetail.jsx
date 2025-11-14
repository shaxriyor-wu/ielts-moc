import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const TestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTest();
  }, [id]);

  const loadTest = async () => {
    try {
      const response = await adminApi.getTest(id);
      setTest(response.data);
    } catch (error) {
      showToast('Failed to load test', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="secondary" onClick={() => navigate('/admin/tests')} className="mb-4">
            Back
          </Button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{test?.title}</h2>
        </div>
        <div className="flex gap-2">
          {!test?.isActive ? (
            <Button variant="success" onClick={() => {
              adminApi.startTest(id).then(() => {
                showToast('Test started', 'success');
                loadTest();
              });
            }}>
              Start Test
            </Button>
          ) : (
            <Button variant="danger" onClick={() => {
              adminApi.stopTest(id).then(() => {
                showToast('Test stopped', 'success');
                loadTest();
              });
            }}>
              Stop Test
            </Button>
          )}
        </div>
      </div>

      <Card title="Test Information">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Description:</span>
            <span className="text-gray-900 dark:text-white">{test?.description}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Duration:</span>
            <span className="text-gray-900 dark:text-white">{test?.duration} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              test?.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {test?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TestDetail;
