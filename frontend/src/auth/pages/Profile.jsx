import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../../components/common/Modal';
import PasswordStrength from '../components/PasswordStrength';
import { 
  User, Mail, Shield, LogOut, HeartPulse, 
  Settings, Phone, MapPin, Calendar, CreditCard, Key, Activity, Check, X, Camera, Lock
} from 'lucide-react';
import api from '../../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, changePassword, downloadHealthReport } = useAuth();
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
    age: '',
    national_id: '',
    address: '',
    fitness_goal: '',
    avatar: '',
    bmi_reminder_enabled: false,
    bmi_reminder_frequency: 'weekly',
    underlying_diseases: [],
    food_allergies: [],
    activity_level: '',
    other_diseases: '',
    other_allergies: '',
    wrist_circumference: '',
    ankle_circumference: ''
    other_allergies: ''
  });
  
  // Change Password Modal State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  // Debug: Log formData changes
  useEffect(() => {
    console.log('FormData updated:', formData);
  }, [formData]);

  const startEditing = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      gender: user?.gender || '',
      date_of_birth: user?.date_of_birth || '',
      age: user?.age || '',
      national_id: user?.national_id || '',
      address: user?.address || '',
      fitness_goal: user?.fitness_goal || '',
      avatar: user?.avatar_url || null,
      bmi_reminder_enabled: user?.bmi_reminder_enabled ?? false,
      bmi_reminder_frequency: user?.bmi_reminder_frequency || 'weekly',
      underlying_diseases: user?.underlying_diseases || [],
      food_allergies: user?.food_allergies || [],
      activity_level: user?.activity_level || '',
      other_diseases: user?.other_diseases || '',
      other_allergies: user?.other_allergies || '',
      wrist_circumference: user?.wrist_circumference || '',
      ankle_circumference: user?.ankle_circumference || ''
      other_allergies: user?.other_allergies || ''
    });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    console.log('handleAvatarChange triggered');
    const file = e.target.files[0];
    console.log('Selected file:', file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (event) => {
        console.log('File loaded, result length:', event.target.result.length);
        const newAvatar = event.target.result;
        setFormData(prev => {
          const updated = { ...prev, avatar: newAvatar };
          console.log('Updated formData with new avatar:', updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    console.log('Saving formData:', formData);
    console.log('formData.avatar:', formData.avatar);
    console.log('formData.avatar type:', typeof formData.avatar);
    console.log('formData.avatar length:', formData.avatar ? formData.avatar.length : 0);
    
    // Build payload with all fields
    const payload = {
      full_name: formData.full_name,
      phone_number: formData.phone_number || null,
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      age: formData.age ? parseInt(formData.age) : null,
      national_id: formData.national_id || null,
      address: formData.address || null,
      fitness_goal: formData.fitness_goal || null,
      bmi_reminder_enabled: formData.bmi_reminder_enabled,
      bmi_reminder_frequency: formData.bmi_reminder_frequency,
      underlying_diseases: formData.underlying_diseases,
      food_allergies: formData.food_allergies,
      activity_level: formData.activity_level,
      other_diseases: formData.other_diseases,
      other_allergies: formData.other_allergies,
      wrist_circumference: formData.wrist_circumference ? parseFloat(formData.wrist_circumference) : null,
      ankle_circumference: formData.ankle_circumference ? parseFloat(formData.ankle_circumference) : null,
      // Always add avatar_url, even if null
      avatar_url: formData.avatar,
    };
    
    console.log('Final payload to send:', payload);
    console.log('Payload has avatar_url:', 'avatar_url' in payload);
    console.log('Payload avatar_url value:', payload.avatar_url);
    
    const result = await updateProfile(payload);
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  // Change Password Handlers
  const openChangePasswordModal = () => {
    setChangePasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setChangePasswordError('');
    setIsChangePasswordModalOpen(true);
  };

  const closeChangePasswordModal = () => {
    setIsChangePasswordModalOpen(false);
  };

  const handleChangePasswordInput = (e) => {
    setChangePasswordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setChangePasswordError('');
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    
    // Validation
    if (!changePasswordForm.current_password) {
      setChangePasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!changePasswordForm.new_password) {
      setChangePasswordError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (changePasswordForm.new_password !== changePasswordForm.confirm_password) {
      setChangePasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (changePasswordForm.new_password.length < 8) {
      setChangePasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword({
      current_password: changePasswordForm.current_password,
      new_password: changePasswordForm.new_password
    });
    setIsChangingPassword(false);
    
    if (result.success) {
      closeChangePasswordModal();
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
      'address'
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
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
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
                <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center justify-end">
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
                  {!isEditing && (
                    <Button 
                      variant="secondary" 
                      className="flex-1 sm:flex-none justify-start text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                      onClick={downloadHealthReport}
                    >
                      <Activity size={16} className="mr-2" />
                      Xuất báo cáo sức khỏe (PDF)
                    </Button>
                  )}
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
                        label="Tuổi"
                        name="age"
                        type="number"
                        icon={Calendar}
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Nhập tuổi"
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

                       <div className="sm:col-span-2 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-center space-y-3">
                         <p className="text-sm text-blue-700 font-medium">
                           Muốn thay đổi BMI?
                         </p>
                         <div className="flex justify-center">
                          <Button 
                           variant="secondary" 
                           className="w-full sm:w-auto text-xs py-2 h-auto"
                           onClick={() => navigate('/dashboard')}
                         >
                           <Settings size={14} className="mr-1" />
                           Đến Bảng điều khiển
                         </Button>
                         </div>
                         
                       </div>

                      {/* Tình trạng sức khỏe */}
                      <div className="sm:col-span-2 space-y-6 pt-4 border-t border-slate-100">
                        <div className="space-y-3">
                          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">1. Bệnh nền</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { id: 'diabetes', label: 'Tiểu đường' },
                              { id: 'hypertension', label: 'Huyết áp cao' },
                              { id: 'heart_disease', label: 'Tim mạch' },
                              { id: 'hyperlipidemia', label: 'Mỡ máu cao' },
                              { id: 'stomach_issue', label: 'Dạ dày' },
                              { id: 'none_disease', label: 'Không có' },
                            ].map(disease => (
                              <label key={disease.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-red-600 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={formData.underlying_diseases.includes(disease.id)}
                                  onChange={(e) => {
                                    const newValue = e.target.checked 
                                      ? [...formData.underlying_diseases, disease.id]
                                      : formData.underlying_diseases.filter(id => id !== disease.id);
                                    setFormData(prev => ({ ...prev, underlying_diseases: newValue }));
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                {disease.label}
                              </label>
                            ))}
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData.underlying_diseases.includes('other')}
                                onChange={(e) => {
                                  const newValue = e.target.checked 
                                    ? [...formData.underlying_diseases, 'other']
                                    : formData.underlying_diseases.filter(id => id !== 'other');
                                  setFormData(prev => ({ ...prev, underlying_diseases: newValue }));
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                              Khác
                            </label>
                          </div>
                          {formData.underlying_diseases.includes('other') && (
                            <Input 
                              label="Chi tiết bệnh nền khác" 
                              name="other_diseases" 
                              value={formData.other_diseases} 
                              onChange={handleChange} 
                              placeholder="Nhập bệnh nền khác..."
                              className="mt-2"
                            />
                          )}
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">2. Dị ứng thực phẩm</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { id: 'seafood', label: 'Hải sản' },
                              { id: 'peanuts', label: 'Đậu phộng' },
                              { id: 'dairy', label: 'Sữa' },
                              { id: 'gluten', label: 'Gluten' },
                              { id: 'none_allergy', label: 'Không có' },
                            ].map(allergy => (
                              <label key={allergy.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-red-600 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={formData.food_allergies.includes(allergy.id)}
                                  onChange={(e) => {
                                    const newValue = e.target.checked 
                                      ? [...formData.food_allergies, allergy.id]
                                      : formData.food_allergies.filter(id => id !== allergy.id);
                                    setFormData(prev => ({ ...prev, food_allergies: newValue }));
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                {allergy.label}
                              </label>
                            ))}
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData.food_allergies.includes('other')}
                                onChange={(e) => {
                                  const newValue = e.target.checked 
                                    ? [...formData.food_allergies, 'other']
                                    : formData.food_allergies.filter(id => id !== 'other');
                                  setFormData(prev => ({ ...prev, food_allergies: newValue }));
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                              Khác
                            </label>
                          </div>
                          {formData.food_allergies.includes('other') && (
                            <Input 
                              label="Chi tiết dị ứng khác" 
                              name="other_allergies" 
                              value={formData.other_allergies} 
                              onChange={handleChange} 
                              placeholder="Nhập dị ứng khác..."
                              className="mt-2"
                            />
                          )}
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">3. Mức độ vận động hiện tại</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { id: 'sedentary', label: 'Ít vận động (ngồi nhiều)' },
                              { id: 'light', label: 'Vận động nhẹ (1-3 buổi/tuần)' },
                              { id: 'moderate', label: 'Vận động vừa (3-5 buổi/tuần)' },
                              { id: 'active', label: 'Vận động nhiều (6-7 buổi/tuần)' },
                            ].map(level => (
                              <label key={level.id} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-red-600 transition-colors">
                                <input 
                                  type="radio" 
                                  name="activity_level" 
                                  value={level.id}
                                  checked={formData.activity_level === level.id}
                                  onChange={handleChange}
                                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                                />
                                {level.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Save / Cancel buttons — chỉ hiển thị ở đây vì đây là card cuối cùng trong edit mode */}
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
                      {/* Tuổi */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Tuổi</p>
                        <p className={`text-2xl font-bold ${user?.age ? 'text-slate-800' : 'text-slate-300'}`}>
                          {user?.age ? user.age : '—'}
                        </p>
                        {user?.age && <p className="text-xs text-slate-500 mt-1">tuổi</p>}
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
                        {isEditing && (
                          <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                            <p className="text-xs text-red-600 font-medium mb-2">Muốn thay đổi chỉ số BMI?</p>
                            <Button 
                              variant="secondary" 
                              className="w-full text-xs py-1.5 h-auto"
                              onClick={() => navigate('/dashboard')}
                            >
                              <Settings size={14} className="mr-1" />
                              Đến Bảng điều khiển
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Giới tính */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Giới tính</p>
                        <p className={`text-base font-medium ${user?.gender ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {user?.gender === 'male' ? 'Nam' : user?.gender === 'female' ? 'Nữ' : user?.gender === 'other' ? 'Khác' : 'Chưa cung cấp'}
                        </p>
                      </div>

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

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Vòng cổ tay</p>
                        <p className={`text-2xl font-bold ${latestBMI?.wrist_circumference_cm ? 'text-slate-800' : 'text-slate-300'}`}>
                          {latestBMI?.wrist_circumference_cm ? latestBMI.wrist_circumference_cm : '—'}
                        </p>
                        {latestBMI?.wrist_circumference_cm && <p className="text-xs text-slate-500 mt-1">cm</p>}
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Vòng cổ chân</p>
                        <p className={`text-2xl font-bold ${latestBMI?.ankle_circumference_cm ? 'text-slate-800' : 'text-slate-300'}`}>
                          {latestBMI?.ankle_circumference_cm ? latestBMI.ankle_circumference_cm : '—'}
                        </p>
                        {latestBMI?.ankle_circumference_cm && <p className="text-xs text-slate-500 mt-1">cm</p>}
                      </div>

                      {/* Tình trạng sức khỏe */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 sm:col-span-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Tình trạng sức khỏe</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 font-medium">Bệnh nền:</span>
                            <span className="text-slate-800">
                              {user?.underlying_diseases?.length > 0 
                                ? (user.underlying_diseases.map(id => {
                                    if (id === 'none_disease') return 'Không có';
                                    if (id === 'other') return `Khác (${user.other_diseases || 'không rõ'})`;
                                    const map = {
                                      diabetes: 'Tiểu đường',
                                      hypertension: 'Huyết áp cao',
                                      heart_disease: 'Tim mạch',
                                      hyperlipidemia: 'Mỡ máu cao',
                                      stomach_issue: 'Dạ dày'
                                    };
                                    return map[id] || id;
                                  }).join(', '))
                                : 'Chưa cung cấp'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 font-medium">Dị ứng:</span>
                            <span className="text-slate-800">
                              {user?.food_allergies?.length > 0 
                                ? (user.food_allergies.map(id => {
                                    if (id === 'none_allergy') return 'Không có';
                                    if (id === 'other') return `Khác (${user.other_allergies || 'không rõ'})`;
                                    const map = {
                                      seafood: 'Hải sản',
                                      peanuts: 'Đậu phộng',
                                      dairy: 'Sữa',
                                      gluten: 'Gluten'
                                    };
                                    return map[id] || id;
                                  }).join(', '))
                                : 'Chưa cung cấp'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-500 font-medium">Mức độ vận động:</span>
                            <span className="text-slate-800">
                              {user?.activity_level === 'sedentary' ? 'Ít vận động (ngồi nhiều)'
                                : user?.activity_level === 'light' ? 'Vận động nhẹ (1-3 buổi/tuần)'
                                : user?.activity_level === 'moderate' ? 'Vận động vừa (3-5 buổi/tuần)'
                                : user?.activity_level === 'active' ? 'Vận động nhiều (6-7 buổi/tuần)'
                                : 'Chưa cung cấp'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column - Security & Status */}
              <div className="space-y-8">
                {/* Notification Settings Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-red-200 transition-colors duration-300">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-red-500" />
                    Nhắc nhở & Thông báo
                  </h3>
                  
                  {isEditing ? (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800">Nhắc cập nhật BMI</span>
                          <span className="text-xs text-slate-500">Nhận email nhắc nhở định kỳ</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={formData.bmi_reminder_enabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, bmi_reminder_enabled: e.target.checked }))}
                          className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Tần suất thông báo</label>
                        <select
                          name="bmi_reminder_frequency"
                          value={formData.bmi_reminder_frequency}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        >
                          <option value="daily">Hàng ngày</option>
                          <option value="weekly">Hàng tuần</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-sm font-medium text-slate-700">Nhắc cập nhật BMI</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${user?.bmi_reminder_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {user?.bmi_reminder_enabled ? 'Đã bật' : 'Đang tắt'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-sm font-medium text-slate-700">Tần suất</span>
                        <span className="text-sm text-slate-600">
                          {user?.bmi_reminder_frequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-red-200 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Key size={20} className="text-red-500" />
            Thiết lập bảo mật
          </h3>
            <div className="space-y-4">
              <Button 
                variant="secondary" 
                className="w-full justify-start text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                onClick={openChangePasswordModal}
                disabled={user?.auth_provider === 'google'}
              >
                <Lock size={16} className="mr-2" />
                Đổi mật khẩu
              </Button>
            {user?.auth_provider === 'google' && (
              <p className="text-xs text-slate-500 text-center">
                Tài khoản Google không thể đổi mật khẩu
              </p>
            )}
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

      {/* Change Password Modal */}
      <Modal 
        isOpen={isChangePasswordModalOpen} 
        onClose={closeChangePasswordModal}
        title="Đổi Mật Khẩu"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
          <div className="text-sm text-slate-600 mb-4">
            Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn.
          </div>

          <Input
            label="Mật khẩu hiện tại"
            name="current_password"
            type="password"
            icon={Lock}
            value={changePasswordForm.current_password}
            onChange={handleChangePasswordInput}
            placeholder="Nhập mật khẩu hiện tại"
            showToggle={true}
            showPassword={showCurrentPassword}
            onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
          />

          <Input
            label="Mật khẩu mới"
            name="new_password"
            type="password"
            icon={Lock}
            value={changePasswordForm.new_password}
            onChange={handleChangePasswordInput}
            placeholder="Nhập mật khẩu mới"
            showToggle={true}
            showPassword={showNewPassword}
            onTogglePassword={() => setShowNewPassword(!showNewPassword)}
          />
          
          {changePasswordForm.new_password && (
            <PasswordStrength password={changePasswordForm.new_password} />
          )}

          <Input
            label="Xác nhận mật khẩu mới"
            name="confirm_password"
            type="password"
            icon={Lock}
            value={changePasswordForm.confirm_password}
            onChange={handleChangePasswordInput}
            placeholder="Nhập lại mật khẩu mới"
            showToggle={true}
            showPassword={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          {changePasswordError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{changePasswordError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              type="button"
              className="flex-1"
              onClick={closeChangePasswordModal}
              disabled={isChangingPassword}
            >
              <X size={16} className="mr-2" />
              Hủy
            </Button>
            <Button 
              type="submit"
              className="flex-1"
              isLoading={isChangingPassword}
              disabled={isChangingPassword}
            >
              <Check size={16} className="mr-2" />
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;