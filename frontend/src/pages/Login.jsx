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
      if (role === 'admin') {
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
        (error.response?.data?.non_field_errors ? error.response.data.non_field_errors[0] : null) ||
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
      // Handle different error response formats
      let errorMessage = 'Registration failed';

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.errors) {
          // Handle validation errors
          if (typeof errorData.errors === 'string') {
            errorMessage = errorData.errors;
          } else if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors[0]?.msg || errorData.errors[0] || 'Invalid registration data';
          } else if (typeof errorData.errors === 'object') {
            // Get first error message from object
            const firstError = Object.values(errorData.errors)[0];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else {
              errorMessage = firstError || 'Invalid registration data';
            }
          }
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : errorData.non_field_errors;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast(errorMessage, 'error');
      console.error('Registration error:', {
        message: errorMessage,
        response: error.response?.data,
        status: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background gradient layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 15%, #ef4444 25%, #f87171 32%, #fca5a5 37%, #fecaca 40%, #ffffff 45%, #ffffff 55%, #d4d4d4 60%, #737373 65%, #404040 70%, #262626 78%, #171717 85%, #0a0a0a 100%)',
        }}
      />
      {/* Blur overlay */}
      <div
        className="absolute inset-0 backdrop-blur-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(185,28,28,0.2) 0%, rgba(239,68,68,0.15) 20%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, rgba(23,23,23,0.15) 80%, rgba(10,10,10,0.2) 100%)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/50 dark:border-gray-700"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CD IELTS EMPIRE
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Login to your account</p>

          {/* Quick Login Buttons - fills in credentials */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setLoginData({ login: 'admin', password: 'admin123' });
              }}
              className="px-3 py-2 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              🔑 Admin
            </button>
            <button
              onClick={() => {
                setLoginData({ login: 'student', password: 'student123' });
              }}
              className="px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              👤 Student
            </button>
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
