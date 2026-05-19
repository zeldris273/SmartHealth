import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, icon: Icon, type = 'text', options = [], className = '', ...props }, ref) => {
  const baseClasses = `
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
        <label className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute top-[11px] left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-600 transition-colors">
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
        <span className="text-xs text-red-500 font-medium ml-1">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
