const mockHistory = [
  { date: '30/5', weight: 67.5, change: -0.5 },
  { date: '25/5', weight: 68.0, change: +0.1 },
  { date: '20/5', weight: 67.9, change: -0.3 },
  { date: '15/5', weight: 68.2, change: -0.6 },
  { date: '10/5', weight: 68.8, change: -0.7 },
  { date: '5/5',  weight: 69.5, change: -0.5 },
  { date: '1/5',  weight: 70.0, change: 0 },
];

const WeightHistory = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
        Lịch sử cân nặng
      </h2>
      <p className="text-xs text-gray-400 italic mb-4">
        "I cannot deactivate until you are satisfied with your care."
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-2">Ngày</th>
              <th className="pb-2">Cân nặng (kg)</th>
              <th className="pb-2">Thay đổi</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map((item, index) => (
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
    </div>
  );
};

export default WeightHistory;