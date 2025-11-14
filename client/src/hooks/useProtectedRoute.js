import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useProtectedRoute = (requiredRole) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/');
        return;
      }

      if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'owner') {
          navigate('/owner/dashboard');
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'student') {
          navigate('/exam-access');
        } else {
          navigate('/');
        }
      }
    }
  }, [user, loading, requiredRole, navigate]);

  return { user, loading };
};
