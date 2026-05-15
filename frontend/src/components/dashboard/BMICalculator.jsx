import { useState } from 'react';

const BMICalculator = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [status, setStatus] = useState('');

  const calculateBMI = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return;
    const result = (w / (h * h)).toFixed(1);
    setBmi(result);

    if (result < 18.5) setStatus('Thiếu cân');
    else if (result < 24.9) setStatus('Bình thường');
    else if (result < 29.9) setStatus('Thừa cân');
    else setStatus('Béo phì');
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

      <button
        onClick={calculateBMI}
        className="w-full bg-red-500 text-white rounded-full py-2 text-sm font-medium hover:bg-red-600 transition"
      >
        Tính BMI
      </button>

      {bmi && (
        <div className="mt-4 bg-red-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-semibold text-red-500">{bmi}</div>
          <div className="text-sm text-red-800 mt-1">{status}</div>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;