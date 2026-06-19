import { useState } from 'react';
import api from '../../services/api';
import HealthTipsModal from './HealthTipsModal';
import { useAuth } from '../../auth/context/AuthContext';

const CaloriesCalculator = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const handleOpenTipsModal = () => {
    if (!isAuthenticated) {
      setShowLoginWarning(true);
      setTimeout(() => setShowLoginWarning(false), 3000);
      return;
    }
    setShowTipsModal(true);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post('/health/calories', {
        weight_kg: parseFloat(weight),
        height_cm: parseFloat(height),
        age: parseInt(age),
        gender: gender,
        activity_level: activityLevel
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Tính Calories Cần Thiết</h2>
      
      <form onSubmit={handleCalculate} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cân nặng (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập cân nặng"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chiều cao (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập chiều cao"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tuổi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ hoạt động</label>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sedentary">Ít vận động (ngồi nhiều)</option>
            <option value="lightly_active">Vận động nhẹ (1-3 ngày/tuần)</option>
            <option value="moderately_active">Vận động trung bình (3-5 ngày/tuần)</option>
            <option value="very_active">Vận động nhiều (6-7 ngày/tuần)</option>
            <option value="extra_active">Vận động rất nhiều</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Đang tính...' : 'Tính Calories'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-700 mb-1">BMR (Lượng calo cơ bản)</h3>
              <p className="text-2xl font-bold text-blue-900">{result.bmr} kcal/ngày</p>
              <p className="text-xs text-blue-600 mt-1">{result.bmr_formula}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-700 mb-1">TDEE (Tổng lượng calo cần)</h3>
              <p className="text-2xl font-bold text-green-900">{result.tdee} kcal/ngày</p>
              <p className="text-xs text-green-600 mt-1">{result.tdee_explanation}</p>
            </div>
          </div>
          
          {/* Nút nhận gợi ý sức khỏe */}
          <button
            onClick={handleOpenTipsModal}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
             Nhận gợi ý sức khỏe cá nhân hóa
          </button>

          {/* Thông báo cần đăng nhập */}
          {showLoginWarning && (
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300">
              Vui lòng đăng nhập để dùng tính năng này!
            </div>
          )}
        </div>
      )}

      {/* Modal gợi ý sức khỏe */}
      <HealthTipsModal
        isOpen={showTipsModal}
        onClose={() => setShowTipsModal(false)}
        tdee={result?.tdee}
        currentWeight={parseFloat(weight)}
      />
    </div>
  );
};

export default CaloriesCalculator;
