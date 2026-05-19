import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../services/api';

const HealthChart = ({ refreshKey }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isLoggedIn = () => {
    return !!localStorage.getItem('access_token');
  };

  const fetchHistory = async () => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/health/bmi/history');
      console.log('BMI History response:', response.data); // Debug log
      
      if (response.data && Array.isArray(response.data)) {
        const history = response.data.reverse(); // đảo lại để cũ nhất trước, mới nhất sau
        const data = history.map(record => {
          const date = new Date(record.created_at);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return {
            date: `${day}/${month}`,
            weight: record.weight_kg
          };
        });
        setChartData(data);
      }
    } catch (err) {
      console.error('Error fetching BMI history:', err);
      setError(err.response?.data?.detail || 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  if (!isLoggedIn()) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Biểu đồ cân nặng
        </h2>
        <p className="text-xs text-gray-400 italic mb-4">
          "Your health is my top concern."
        </p>
        <div className="text-center py-8">
          <p className="text-yellow-600">⚠️ Vui lòng đăng nhập để xem biểu đồ</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Biểu đồ cân nặng
        </h2>
        <p className="text-xs text-gray-400 italic mb-4">
          "Your health is my top concern."
        </p>
        <div className="text-center py-8">
          <p className="text-gray-500">Đang tải biểu đồ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Biểu đồ cân nặng
        </h2>
        <p className="text-xs text-gray-400 italic mb-4">
          "Your health is my top concern."
        </p>
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
        Biểu đồ cân nặng
      </h2>
      <p className="text-xs text-gray-400 italic mb-4">
        "Your health is my top concern."
      </p>

      {chartData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Chưa có dữ liệu lịch sử cân nặng</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default HealthChart;