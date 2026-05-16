import { useState } from 'react';
import api from '../../services/api';

const BMICalculator = ({ onSave }) => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [saveHistory, setSaveHistory] = useState(false);
  const [bmi, setBmi] = useState(null);
  const [status, setStatus] = useState('');
  const [statusVi, setStatusVi] = useState('');
  const [healthyRange, setHealthyRange] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateBMI = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w) {
      setError('Vui lòng nhập đầy đủ chiều cao và cân nặng');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      
      if (saveHistory) {
        response = await api.post('/health/bmi/save', {
          weight_kg: w,
          height_cm: h,
        });
      } else {
        response = await api.post('/health/bmi', {
          weight_kg: w,
          height_cm: h,
        });
      }

      const data = response.data;
      setBmi(data.bmi_value);
      setStatus(data.bmi_category);
      setStatusVi(data.bmi_category_vi);
      setHealthyRange(data.healthy_weight_range_kg);
      
      if (onSave && saveHistory) {
        onSave();
      }
    } catch (err) {
      console.error('Error calculating BMI:', err);
      setError('Có lỗi xảy ra khi tính BMI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
        BMI Calculator
      </h2>
      <p className="text-xs text-gray-400 italic mb-4">
        "On a scale of 1 to 10, how would you rate your health?"
      </p>

      <div className="mb-3">
        <label className="text-xs text-gray-500 mb-1 block">Chiều cao (cm)</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="VD: 170"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500 mb-1 block">Cân nặng (kg)</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="VD: 68"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="saveHistory"
          checked={saveHistory}
          onChange={(e) => setSaveHistory(e.target.checked)}
          className="w-4 h-4 text-red-500 rounded focus:ring-red-400"
        />
        <label htmlFor="saveHistory" className="text-xs text-gray-600">
          Lưu lịch sử cân nặng
        </label>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      <button
        onClick={calculateBMI}
        disabled={loading}
        className="w-full bg-red-500 text-white rounded-full py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Đang tính...' : 'Tính BMI'}
      </button>

      {bmi && (
        <div className="mt-4 bg-red-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-red-500">{bmi}</div>
          <div className="text-sm text-red-800 mt-1">{statusVi}</div>
          {healthyRange && (
            <div className="text-xs text-red-600 mt-2">
              Cân nặng lý tưởng: {healthyRange}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BMICalculator;
