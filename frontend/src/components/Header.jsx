import { Link, NavLink, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import BaymaxLogo from './BaymaxLogo';
import { useAuth } from '../auth/context/AuthContext';
import { useRef } from 'react';

const navItems = [
  { label: 'Bảng điều khiển', to: '/dashboard' },
  { label: 'Chatbot', to: '/chat' },
  { label: 'Trang cá nhân', to: '/profile' },
];

const Header = () => {
  const { isAuthenticated, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const spawnParticles = () => {
    const wrap = btnRef.current?.parentElement;
    const btn = btnRef.current;
    if (!wrap || !btn) return;
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      const x = Math.random() * btn.offsetWidth;
      p.style.cssText = `
        position:absolute;
        left:${x}px;bottom:0;
        width:${3 + Math.random() * 4}px;
        height:${3 + Math.random() * 4}px;
        border-radius:50%;
        background:#ef4444;
        pointer-events:none;
        animation:float-up 1.2s ease-out ${Math.random() * 0.3}s forwards;
        z-index:0;
      `;
      wrap.appendChild(p);
      setTimeout(() => p.remove(), 1400);
    }
  };

  const clickEffect = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.transform = 'scale(0.92)';
    setTimeout(() => (btn.style.transform = ''), 150);
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('div');
      const angle = (i / 10) * 360;
      const dist = 20 + Math.random() * 20;
      p.style.cssText = `position:absolute;left:50%;bottom:50%;width:5px;height:5px;border-radius:50%;background:#ef4444;pointer-events:none;z-index:0;`;
      p.animate(
        [
          { transform: `translate(-50%,50%) scale(1)`, opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(50% - ${Math.sin(angle) * dist}px)) scale(0)`, opacity: 0 },
        ],
        { duration: 500, easing: 'ease-out', fill: 'forwards' }
      );
      btn.appendChild(p);
      setTimeout(() => p.remove(), 520);
    }
  };

  const addRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const r = document.createElement('span');
    r.style.cssText = `
      position:absolute;border-radius:50%;
      background:rgba(239,68,68,0.18);
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      transform:scale(0);
      animation:ripple-nav 0.5s linear;
      pointer-events:none;
    `;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 500);
  };

  return (
    <>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-32px) scale(0); opacity: 0; }
        }
        @keyframes ripple-nav {
          to { transform: scale(5); opacity: 0; }
        }
        @keyframes glow-pulse {
          0%,100% { transform: scale(1); opacity: 0; }
          50% { transform: scale(1.15); opacity: 0.25; }
        }
        @keyframes grow-line {
          from { width: 0; }
          to { width: 16px; }
        }
        .nav-pill-active {
          color: #ef4444 !important;
          background: white !important;
          box-shadow: 0 2px 8px rgba(239,68,68,0.2) !important;
        }
        .nav-pill-active::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 2px;
          background: #ef4444;
          border-radius: 999px;
          animation: grow-line 0.3s ease;
        }
        .btn-account-wow::before {
          content: '';
          position: absolute;
          top: -50%; left: -60%;
          width: 35%; height: 200%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg);
          transition: left 0s;
          pointer-events: none;
        }
        .btn-account-wow:hover::before {
          left: 160%;
          transition: left 0.5s ease;
        }
        .btn-account-wow::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 999px;
          background: #ef4444;
          opacity: 0;
          z-index: -1;
          animation: glow-pulse 2s ease-in-out infinite;
        }
        .btn-account-wow:hover {
          transform: scale(1.08) translateY(-2px) !important;
          box-shadow: 0 8px 24px rgba(239,68,68,0.45) !important;
        }
        .tooltip-wow {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%) translateY(6px);
          background: #1e293b;
          color: white;
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 8px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
          z-index: 50;
        }
        .tooltip-wow::after {
          content: '';
          position: absolute;
          top: 100%; left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #1e293b;
        }
        .btn-wrap-wow:hover .tooltip-wow {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .logo-baymax { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .logo-baymax:hover { transform: rotate(-8deg) scale(1.1); }
      `}</style>

      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">

          <Link to="/" className="flex items-center gap-3">
            <div className="logo-baymax">
              <BaymaxLogo size={36} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">SmartHealth</p>
              <p className="text-xs text-red-500">Người bạn sức khỏe</p>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            {/* Nav pills */}
            <div className="flex items-center gap-1 rounded-full border px-1 py-1"
              style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.12)' }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={addRipple}
                  className={({ isActive }) =>
                    `relative overflow-hidden text-sm font-medium px-4 py-1.5 rounded-full border-none transition-all duration-200 cursor-pointer
                    ${isActive ? 'nav-pill-active' : 'text-slate-500 hover:text-red-500 hover:scale-105'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Account button */}
            {isAuthenticated ? (
              <button
                onClick={() => { logout(); navigate('/', { replace: true }); }}
                className="flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-100 hover:shadow-md hover:scale-105 active:scale-95"
              >
                <LogOut size={15} />
                Đăng xuất
              </button>
            ) : (
              <div className="btn-wrap-wow relative">
                <div className="tooltip-wow">Đăng nhập hoặc đăng ký</div>
                <button
                  ref={btnRef}
                  onClick={(e) => { clickEffect(e); openAuthModal('login'); }}
                  onMouseEnter={spawnParticles}
                  className="btn-account-wow relative flex items-center gap-2 bg-red-500 text-white rounded-full px-5 py-2 text-sm font-medium overflow-hidden transition-all duration-200 active:scale-95"
                >
                  <User size={15} className="relative z-10" />
                  <span className="relative z-10">Tài khoản</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;