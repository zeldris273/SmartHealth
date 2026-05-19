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
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 focus:ring-2 focus:ring-blue-500/50 border border-blue-400/20",
    secondary: "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 shadow-lg focus:ring-2 focus:ring-white/30",
    ghost: "text-blue-200 hover:bg-white/10 hover:text-white"
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
      {variant === 'primary' && (
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
