import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { healthTipService } from '../../services/healthTipService';
import { RefreshCw, Lightbulb, ArrowRight } from 'lucide-react';

const HealthTipWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTip = async () => {
    try {
      setLoading(true);
      const data = await healthTipService.getTodayTip();
      setTip(data);
    } catch (err) {
      console.error('Error fetching health tip:', err);
      setError('Could not load health tip.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await healthTipService.refreshTip();
      setTip(data.tip);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setError('You have reached the daily refresh limit (2 tips/day).');
      } else {
        setError('Failed to refresh health tip. Please try again later.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-6 my-5 border border-white/20 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-white/20 rounded-full"></div>
          <div className="w-24 h-4 bg-white/20 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="w-full h-4 bg-white/20 rounded"></div>
          <div className="w-3/4 h-4 bg-white/20 rounded"></div>
          <div className="flex gap-2 mt-4">
            <div className="w-12 h-5 bg-white/20 rounded-full"></div>
            <div className="w-12 h-5 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has not entered necessary health metrics
  const isProfileIncomplete = !user?.weight || !user?.height;

  if (isProfileIncomplete) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-[24px] p-6 my-5 border border-white/20 text-white shadow-xl transition-transform hover:-translate-y-1">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mb-2">
            <Lightbulb size={24} className="text-yellow-400" />
          </div>
          <h3 className="font-semibold text-lg">Nhận lời khuyên cá nhân hóa!</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Hãy cập nhật chiều cao và cân nặng của bạn để Baymax có thể đưa ra những lời khuyên sức khỏe chính xác nhất cho riêng bạn.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-2 bg-white text-red-500 rounded-full text-sm font-bold hover:bg-red-50 transition-all shadow-lg hover:scale-105"
          >
            Cập nhật ngay <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-[24px] p-6 my-5 border border-white/20 text-white shadow-xl transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Lightbulb size={20} className="text-yellow-400" />
          <span>Mẹo sức khỏe mỗi ngày</span>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing} 
          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh Tip"
        >
          <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {error ? (
          <div className="text-red-200 text-sm bg-red-500/10 p-3 rounded-lg border-l-4 border-red-500">
            {error}
          </div>
        ) : (
          <>
            <p className="text-base leading-relaxed opacity-90">
              {tip?.tip_content}
            </p>
            <div className="flex flex-wrap gap-2">
              {tip?.hashtags?.map((tag, index) => (
                <span key={index} className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10 text-white/80">
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HealthTipWidget;