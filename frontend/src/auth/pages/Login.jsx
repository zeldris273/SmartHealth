import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { openAuthModal, closeAuthModal, isAuthModalOpen, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('login');
    }
  }, [openAuthModal, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      closeAuthModal();
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate, closeAuthModal]);

  useEffect(() => {
    if (!isAuthModalOpen && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthModalOpen, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-lg text-center px-6 py-10 rounded-3xl shadow-xl border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">Opening the login form…</p>
      </div>
    </div>
  );
};

export default Login;
