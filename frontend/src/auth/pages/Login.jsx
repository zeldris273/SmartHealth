import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

  const validate = () => {
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
    // Since backend might expect email, pass it as email for now if no modifications to backend
    // Otherwise, adapt to backend schema (e.g., { username: formData.identifier, ... })
    const result = await login({ email: formData.identifier, password: formData.password }, rememberMe);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your account to continue"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Email or Username"
          name="identifier"
          type="text"
          placeholder="admin@admin.com or admin123"
          value={formData.identifier}
          onChange={handleChange}
          error={errors.identifier}
          icon={User}
        />

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
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-blue-100 cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </a>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isSubmitting}
          >
            Sign in securely
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
              Don't have an account?
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/register" className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
            Create an enterprise account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
