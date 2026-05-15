import BMICalculator from '../../components/dashboard/BMICalculator';
import HealthChart from '../../components/dashboard/HealthChart';
import WeightHistory from '../../components/dashboard/WeightHistory';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <h1 className="text-2xl font-semibold text-[#1e293b] mb-2">
        Dashboard
      </h1>
      <p className="text-sm text-gray-400 italic mb-6">
        "I am Baymax, your personal healthcare companion."
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BMICalculator />
        <HealthChart />
        <WeightHistory />
      </div>
    </div>
  );
};

export default Dashboard;