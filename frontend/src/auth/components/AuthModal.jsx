import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import PasswordStrength from './PasswordStrength';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authModalType, toggleAuthModalType, login, register } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

  // Reset form when modal opens or toggles type
  useEffect(() => {
    if (isAuthModalOpen) {
      setFormData({ email: '', password: '', confirmPassword: '', otp: '' });
      setErrors({});
      setShowPassword(false);
    }
  }, [isAuthModalOpen, authModalType]);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalType === 'login';

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.otp) {
        newErrors.otp = 'OTP is required';
      } else if (formData.otp.length < 6) {
        newErrors.otp = 'Invalid OTP format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    if (isLogin) {
      const result = await login({ email: formData.email, password: formData.password }, rememberMe);
      if (result.success) {
        closeAuthModal();
        navigate(from, { replace: true });
      }
    } else {
      // Using email prefix as full_name for backend compatibility since we only have Email field now
      const username = formData.email.split('@')[0];
      const result = await register({ fullName: username, email: formData.email, password: formData.password });
      if (result.success) {
        closeAuthModal();
        navigate('/profile', { replace: true });
      }
    }
    
    setIsSubmitting(false);
  };

  // Click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md overflow-hidden bg-white/80 border border-slate-200 shadow-2xl rounded-3xl backdrop-blur-xl animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="relative px-8 pt-10 pb-6 text-center">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/30 rounded-full blur-[60px]" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-600/30 rounded-full blur-[60px]" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isLogin ? 'Sign in to access your dashboard' : 'Join SmartHealth today'}
          </p>
        </div>

        {/* Modal Body (Form) */}
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
            />

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
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isLogin && (
              <>
                <PasswordStrength password={formData.password} />
                
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

                <Input
                  label="One-Time Password (OTP)"
                  name="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  error={errors.otp}
                  icon={ShieldCheck}
                  maxLength={6}
                />
              </>
            )}

            {isLogin && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-red-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                    Remember me
                  </label>
                </div>
                <button type="button" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                {isLogin ? 'Sign in securely' : 'Create account'}
              </Button>
            </div>
          </form>

          {/* Toggle Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={toggleAuthModalType}
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors focus:outline-none"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
