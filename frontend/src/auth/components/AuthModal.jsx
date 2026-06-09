import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthForm from './AuthForm';
import BaymaxLogo from '../../components/BaymaxLogo';
import AuthSwapBurst from './AuthSwapBurst';

const getPanelClass = (isLoginPanel, mode, isSwapping, slideDir) => {
  const isActive = isLoginPanel ? mode === 'login' : mode === 'register';
  const classes = ['auth-swap-panel'];

  if (isSwapping && slideDir) {
    if (slideDir === 'to-register') {
      classes.push(isLoginPanel ? 'auth-swap-panel--slide-out-left' : 'auth-swap-panel--slide-in-right');
    } else {
      classes.push(isLoginPanel ? 'auth-swap-panel--slide-in-left' : 'auth-swap-panel--slide-out-right');
    }
  } else if (isActive) {
    classes.push('auth-swap-panel--active');
  } else {
    classes.push('auth-swap-panel--inactive');
  }

  return classes.join(' ');
};

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, openAuthModal, authModalType, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(authModalType);
  const [slideDir, setSlideDir] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const swapTimerRef = useRef(null);

  // Sync mode with authModalType when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalType);
      setIsSwapping(false);
      setSlideDir(null);
    }
  }, [isAuthModalOpen, authModalType]);

  // Clean up swap timer on unmount
  useEffect(() => {
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, []);

  // Listen to redirect state or query params to automatically trigger opening the modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasOpenLoginParam = params.get('openLogin') === 'true';

    if ((location.state?.openLogin || hasOpenLoginParam) && !isAuthenticated && !isAuthModalOpen) {
      openAuthModal('login');

      // Clear the query parameter and location state
      if (hasOpenLoginParam) {
        params.delete('openLogin');
        const newSearch = params.toString();
        navigate(
          {
            pathname: location.pathname,
            search: newSearch ? `?${newSearch}` : '',
          },
          { replace: true, state: {} }
        );
      } else {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location, isAuthenticated, isAuthModalOpen, openAuthModal, navigate]);

  // Close modal if authenticated while it is open
  useEffect(() => {
    if (isAuthenticated && isAuthModalOpen) {
      closeAuthModal();
    }
  }, [isAuthenticated, isAuthModalOpen, closeAuthModal]);
  const isLogin = mode === 'login';

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  const switchMode = useCallback(
    (next) => {
      if (next === mode || isSwapping) return;

      setSlideDir(next === 'register' ? 'to-register' : 'to-login');
      setIsSwapping(true);
      setMode(next);

      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
      swapTimerRef.current = setTimeout(() => {
        setIsSwapping(false);
        setSlideDir(null);
      }, 780);
    },
    [mode, isSwapping]
  );

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="auth-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className={`auth-glass-layout relative z-10 w-full max-w-[420px] ${isSwapping ? 'auth-card--swapping' : ''}`}
      >
        {/* Floating Baymax Logo overlapping the glass card */}
        <div className={`auth-glass-logo ${isSwapping ? 'auth-logo-swap-pop' : ''}`}>
          <span className="auth-baymax-glow pointer-events-none absolute inset-0 scale-125 rounded-full bg-white/50 blur-2xl" />
          <span className="relative block animate-heartbeat drop-shadow-lg">
            <BaymaxLogo size={88} />
          </span>
        </div>

        {/* The Glassmorphism Card */}
        <div className="auth-glass-card">
          {/* Close button nestled in the top-right of the glass panel */}
          <button
            onClick={closeAuthModal}
            className="absolute right-4 top-4 z-20 rounded-full p-2 text-[#8f2c24]/50 transition-colors hover:bg-white/20 hover:text-[#8f2c24]"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <h1 key={mode} className="auth-glass-title auth-glass-title--swap">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h1>
          <p key={`sub-${mode}`} className="auth-glass-subtitle auth-glass-subtitle--swap">
            {isLogin
              ? 'Hello. I am Baymax — your healthcare companion.'
              : 'Create your SmartHealth account with Baymax.'}
          </p>

          <div
            className={[
              'auth-swap-stage',
              !isLogin ? 'auth-swap-stage--tall' : '',
              isSwapping ? 'auth-swap-stage--swapping' : '',
              slideDir ? `auth-swap-stage--${slideDir}` : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <AuthSwapBurst active={isSwapping} />

            {/* Login panel */}
            <div
              className={getPanelClass(true, mode, isSwapping, slideDir)}
              aria-hidden={mode !== 'login' && !isSwapping}
            >
              <div className={`auth-form-inner ${isSwapping && mode === 'login' ? 'auth-form-card--shine' : ''}`}>
                <AuthForm
                  mode="login"
                  onSuccess={() => {
                    closeAuthModal();
                    navigate('/profile', { replace: true });
                  }}
                  onSwitchMode={() => switchMode('register')}
                  stagger={mode === 'login' && !isSwapping}
                  variant="glass"
                />
              </div>
            </div>

            {/* Register panel */}
            <div
              className={getPanelClass(false, mode, isSwapping, slideDir)}
              aria-hidden={mode !== 'register' && !isSwapping}
            >
              <div className={`auth-form-inner ${isSwapping && mode === 'register' ? 'auth-form-card--shine' : ''}`}>
                <AuthForm
                  mode="register"
                  onSwitchMode={() => switchMode('login')}
                  onRegisterSuccess={() => switchMode('login')}
                  stagger={mode === 'register' && !isSwapping}
                  variant="glass"
                />
              </div>
            </div>
          </div>

          <div className="auth-glass-footer">
            {isLogin ? (
              <>
                <button type="button" className="auth-glass-footer-link">
                  Forget Password?
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="auth-glass-footer-link auth-glass-footer-link--accent"
                >
                  Signup
                </button>
              </>
            ) : (
              <>
                <span className="text-xs text-[#8f2c24]/70">Already registered?</span>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="auth-glass-footer-link auth-glass-footer-link--accent"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
