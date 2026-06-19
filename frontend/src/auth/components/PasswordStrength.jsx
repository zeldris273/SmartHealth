import { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

const PasswordStrength = ({ password, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const isBaymax = theme === 'baymax';
  const isGlass = theme === 'glass';
  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Normalize to 0-4
    if (score < 2) return 1;
    if (score < 4) return 2;
    if (score < 5) return 3;
    return 4;
  }, [password]);

  const getStrengthData = () => {
    switch (strength) {
      case 0: return { label: 'Enter password', color: isGlass || isBaymax || isDark ? 'bg-white/60' : 'bg-slate-200', text: isGlass ? 'text-[#8f2c24]/70' : isBaymax ? 'text-slate-500' : 'text-[#888888]', icon: Shield };
      case 1: return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500', icon: ShieldAlert };
      case 2: return { label: 'Fair', color: 'bg-orange-400', text: 'text-orange-400', icon: ShieldAlert };
      case 3: return { label: 'Good', color: 'bg-rose-400', text: 'text-rose-400', icon: ShieldCheck };
      case 4: return { label: 'Strong', color: 'bg-red-400', text: 'text-red-400', icon: ShieldCheck };
      default: return { label: '', color: isGlass || isBaymax || isDark ? 'bg-white/60' : 'bg-slate-200', text: isGlass ? 'text-[#8f2c24]/70' : isBaymax ? 'text-slate-500' : 'text-[#888888]', icon: Shield };
    }
  };

  const { label, color, text, icon: Icon } = getStrengthData();

  return (
    <div className={`mt-2 flex flex-col gap-1.5 ${isGlass ? 'password-strength-glass' : ''}`}>
      <div className="flex items-center justify-between text-xs font-medium">
        <span className={`flex items-center gap-1 ${isGlass ? 'text-[#8f2c24]/70' : isBaymax ? 'text-slate-500' : isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
          <Icon size={12} className={text} />
          Password Strength
        </span>
        <span className={text}>{label}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`flex-1 rounded-full transition-all duration-300 ${
              strength >= level ? color : isGlass || isBaymax || isDark ? 'bg-white/60' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PasswordStrength;
