import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BaymaxLogo from '../../components/BaymaxLogo';
import AuthGlassBackground from './AuthGlassBackground';
import AuthForm from './AuthForm';
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

const AuthInteractiveScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeMode = location.pathname.includes('register') ? 'register' : 'login';
  const swapTimerRef = useRef(null);

  const [mode, setMode] = useState(routeMode);
  const [slideDir, setSlideDir] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    setMode(routeMode);
  }, [routeMode]);

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, []);

  const switchMode = useCallback(
    (next) => {
      if (next === mode || isSwapping) return;

      setSlideDir(next === 'register' ? 'to-register' : 'to-login');
      setIsSwapping(true);
      setMode(next);
      navigate(next === 'login' ? '/login' : '/register', { replace: true });

      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
      swapTimerRef.current = setTimeout(() => {
        setIsSwapping(false);
        setSlideDir(null);
      }, 780);
    },
    [mode, isSwapping, navigate]
  );

  const isLogin = mode === 'login';

  return (
    <section className="auth-glass-screen relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <AuthGlassBackground />

      <div
        className={`auth-glass-layout relative z-10 w-full max-w-[420px] ${isSwapping ? 'auth-card--swapping' : ''}`}
      >
        <div className={`auth-glass-logo ${isSwapping ? 'auth-logo-swap-pop' : ''}`}>
          <span className="auth-baymax-glow pointer-events-none absolute inset-0 scale-125 rounded-full bg-white/50 blur-2xl" />
          <span className="relative block animate-heartbeat drop-shadow-lg">
            <BaymaxLogo size={88} />
          </span>
        </div>

        <div className="auth-glass-card">
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

            <div
              className={getPanelClass(true, mode, isSwapping, slideDir)}
              aria-hidden={mode !== 'login' && !isSwapping}
            >
              <div className={`auth-form-inner ${isSwapping && mode === 'login' ? 'auth-form-card--shine' : ''}`}>
                <AuthForm
                  mode="login"
                  onSwitchMode={() => switchMode('register')}
                  stagger={mode === 'login' && !isSwapping}
                  variant="glass"
                />
              </div>
            </div>

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

        <Link to="/" className="auth-glass-home mt-6 block text-center text-xs text-white/90 hover:text-white">
          ← Về trang chủ
        </Link>
      </div>
    </section>
  );
};

export default AuthInteractiveScreen;
