const EkgPulse = ({ light }) => (
  <div className="pointer-events-none absolute left-4 top-5 sm:left-6 sm:top-6" aria-hidden="true">
    <div className="relative h-10 w-36">
      <svg
        className={`auth-ekg h-10 w-full ${light ? 'text-red-400' : 'text-[#8b2b2b]'}`}
        viewBox="0 0 140 40"
        fill="none"
      >
        <path
          className="auth-ekg-track"
          d="M0 20 H20 L26 6 L32 34 L38 20 H140"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />
        <path
          className="auth-ekg-line"
          d="M0 20 H20 L26 6 L32 34 L38 20 H140"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`auth-ekg-dot absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full shadow-sm ${light ? 'bg-red-400 shadow-red-300' : 'bg-[#8b2b2b] shadow-[#8b2b2b]'}`}
      />
    </div>
  </div>
);

const BokehOrbs = ({ light }) =>
  light ? (
    <>
      <div className="auth-orb auth-orb-1 pointer-events-none absolute -left-10 top-[15%] h-40 w-40 rounded-full border border-rose-200/80 bg-rose-100/40" />
      <div className="auth-orb auth-orb-2 pointer-events-none absolute right-4 top-[20%] h-32 w-32 rounded-full bg-red-200/35 blur-2xl" />
      <div className="auth-orb auth-orb-3 pointer-events-none absolute bottom-[25%] left-[10%] h-24 w-24 rounded-full bg-pink-200/50 blur-xl" />
      <div className="auth-orb auth-orb-4 pointer-events-none absolute right-[15%] bottom-[30%] h-36 w-36 rounded-full border border-red-100 bg-white/50" />
      <div className="auth-orb auth-orb-5 pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-200/25 blur-3xl" />
    </>
  ) : (
    <>
      <div className="auth-orb auth-orb-1 pointer-events-none absolute -left-12 top-[18%] h-44 w-44 rounded-full border border-[#8b2b2b]/25" />
      <div className="auth-orb auth-orb-2 pointer-events-none absolute right-6 top-[22%] h-28 w-28 rounded-full bg-[#8b2b2b]/12 blur-2xl" />
      <div className="auth-orb auth-orb-3 pointer-events-none absolute bottom-[28%] left-[12%] h-20 w-20 rounded-full bg-[#8b2b2b]/18 blur-xl" />
      <div className="auth-orb auth-orb-4 pointer-events-none absolute right-[18%] bottom-[32%] h-36 w-36 rounded-full border border-[#8b2b2b]/15" />
      <div className="auth-orb auth-orb-5 pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8b2b2b]/6 blur-3xl" />
    </>
  );

const AuthAmbientEffects = ({ variant = 'dark' }) => {
  const light = variant === 'baymax';

  return (
    <>
      <EkgPulse light={light} />
      <BokehOrbs light={light} />
      <div
        className={`auth-bg-shift pointer-events-none absolute inset-0 ${light ? 'auth-bg-shift--baymax' : ''}`}
        aria-hidden="true"
      />
    </>
  );
};

export default AuthAmbientEffects;
