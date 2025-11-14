import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../api/studentApi';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Form from '../../components/Form';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { User, Mail, Calendar } from 'lucide-react';

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await studentApi.getProfile();
      setProfile(response.data);
      setFormData({
        fullName: response.data.fullName || user.name || '',
        email: response.data.email || user.email || '',
      });
    } catch (error) {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await studentApi.updateProfile(formData);
      showToast('Profile updated successfully', 'success');
      setEditMode(false);
      loadProfile();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update profile', 'error');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
        <Button
          variant={editMode ? 'secondary' : 'primary'}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {profile?.fullName || user.name || 'Student'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{profile?.email || user.email}</p>
          </div>
        </div>

        {editMode ? (
          <Form onSubmit={handleUpdate}>
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
              <Input
                type="email"
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                <p className="text-gray-900 dark:text-white">{profile?.fullName || user.name || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-white">{profile?.email || user.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                <p className="text-gray-900 dark:text-white">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentProfile;

