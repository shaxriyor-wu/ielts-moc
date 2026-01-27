import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { Users, BookOpen, PlayCircle, UserCheck, Key, Edit, Trash2, Play, Square } from 'lucide-react';
import StartMockModal from './StartMockModal';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStartMock, setShowStartMock] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, variantsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getVariants(),
      ]);
      setStats(statsRes.data);
      setVariants(variantsRes.data);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (variantId) => {
    try {
      const response = await adminApi.generateCode(variantId);
      setGeneratedCode(response.data.code);
      showToast('Code generated successfully!', 'success');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to generate code', 'error');
    }
  };

  const handleStartMock = async (variantId) => {
    try {
      await adminApi.startMock(variantId);
      showToast('Mock test activated successfully!', 'success');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to start mock', 'error');
    }
  };

  const handleStopMock = async (variantId) => {
    try {
      await adminApi.stopMock(variantId);
      showToast('Mock test deactivated successfully!', 'success');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to stop mock', 'error');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;
    try {
      await adminApi.deleteVariant(variantId);
      showToast('Variant deleted successfully', 'success');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete variant', 'error');
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

      {/* LEGACY VARIANT - Cambridge IELTS 8 Test 1 */}
      {variants.length > 0 && (
        <Card>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Cambridge IELTS 8 - Test 1
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Legacy test variant for testing purposes
            </p>
          </div>

          {/* Generated Code Display */}
          {generatedCode && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    Generated Code
                  </p>
                  <p className="text-2xl font-mono font-bold text-green-700 dark:text-green-400 mt-1">
                    {generatedCode}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    showToast('Code copied to clipboard!', 'success');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Variant List */}
          <div className="space-y-4">
            {variants.map((variant) => (
              <Card key={variant.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {variant.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          variant.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {variant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Code:</span>{' '}
                        <span className="font-mono font-bold">{variant.code}</span>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {variant.duration_minutes} min
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {new Date(variant.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Files:</span>{' '}
                        {variant.test_files?.length || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleGenerateCode(variant.id)}
                      title="Generate New Code"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                    {variant.is_active ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleStopMock(variant.id)}
                        title="Stop Mock"
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleStartMock(variant.id)}
                        title="Start Mock"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteVariant(variant.id)}
                      title="Delete Variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* NEW JSON-BASED MOCK TEST SYSTEM */}
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            IELTS Mock Test Management (New System)
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create randomized mock tests from JSON variant library
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
