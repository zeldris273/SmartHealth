const BaymaxSplashLogo = ({ size = 120 }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
    <div
      className="absolute inset-0 rounded-full opacity-60 blur-2xl"
      style={{ background: 'radial-gradient(circle, #8b2b2b 0%, transparent 70%)' }}
    />
    <div
      className="relative flex items-center justify-center rounded-full bg-black"
      style={{
        width: size,
        height: size,
        border: '2px solid #8b2b2b',
        boxShadow: '0 0 40px rgba(139, 43, 43, 0.45), inset 0 0 20px rgba(139, 43, 43, 0.15)',
      }}
    >
      <svg viewBox="0 0 80 80" width={size * 0.45} height={size * 0.45} aria-hidden="true">
        <circle cx="28" cy="32" r="3" fill="white" />
        <circle cx="52" cy="32" r="3" fill="white" />
        <path
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
