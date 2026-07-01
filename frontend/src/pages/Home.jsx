import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Scale,
  Weight,
  Flame,
  HeartPulse,
  MessageCircle,
  TrendingUp,
  Brain,
  BarChart3,
  Lightbulb,
  Bot,
  ArrowRight,
  User,
  Lock,
  Headphones,
} from "lucide-react";
import BaymaxLogo from "../components/BaymaxLogo";
import HealthTipWidget from "../components/dashboard/HealthTipWidget";
import CSKHChatWidget from "../components/customerservice/CSKHChatWidget";
import { useAuth } from "../auth/context/AuthContext";
import api from "../services/api";

// Màu sắc được map theo Ý NGHĨA của trạng thái, không theo brand color cố định.
// good = ổn định/tốt, warning = cần chú ý, alert = cảnh báo, neutral = chỉ là số liệu tham khảo (không tốt/xấu)
const TONE = {
  good: { value: "text-emerald-600", chip: "bg-emerald-50 text-emerald-600" },
  warning: { value: "text-amber-600", chip: "bg-amber-50 text-amber-600" },
  alert: { value: "text-red-600", chip: "bg-red-50 text-red-600" },
  neutral: { value: "text-orange-500", chip: "bg-orange-50 text-orange-500" },
};

// Thay cho 3 "feature card" lặp nội dung với wheel: đây là một QUY TRÌNH thật
// (thứ tự có ý nghĩa: tạo hồ sơ -> AI phân tích -> nhận gợi ý), nên đánh số 01/02/03 hợp lý.
const steps = [
  {
    number: "01",
    icon: User,
    title: "Tạo hồ sơ sức khỏe",
    desc: "Nhập chiều cao, cân nặng và mục tiêu để Baymax hiểu đúng tình trạng của bạn.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI phân tích mỗi ngày",
    desc: "Baymax theo dõi chỉ số liên tục và phát hiện sớm những thay đổi cần lưu ý.",
  },
  {
    number: "03",
    icon: MessageCircle,
    title: "Nhận gợi ý & trò chuyện",
    desc: "Hỏi đáp trực tiếp với Baymax để điều chỉnh thói quen kịp thời, mọi lúc.",
  },
];

