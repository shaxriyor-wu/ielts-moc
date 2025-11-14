import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mocApi } from '../../api/mocApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Form from '../../components/Form';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';

const MocManagement = () => {
  const [mocs, setMocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedMocs, setSelectedMocs] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'full',
    answerKey: '',
    writingTopics: ''
  });
  const [files, setFiles] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadMocs();
  }, []);

  const loadMocs = async () => {
    try {
      const response = await mocApi.getMocs();
      setMocs(response.data);
    } catch (error) {
      showToast('Failed to load MOCs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type, file) => {
    setFiles({ ...files, [type]: file });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('answerKey', formData.answerKey);
    formDataToSend.append('writingTopics', formData.writingTopics);

    if (files.readingFile) {
      formDataToSend.append('readingFile', files.readingFile);
    }
    if (files.listeningFile) {
      formDataToSend.append('listeningFile', files.listeningFile);
    }
    if (files.listeningAudio) {
      formDataToSend.append('listeningAudio', files.listeningAudio);
    }

    try {
      await mocApi.createMoc(formDataToSend);
      showToast('MOC created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ title: '', type: 'full', answerKey: '', writingTopics: '' });
      setFiles({});
      loadMocs();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to create MOC', 'error');
    }
  };

  const handleStart = async () => {
    if (selectedMocs.length === 0) {
      showToast('Please select at least one MOC', 'error');
      return;
    }

    try {
      const response = await mocApi.startMocs(selectedMocs);
      showToast('MOC tests started', 'success');
      setShowStartModal(false);
      setSelectedMocs([]);
      navigate('/admin/generate-key');
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to start MOCs', 'error');
    }
  };

  const toggleMocSelection = (mocId) => {
    if (selectedMocs.includes(mocId)) {
      setSelectedMocs(selectedMocs.filter(id => id !== mocId));
    } else {
      setSelectedMocs([...selectedMocs, mocId]);
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created', render: (value) => new Date(value).toLocaleDateString() },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/admin/mocs/${row.id}`)}>View</Button>
          <Button size="sm" variant="danger" onClick={async () => {
            if (window.confirm('Delete this MOC?')) {
              try {
                await mocApi.deleteMoc(row.id);
                showToast('MOC deleted', 'success');
                loadMocs();
              } catch (error) {
                showToast('Failed to delete', 'error');
              }
            }
          }}>Delete</Button>
        </div>
      ),
    },
  ];

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">MOC Tests</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowStartModal(true)}>Start MOCs</Button>
          <Button onClick={() => setShowCreateModal(true)}>Create MOC</Button>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={mocs} />
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create MOC Test" size="lg">
        <Form onSubmit={handleCreate}>
          <div className="space-y-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reading MOC File</label>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => handleFileChange('readingFile', e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Listening MOC File</label>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => handleFileChange('listeningFile', e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Listening Audio</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileChange('listeningAudio', e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Writing Topics (JSON array)</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="4"
                value={formData.writingTopics}
                onChange={(e) => setFormData({ ...formData, writingTopics: e.target.value })}
                placeholder='["Topic 1", "Topic 2"]'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Key (JSON object)</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="6"
                value={formData.answerKey}
                onChange={(e) => setFormData({ ...formData, answerKey: e.target.value })}
                placeholder='{"reading": {"1": "A", "2": "B"}, "listening": {"1": "C"}}'
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button type="submit">Create MOC</Button>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal isOpen={showStartModal} onClose={() => setShowStartModal(false)} title="Start MOC Tests" size="lg">
        <div className="space-y-4">
          <p className="text-gray-600">Select MOCs to start. Each student will get a random MOC from the selected ones.</p>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {mocs.map((moc) => (
              <label key={moc.id} className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedMocs.includes(moc.id)}
                  onChange={() => toggleMocSelection(moc.id)}
                />
                <span>{moc.title}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowStartModal(false)}>Cancel</Button>
            <Button onClick={handleStart}>Start Selected MOCs</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MocManagement;

