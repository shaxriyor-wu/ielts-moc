import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { Users, BookOpen, PlayCircle, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import StartMockModal from './StartMockModal';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStartMock, setShowStartMock] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const statsRes = await adminApi.getStats();
      setStats(statsRes.data);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats?.total_students || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Variants</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats?.total_variants || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mock Tests Taken</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats?.total_mock_tests_taken || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Test Participants</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {stats?.total_test_participants || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* IELTS MOCK SECTION */}
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            IELTS Mock Test Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage test variants, generate codes, and activate mock tests
          </p>
        </div>

        {/* Start Mock Button */}
        <div className="flex justify-end">
          <Button
            variant="success"
            onClick={() => setShowStartMock(true)}
            className="flex items-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Start Mock
          </Button>
        </div>
      </Card>

      {/* Start Mock Modal */}
      <Modal
        isOpen={showStartMock}
        onClose={() => setShowStartMock(false)}
        title="Start Mock Test"
        size="2xl"
      >
        <StartMockModal onClose={() => setShowStartMock(false)} />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
