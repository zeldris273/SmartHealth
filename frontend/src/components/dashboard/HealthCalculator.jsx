import { useState } from 'react';
import api from '../../services/api';
import HealthTipsModal from './HealthTipsModal';
import { useAuth } from '../../auth/context/AuthContext';

const HealthCalculator = ({ onSave }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Shared fields
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  
  // BMI specific
  const [wristCircumference, setWristCircumference] = useState('');
  const [ankleCircumference, setAnkleCircumference] = useState('');
  const [bmiResult, setBmiResult] = useState(null);
  const [bmiLoading, setBmiLoading] = useState(false);
  
  // Calories specific
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [caloriesResult, setCaloriesResult] = useState(null);
  const [caloriesLoading, setCaloriesLoading] = useState(false);
  
  // Common
  const [error, setError] = useState('');
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [saveHistory, setSaveHistory] = useState(false);
  const [activeResult, setActiveResult] = useState(null); // 'bmi' or 'calories'

  const handleCalculateBMI = async (e) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) {
      setError('Vui lòng nhập đầy đủ chiều cao và cân nặng');
      return;
    }

    setBmiLoading(true);
    setError('');

    try {
      let response;
      const payload = {
        weight_kg: w,
        height_cm: h,
        age: age ? parseInt(age) : null,
        gender: gender,
        wrist_circumference_cm: wristCircumference ? parseFloat(wristCircumference) : null,
        ankle_circumference_cm: ankleCircumference ? parseFloat(ankleCircumference) : null,
      };
      
      if (saveHistory && isAuthenticated) {
        response = await api.post('/health/bmi/save', payload);
        if (onSave) onSave();
      } else {
        response = await api.post('/health/bmi', payload);
      }

      setBmiResult(response.data);
      setActiveResult('bmi');
    } catch (err) {
      console.error('Error calculating BMI:', err);
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi tính BMI');
    } finally {
      setBmiLoading(false);
    }
  };

  const handleCalculateCalories = async (e) => {
    e.preventDefault();
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age);
    
    if (!h || !w || !a) {
      setError('Vui lòng nhập đầy đủ chiều cao, cân nặng và tuổi');
      return;
    }

    setCaloriesLoading(true);
    setError('');
    setCaloriesResult(null);

    try {
      // Nếu tích checkbox lưu lịch sử, thì tính BMI và lưu lịch sử trước
      if (saveHistory && isAuthenticated) {
        const bmiPayload = {
          weight_kg: w,
          height_cm: h,
          age: a,
          gender: gender,
          wrist_circumference_cm: wristCircumference ? parseFloat(wristCircumference) : null,
          ankle_circumference_cm: ankleCircumference ? parseFloat(ankleCircumference) : null,
        };
        await api.post('/health/bmi/save', bmiPayload);
        if (onSave) onSave();
      }

      // Sau đó tính Calories
      const response = await api.post('/health/calories', {
        weight_kg: w,
        height_cm: h,
        age: a,
        gender: gender,
        activity_level: activityLevel
      });
      setCaloriesResult(response.data);
      setActiveResult('calories');
    } catch (err) {
        setError(err.response?.data?.detail || 'Đã xảy ra lỗi');
      } finally {
        setCaloriesLoading(false);
      }
  };

  const handleOpenTipsModal = () => {
    if (!isAuthenticated) {
      setShowLoginWarning(true);
      setTimeout(() => setShowLoginWarning(false), 3000);
      return;
    }
    setShowTipsModal(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Tính Toán Sức Khỏe</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Shared Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cân nặng (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Nhập tuổi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>
      </div>

      {/* Additional Fields for Both Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vòng cổ tay (cm)</label>
          <input
            type="number"
            step="0.1"
            value={wristCircumference}
            onChange={(e) => setWristCircumference(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Tuỳ chọn (dành cho BMI)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vòng cổ chân (cm)</label>
          <input
            type="number"
            step="0.1"
            value={ankleCircumference}
            onChange={(e) => setAnkleCircumference(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Tuỳ chọn (dành cho BMI)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ hoạt động</label>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="sedentary">Ít vận động (ngồi nhiều)</option>
            <option value="lightly_active">Vận động nhẹ (1-3 ngày/tuần)</option>
            <option value="moderately_active">Vận động trung bình (3-5 ngày/tuần)</option>
            <option value="very_active">Vận động nhiều (6-7 ngày/tuần)</option>
            <option value="extra_active">Vận động rất nhiều</option>
          </select>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <input
          type="checkbox"
          id="saveHistory"
          checked={saveHistory}
          onChange={(e) => setSaveHistory(e.target.checked)}
          className="w-4 h-4 text-red-500 rounded focus:ring-red-400"
        />
        <label htmlFor="saveHistory" className="text-sm text-gray-600">
          Lưu lịch sử cân nặng
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleCalculateBMI}
          disabled={bmiLoading}
          className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {bmiLoading ? 'Đang tính...' : 'Tính BMI'}
        </button>
        <button
          onClick={handleCalculateCalories}
          disabled={caloriesLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {caloriesLoading ? 'Đang tính...' : 'Tính Calories'}
        </button>
      </div>

      {showLoginWarning && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-300">
          Vui lòng đăng nhập để dùng tính năng này!
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-6">
        {/* BMI Results */}
        {activeResult === 'bmi' && bmiResult && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Kết quả BMI</h3>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-red-500">{bmiResult.bmi_value}</div>
              <div className="text-sm text-red-800 mt-1">{bmiResult.bmi_category_vi}</div>
              {bmiResult.healthy_weight_range_kg && (
                <div className="text-xs text-red-600 mt-2">
                  Cân nặng lý tưởng (chuẩn BMI): {bmiResult.healthy_weight_range_kg}
                </div>
              )}
            </div>
            
            {/* Thông tin về khung xương */}
            {bmiResult.body_frame_size && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">Kích thước khung xương</p>
                <p className="text-2xl font-bold text-blue-900">
                  {bmiResult.body_frame_size === "small" ? "Nhỏ" : 
                   bmiResult.body_frame_size === "medium" ? "Trung bình" : "Lớn"}
                </p>
                {bmiResult.healthy_weight_range_for_frame && (
                  <p className="text-xs text-blue-700 mt-2">
                    Cân nặng lý tưởng (theo khung xương): {bmiResult.healthy_weight_range_for_frame}
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bmiResult.wrist_to_height_ratio && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Tỷ lệ vòng cổ tay/chiều cao</p>
                  <p className="text-lg font-semibold text-gray-800">{bmiResult.wrist_to_height_ratio}</p>
                </div>
              )}
              {bmiResult.ankle_to_height_ratio && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Tỷ lệ vòng cổ chân/chiều cao</p>
                  <p className="text-lg font-semibold text-gray-800">{bmiResult.ankle_to_height_ratio}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calories Results */}
        {activeResult === 'calories' && caloriesResult && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Kết quả Calories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700 mb-1">BMR (Lượng calo cơ bản)</h3>
                <p className="text-2xl font-bold text-blue-900">{caloriesResult.bmr} kcal/ngày</p>
                <p className="text-xs text-blue-600 mt-1">{caloriesResult.bmr_formula}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-700 mb-1">TDEE (Tổng lượng calo cần)</h3>
                <p className="text-2xl font-bold text-green-900">{caloriesResult.tdee} kcal/ngày</p>
                <p className="text-xs text-green-600 mt-1">{caloriesResult.tdee_explanation}</p>
              </div>
            </div>
            
            <button
              onClick={handleOpenTipsModal}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Nhận gợi ý sức khỏe cá nhân hóa
            </button>
          </div>
        )}
      </div>

      <HealthTipsModal
        isOpen={showTipsModal}
        onClose={() => setShowTipsModal(false)}
        tdee={caloriesResult?.tdee}
        currentWeight={parseFloat(weight)}
      />
    </div>
  );
};

export default HealthCalculator;
