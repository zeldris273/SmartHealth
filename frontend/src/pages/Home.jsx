import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import BaymaxLogo from "../components/BaymaxLogo";

const stats = [
  {
    icon: "⚖️",
    label: "BMI",
    value: "22.4",
    unit: "",
    status: "Bình thường",
    color: "text-red-500",
  },
  {
    icon: "👜",
    label: "Cân nặng",
    value: "68",
    unit: "kg",
    status: "Ổn định",
    color: "text-red-500",
  },
  {
    icon: "🔥",
    label: "Calories",
    value: "1,850",
    unit: "kcal",
    status: "Hôm nay",
    color: "text-orange-400",
  },
  {
    icon: "❤️",
    label: "Sức khỏe",
    value: "82",
    unit: "%",
    status: "Tốt",
    color: "text-green-500",
  },
];

const features = [
  {
    icon: "💬",
    title: "AI Chat cùng Baymax",
    desc: "Trò chuyện với AI để nhận tư vấn và giải đáp mọi thắc mắc về sức khỏe.",
    link: "Trải nghiệm ngay",
  },
  {
    icon: "📈",
    title: "Theo dõi sức khỏe",
    desc: "Theo dõi chỉ số cơ thể và lịch sử sức khỏe theo thời gian thực.",
    link: "Xem chi tiết",
  },
  {
    icon: "🧠",
    title: "Phân tích thông minh",
    desc: "AI phân tích dữ liệu và đưa ra những gợi ý cải thiện sức khỏe cho bạn.",
    link: "Khám phá ngay",
  },
];

const features_wheel = [
  {
    icon: "⚖️",
    title: "BMI Calculator",
    desc: "Tính chỉ số BMI và nhận gợi ý sức khỏe phù hợp.",
  },
  {
    icon: "📊",
    title: "Theo dõi cân nặng",
    desc: "Lịch sử cân nặng theo thời gian với biểu đồ trực quan.",
  },
  {
    icon: "🔥",
    title: "Calories",
    desc: "Ước tính lượng calo tiêu thụ mỗi ngày.",
  },
  {
    icon: "💡",
    title: "Gợi ý sức khỏe",
    desc: "Nhận gợi ý cá nhân hóa dựa trên chỉ số của bạn.",
  },
  {
    icon: "🤖",
    title: "AI Chatbot",
    desc: "Trò chuyện với Baymax để được tư vấn sức khỏe 24/7.",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const radius = 100;

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const openChatbot = () => {
    window.dispatchEvent(new Event("open-chatbot"));
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-red-100 via-rose-50 to-pink-100 transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Hero Section */}
      <section className="px-8 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div
            className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded-full mb-6 border border-red-100">
              <span>✦</span>
              <span>AI Healthcare Assistant</span>
            </div>
            <h1 className="text-5xl font-bold text-[#1e293b] leading-tight mb-4">
              Chăm sóc sức khỏe
              <br />
              thông minh cùng <span className="text-red-500">AI</span>
            </h1>
            <p className="text-gray-500 text-base mb-8 leading-relaxed">
              Baymax luôn sẵn sàng đồng hành cùng bạn theo dõi sức khỏe,
              <br />
              tư vấn và đưa ra những gợi ý tốt nhất cho bạn.
            </p>
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-red-500 text-white rounded-full px-7 py-3 text-sm font-medium hover:bg-red-600 hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                Vào Dashboard →
              </button>
              <Link
                to="/chat"
                className="bg-white text-gray-700 border border-gray-200 rounded-full px-7 py-3 text-sm font-medium hover:bg-gray-50 hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                💬 Chat với Baymax
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["🧑", "👩", "🧔"].map((e, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-sm"
                  >
                    {e}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  10K+ người dùng
                </div>
                <div className="text-xs text-gray-400">
                  tin tưởng sử dụng SmartHealth
                </div>
              </div>
            </div>
          </div>

          {/* Right - Baymax wheel + info card + floating stats */}
          <div
            className={`relative flex items-center justify-center transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="absolute w-72 h-72 bg-red-100 rounded-full opacity-50" />

            <div className="flex flex-col items-center gap-4 z-10">
              {/* Wheel */}
              <div className="relative w-[260px] h-[260px] flex items-center justify-center">
                {features_wheel.map((f, i) => {
                  const angle =
                    (i * 2 * Math.PI) / features_wheel.length - Math.PI / 2;
                  const x = radius * Math.cos(angle);
                  const y = radius * Math.sin(angle);
                  const isActive = activeFeature === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveFeature(isActive ? null : i)}
                      className={`absolute w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md transition-all duration-500 ${isActive ? "bg-red-500 ring-4 ring-red-200" : "bg-white border border-red-100 hover:bg-red-50 hover:scale-110"}`}
                      style={{
                        transform: wheelOpen
                          ? `translate(${x}px, ${y}px) scale(${isActive ? 1.2 : 1})`
                          : "translate(0,0) scale(0)",
                        opacity: wheelOpen ? 1 : 0,
                        transitionDelay: wheelOpen ? `${i * 60}ms` : "0ms",
                      }}
                    >
                      {f.icon}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setWheelOpen(!wheelOpen);
                    setActiveFeature(null);
                  }}
                  className={`z-10 transition-all duration-300 animate-heartbeat ${wheelOpen ? "scale-110" : "hover:scale-105"}`}
                >
                  <BaymaxLogo size={110} />
                </button>
              </div>

              {/* Info card cố định bên dưới wheel */}
              <div
                className={`w-[260px] bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 min-h-[64px] transition-all duration-300 ${activeFeature !== null ? "border-red-100 shadow-md" : "border-gray-100"}`}
              >
                {activeFeature !== null ? (
                  <>
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {features_wheel[activeFeature].icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#1e293b] mb-0.5">
                        {features_wheel[activeFeature].title}
                      </div>
                      <div className="text-xs text-gray-400 leading-relaxed">
                        {features_wheel[activeFeature].desc}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-red-300 italic w-full text-center">
                    {wheelOpen
                      ? "Click icon để xem chi tiết"
                      : "Click Baymax để khám phá tính năng"}
                  </p>
                )}
              </div>
            </div>

            {/* Floating stat cards */}
            <div className="absolute top-4 left-0 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100 z-20">
              <div className="text-xs text-gray-400 mb-1">BMI</div>
              <div className="text-xl font-bold text-red-500">22.4</div>
              <div className="text-xs text-green-500">Bình thường</div>
            </div>
            <div className="absolute top-4 right-0 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100 z-20">
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                ❤️ Sức khỏe
              </div>
              <div className="text-xl font-bold text-red-500">82%</div>
              <div className="text-xs text-green-500">Tốt</div>
            </div>
            <div className="absolute bottom-16 right-0 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100 z-20">
              <div className="text-xs text-gray-400 mb-1">Calories</div>
              <div className="text-xl font-bold text-orange-400">
                1,850
                <span className="text-sm font-normal text-gray-400 ml-1">
                  kcal
                </span>
              </div>
              <div className="text-xs text-gray-400">Hôm nay</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className={`px-8 py-8 max-w-7xl mx-auto transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Tổng quan sức khỏe
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-200"
            >
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="text-xs text-gray-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>
                {s.value}
                <span className="text-sm font-normal ml-1">{s.unit}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">{s.status}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`px-8 py-8 max-w-7xl mx-auto pb-16 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Tính năng nổi bật
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-200"
            >
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-[#1e293b] mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                {f.desc}
              </p>
              <button className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors">
                {f.link} →
              </button>
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
