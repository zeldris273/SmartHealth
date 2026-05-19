import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BaymaxLogo from '../components/BaymaxLogo';
import { useAuth } from '../auth/context/AuthContext';

const stats = [
  { label: 'BMI', value: '22.4', unit: '', status: 'Bình thường' },
  { label: 'Cân nặng', value: '68', unit: 'kg', status: 'Ổn định' },
  { label: 'Calories', value: '1,850', unit: 'kcal', status: 'Hôm nay' },
  { label: 'Sức khỏe', value: '82', unit: '%', status: 'Tốt' },
];

const features = [
  { icon: '⚖️', title: 'BMI Calculator', desc: 'Tính chỉ số BMI và nhận gợi ý sức khỏe phù hợp.' },
  { icon: '📊', title: 'Theo dõi cân nặng', desc: 'Lịch sử cân nặng theo thời gian với biểu đồ trực quan.' },
  { icon: '🔥', title: 'Calories', desc: 'Ước tính lượng calo tiêu thụ mỗi ngày.' },
  { icon: '💡', title: 'Gợi ý sức khỏe', desc: 'Nhận gợi ý cá nhân hóa dựa trên chỉ số của bạn.' },
  { icon: '🤖', title: 'AI Chatbot', desc: 'Trò chuyện với Baymax để được tư vấn sức khỏe 24/7.' },
];

const FeatureWheel = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const radius = 110;

  const handleCenter = () => {
    setOpen(!open);
    setActive(null);
  };

  const handleFeature = (i) => {
    setActive(active === i ? null : i);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-[300px] h-[300px] flex items-center justify-center">
        {features.map((f, i) => {
          const angle = (i * 2 * Math.PI) / features.length - Math.PI / 2;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          const isActive = active === i;
          return (
            <button
              key={i}
              onClick={() => handleFeature(i)}
              className={`absolute w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-md transition-all duration-500
                ${isActive ? 'bg-red-500 ring-4 ring-red-200' : 'bg-white border border-gray-100 hover:bg-red-50 hover:scale-110'}
              `}
              style={{
                transform: open
                  ? `translate(${x}px, ${y}px) scale(${isActive ? 1.25 : 1})`
                  : 'translate(0px, 0px) scale(0)',
                opacity: open ? 1 : 0,
                transitionDelay: open ? `${i * 60}ms` : '0ms',
              }}
            >
              {f.icon}
            </button>
          );
        })}

        <button
          onClick={handleCenter}
          className={`z-10 transition-all duration-300 ${open ? 'scale-110' : 'hover:scale-105'}`}
        >
          <BaymaxLogo size={80} />
        </button>
      </div>

      <div className="min-h-[80px] text-center">
        {active !== null ? (
          <div className="bg-white rounded-2xl px-6 py-4 border border-red-100 shadow-md transition-all duration-300 max-w-xs">
            <div className="text-2xl mb-1">{features[active].icon}</div>
            <h3 className="text-sm font-semibold text-[#1e293b] mb-1">{features[active].title}</h3>
            <p className="text-xs text-gray-400">{features[active].desc}</p>
          </div>
        ) : (
          <p className="text-xs text-gray-300 italic">
            {open ? 'Click vào icon để xem chi tiết' : 'Click vào Baymax để khám phá tính năng'}
          </p>
        )}
      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const { isAuthenticated, logout, openAuthModal } = useAuth();

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <BaymaxLogo size={36} />
          <span className="text-lg font-semibold text-[#1e293b]">SmartHealth</span>
        </div>
        <nav className="flex items-center gap-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-red-500 transition-all duration-200 hover:scale-105"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/chatbot')}
            className="text-sm text-gray-500 hover:text-red-500 transition-all duration-200 hover:scale-105"
          >
            Chatbot
          </button>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-gray-500 hover:text-red-500 transition-all duration-200 hover:scale-105"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="bg-red-50 text-red-500 border border-red-100 rounded-full px-4 py-2 text-sm font-medium hover:bg-red-100 transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuthModal('login')}
                className="text-sm text-gray-500 hover:text-red-500 transition-all duration-200 hover:scale-105"
              >
                Login
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                Register
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className={`flex flex-col items-center justify-center text-center px-6 py-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="mb-6 animate-heartbeat">
  <BaymaxLogo size={96} />
</div>
        <h1 className="text-4xl font-semibold text-[#1e293b] mb-3">
          Xin chào, tôi là <span className="text-red-500">Baymax!</span>
        </h1>
        <p className="text-gray-400 italic text-base mb-2">
          "Hello. I am Baymax, your personal healthcare companion."
        </p>
        <p className="text-gray-400 text-sm mb-10 max-w-md">
          Hệ thống chăm sóc sức khỏe thông minh — theo dõi sức khỏe, tính BMI, và trò chuyện với AI Baymax mọi lúc mọi nơi.
        </p>
        <div className="flex gap-4 mb-16">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full px-8 py-3 text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Vào Dashboard
          </button>
          <button
            onClick={() => navigate('/chatbot')}
            className="bg-white text-red-500 border-2 border-red-500 rounded-full px-8 py-3 text-sm font-medium hover:bg-red-50 hover:scale-105 transition-all duration-200"
          >
            Chat với Baymax
          </button>
        </div>

        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-8">Tính năng nổi bật</h2>
        <FeatureWheel />
      </section>

      {/* Quick Stats */}
      <section className={`px-8 pb-10 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center hover:shadow-md hover:scale-105 hover:border-red-200 transition-all duration-200 cursor-default">
              <div className="text-2xl font-semibold text-red-500">{s.value}<span className="text-base ml-1">{s.unit}</span></div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              <div className="text-xs text-red-300 mt-1 italic">{s.status}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8">
        <p className="text-xs text-gray-300 italic">
          "I cannot deactivate until you are satisfied with your care." — Baymax
        </p>
      </footer>

    </div>
  );
};

export default Home;