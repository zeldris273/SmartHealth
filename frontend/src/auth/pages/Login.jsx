import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthScreenLayout from '../components/AuthScreenLayout';
import AuthForm from '../components/AuthForm';

const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return (
    <AuthScreenLayout
      subtitle='"Hello. I am Baymax."'
      footerLabel="Tap to go home"
    >
      <p className="mb-6 text-center text-xs text-[#888888]">Sign in to access your health dashboard</p>
      <AuthForm mode="login" />
    </AuthScreenLayout>
  );
};

export default Login;
