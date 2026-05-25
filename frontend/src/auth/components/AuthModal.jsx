import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthForm from './AuthForm';
import BaymaxSplashLogo from '../../components/BaymaxSplashLogo';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#8b2b2b]/20 bg-[#0a0a0a] px-8 py-10 shadow-2xl shadow-[#8b2b2b]/10">
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-full p-2 text-[#666666] transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-white">
          <BaymaxSplashLogo size={72} />
          <h2 className="mt-4 text-xl font-bold">SmartHealth</h2>
          <p className="mt-1 text-xs italic text-[#888888]">
            {isLogin ? '"Hello. I am Baymax."' : 'Create your account'}
          </p>
        </div>

        <div className="mt-8">
          <AuthForm
            mode={authModalType}
            onSuccess={() => {
              closeAuthModal();
              navigate(isLogin ? '/profile' : '/login', { replace: true });
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            closeAuthModal();
            navigate(isLogin ? '/register' : '/login');
          }}
          className="mt-4 w-full text-center text-xs text-[#666666] hover:text-[#8b2b2b]"
        >
          Open full {isLogin ? 'register' : 'login'} page
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
