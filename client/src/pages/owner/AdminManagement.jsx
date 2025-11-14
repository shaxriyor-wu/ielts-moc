import { useEffect, useState } from 'react';
import { ownerApi } from '../../api/ownerApi';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Form from '../../components/Form';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { useNavigate } from 'react-router-dom';
import Toggle from '../../components/Toggle';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({ login: '', password: '', name: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await ownerApi.getAdmins();
      setAdmins(response.data);
    } catch (error) {
      showToast('Failed to load admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.login || !formData.password || !formData.name) {
      showToast('Please fill all fields', 'error');
      return;
    }
    try {
      console.log('Creating admin with:', formData);
      const response = await ownerApi.createAdmin(formData);
      console.log('Admin created:', response.data);
      showToast('Admin created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ login: '', password: '', name: '' });
      loadAdmins();
    } catch (error) {
      console.error('Create admin error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Failed to create admin';
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await ownerApi.deleteAdmin(id);
      showToast('Admin deleted successfully', 'success');
      loadAdmins();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete admin', 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await ownerApi.resetAdminPassword(selectedAdmin.id, newPassword);
      showToast('Password reset successfully', 'success');
      setShowResetModal(false);
      setNewPassword('');
      setSelectedAdmin(null);
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to reset password', 'error');
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      await ownerApi.activateAdmin(admin.id, !admin.isActive);
      showToast(`Admin ${admin.isActive ? 'deactivated' : 'activated'}`, 'success');
      loadAdmins();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update admin', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'login', label: 'Login' },
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
    { 
      key: 'createdAt', 
      label: 'Created At', 
      render: (value) => new Date(value).toLocaleDateString() 
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/owner/admins/${row.id}`)}>
            View
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => handleToggleActive(row)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => { setSelectedAdmin(row); setShowResetModal(true); }}
          >
            Reset Password
          </Button>
          <Button 
            size="sm" 
            variant="danger" 
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h2>
        <Button onClick={() => setShowCreateModal(true)}>Create Admin</Button>
      </div>

      <Card>
        <Table columns={columns} data={admins} />
      </Card>

      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title="Create Admin"
      >
        <Form onSubmit={handleCreate}>
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Login"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              required
              placeholder="Enter login"
            />
            <Input
              type="password"
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        title="Reset Password"
      >
        <Form onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowResetModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Reset</Button>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminManagement;
