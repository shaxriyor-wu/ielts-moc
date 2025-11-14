import { useEffect, useState } from 'react';
import { ownerApi } from '../../api/ownerApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const OwnerTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const response = await ownerApi.getTests();
      setTests(response.data);
    } catch (error) {
      showToast('Failed to load tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type' },
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
      key: 'createdAt', 
      label: 'Created', 
      render: (value) => new Date(value).toLocaleDateString() 
    },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Tests</h2>
      <Card>
        <Table columns={columns} data={tests} />
      </Card>
    </div>
  );
};

export default OwnerTests;
