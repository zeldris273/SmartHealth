import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { 
  User, Mail, Shield, LogOut, HeartPulse, 
  Settings, Phone, MapPin, Calendar, CreditCard, Key, Activity, Check, X, Camera
} from 'lucide-react';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    national_id: '',
    address: '',
    avatar: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      date_of_birth: user?.date_of_birth || '',
      national_id: user?.national_id || '',
      address: user?.address || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      full_name: formData.full_name,
      phone_number: formData.phone_number || null,
      date_of_birth: formData.date_of_birth || null,
      national_id: formData.national_id || null,
      address: formData.address || null,
    };
    const result = await updateProfile(payload);
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-red-400/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-rose-400/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
        <div className="bg-white shadow-sm rounded-3xl overflow-hidden border border-slate-200">
          
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-1 shadow-md">
                  <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <HeartPulse size={36} className="text-red-500" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white shadow-sm border border-slate-200 p-1.5 rounded-lg">
                  <Shield size={14} className="text-red-600" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{user?.full_name || 'Healthcare User'}</h1>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">@{user?.email ? user.email.split('@')[0] : 'user'}</span>
                  <span>•</span>
                  <span className="text-red-600 font-medium">{user?.role || 'Patient'}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {!isEditing && (
                <Button className="flex-1 sm:flex-none" onClick={startEditing}>
                  <Settings size={18} className="mr-2" />
                  Edit Profile
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={logout}
                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
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
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-red-200 transition-colors duration-300 relative overflow-hidden">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={20} className="text-red-500" />
                      Identity & Contact Information
                    </div>
                  </h3>
                  
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
                      
                      {/* Avatar Upload */}
                      <div className="sm:col-span-2 flex flex-col items-center justify-center mb-2">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload').click()}>
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 p-1 shadow-md transition-transform duration-300 group-hover:scale-105">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                              {formData.avatar ? (
                                <img src={formData.avatar} alt="Profile Preview" className="w-full h-full object-cover" />
                              ) : (
                                <HeartPulse size={36} className="text-red-500" />
                              )}
                              <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                                <Camera className="text-white mb-1" size={20} />
                                <span className="text-white text-[10px] font-medium tracking-wide uppercase">Update</span>
                              </div>
                            </div>
                          </div>
                          <input 
                            id="avatar-upload"
                            type="file" 
                            accept="image/*"
                            className="hidden" 
                            onChange={handleAvatarChange}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-3 font-medium">Click to upload new photo</p>
                      </div>

                      <Input
                        label="Full Name"
                        name="full_name"
                        icon={User}
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                      />
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        icon={Mail}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                      />
                      <Input
                        label="Phone Number"
                        name="phone_number"
                        icon={Phone}
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                      />
                      <Input
                        label="Date of Birth"
                        name="date_of_birth"
                        type="date"
                        icon={Calendar}
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        placeholder="YYYY-MM-DD"
                      />
                      <Input
                        label="Citizen ID / CCCD"
                        name="national_id"
                        icon={CreditCard}
                        value={formData.national_id}
                        onChange={handleChange}
                        placeholder="Enter ID number"
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Residential Address"
                          name="address"
                          icon={MapPin}
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter your full address"
                        />
                      </div>
                      
                      <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsEditing(false)}
                          disabled={isSaving}
                        >
                          <X size={16} className="mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSave} isLoading={isSaving}>
                          <Check size={16} className="mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-300">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email Address</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.email ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <Mail size={16} className={user?.email ? 'text-red-400' : 'text-slate-300'} />
                          {user?.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Phone Number</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.phone_number ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <Phone size={16} className={user?.phone_number ? 'text-red-400' : 'text-slate-300'} />
                          {user?.phone_number || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Date of Birth</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.date_of_birth ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <Calendar size={16} className={user?.date_of_birth ? 'text-red-400' : 'text-slate-300'} />
                          {user?.date_of_birth || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Citizen ID / CCCD</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.national_id ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <CreditCard size={16} className={user?.national_id ? 'text-red-400' : 'text-slate-300'} />
                          {user?.national_id || 'Not provided'}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Residential Address</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.address ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <MapPin size={16} className={user?.address ? 'text-red-400' : 'text-slate-300'} />
                          {user?.address || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Security & Status */}
              <div className="space-y-8">
                {/* Security Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-red-200 transition-colors duration-300">
                   <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <Key size={20} className="text-red-500" />
                    Security Settings
                  </h3>
                  <div className="space-y-4">
                    <Button variant="secondary" className="w-full justify-start text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                      Change Password
                    </Button>
                    <Button variant="secondary" className="w-full justify-start text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                      Enable Two-Factor Auth
                    </Button>
                  </div>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-red-200 transition-colors duration-300">
                   <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-red-500" />
                    Account Status
                  </h3>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <h4 className="text-sm font-medium text-emerald-800">Profile Complete</h4>
                    <p className="text-xs text-emerald-600 mt-1">Your enterprise healthcare profile is fully verified.</p>
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
