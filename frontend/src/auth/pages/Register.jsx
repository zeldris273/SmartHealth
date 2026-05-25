import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthScreenLayout from '../components/AuthScreenLayout';
import AuthForm from '../components/AuthForm';

const Register = () => {
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
      subtitle="Join your personal healthcare companion"
      footerLabel="Tap to go home"
    >
      <p className="mb-6 text-center text-xs text-[#888888]">Create your SmartHealth account</p>
      <AuthForm mode="register" />
    </AuthScreenLayout>
  );
};

export default Register;
