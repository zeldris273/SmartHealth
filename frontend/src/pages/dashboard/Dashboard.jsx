import { useState } from 'react';
import HealthCalculator from '../../components/dashboard/HealthCalculator';
import HealthChart from '../../components/dashboard/HealthChart';
import WeightHistory from '../../components/dashboard/WeightHistory';
import { useAuth } from '../../auth/context/AuthContext';

const Dashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { refreshProfile } = useAuth();

  const refreshHistory = async () => {
    setRefreshKey(prev => prev + 1);
    // Refresh the user profile to update weight and height
    await refreshProfile();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <h1 className="text-2xl font-semibold text-[#1e293b] mb-2">
        Dashboard
      </h1>
      <p className="text-sm text-gray-400 italic mb-6">
        "I am Baymax, your personal healthcare companion."
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HealthCalculator onSave={refreshHistory} />
        <HealthChart refreshKey={refreshKey} />
        <WeightHistory refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default Dashboard;
