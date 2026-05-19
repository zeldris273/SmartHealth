import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import PasswordStrength from '../components/PasswordStrength';
import {
  Mail, Lock, User, Eye, EyeOff, Phone,
  MapPin, Calendar, CreditCard, Camera
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    address: '',
    citizenId: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';

    // Đã sửa: Regex cho Email (Bỏ dấu \ dư thừa)
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email address';

    // Đã sửa: Regex cho Số điện thoại (Bỏ dấu \ dư thừa để replace khoảng trắng hoạt động chính xác)
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10,12}$/.test(formData.phone.replace(/[\s-]/g, ''))) newErrors.phone = 'Invalid phone number';

    if (!formData.gender) newErrors.gender = 'Please select a gender';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';
    if (!formData.citizenId) newErrors.citizenId = 'Citizen ID / CCCD is required';
    if (!formData.address) newErrors.address = 'Address is required';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const { confirmPassword, agreeTerms, ...registerData } = formData;

    const result = await register(registerData);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/profile', { replace: true });
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Enter your details to join the SmartHealth platform"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative group cursor-pointer">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all duration-300 ${avatarPreview ? 'border-cyan-400' : 'border-white/20 bg-white/5 border-dashed group-hover:border-cyan-400/50 group-hover:bg-white/10'}`}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-blue-200" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <span className="text-xs text-blue-200 mt-2 font-medium">Upload Profile Photo</span>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" name="fullName" type="text" placeholder="John Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} icon={User} />
          <Input label="Username" name="username" type="text" placeholder="johndoe99" value={formData.username} onChange={handleChange} error={errors.username} icon={User} />

          <Input label="Email Address" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={errors.email} icon={Mail} />
          <Input label="Phone Number" name="phone" type="tel" placeholder="0912345678" value={formData.phone} onChange={handleChange} error={errors.phone} icon={Phone} />

          <Input
            label="Gender"
            name="gender"
            type="select"
            value={formData.gender}
            onChange={handleChange}
            error={errors.gender}
            options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Other', value: 'other' }]}
          />
          <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} error={errors.dob} icon={Calendar} />

          <Input label="Citizen ID / CCCD" name="citizenId" type="text" placeholder="012345678912" value={formData.citizenId} onChange={handleChange} error={errors.citizenId} icon={CreditCard} />
          <Input label="Address" name="address" type="text" placeholder="123 Health St, City" value={formData.address} onChange={handleChange} error={errors.address} icon={MapPin} />
        </div>

        {/* Passwords */}
        <div className="space-y-4 pt-2">
          <div>
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={Lock}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-blue-300 hover:text-cyan-400 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.password && <PasswordStrength password={formData.password} />}
          </div>

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={Lock}
          />
        </div>

        {/* Terms */}
        <div className="pt-2">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="agreeTerms"
                name="agreeTerms"
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeTerms" className="text-blue-100 cursor-pointer">
                I agree to the <a href="#" className="text-cyan-400 hover:underline">Terms of Service</a> and <a href="#" className="text-cyan-400 hover:underline">Privacy Policy</a>.
              </label>
              {errors.agreeTerms && <p className="text-xs text-red-400 mt-1">{errors.agreeTerms}</p>}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create Enterprise Account
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 lg:bg-transparent text-blue-200">
              Already have an account?
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
            Sign in instead
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;