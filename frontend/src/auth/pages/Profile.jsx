import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { 
  User, Mail, Shield, LogOut, HeartPulse, 
  Settings, Phone, MapPin, Calendar, CreditCard, Key, Activity
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
        <div className="bg-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden border border-white/20">
          
          {/* Header */}
          <div className="bg-white/5 border-b border-white/10 px-6 py-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-5 text-white">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 p-1">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <HeartPulse size={36} className="text-cyan-400" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 p-1.5 rounded-lg">
                  <Shield size={14} className="text-cyan-400" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">{user?.full_name || 'Healthcare User'}</h1>
                <p className="text-blue-200 text-sm mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">@{user?.username || 'user'}</span>
                  <span>•</span>
                  <span className="text-cyan-400">{user?.role || 'Patient'}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="secondary" className="flex-1 sm:flex-none">
                <Settings size={18} className="mr-2" />
                Edit Profile
              </Button>
              <Button 
                variant="secondary" 
                onClick={logout}
                className="flex-1 sm:flex-none bg-red-500/10 hover:bg-red-500/20 text-red-100 border-red-500/20 focus:ring-red-500/30"
              >
                <LogOut size={18} className="mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-8 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Personal Info */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors duration-300">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <User size={20} className="text-cyan-400" />
                    Identity & Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-1">Email Address</p>
                      <p className="text-base font-medium text-white flex items-center gap-2">
                        <Mail size={16} className="text-blue-400" />
                        {user?.email || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-1">Phone Number</p>
                      <p className="text-base font-medium text-white flex items-center gap-2">
                        <Phone size={16} className="text-blue-400" />
                        {user?.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-1">Date of Birth</p>
                      <p className="text-base font-medium text-white flex items-center gap-2">
                        <Calendar size={16} className="text-blue-400" />
                        {user?.dob || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-1">Citizen ID / CCCD</p>
                      <p className="text-base font-medium text-white flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-400" />
                        {user?.citizenId || 'Not provided'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-blue-300 uppercase tracking-wider mb-1">Residential Address</p>
                      <p className="text-base font-medium text-white flex items-center gap-2">
                        <MapPin size={16} className="text-blue-400" />
                        {user?.address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Security & Status */}
              <div className="space-y-8">
                {/* Security Card */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors duration-300">
                   <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Key size={20} className="text-cyan-400" />
                    Security Settings
                  </h3>
                  <div className="space-y-4">
                    <Button variant="secondary" className="w-full justify-start text-sm border-blue-500/30 text-blue-100 hover:bg-blue-500/10">
                      Change Password
                    </Button>
                    <Button variant="secondary" className="w-full justify-start text-sm border-blue-500/30 text-blue-100 hover:bg-blue-500/10">
                      Enable Two-Factor Auth
                    </Button>
                  </div>
                </div>

                {/* Status Card */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors duration-300">
                   <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-cyan-400" />
                    Account Status
                  </h3>
                  <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <h4 className="text-sm font-medium text-cyan-300">Profile Complete</h4>
                    <p className="text-xs text-blue-200 mt-1">Your enterprise healthcare profile is fully verified.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
