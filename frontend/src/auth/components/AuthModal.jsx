import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthForm from './AuthForm';
import BaymaxLogo from '../../components/BaymaxLogo';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authModalType, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && isAuthModalOpen) {
      closeAuthModal();
    }
  }, [isAuthenticated, isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalType === 'login';

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  return (
    <div
      className="auth-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="auth-modal-panel relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-b from-white to-rose-50 px-8 py-10 shadow-2xl shadow-red-200/50">
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 z-20 rounded-full p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-red-500"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 flex flex-col items-center">
          <span className="animate-heartbeat">
            <BaymaxLogo size={72} />
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-800">SmartHealth</h2>
          <p className="mt-1 text-xs italic text-slate-500">
            {isLogin ? '"Hello. I am Baymax."' : 'Create your account'}
          </p>
        </div>

        <div className="auth-form-card relative z-10 mt-6 border-rose-100/80 shadow-lg">
          <AuthForm
            mode={authModalType}
            onSuccess={() => {
              closeAuthModal();
              navigate(isLogin ? '/profile' : '/login', { replace: true });
            }}
            onSwitchMode={() => {
              closeAuthModal();
              navigate(isLogin ? '/register' : '/login');
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            closeAuthModal();
            navigate(isLogin ? '/register' : '/login');
          }}
          className="relative z-10 mt-4 w-full text-center text-xs text-red-500 hover:text-red-600"
        >
          Open full {isLogin ? 'register' : 'login'} page
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
