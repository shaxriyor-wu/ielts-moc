import { useEffect, useState } from 'react';
import { ownerApi } from '../../api/ownerApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const OwnerStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await ownerApi.getStudents();
      setStudents(response.data);
    } catch (error) {
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'totalAttempts', label: 'Total Attempts' },
    { key: 'completedAttempts', label: 'Completed' },
    { 
      key: 'lastAttempt', 
      label: 'Last Attempt', 
      render: (value) => value ? new Date(value).toLocaleString() : 'Never' 
    },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Students</h2>
      <Card>
        <Table columns={columns} data={students} />
      </Card>
    </div>
  );
};

export default OwnerStudents;
