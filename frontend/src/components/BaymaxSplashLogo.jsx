const BaymaxSplashLogo = ({ size = 120, animated = true }) => (
  <div
    className={`relative flex items-center justify-center ${animated ? 'auth-logo-wrap' : ''}`}
    style={{ width: size, height: size }}
  >
    {animated && (
      <>
        <span className="auth-logo-ring auth-logo-ring-1 absolute inset-0 rounded-full border border-[#8b2b2b]/40" />
        <span className="auth-logo-ring auth-logo-ring-2 absolute inset-0 rounded-full border border-[#8b2b2b]/25" />
      </>
    )}

    <div
      className={`absolute inset-0 rounded-full blur-2xl ${animated ? 'auth-logo-glow' : 'opacity-60'}`}
      style={{ background: 'radial-gradient(circle, #8b2b2b 0%, transparent 70%)' }}
    />

    <div
      className={`relative flex items-center justify-center rounded-full bg-black ${animated ? 'auth-logo-face' : ''}`}
      style={{
        width: size,
        height: size,
        border: '2px solid #8b2b2b',
        boxShadow: '0 0 40px rgba(139, 43, 43, 0.45), inset 0 0 20px rgba(139, 43, 43, 0.15)',
      }}
    >
      <svg viewBox="0 0 80 80" width={size * 0.45} height={size * 0.45} aria-hidden="true">
        <circle className={animated ? 'auth-baymax-eye' : ''} cx="28" cy="32" r="3" fill="white" />
        <circle className={animated ? 'auth-baymax-eye' : ''} cx="52" cy="32" r="3" fill="white" style={{ animationDelay: '0.15s' }} />
        <path
          className={animated ? 'auth-baymax-smile' : ''}
          d="M30 48 Q40 56 50 48"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  </div>
);

export default BaymaxSplashLogo;
