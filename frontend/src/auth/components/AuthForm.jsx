import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from './Input';
import Button from './Button';
import PasswordStrength from './PasswordStrength';

const AuthForm = ({
  mode = 'login',
  onSuccess,
  onSwitchMode,
  onRegisterSuccess,
  stagger = true,
  variant = 'baymax',
}) => {
  const isLogin = mode === 'login';
  const isGlass = variant === 'glass';
  const inputTheme = isGlass ? 'glass' : 'baymax';
  const { login, register, closeAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

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
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    setFormData({ email: '', password: '', confirmPassword: '', otp: '' });
    setErrors({});
    setShowPassword(false);
  }, [mode]);

  const handleSendOtp = async () => {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Nhập email hợp lệ trước' }));
      return;
    }
    setIsSendingOtp(true);
    try {
      await fetch('http://127.0.0.1:8000/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      setOtpCooldown(60);
      const timer = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    }
    setIsSendingOtp(false);
  };

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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isLogin) {
      const result = await login(
        { email: formData.email, password: formData.password },
        rememberMe
      );
      if (result.success) {
        closeAuthModal();
        if (onSuccess) onSuccess();
        else navigate(from, { replace: true });
      }
    } else {
      const username = formData.email.split('@')[0];
      const result = await register({
        fullName: username,
        email: formData.email,
        password: formData.password,
        otp: formData.otp,
      });

      if (result.success) {
        closeAuthModal();
        if (onRegisterSuccess) onRegisterSuccess();
        else if (onSuccess) onSuccess();
        else navigate('/login', { replace: true });
      }
    }

    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full ${isGlass ? 'auth-glass-form' : 'space-y-5'} ${stagger ? 'auth-stagger' : ''}`}
    >
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder={isGlass ? 'Email' : 'you@example.com'}
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        icon={Mail}
        theme={inputTheme}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        placeholder={isGlass ? 'Password' : '••••••••'}
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        icon={Lock}
        theme={inputTheme}
        showToggle
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />

      {!isLogin && (
        <>
          <PasswordStrength password={formData.password} theme={inputTheme} />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder={isGlass ? 'Confirm Password' : '••••••••'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={Lock}
            theme={inputTheme}
            showToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

<div className="space-y-1">
  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">OTP</label>
  <div className="relative">
    <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      name="otp"
      type="text"
      placeholder="6-digit code"
      value={formData.otp}
      onChange={handleChange}
      maxLength={6}
      className="w-full rounded-2xl border border-rose-100 bg-rose-50/50 py-3 pl-9 pr-24 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
    />
    <button
      type="button"
      onClick={handleSendOtp}
      disabled={isSendingOtp || otpCooldown > 0}
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
    >
      {isSendingOtp ? '...' : otpCooldown > 0 ? `${otpCooldown}s` : 'Gửi OTP'}
    </button>
  </div>
  {errors.otp && <p className="text-xs text-red-500">{errors.otp}</p>}
</div>
        </>
      )}

      {isLogin && !isGlass && (
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-rose-200 text-red-500 focus:ring-red-300 focus:ring-offset-0"
            />
            Remember me
          </label>
          <button type="button" className="font-medium text-red-500 transition-colors hover:text-red-600">
            Forgot password?
          </button>
        </div>
      )}

      {isLogin && isGlass && (
        <label className="auth-glass-remember flex cursor-pointer items-center gap-2 text-sm text-[#8f2c24]/80">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-[#8f2c24]/30 text-[#8f2c24] focus:ring-[#8f2c24]/30"
          />
          Remember me
        </label>
      )}

      <Button
        type="submit"
        variant={isGlass ? 'glass' : 'baymax'}
        className={isGlass ? 'auth-glass-submit w-full' : 'auth-btn-baymax w-full'}
        isLoading={isSubmitting}
      >
        {isLogin ? 'Login' : 'Sign Up'}
      </Button>

      {!isGlass && (
        <div className="auth-switch-row pt-1 text-center text-sm text-slate-600">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          {onSwitchMode ? (
            <button type="button" onClick={onSwitchMode} className="auth-switch-link auth-switch-link--pulse ml-1.5">
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          ) : (
            <Link to={isLogin ? '/register' : '/login'} className="auth-switch-link ml-1.5">
              {isLogin ? 'Register' : 'Sign in'}
            </Link>
          )}
        </div>
      )}
    </form>
  );
};

export default AuthForm;