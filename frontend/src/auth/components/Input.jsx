import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, type = 'text', options = [], theme = 'light', className = '', ...props }, ref) => {
  const isDark = theme === 'dark';

  const baseClasses = isDark
    ? `
    w-full border-0 border-b bg-transparent
    px-0 py-2.5 text-sm transition-all duration-300 outline-none
    border-b-white/20 text-white placeholder:text-[#555555]
    focus:border-[#8b2b2b] focus:shadow-[0_4px_12px_-4px_rgba(139,43,43,0.5)]
    ${Icon ? 'pl-8' : ''}
    ${error ? 'border-b-[#8b2b2b]/80' : ''}
  `
    : `
    w-full rounded-xl border bg-white/50 backdrop-blur-md
    px-4 py-2.5 text-sm transition-all duration-300 outline-none
    focus:bg-white focus:ring-2 focus:ring-red-500/40 focus:border-red-400
    ${Icon ? 'pl-10' : ''}
    ${error ? 'border-red-400/50 focus:ring-red-500/50 focus:border-red-400' : 'border-slate-200'}
    text-slate-900 placeholder:text-slate-400
  `;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className={`text-xs font-medium tracking-wide uppercase ${isDark ? 'text-[#888888]' : 'text-slate-700'}`}>
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className={`absolute top-[11px] left-0 flex items-center pointer-events-none transition-colors ${isDark ? 'pl-0 text-[#666666] group-focus-within:text-[#8b2b2b]' : 'pl-3 text-slate-400 group-focus-within:text-slate-600'}`}>
            <Icon size={18} />
          </div>
        )}
        
        {type === 'select' ? (
          <select ref={ref} className={`${baseClasses} appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-slate-900`} {...props}>
            <option value="" disabled hidden>{props.placeholder || 'Select an option'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea ref={ref} className={`${baseClasses} min-h-[80px] py-3 resize-y`} {...props} />
        ) : (
          <input
            ref={ref}
            type={type}
            className={`${baseClasses} ${type === 'date' ? '[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.8]' : ''}`}
            {...props}
          />
        )}
      </div>
      {error && (
        <span className={`text-xs font-medium ${isDark ? 'text-[#a33a3a]' : 'text-red-500 ml-1'}`}>
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
