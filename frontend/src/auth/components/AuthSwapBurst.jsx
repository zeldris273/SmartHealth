const AuthSwapBurst = ({ active }) => {
  if (!active) return null;

  return (
    <div className="auth-swap-burst pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className="auth-swap-burst-dot" style={{ '--i': i }} />
      ))}
      <span className="auth-swap-burst-ring" />
      <span className="auth-swap-burst-ring auth-swap-burst-ring--delay" />
    </div>
  );
};

export default AuthSwapBurst;
