import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await adminApi.getResults();
      setResults(response.data);
    } catch (error) {
      showToast('Failed to load results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'testTitle', label: 'Test' },
    { key: 'testKey', label: 'Test Key' },
    {
      key: 'isSubmitted',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        }`}>
          {value ? 'Submitted' : 'In Progress'}
        </span>
      ),
    },
    { 
      key: 'startedAt', 
      label: 'Started', 
      render: (value) => new Date(value).toLocaleString() 
    },
    { 
      key: 'submittedAt', 
      label: 'Submitted', 
      render: (value) => value ? new Date(value).toLocaleString() : '-' 
    },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Results</h2>
      <Card>
        <Table columns={columns} data={results} />
      </Card>
    </div>
  );
};

export default AdminResults;
