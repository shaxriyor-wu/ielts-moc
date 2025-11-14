import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ownerApi } from '../../api/ownerApi';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

const AdminDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [adminRes, statsRes] = await Promise.all([
        ownerApi.getAdmins(),
        ownerApi.getAdminStats(id),
      ]);
      const adminData = adminRes.data.find(a => a.id === id);
      setAdmin(adminData);
      setStats(statsRes.data);
    } catch (error) {
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="secondary" onClick={() => navigate('/owner/admins')}>
          Back
        </Button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Details</h2>
      </div>

      <Card title="Admin Information">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Name:</span>
            <span className="text-gray-900 dark:text-white">{admin?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Login:</span>
            <span className="text-gray-900 dark:text-white">{admin?.login || admin?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              admin?.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {admin?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Created:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(admin?.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Tests</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {stats?.totalTests || 0}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Tests</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
            {stats?.activeTests || 0}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Test Keys</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {stats?.totalKeys || 0}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Attempts</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            {stats?.totalAttempts || 0}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDetail;
