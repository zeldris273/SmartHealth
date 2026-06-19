const BUBBLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: 4 + ((i * 37) % 92),
  bottom: -10 - ((i * 19) % 40),
  size: 10 + (i % 6) * 7,
  duration: 9 + (i % 5) * 2.5,
  delay: (i % 9) * 1.1,
  drift: (i % 2 === 0 ? 1 : -1) * (12 + (i % 4) * 8),
}));

const AuthGlassBackground = () => (
  <div className="auth-glass-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div className="auth-glass-bg-base absolute inset-0" />
    <div className="auth-glass-bg-blob auth-glass-bg-blob--1" />
    <div className="auth-glass-bg-blob auth-glass-bg-blob--2" />
    <div className="auth-glass-bg-blob auth-glass-bg-blob--3" />
    <div className="auth-glass-bg-mesh absolute inset-0" />

    {/* Nhịp tim chạy */}
    <div className="auth-glass-ekg">
      <svg className="auth-glass-ekg-svg" viewBox="0 0 800 48" preserveAspectRatio="none">
        <path
          className="auth-glass-ekg-track"
          d="M0 24 H40 L52 8 L64 40 L76 24 H160 L172 10 L184 38 L196 24 H320 L332 6 L344 42 L356 24 H480 L492 12 L504 36 L516 24 H640 L652 8 L664 40 L676 24 H800"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="auth-glass-ekg-line"
          d="M0 24 H40 L52 8 L64 40 L76 24 H160 L172 10 L184 38 L196 24 H320 L332 6 L344 42 L356 24 H480 L492 12 L504 36 L516 24 H640 L652 8 L664 40 L676 24 H800"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="auth-glass-ekg-dot" />
    </div>

    {/* Bong bóng bay đều */}
    <div className="auth-glass-bubbles">
      {BUBBLES.map((b) => (
        <span
          key={b.id}
          className="auth-glass-bubble"
          style={{
            '--b-left': `${b.left}%`,
            '--b-bottom': `${b.bottom}%`,
            '--b-size': `${b.size}px`,
            '--b-duration': `${b.duration}s`,
            '--b-delay': `${b.delay}s`,
            '--b-drift': `${b.drift}px`,
          }}
        />
      ))}
    </div>

    {/* Sóng biển */}
    <div className="auth-glass-waves">
      <svg className="auth-glass-wave auth-glass-wave--1" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,55 C240,95 480,15 720,55 C960,95 1200,15 1440,55 L1440,120 L0,120 Z"
          fill="rgba(255,255,255,0.12)"
        />
      </svg>
      <svg className="auth-glass-wave auth-glass-wave--2" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,70 C360,30 720,100 1080,70 C1260,55 1380,65 1440,70 L1440,120 L0,120 Z"
          fill="rgba(255,255,255,0.18)"
        />
      </svg>
      <svg className="auth-glass-wave auth-glass-wave--3" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          d="M0,85 C180,105 360,75 540,85 C720,95 900,70 1080,85 C1260,100 1380,80 1440,85 L1440,120 L0,120 Z"
          fill="rgba(255,255,255,0.25)"
        />
      </svg>
    </div>
  </div>
);

export default AuthGlassBackground;
