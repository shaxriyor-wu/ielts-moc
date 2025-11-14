import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const AdminTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const response = await adminApi.getTests();
      setTests(response.data);
    } catch (error) {
      showToast('Failed to load tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id) => {
    try {
      await adminApi.startTest(id);
      showToast('Test started', 'success');
      loadTests();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to start test', 'error');
    }
  };

  const handleStop = async (id) => {
    try {
      await adminApi.stopTest(id);
      showToast('Test stopped', 'success');
      loadTests();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to stop test', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await adminApi.deleteTest(id);
      showToast('Test deleted', 'success');
      loadTests();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete test', 'error');
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/admin/tests/${row.id}`)}>
            View
          </Button>
          {!row.isActive ? (
            <Button size="sm" variant="success" onClick={() => handleStart(row.id)}>
              Start
            </Button>
          ) : (
            <Button size="sm" variant="danger" onClick={() => handleStop(row.id)}>
              Stop
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tests</h2>
        <Button onClick={() => navigate('/admin/tests/create')}>Create Test</Button>
      </div>

      <Card>
        <Table columns={columns} data={tests} />
      </Card>
    </div>
  );
};

export default AdminTests;
