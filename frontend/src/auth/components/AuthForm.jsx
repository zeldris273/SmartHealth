import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from './Input';
import Button from './Button';
import PasswordStrength from './PasswordStrength';

const AuthForm = ({ mode = 'login', onSuccess }) => {
  const isLogin = mode === 'login';
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

  useEffect(() => {
    setFormData({ email: '', password: '', confirmPassword: '', otp: '' });
    setErrors({});
    setShowPassword(false);
  }, [mode]);

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
        if (onSuccess) onSuccess();
        else navigate('/login', { replace: true });
      }
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        icon={Mail}
        theme="dark"
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
          theme="dark"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-[30px] p-2 text-[#666666] transition-colors hover:text-[#8b2b2b]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {!isLogin && (
        <>
          <PasswordStrength password={formData.password} theme="dark" />

          <Input
            label="Confirm password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={Lock}
            theme="dark"
          />

          <Input
            label="OTP"
            name="otp"
            type="text"
            placeholder="6-digit code"
            value={formData.otp}
            onChange={handleChange}
            error={errors.otp}
            icon={ShieldCheck}
            maxLength={6}
            theme="dark"
          />
        </>
      )}

      {isLogin && (
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-[#888888]">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-[#333333] bg-transparent text-[#8b2b2b] focus:ring-[#8b2b2b]/50 focus:ring-offset-0"
            />
            Remember me
          </label>
          <button
            type="button"
            className="text-[#8b2b2b] transition-colors hover:text-[#a33a3a]"
          >
            Forgot password?
          </button>
        </div>
      )}

      <Button type="submit" variant="auth" className="w-full" isLoading={isSubmitting}>
        {isLogin ? 'Sign in' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-[#888888]">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <Link
          to={isLogin ? '/register' : '/login'}
          className="font-medium text-[#8b2b2b] transition-colors hover:text-[#a33a3a]"
        >
          {isLogin ? 'Register' : 'Sign in'}
        </Link>
      </p>
    </form>
  );
};

export default AuthForm;
