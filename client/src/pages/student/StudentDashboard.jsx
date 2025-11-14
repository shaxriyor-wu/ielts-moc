import { useEffect, useState } from 'react';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import BarChart from '../../components/Charts/BarChart';
import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, attemptsRes] = await Promise.all([
        studentApi.getStats(),
        studentApi.getAttempts(),
      ]);
      setStats(statsRes.data);
      setAttempts(attemptsRes.data);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'testTitle', label: 'Test' },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.isSubmitted
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
        }`}>
          {row.isSubmitted ? 'Completed' : 'In Progress'}
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
    {
      key: 'score',
      label: 'Score',
      render: (_, row) => row.score ? `${row.score}%` : '-',
    },
  ];

  if (loading) return <Loader fullScreen />;

  const chartData = [
    { name: 'Completed', value: stats?.completedTests || 0 },
    { name: 'In Progress', value: stats?.inProgressTests || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {stats?.totalTests || 0}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats?.completedTests || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {stats?.inProgressTests || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {stats?.averageScore || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Test Statistics">
        <BarChart data={chartData} dataKey="value" />
      </Card>

      <Card title="My Test Attempts">
        <Table columns={columns} data={attempts} />
      </Card>
    </div>
  );
};

export default StudentDashboard;