const features_wheel = [
  {
    icon: Scale,
    title: "BMI Calculator",
    desc: "Tính chỉ số BMI và nhận gợi ý sức khỏe phù hợp.",
  },
  {
    icon: BarChart3,
    title: "Theo dõi cân nặng",
    desc: "Lịch sử cân nặng theo thời gian với biểu đồ trực quan.",
  },
  {
    icon: Flame,
    title: "Calories",
    desc: "Ước tính lượng calo tiêu thụ mỗi ngày.",
  },
  {
    icon: Lightbulb,
    title: "Gợi ý sức khỏe",
    desc: "Nhận gợi ý cá nhân hóa dựa trên chỉ số của bạn.",
  },
  {
    icon: Bot,
    title: "AI Chatbot",
    desc: "Trò chuyện với Baymax để được tư vấn sức khỏe 24/7.",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  
  const [visible, setVisible] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const radius = 100;

  const [bmiData, setBmiData] = useState({
    value: "22.4",
    status: "Bình thường",
    tone: "good"
  });
  const [weightData, setWeightData] = useState({
    value: "68",
    status: "Ổn định",
    tone: "good"
  });
  const [caloriesData, setCaloriesData] = useState({
    value: "1,850",
    status: "Hôm nay",
    tone: "neutral"
  });
  const [healthData, setHealthData] = useState({
    value: "82",
    status: "Tốt",
    tone: "good"
  });
  const [streakDays, setStreakDays] = useState(1);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  useEffect(() => {
    const getStreakDays = () => {
      const streakKey = `user_streak_${user?.id || "guest"}`;
      const lastActiveKey = `user_last_active_${user?.id || "guest"}`;
      const storedStreak = localStorage.getItem(streakKey);
      const lastActiveStr = localStorage.getItem(lastActiveKey);
      const todayStr = new Date().toDateString();
      
      if (!storedStreak || !lastActiveStr) {
        localStorage.setItem(streakKey, "1"); 
        localStorage.setItem(lastActiveKey, todayStr);
        return 1;
      }
      
      const lastActiveDate = new Date(lastActiveStr);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate - lastActiveDate);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        const newStreak = parseInt(storedStreak) + 1;
        localStorage.setItem(streakKey, newStreak.toString());
        localStorage.setItem(lastActiveKey, todayStr);
        return newStreak;
      } else if (diffDays > 1) {
        localStorage.setItem(streakKey, "1");
        localStorage.setItem(lastActiveKey, todayStr);
        return 1;
      } else {
        return parseInt(storedStreak);
      }
    };
    
    setStreakDays(getStreakDays());
  }, [user?.id]);

  useEffect(() => {
    const fetchRealData = async () => {
      if (!isAuthenticated) return;
      
      let finalWeight = user?.weight || null;
      let finalHeight = user?.height || null;
      let bmiValStr = null;
      let bmiCatVi = null;
      let bmiTone = "good";
      
      // 1. Lấy dữ liệu BMI mới nhất từ API
      try {
        const bmiRes = await api.get('/health/bmi/latest');
        if (bmiRes.data) {
          finalWeight = bmiRes.data.weight_kg;
          finalHeight = bmiRes.data.height_cm;
          bmiValStr = bmiRes.data.bmi_value.toFixed(1);
          bmiCatVi = bmiRes.data.bmi_category_vi;
        }
      } catch (err) {
        console.log("No latest BMI record found or error fetching, fallback to user profile:", err);
      }
      
      // Fallback tính toán BMI nếu chưa có bản ghi nhưng đã điền cân nặng và chiều cao ở profile
      if (!bmiValStr && finalWeight && finalHeight) {
        const heightM = finalHeight / 100;
        const calcBmi = finalWeight / (heightM * heightM);
        bmiValStr = calcBmi.toFixed(1);
        
        if (calcBmi < 18.5) {
          bmiCatVi = "Thiếu cân";
          bmiTone = "warning";
        } else if (calcBmi >= 18.5 && calcBmi < 25) {
          bmiCatVi = "Bình thường";
          bmiTone = "good";
        } else if (calcBmi >= 25 && calcBmi < 30) {
          bmiCatVi = "Thừa cân";
          bmiTone = "warning";
        } else {
          bmiCatVi = "Béo phì";
          bmiTone = "alert";
        }
      } else if (bmiValStr) {
        const bmiVal = parseFloat(bmiValStr);
        if (bmiVal < 18.5) bmiTone = "warning";
        else if (bmiVal >= 18.5 && bmiVal < 25) bmiTone = "good";
        else if (bmiVal >= 25 && bmiVal < 30) bmiTone = "warning";
        else bmiTone = "alert";
      }
      
      if (bmiValStr && bmiCatVi) {
        setBmiData({
          value: bmiValStr,
          status: bmiCatVi,
          tone: bmiTone
        });
      }
      
      if (finalWeight) {
        let weightStatus = "Ổn định";
        let weightTone = "good";
        try {
          const historyRes = await api.get('/health/weight/history');
          const history = historyRes.data?.history || [];
          if (history.length > 1) {
            const lastChange = history[0].change;
            if (lastChange > 1.5) {
              weightStatus = `Tăng (+${lastChange}kg)`;
              weightTone = "warning";
            } else if (lastChange < -1.5) {
              weightStatus = `Giảm (${lastChange}kg)`;
              weightTone = "warning";
            }
          }
        } catch (err) {
          console.log("Error fetching weight history for status:", err);
        }
        
        setWeightData({
          value: String(finalWeight),
          status: weightStatus,
          tone: weightTone
        });
      }
      
      // 2. Điểm sức khỏe ước tính theo BMI
      if (bmiValStr) {
        const bmiVal = parseFloat(bmiValStr);
        let score = 82;
        let scoreStatus = "Tốt";
        let scoreTone = "good";
        
        if (bmiVal >= 18.5 && bmiVal < 25) {
          score = Math.round(90 + (5 - Math.abs(bmiVal - 21.7)) * 2);
          if (score > 100) score = 100;
          scoreStatus = "Tốt";
          scoreTone = "good";
        } else if (bmiVal >= 25 && bmiVal < 30) {
          score = Math.round(85 - (bmiVal - 25) * 3);
          scoreStatus = "Khá";
          scoreTone = "warning";
        } else if (bmiVal < 18.5) {
          score = Math.round(85 - (18.5 - bmiVal) * 4);
          scoreStatus = "Cần chú ý";
          scoreTone = "warning";
        } else {
          score = Math.max(40, Math.round(70 - (bmiVal - 30) * 4));
          scoreStatus = "Cần cải thiện";
          scoreTone = "alert";
        }
        
        setHealthData({
          value: String(score),
          status: scoreStatus,
          tone: scoreTone
        });
      }
      
      // 3. Lấy chỉ số TDEE / Calories target từ API gợi ý
      try {
        let goalParam = "maintain";
        if (user?.fitness_goal) {
          if (user.fitness_goal === "lose_weight") goalParam = "lose";
          else if (user.fitness_goal === "gain_weight" || user.fitness_goal === "gain_muscle") goalParam = "gain";
        }
        
        const tipsRes = await api.get(`/health/tips?goal=${goalParam}`);
        if (tipsRes.data?.goal_tips?.calorie_target) {
          const calorieStr = tipsRes.data.goal_tips.calorie_target;
          const match = calorieStr.match(/\d+([\.,]\d+)?/);
          if (match) {
            let calVal = parseFloat(match[0].replace(',', ''));
            const formattedCal = calVal.toLocaleString('en-US');
            
            let calStatus = "Hôm nay";
            if (user?.fitness_goal) {
              const goalMap = {
                lose_weight: "Giảm cân",
                gain_weight: "Tăng cân",
                maintain_weight: "Duy trì",
                gain_muscle: "Tăng cơ"
              };
              calStatus = goalMap[user.fitness_goal] || "Hôm nay";
            }
            
            setCaloriesData({
              value: formattedCal,
              status: calStatus,
              tone: "neutral"
            });
          }
        }
      } catch (err) {
        console.log("Error fetching calorie tips:", err);
      }
    };
    
    fetchRealData();
  }, [isAuthenticated, user]);

  const stats = [
    {
      icon: Scale,
      label: "BMI",
      value: bmiData.value,
      unit: "",
      status: bmiData.status,
      tone: bmiData.tone,
    },
    {
      icon: Weight,
      label: "Cân nặng",
      value: weightData.value,
      unit: "kg",
      status: weightData.status,
      tone: weightData.tone,
    },
    {
      icon: Flame,
      label: "Calories",
      value: caloriesData.value,
      unit: "kcal",
      status: caloriesData.status,
      tone: caloriesData.tone,
    },
    {
      icon: HeartPulse,
      label: "Sức khỏe",
      value: healthData.value,
      unit: "%",
      status: healthData.status,
      tone: healthData.tone,
    },
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-red-100 via-rose-50 to-pink-100 transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Định nghĩa animation tại chỗ để không phụ thuộc cấu hình tailwind.config,
          đồng thời tôn trọng prefers-reduced-motion cho người dùng nhạy cảm với chuyển động. */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.05); }
          50% { transform: scale(1); }
        }
        .animate-heartbeat { animation: heartbeat 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-heartbeat,
          .transition-all { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Hero Section */}
      <section className="px-6 sm:px-8 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div
            className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded-full mb-6 border border-red-100">
              <span aria-hidden="true">✦</span>
              <span>AI Healthcare Assistant</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1e293b] leading-tight mb-4">
              Chăm sóc sức khỏe
              <br />
              thông minh cùng <span className="text-red-500">AI</span>
            </h1>
            <p className="text-gray-500 text-base mb-8 leading-relaxed">
              Baymax luôn sẵn sàng đồng hành cùng bạn theo dõi sức khỏe,
              <br className="hidden sm:block" />
              tư vấn và đưa ra những gợi ý tốt nhất cho bạn.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-red-500 text-white rounded-full px-7 py-3 text-sm font-medium hover:bg-red-600 hover:scale-105 transition-all duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
              >
                Vào Dashboard <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <Link
                to="/chat"
                className="bg-white text-gray-700 border border-gray-200 rounded-full px-7 py-3 text-sm font-medium hover:bg-gray-50 hover:scale-105 transition-all duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" /> Chat với Baymax
              </Link>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-orange-500" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    <span className="text-orange-500 font-bold">{streakDays} ngày</span> liên tiếp
                  </div>
                  <div className="text-xs text-gray-400">
                    Bạn đang duy trì thói quen rất tốt
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <HeartPulse className="w-5 h-5 text-red-500 animate-pulse" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Bạn cần được chăm sóc sức khỏe?
                  </div>
                  <div className="text-xs text-gray-400">
                    Hãy tính chỉ số đầu tiên cùng Baymax nhé!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right - Baymax wheel + info card + floating stats */}
          <div
            className={`relative flex items-center justify-center transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="absolute w-72 h-72 bg-red-100 rounded-full opacity-50" aria-hidden="true" />

            <div className="flex flex-col items-center gap-4 z-10">
              {/* Wheel */}
              <div className="relative w-[260px] h-[260px] flex items-center justify-center">
                {features_wheel.map((f, i) => {
                  const angle =
                    (i * 2 * Math.PI) / features_wheel.length - Math.PI / 2;
                  const x = radius * Math.cos(angle);
                  const y = radius * Math.sin(angle);
                  const isActive = activeFeature === i;
                  const Icon = f.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveFeature(isActive ? null : i)}
                      aria-label={f.title}
                      aria-pressed={isActive}
                      tabIndex={wheelOpen ? 0 : -1}
                      className={`absolute w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${isActive ? "bg-red-500 text-white ring-4 ring-red-200" : "bg-white text-red-500 border border-red-100 hover:bg-red-50 hover:scale-110"}`}
                      style={{
                        transform: wheelOpen
                          ? `translate(${x}px, ${y}px) scale(${isActive ? 1.2 : 1})`
                          : "translate(0,0) scale(0)",
                        opacity: wheelOpen ? 1 : 0,
                        transitionDelay: wheelOpen ? `${i * 60}ms` : "0ms",
                      }}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    setWheelOpen(!wheelOpen);
                    setActiveFeature(null);
                  }}
                  aria-label={wheelOpen ? "Thu gọn menu tính năng" : "Mở menu tính năng Baymax"}
                  aria-expanded={wheelOpen}
                  className="z-10 transition-all duration-300 animate-heartbeat hover:scale-105 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                >
                  <BaymaxLogo size={110} />
                </button>
              </div>

              {/* Info card cố định bên dưới wheel */}
              <div
                className={`w-[260px] bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 min-h-[64px] transition-all duration-300 ${activeFeature !== null ? "border-red-100 shadow-md" : "border-gray-100"}`}
                aria-live="polite"
              >
                {activeFeature !== null ? (
                  <>
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const Icon = features_wheel[activeFeature].icon;
                        return <Icon className="w-5 h-5 text-red-500" aria-hidden="true" />;
                      })()}
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

            {/* Floating stat cards — chỉ hiện ở màn hình lớn để tránh vỡ layout/tràn ngang trên mobile.
                Trên mobile, thông tin tương đương đã có ở Stats Section bên dưới. */}
            <div className="hidden lg:block absolute top-4 left-0 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100 z-20">
              <div className="text-xs text-gray-400 mb-1">BMI</div>
              <div className={!isAuthenticated ? "filter blur-[2.5px] select-none" : ""}>
                <div className={`text-xl font-bold ${TONE[bmiData.tone].value}`}>{bmiData.value}</div>
                <div className={`text-xs ${TONE[bmiData.tone].value}`}>{bmiData.status}</div>
              </div>
            </div>
            <div className="hidden lg:block absolute top-4 right-0 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100 z-20">
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <HeartPulse className="w-3.5 h-3.5" aria-hidden="true" /> Sức khỏe
              </div>
              <div className={!isAuthenticated ? "filter blur-[2.5px] select-none" : ""}>
                <div className={`text-xl font-bold ${TONE[healthData.tone].value}`}>{healthData.value}%</div>
                <div className={`text-xs ${TONE[healthData.tone].value}`}>{healthData.status}</div>
              </div>
            </div>
            <div className="hidden lg:block absolute bottom-16 right-0 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100 z-20">
              <div className="text-xs text-gray-400 mb-1">Calories</div>
              <div className={!isAuthenticated ? "filter blur-[2.5px] select-none" : ""}>
                <div className={`text-xl font-bold ${TONE[caloriesData.tone].value}`}>
                  {caloriesData.value}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    kcal
                  </span>
                </div>
                <div className="text-xs text-gray-400">{caloriesData.status}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className={`px-6 sm:px-8 py-8 max-w-7xl mx-auto transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Tổng quan sức khỏe
        </h2>
        <div className="relative">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-300 ${!isAuthenticated ? "filter blur-[5px] select-none pointer-events-none opacity-40" : ""}`}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              const tone = TONE[s.tone];
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${tone.value}`}>
                    {s.value}
                    <span className="text-sm font-normal ml-1">{s.unit}</span>
                  </div>
                  <div className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-full ${tone.chip}`}>
                    {s.status}
                  </div>
                </div>
              );
            })}
          </div>
          {!isAuthenticated && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/10 backdrop-blur-[1px] rounded-2xl border border-dashed border-red-200 p-6 z-10 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 shadow-sm border border-red-100">
                <Lock className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-[#1e293b] mb-1">
                Xem chi tiết chỉ số của bạn
              </h3>
              <p className="text-xs text-gray-400 mb-4 text-center max-w-[280px]">
                Đăng nhập để theo dõi cân nặng, chỉ số BMI và nhận thực đơn từ AI Baymax.
              </p>
              <button
                onClick={() => openAuthModal('login')}
                className="bg-red-500 text-white rounded-full px-6 py-2 text-xs font-semibold hover:bg-red-600 hover:scale-105 transition-all duration-200 shadow-md shadow-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>
       </section>

       {/* Daily Health Tip Section */}
       {isAuthenticated && (
         <section
           className={`px-6 sm:px-8 py-8 max-w-7xl mx-auto transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
         >
           <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
             Lời khuyên hôm nay
           </h2>
           <HealthTipWidget />
         </section>
       )}

       {/* Cách hoạt động — thay cho 3 feature card từng lặp nội dung với wheel ở hero.
          Đây là một quy trình thật nên đánh số có ý nghĩa (01 → 02 → 03). */}
      <section
        className={`px-6 sm:px-8 py-8 max-w-7xl mx-auto pb-16 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Cách hoạt động
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-red-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-red-500" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-semibold text-gray-300 tracking-widest">
                    {s.number}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#1e293b] mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer Service Section */}
      {user?.role !== 'admin' && (
        <section
          className={`px-6 sm:px-8 py-8 max-w-7xl mx-auto pb-16 transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="bg-white rounded-3xl p-8 border border-red-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-60" />
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1e293b] mb-1">Trung tâm hỗ trợ</h2>
                <p className="text-gray-500 max-w-md">
                  Bạn gặp khó khăn khi sử dụng Baymax hoặc cần tư vấn chi tiết hơn về sức khỏe? 
                  Đội ngũ CSKH của chúng tôi luôn sẵn sàng hỗ trợ bạn.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-cskh-chat'))}
              className="relative z-10 bg-red-500 text-white rounded-full px-8 py-3 text-sm font-semibold hover:bg-red-600 hover:scale-105 transition-all duration-200 shadow-md shadow-red-200 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Chat với CSKH ngay
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center pb-8 px-6">
        <p className="text-xs text-gray-300 italic">
          "I cannot deactivate until you are satisfied with your care." — Baymax
        </p>
      </footer>
      {user?.role !== 'admin' && <CSKHChatWidget />}
    </div>
  );
};

export default Home;