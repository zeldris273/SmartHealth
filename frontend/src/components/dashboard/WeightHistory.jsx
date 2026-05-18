import { useState, useEffect } from 'react';
import api from '../../services/api';

const WeightHistory = ({ refreshKey }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWeightHistory();
  }, [refreshKey]);

  const fetchWeightHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/health/weight/history');
      setHistory(response.data.history);
    } catch (err) {
      console.error('Error fetching weight history:', err);
      setError('Không thể tải lịch sử cân nặng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
        Lịch sử cân nặng
      </h2>
      <p className="text-xs text-gray-400 italic mb-4">
        "I cannot deactivate until you are satisfied with your care."
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-8">
          Đang tải...
        </div>
      ) : history.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Chưa có lịch sử cân nặng
        </div>
      ) : (
        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2">Ngày</th>
                <th className="pb-2">Cân nặng (kg)</th>
                <th className="pb-2">Thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index} className="border-b border-gray-50 hover:bg-red-50 transition">
                  <td className="py-2 text-gray-600">{item.date}</td>
                  <td className="py-2 font-medium text-gray-800">{item.weight} kg</td>
                  <td className={`py-2 font-medium ${item.change < 0 ? 'text-green-500' : item.change > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {item.change > 0 ? `+${item.change}` : item.change} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WeightHistory;
