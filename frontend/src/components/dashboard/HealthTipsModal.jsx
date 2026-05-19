import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../common/Modal';

const HealthTipsModal = ({ isOpen, onClose, tdee, currentWeight }) => {
  const [goal, setGoal] = useState('maintain');
  const [tips, setTips] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTips = async () => {
    if (!tdee) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/health/tips', {
        params: {
          tdee: tdee,
          goal: goal,
          current_weight: currentWeight
        }
      });
      setTips(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tdee) {
      fetchTips();
    }
  }, [isOpen, goal, tdee]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gợi ý sức khỏe cá nhân hóa"
    >
      {/* Thông tin TDEE */}
      <div className="bg-yellow-50 p-4 rounded-xl mb-6">
        <h3 className="font-bold text-yellow-900 mb-2"> Dựa trên TDEE của bạn</h3>
        <p className="text-yellow-800">
          TDEE (Tổng lượng calo tiêu thụ mỗi ngày): <strong className="text-xl">{tdee} kcal/ngày</strong>
        </p>
      </div>

      {/* Goal Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mục tiêu của bạn
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'maintain', label: 'Duy trì cân nặng', activeClass: 'bg-blue-600 text-white' },
            { value: 'lose', label: 'Giảm cân', activeClass: 'bg-green-600 text-white' },
            { value: 'gain', label: 'Tăng cân', activeClass: 'bg-orange-600 text-white' }
          ].map((g) => (
            <button
              key={g.value}
              onClick={() => setGoal(g.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                goal === g.value
                  ? g.activeClass
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Đang tạo gợi ý...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {tips && !loading && (
        <div className="space-y-6">
{/* Mục tiêu calo & macros */}
          <div className="bg-green-50 p-4 rounded-xl">
            <h3 className="font-bold text-green-900 mb-3"> Mục tiêu dinh dưỡng (dựa trên TDEE)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-500">Lượng calo đề xuất</p>
                <p className="text-xl font-bold text-green-700">{tips.goal_tips.calorie_target}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Dựa trên TDEE {tdee} kcal
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-500">Phân bổ dinh dưỡng</p>
                <div className="text-sm text-gray-700">
                  <p>🥩 Protein: {tips.goal_tips.macronutrient_breakdown.protein}</p>
                  <p>🍞 Carb: {tips.goal_tips.macronutrient_breakdown.carbs}</p>
                  <p>🥑 Fat: {tips.goal_tips.macronutrient_breakdown.fat}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thực phẩm nên ăn & hạn chế */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl">
              <h3 className="font-bold text-green-900 mb-2"> Nên ăn</h3>
              <ul className="space-y-1 text-sm text-green-800">
                {tips.goal_tips.food_recommendations.should_eat.map((food, i) => (
                  <li key={i}> {food}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded-xl">
              <h3 className="font-bold text-red-900 mb-2"> Nên hạn chế</h3>
              <ul className="space-y-1 text-sm text-red-800">
                {tips.goal_tips.food_recommendations.should_limit.map((food, i) => (
                  <li key={i}> {food}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ví dụ khẩu phần ăn */}
          <div className="bg-purple-50 p-4 rounded-xl">
            <h3 className="font-bold text-purple-900 mb-2"> Ví dụ khẩu phần ăn trong ngày</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              {tips.goal_tips.example_meal.map((meal, i) => (
                <li key={i} className="bg-white p-2 rounded-lg">
                  {meal}
                </li>
              ))}
            </ul>
          </div>

          {/* Kế hoạch bài tập */}
          <div className="bg-orange-50 p-4 rounded-xl">
            <h3 className="font-bold text-orange-900 mb-2"> Kế hoạch bài tập</h3>
            <p className="text-sm text-orange-800 mb-2">
              <strong>Tần suất:</strong> {tips.goal_tips.exercise_plan.frequency}
            </p>
            <ul className="space-y-1 text-sm text-orange-800">
              {tips.goal_tips.exercise_plan.schedule.map((plan, i) => (
                <li key={i}>• {plan}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default HealthTipsModal;
