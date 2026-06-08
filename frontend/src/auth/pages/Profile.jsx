import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { 
  User, Mail, Shield, LogOut, HeartPulse, 
  Settings, Phone, MapPin, Calendar, CreditCard, Key, Activity, Check, X, Camera
} from 'lucide-react';
import api from '../../services/api';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [latestBMI, setLatestBMI] = useState(null);
  const [bmiLoading, setBmiLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    gender: '',
    date_of_birth: '',
    national_id: '',
    address: '',
    weight: '',
    height: '',
    fitness_goal: '',
    avatar: ''
  });

  // Fetch latest BMI record
  useEffect(() => {
    const fetchLatestBMI = async () => {
      try {
        const response = await api.get('/health/bmi/latest');
        setLatestBMI(response.data);
      } catch (error) {
        // Nếu không có BMI record, để null
        setLatestBMI(null);
      } finally {
        setBmiLoading(false);
      }
    };

    if (user) {
      fetchLatestBMI();
    }
  }, [user]);

  const startEditing = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      gender: user?.gender || '',
      date_of_birth: user?.date_of_birth || '',
      national_id: user?.national_id || '',
      address: user?.address || '',
      weight: user?.weight || '',
      height: user?.height || '',
      fitness_goal: user?.fitness_goal || '',
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
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      national_id: formData.national_id || null,
      address: formData.address || null,
      weight: formData.weight ? parseInt(formData.weight) : null,
      height: formData.height ? parseInt(formData.height) : null,
      fitness_goal: formData.fitness_goal || null,
    };
    const result = await updateProfile(payload);
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  // Tính BMI từ lần tính gần đây nhất từ dashboard, không phải tính lại
  const bmi = latestBMI?.bmi_value || null;
  const bmiCategory = latestBMI?.bmi_category_vi || null;

  const getBmiLabel = (category) => {
    if (!category) return null;
    const categoryMap = {
      'Thiếu cân': { label: 'Thiếu cân', color: 'text-blue-600 bg-blue-50 border-blue-200' },
      'Bình thường': { label: 'Bình thường', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      'Thừa cân': { label: 'Thừa cân', color: 'text-amber-700 bg-amber-50 border-amber-200' },
      'Béo phì': { label: 'Béo phì', color: 'text-red-700 bg-red-50 border-red-200' }
    };
    return categoryMap[category] || null;
  };

  const bmiInfo = getBmiLabel(bmiCategory);

  // Kiểm tra hồ sơ hoàn chỉnh
  const isProfileComplete = () => {
    if (!user) return false;
    // Các trường bắt buộc để hồ sơ được coi là hoàn chỉnh
    const requiredFields = [
      'full_name',
      'email',
      'phone_number',
      'date_of_birth',
      'national_id',
      'address',
      'weight',
      'height'
    ];
    return requiredFields.every(field => user[field] && user[field] !== '');
  };

  const profileComplete = isProfileComplete();

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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{user?.full_name || 'Người dùng'}</h1>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">@{user?.email ? user.email.split('@')[0] : 'user'}</span>
                  <span>•</span>
                  <span className="text-red-600 font-medium">{user?.role === 'admin' ? 'Quản trị viên' : 'Bệnh nhân'}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              {!isEditing && (
                <Button className="flex-1 sm:flex-none" onClick={startEditing}>
                  <Settings size={18} className="mr-2" />
                  Chỉnh sửa Hồ sơ
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={logout}
                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
              >
                <LogOut size={18} className="mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-8 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Personal Info */}
              <div className="lg:col-span-2 space-y-8">

                {/* Card: Thông tin Cá nhân & Liên hệ */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-red-200 transition-colors duration-300">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <User size={20} className="text-red-500" />
                    Thông tin Cá nhân & Liên hệ
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
                                <span className="text-white text-[10px] font-medium tracking-wide uppercase">Cập nhật</span>
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
                        <p className="text-xs text-slate-500 mt-3 font-medium">Nhấp để tải ảnh mới</p>
                      </div>

                      <Input
                        label="Họ và Tên"
                        name="full_name"
                        icon={User}
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Nhập họ và tên"
                      />
                      <Input
                        label="Địa chỉ Email"
                        name="email"
                        type="email"
                        icon={Mail}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ email"
                      />
                      <Input
                        label="Số Điện thoại"
                        name="phone_number"
                        icon={Phone}
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Nhập số điện thoại"
                      />
                      <Input
                        label="Ngày sinh"
                        name="date_of_birth"
                        type="date"
                        icon={Calendar}
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        placeholder="YYYY-MM-DD"
                      />
                      <Input
                        label="Số CCCD"
                        name="national_id"
                        icon={CreditCard}
                        value={formData.national_id}
                        onChange={handleChange}
                        placeholder="Nhập số CCCD"
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Địa chỉ Thường trú"
                          name="address"
                          icon={MapPin}
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Nhập địa chỉ đầy đủ"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-300">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Địa chỉ Email</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.email ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <Mail size={16} className={user?.email ? 'text-red-400' : 'text-slate-300'} />
                          {user?.email || 'Chưa cung cấp'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Số Điện thoại</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.phone_number ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <Phone size={16} className={user?.phone_number ? 'text-red-400' : 'text-slate-300'} />
                          {user?.phone_number || 'Chưa cung cấp'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Ngày sinh</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.date_of_birth ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <Calendar size={16} className={user?.date_of_birth ? 'text-red-400' : 'text-slate-300'} />
                          {user?.date_of_birth || 'Chưa cung cấp'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Số CCCD</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.national_id ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <CreditCard size={16} className={user?.national_id ? 'text-red-400' : 'text-slate-300'} />
                          {user?.national_id || 'Chưa cung cấp'}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Địa chỉ Thường trú</p>
                        <p className={`text-base font-medium flex items-center gap-2 ${user?.address ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          <MapPin size={16} className={user?.address ? 'text-red-400' : 'text-slate-300'} />
                          {user?.address || 'Chưa cung cấp'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card: Thông tin Sức khỏe (tách riêng) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-red-200 transition-colors duration-300">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <HeartPulse size={20} className="text-red-500" />
                    Thông tin Sức khỏe
                  </h3>

                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in slide-in-from-left-4 duration-300">
                      <Input
                        label="Cân nặng (kg)"
                        name="weight"
                        type="number"
                        icon={Activity}
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="Nhập cân nặng"
                      />
                      <Input
                        label="Chiều cao (cm)"
                        name="height"
                        type="number"
                        icon={Activity}
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="Nhập chiều cao"
                      />

                      {/* Giới tính */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Giới tính</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        >
                          <option value="">-- Chọn giới tính --</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>

                      {/* Mục tiêu */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Mục tiêu</label>
                        <select
                          name="fitness_goal"
                          value={formData.fitness_goal}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        >
                          <option value="">-- Chọn mục tiêu --</option>
                          <option value="lose_weight">Giảm cân nặng</option>
                          <option value="gain_weight">Tăng cân nặng</option>
                          <option value="maintain_weight">Duy trì cân nặng</option>
                          <option value="gain_muscle">Tăng cơ bắp</option>
                        </select>
                      </div>

                      {/* Save / Cancel buttons — chỉ hiển thị ở đây vì đây là card cuối cùng trong edit mode */}
                      <div className="sm:col-span-2 flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsEditing(false)}
                          disabled={isSaving}
                        >
                          <X size={16} className="mr-2" />
                          Hủy
                        </Button>
                        <Button onClick={handleSave} isLoading={isSaving}>
                          <Check size={16} className="mr-2" />
                          Lưu Thay đổi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in duration-300">
                      {/* Cân nặng */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Cân nặng</p>
                        <p className={`text-2xl font-bold ${user?.weight ? 'text-slate-800' : 'text-slate-300'}`}>
                          {user?.weight ? user.weight : '—'}
                        </p>
                        {user?.weight && <p className="text-xs text-slate-500 mt-1">kg</p>}
                      </div>

                      {/* Chiều cao */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Chiều cao</p>
                        <p className={`text-2xl font-bold ${user?.height ? 'text-slate-800' : 'text-slate-300'}`}>
                          {user?.height ? user.height : '—'}
                        </p>
                        {user?.height && <p className="text-xs text-slate-500 mt-1">cm</p>}
                      </div>

                      {/* BMI */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Chỉ số BMI</p>
                        {bmiLoading ? (
                          <div className="animate-pulse">
                            <p className="text-2xl font-bold text-slate-300">—</p>
                          </div>
                        ) : (
                          <>
                            <p className={`text-2xl font-bold ${bmi ? 'text-slate-800' : 'text-slate-300'}`}>
                              {bmi ? bmi.toFixed(1) : '—'}
                            </p>
                            {bmiInfo && (
                              <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${bmiInfo.color}`}>
                                {bmiInfo.label}
                              </span>
                            )}
                            {!bmi && <p className="text-xs text-slate-400 mt-1 italic">Chưa có dữ liệu BMI</p>}
                          </>
                        )}
                      </div>

                      {/* Giới tính */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Giới tính</p>
                        <p className={`text-base font-medium ${user?.gender ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {user?.gender === 'male' ? 'Nam' : user?.gender === 'female' ? 'Nữ' : user?.gender === 'other' ? 'Khác' : 'Chưa cung cấp'}
                        </p>
                      </div>

                      {/* Mục tiêu */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Mục tiêu sức khỏe</p>
                        <p className={`text-base font-medium ${user?.fitness_goal ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {user?.fitness_goal === 'lose_weight' ? '📉 Giảm cân nặng' 
                            : user?.fitness_goal === 'gain_weight' ? '📈 Tăng cân nặng'
                            : user?.fitness_goal === 'maintain_weight' ? '⚖️ Duy trì cân nặng'
                            : user?.fitness_goal === 'gain_muscle' ? '💪 Tăng cơ bắp'
                            : 'Chưa cung cấp'}
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
                    Thiết lập Bảo mật
                  </h3>
                  <div className="space-y-4">
                    <Button variant="secondary" className="w-full justify-start text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                      Đổi mật khẩu
                    </Button>
                    <Button variant="secondary" className="w-full justify-start text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                      Bật xác thực 2 lớp
                    </Button>
                  </div>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-red-200 transition-colors duration-300">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-red-500" />
                    Trạng thái Tài khoản
                  </h3>
                  {profileComplete ? (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <h4 className="text-sm font-medium text-emerald-800">Hồ sơ Hoàn tất</h4>
                      <p className="text-xs text-emerald-600 mt-1">Hồ sơ sức khỏe của bạn đã được xác minh đầy đủ.</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-800">Tài khoản chưa xác thực</h4>
                      <p className="text-xs text-yellow-600 mt-1">Vui lòng cập nhật đầy đủ thông tin.</p>
                    </div>
                  )}
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