import { useEffect, useState } from 'react';
import { ownerApi } from '../../api/ownerApi';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import BarChart from '../../components/Charts/BarChart';
import PieChart from '../../components/Charts/PieChart';
import LineChart from '../../components/Charts/LineChart';
import { Users, BookOpen, GraduationCap, Activity } from 'lucide-react';

const OwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await ownerApi.getSystemStats();
      setStats(response.data);
    } catch (error) {
      showToast('Failed to load stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const chartData = [
    { name: 'Admins', value: stats?.totalAdmins || 0 },
    { name: 'Tests', value: stats?.totalTests || 0 },
    { name: 'Students', value: stats?.totalStudents || 0 },
    { name: 'Attempts', value: stats?.totalAttempts || 0 },
  ];

  const pieData = [
    { name: 'Active Admins', value: stats?.activeAdmins || 0 },
    { name: 'Inactive Admins', value: (stats?.totalAdmins || 0) - (stats?.activeAdmins || 0) },
  ];

  const activityData = [
    { name: 'Mon', attempts: stats?.totalAttempts || 0 },
    { name: 'Tue', attempts: (stats?.totalAttempts || 0) + 5 },
    { name: 'Wed', attempts: (stats?.totalAttempts || 0) + 10 },
    { name: 'Thu', attempts: (stats?.totalAttempts || 0) + 8 },
    { name: 'Fri', attempts: (stats?.totalAttempts || 0) + 12 },
    { name: 'Sat', attempts: (stats?.totalAttempts || 0) + 6 },
    { name: 'Sun', attempts: (stats?.totalAttempts || 0) + 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Admins</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats?.totalAdmins || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Active: {stats?.activeAdmins || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats?.totalTests || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Active: {stats?.activeTests || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats?.totalStudents || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Attempts</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {stats?.totalAttempts || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Completed: {stats?.completedAttempts || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Platform Statistics">
          <BarChart data={chartData} dataKey="value" />
        </Card>

        <Card title="Admin Status">
          <PieChart data={pieData} />
        </Card>
      </div>

      <Card title="Weekly Activity">
        <LineChart data={activityData} dataKey="attempts" />
      </Card>
    </div>
  );
};

export default OwnerDashboard;
