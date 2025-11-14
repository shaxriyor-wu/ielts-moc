import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Form from '../../components/Form';
import { showToast } from '../../components/Toast';
import { Users } from 'lucide-react';

const AdminLogin = () => {
  const [loginData, setLoginData] = useState({ login: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminApi.login(loginData.login, loginData.password);
      login(
        { ...response.data.admin, role: 'admin' },
        response.data.accessToken,
        response.data.refreshToken
      );
      showToast('Login successful', 'success');
      navigate('/admin/dashboard');
    } catch (error) {
      showToast(error.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Login</h2>
          <p className="text-gray-600 dark:text-gray-400">Test Management Access</p>
        </div>
        <Form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <Input
              label="Login"
              value={loginData.login}
              onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
              required
              autoFocus
              placeholder="Enter your login"
            />
            <Input
              type="password"
              label="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              placeholder="Enter your password"
            />
            <Button type="submit" className="w-full" disabled={loading} loading={loading}>
              Login
            </Button>
          </div>
        </Form>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
