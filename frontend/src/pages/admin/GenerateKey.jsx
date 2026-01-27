import { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const GenerateKey = () => {
  const [tests, setTests] = useState([]);
  const [testKeys, setTestKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsRes, keysRes] = await Promise.all([
        adminApi.getTests(),
        adminApi.getTestKeys(),
      ]);
      setTests(testsRes.data);
      setTestKeys(keysRes.data);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTestId) {
      showToast('Please select a test', 'error');
      return;
    }

    try {
      await adminApi.generateTestKey(selectedTestId);
      showToast('Test key generated successfully', 'success');
      setShowModal(false);
      setSelectedTestId('');
      loadData();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to generate key', 'error');
    }
  };

  const columns = [
    { key: 'key', label: 'Test Key' },
    { key: 'testTitle', label: 'Test' },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    { key: 'usedBy', label: 'Used By' },
    { 
      key: 'createdAt', 
      label: 'Created', 
      render: (value) => new Date(value).toLocaleString() 
    },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test Keys</h2>
        <Button onClick={() => setShowModal(true)}>Generate Key</Button>
      </div>

      <Card>
        <Table columns={columns} data={testKeys} />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Generate Test Key">
        <div className="space-y-4">
          <Select
            label="Select Test"
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            options={tests.map(t => ({ value: t.id, label: t.title }))}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GenerateKey;
