import { Link, NavLink, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import BaymaxLogo from './BaymaxLogo';
import { useAuth } from '../auth/context/AuthContext';

const navItems = [
  { label: 'Bảng điều khiển', to: '/dashboard' },
  { label: 'Trang cá nhân', to: '/profile' },
];

const Header = () => {
  const { isAuthenticated, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <BaymaxLogo size={36} />
          <div>
            <p className="text-sm font-semibold text-slate-900">SmartHealth</p>
            <p className="text-xs text-red-500">Người bạn sức khỏe</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-red-600 underline underline-offset-8 decoration-2 decoration-red-200' : 'text-slate-500 hover:text-red-500'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <button
              onClick={() => {
                logout();
                navigate('/', { replace: true });
              }}
              className="ml-4 flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:shadow-md hover:scale-105 transition-all duration-200"
            >
              <User size={16} />
              Tài khoản
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
