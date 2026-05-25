import { Link } from 'react-router-dom';
import BaymaxSplashLogo from '../../components/BaymaxSplashLogo';

const EkgPulse = () => (
  <svg
    className="auth-ekg absolute left-6 top-6 w-28 h-10 text-[#8b2b2b] opacity-70"
    viewBox="0 0 120 40"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M0 20 H18 L24 8 L30 32 L36 20 H120"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BokehOrbs = () => (
  <>
    <div className="pointer-events-none absolute -left-16 top-1/4 h-48 w-48 rounded-full border border-[#8b2b2b]/20" />
    <div className="pointer-events-none absolute right-8 top-1/3 h-32 w-32 rounded-full bg-[#8b2b2b]/10 blur-2xl" />
    <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full bg-[#8b2b2b]/15 blur-xl" />
    <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-40 w-40 rounded-full border border-[#8b2b2b]/10" />
    <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8b2b2b]/5 blur-3xl" />
  </>
);

const AuthScreenLayout = ({
  children,
  title = 'SmartHealth',
  subtitle = '"Hello. I am Baymax."',
  footerLabel = 'Quay lại trang chủ',
  footerTo = '/',
}) => (
  <div className="auth-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 py-12 text-white">
    <EkgPulse />
    <BokehOrbs />

    <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
      <BaymaxSplashLogo size={100} />

      <h1 className="mt-8 text-2xl font-bold tracking-tight text-white">{title}</h1>
      <p className="mt-2 text-sm italic text-[#888888]">{subtitle}</p>

      <div className="mt-10 w-full">{children}</div>

      <Link
        to={footerTo}
        className="mt-8 text-xs font-medium text-[#8b2b2b] transition-colors hover:text-[#a33a3a]"
      >
        {footerLabel}
      </Link>
    </div>
  </div>
);

export default AuthScreenLayout;
