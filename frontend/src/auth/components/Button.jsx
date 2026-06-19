import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}, ref) => {
  
  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 outline-none rounded-xl overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/30 focus:ring-2 focus:ring-red-500/50 border border-red-400/20",
    auth: "!rounded-full bg-[#8b2b2b] text-white hover:bg-[#a33a3a] shadow-lg shadow-[#8b2b2b]/30 focus:ring-2 focus:ring-[#8b2b2b]/50 border border-[#8b2b2b]/40",
    baymax: "!rounded-full bg-gradient-to-r from-red-400 via-red-500 to-rose-500 text-white hover:from-red-500 hover:to-rose-600 shadow-lg shadow-red-200/80 focus:ring-2 focus:ring-red-200 border border-red-300/30 text-base font-semibold py-3",
    glass: "rounded-[5px] bg-[#8f2c24] text-white text-[1.15rem] font-semibold py-[14px] hover:bg-[#7a251e] shadow-md shadow-[#8f2c24]/25 focus:ring-2 focus:ring-[#8f2c24]/40 border-none",
    secondary: "bg-white/80 backdrop-blur-md text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm focus:ring-2 focus:ring-slate-200",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-6 py-3"
  };

  const disabledStyles = disabled || isLoading ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-0.5 active:translate-y-0";

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {/* Glossy overlay effect for primary button */}
      {(variant === 'primary' || variant === 'auth' || variant === 'baymax' || variant === 'glass') && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {isLoading && (
        <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
      )}
      <span className={`relative flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
