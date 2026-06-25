import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';
import { Mail, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

import { sendOtpAPI } from '../services/auth';
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
  const isRegister = mode === 'register';
  const isForgotPassword = mode === 'forgot-password';
  const isVerifyResetOtp = mode === 'verify-reset-otp';
  const isResetPassword = mode === 'reset-password';

  const isGlass = variant === 'glass';
  const inputTheme = isGlass ? 'glass' : 'baymax';
  const { login, register, forgotPassword, verifyResetOtp, resetPassword, closeAuthModal, setAuthModalType } = useAuth();
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
    const savedEmail = localStorage.getItem('remembered_email');
    if (isLogin) {
      setFormData({
        email: savedEmail ? savedEmail : '',
        password: '',
        confirmPassword: '',
        otp: '',
      });
      if (savedEmail) {
        setRememberMe(true);
      }
    } else if (isRegister) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        otp: '',
      });
    } else if (isVerifyResetOtp || isResetPassword) {
      // Keep email when switching between forgot password steps
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    }
    setErrors({});
    setShowPassword(false);
  }, [mode, isLogin, isRegister, isVerifyResetOtp, isResetPassword]);

  const handleSendOtp = async () => {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Nhập email hợp lệ trước' }));
      return;
    }
    setIsSendingOtp(true);
    try {
      if (isRegister) {
        const response = await sendOtpAPI({ email: formData.email, purpose: 'register' });
        toast.success(response.message || 'Mã OTP đã được gửi thành công!');
      } else if (isForgotPassword) {
        const result = await forgotPassword(formData.email);
        if (result.success) {
          setAuthModalType('verify-reset-otp');
        }
      }
      setOtpCooldown(60);
      const timer = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      const errorMessage = err.detail || err.message || 'Không thể gửi OTP. Vui lòng thử lại.';
      toast.error(errorMessage);
      setErrors(prev => ({ ...prev, otp: errorMessage }));
    }
    setIsSendingOtp(false);
  };

  const validate = () => {
    const newErrors = {};

    if (!isResetPassword && !formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!isResetPassword && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Địa chỉ email không hợp lệ';
    } else if (isRegister && !/^[a-zA-Z0-9._%+-]+@(gmail\.com|hutech\.edu\.vn)$/.test(formData.email)) {
      newErrors.email = 'Hệ thống chỉ chấp nhận email @gmail.com hoặc @hutech.edu.vn';
    }

    if ((isLogin || isRegister || isResetPassword) && !formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if ((isRegister || isResetPassword)) {
      // Kiểm tra mật khẩu mạnh (giống backend)
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(formData.password)) {
        newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)';
      }
    }

    if ((isRegister || isResetPassword) && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if ((isRegister || isVerifyResetOtp) && !formData.otp) {
      newErrors.otp = 'OTP là bắt buộc';
    } else if ((isRegister || isVerifyResetOtp) && formData.otp.length !== 6) {
      newErrors.otp = 'OTP phải có chính xác 6 chữ số';
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
      if (rememberMe) {
        localStorage.setItem('remembered_email', formData.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      const result = await login(
        { email: formData.email, password: formData.password },
        rememberMe
      );
      if (result.success) {
        closeAuthModal();
        if (onSuccess) onSuccess();
        else navigate(from, { replace: true });
      }
    } else if (isRegister) {
      const result = await register({
        email: formData.email,
        password: formData.password,
        otp: formData.otp,
      });

      if (result.success) {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          closeAuthModal();
          if (onSuccess) onSuccess();
          else navigate('/profile', { replace: true });
        }
      }
    } else if (isForgotPassword) {
      // For forgot password, we send OTP on submit
      await handleSendOtp();
    } else if (isVerifyResetOtp) {
      const result = await verifyResetOtp({ email: formData.email, otp_code: formData.otp });
      if (result.success) {
        setAuthModalType('reset-password');
      }
    } else if (isResetPassword) {
      const result = await resetPassword({ email: formData.email, otp_code: formData.otp, new_password: formData.password });
      if (result.success) {
        setAuthModalType('login');
      }
    }

    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full ${isGlass ? 'auth-glass-form' : 'space-y-5'} ${stagger ? 'auth-stagger' : ''}`}
    >
      {/* Back button for forgot password flow */}
      {(isForgotPassword || isVerifyResetOtp || isResetPassword) && (
        <button
          type="button"
          onClick={() => setAuthModalType('login')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-500 mb-4"
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </button>
      )}

      {/* Email Input */}
      {!isResetPassword && (
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder={isGlass ? "Email" : "you@example.com"}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={Mail}
          theme={inputTheme}
        />
      )}

      {/* Password Input */}
      {(isLogin || isRegister || isResetPassword) && (
        <Input
          label={isResetPassword ? "Mật khẩu mới" : "Password"}
          name="password"
          type="password"
          placeholder={isGlass ? (isResetPassword ? "New password" : "Password") : (isResetPassword ? "••••••••" : "••••••••")}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={Lock}
          theme={inputTheme}
          showToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />
      )}

      {/* Password Strength and Confirm Password for Register/Reset Password */}
      {(isRegister || isResetPassword) && (
        <>
          <PasswordStrength password={formData.password} theme={inputTheme} />

          <Input
            label={isResetPassword ? "Xác nhận mật khẩu mới" : "Confirm Password"}
            name="confirmPassword"
            type="password"
            placeholder={isGlass ? (isResetPassword ? "Confirm new password" : "Confirm Password") : "••••••••"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={Lock}
            theme={inputTheme}
            showToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
        </>
      )}

      {/* OTP Input for Register, Forgot Password, Verify Reset OTP */}
      {(isRegister || isForgotPassword || isVerifyResetOtp) && (
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">OTP</label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            {isVerifyResetOtp ? (
              <input
                name="otp"
                type="text"
                placeholder="6-digit code"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                className="w-full rounded-2xl border border-rose-100 bg-rose-50/50 py-3 pl-9 pr-4 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            ) : (
              <input
                name="otp"
                type="text"
                placeholder="6-digit code"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                className="w-full rounded-2xl border border-rose-100 bg-rose-50/50 py-3 pl-9 pr-24 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              />
            )}
            {isForgotPassword && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || otpCooldown > 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isSendingOtp ? '...' : otpCooldown > 0 ? `${otpCooldown}s` : 'Gửi OTP'}
              </button>
            )}
            {isRegister && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || otpCooldown > 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isSendingOtp ? '...' : otpCooldown > 0 ? `${otpCooldown}s` : 'Gửi OTP'}
              </button>
            )}
          </div>
          {errors.otp && <p className="text-xs text-red-500">{errors.otp}</p>}
        </div>
      )}

      {/* Remember Me and Forgot Password for Login */}
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
          <button
            type="button"
            onClick={() => setAuthModalType('forgot-password')}
            className="font-medium text-red-500 transition-colors hover:text-red-600"
          >
            Forgot password?
          </button>
        </div>
      )}

      {isLogin && isGlass && (
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-[#8f2c24]/80">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[#8f2c24]/30 text-[#8f2c24] focus:ring-[#8f2c24]/30"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setAuthModalType('forgot-password')}
            className="font-medium text-[#8f2c24] transition-colors hover:text-[#7a251e]"
          >
            Forgot password?
          </button>
        </div>
      )}

      {/* Google Login Button for Login */}
      {isLogin && (
        <GoogleLoginButton onSuccess={onSuccess} variant={variant} />
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant={isGlass ? 'glass' : 'baymax'}
        className={isGlass ? 'auth-glass-submit w-full' : 'auth-btn-baymax w-full'}
        isLoading={isSubmitting}
      >
        {isLogin
          ? 'Login'
          : isRegister
            ? 'Sign Up'
            : isForgotPassword
              ? 'Gửi mã OTP'
              : isVerifyResetOtp
                ? 'Xác nhận OTP'
                : 'Đổi mật khẩu'}
      </Button>

      {/* Switch Mode for Login/Register */}
      {!isGlass && (isLogin || isRegister) && (
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