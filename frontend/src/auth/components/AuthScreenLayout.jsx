import { Link } from 'react-router-dom';
import BaymaxSplashLogo from '../../components/BaymaxSplashLogo';
import AuthAmbientEffects from './AuthAmbientEffects';

const AuthScreenLayout = ({
  children,
  title = 'SmartHealth',
  subtitle = '"Hello. I am Baymax."',
  footerLabel = 'Tap to go home',
  footerTo = '/',
}) => (
  <div className="auth-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-12 text-white">
    <AuthAmbientEffects />

    <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
      <div className="auth-enter auth-enter-1">
        <BaymaxSplashLogo size={100} animated />
      </div>

      <h1 className="auth-enter auth-enter-2 mt-8 text-2xl font-bold tracking-tight text-white">
        {title}
      </h1>
      <p className="auth-enter auth-enter-3 mt-2 text-sm italic text-[#888888]">{subtitle}</p>

      <div className="auth-enter auth-enter-4 mt-10 w-full">{children}</div>

      <Link
        to={footerTo}
        className="auth-enter auth-enter-5 auth-footer-pulse mt-8 text-xs font-medium text-[#8b2b2b]"
      >
        {footerLabel}
      </Link>
    </div>
  </div>
);

export default AuthScreenLayout;
