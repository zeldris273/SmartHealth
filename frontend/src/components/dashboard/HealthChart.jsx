import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const mockData = [
  { date: '1/5', weight: 70 },
  { date: '5/5', weight: 69.5 },
  { date: '10/5', weight: 68.8 },
  { date: '15/5', weight: 68.2 },
  { date: '20/5', weight: 67.9 },
  { date: '25/5', weight: 68 },
  { date: '30/5', weight: 67.5 },
];

const HealthChart = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
        Biểu đồ cân nặng
      </h2>
      <p className="text-xs text-gray-400 italic mb-4">
        "Your health is my top concern."
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HealthChart;