import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { Users, BookOpen, PlayCircle, Plus, Edit, Trash2, Play, Square, UserCheck, Key } from 'lucide-react';
import AddVariantForm from './AddVariantForm';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
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
      loadData(); // Refresh variants to show new code
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

  const handleEditVariant = (variant) => {
    setSelectedVariant(variant);
    setShowAddVariant(true);
  };

  const handleVariantCreated = () => {
    setShowAddVariant(false);
    setSelectedVariant(null);
    loadData();
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
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Variant List
          </h3>
          {variants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No variants created yet. Click "Add Variant" to create your first variant.
            </div>
          ) : (
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
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditVariant(variant)}
                        title="Edit Variant"
                      >
                        <Edit className="w-4 h-4" />
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
          )}
        </div>

        {/* Start Mock Button (at bottom) */}
        {variants.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end">
              <Button
                variant="success"
                onClick={() => {
                  const inactiveVariants = variants.filter((v) => !v.is_active);
                  if (inactiveVariants.length === 0) {
                    showToast('All variants are already active', 'info');
                    return;
                  }
                  const variantId = prompt(
                    `Enter Variant ID to start:\nAvailable: ${inactiveVariants.map((v) => `${v.id} (${v.name})`).join(', ')}`
                  );
                  if (variantId) {
                    handleStartMock(parseInt(variantId));
                  }
                }}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Mock
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Variant Modal */}
      <Modal
        isOpen={showAddVariant}
        onClose={() => {
          setShowAddVariant(false);
          setSelectedVariant(null);
        }}
        title={selectedVariant ? 'Edit Variant' : 'Add New Variant'}
        size="xl"
      >
        <AddVariantForm
          variant={selectedVariant}
          onSuccess={handleVariantCreated}
          onCancel={() => {
            setShowAddVariant(false);
            setSelectedVariant(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
