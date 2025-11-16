import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Form from '../components/Form';
import { showToast } from '../components/Toast';

const Login = () => {
  const [loginData, setLoginData] = useState({
    login: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    login: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.login || !loginData.password) {
      showToast('Please enter login and password', 'error');
      return;
    }
    setLoading(true);
    try {
      // Use unified login endpoint
      const response = await api.post('/auth/login', {
        login: loginData.login,
        password: loginData.password,
      });

      const { user, accessToken, refreshToken } = response.data;
      if (!user || !user.role || !accessToken) {
        throw new Error('Invalid response from server');
      }

      login(user, accessToken, refreshToken);
      showToast('Login successful', 'success');

      const role = user.role;
      if (role === 'owner') {
        navigate('/owner/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      const errorMessage = error.response?.data?.error || 
                          (error.response?.data?.login ? error.response.data.login[0] : null) ||
                          (error.response?.data?.password ? error.response.data.password[0] : null) ||
                          error.response?.data?.errors?.[0]?.msg || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        fullName: registerData.fullName,
        login: registerData.login,
        password: registerData.password,
      });
      
      const { user, role, accessToken, refreshToken } = response.data;
      
      login(
        { ...user, role },
        accessToken,
        refreshToken
      );
      
      showToast('Registration successful', 'success');
      navigate('/student/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Registration failed';
      showToast(errorMessage, 'error');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            IELTS Exam Platform
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Login to your account</p>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">🔑 Owner Login:</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-mono">Login: owner</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-mono">Password: owner123</p>
          </div>
        </div>

        {!showRegister ? (
          <>
            <Form onSubmit={handleLogin}>
              <div className="space-y-4">
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
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowRegister(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Don't have an account? Register
              </button>
            </div>
          </>
        ) : (
          <>
            <Form onSubmit={handleRegister}>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  required
                  autoFocus
                  placeholder="Enter your full name"
                />
                <Input
                  label="Login"
                  value={registerData.login}
                  onChange={(e) => setRegisterData({ ...registerData, login: e.target.value })}
                  required
                  placeholder="Choose a login"
                />
                <Input
                  type="password"
                  label="Password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  placeholder="Enter password"
                />
                <Input
                  type="password"
                  label="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                  placeholder="Confirm password"
                />
                <Button type="submit" className="w-full" disabled={loading} loading={loading}>
                  Register
                </Button>
              </div>
            </Form>
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowRegister(false)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Already have an account? Login
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
