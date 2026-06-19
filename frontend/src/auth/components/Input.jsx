import { forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      type = 'text',
      options = [],
      theme = 'light',
      className = '',
      showToggle = false,
      showPassword = false,
      onTogglePassword,
      ...props
    },
    ref
  ) => {
    const isDark = theme === 'dark';
    const isBaymax = theme === 'baymax';
    const isGlass = theme === 'glass';
    const inputId = props.id || props.name;
    const isPasswordField = type === 'password' || (showToggle && type !== 'text');

    if (isGlass) {
      const displayLabel = label || props.placeholder;
      const inputType = showToggle ? (showPassword ? 'text' : 'password') : type;

      return (
        <div
          className={`auth-glass-field ${error ? 'auth-glass-field--error' : ''} ${className}`}
        >
          {displayLabel && (
            <label htmlFor={inputId} className="auth-glass-field-label">
              {Icon && (
                <span className="auth-glass-field-label-icon">
                  <Icon size={14} strokeWidth={2.5} />
                </span>
              )}
              {displayLabel}
            </label>
          )}

          <div className={`auth-glass-input-box group ${error ? 'auth-glass-input-box--error' : ''}`}>
            <span className="auth-glass-input-glow" aria-hidden="true" />
            <span className="auth-glass-input-shine" aria-hidden="true" />

            {Icon && (
              <span className="auth-glass-input-icon">
                <Icon size={20} strokeWidth={2} />
              </span>
            )}

            {type === 'select' ? (
              <select
                ref={ref}
                id={inputId}
                className="auth-glass-input auth-glass-input--select"
                {...props}
              >
                <option value="" disabled hidden>
                  {props.placeholder || 'Select'}
                </option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                ref={ref}
                id={inputId}
                className="auth-glass-input auth-glass-input--textarea min-h-[88px] resize-y"
                {...props}
              />
            ) : (
              <input
                ref={ref}
                id={inputId}
                className={`auth-glass-input ${Icon ? 'auth-glass-input--with-icon' : ''} ${showToggle ? 'auth-glass-input--with-toggle' : ''}`}
                {...props}
                type={inputType}
                placeholder={
                  props.placeholder
                    ? `Nhập ${String(props.placeholder).toLowerCase()}...`
                    : undefined
                }
              />
            )}

            {showToggle && (
              <button
                type="button"
                onClick={onTogglePassword}
                className="auth-glass-input-toggle"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}

            <span className="auth-glass-input-border" aria-hidden="true" />
          </div>

          {error && (
            <p className="auth-glass-field-error" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }

    const baseClasses = isBaymax
      ? `
    w-full rounded-2xl border bg-white
    px-4 py-3 text-sm transition-all duration-300 outline-none
    border-rose-100 text-slate-800 placeholder:text-slate-400
    shadow-sm shadow-rose-100/50
    focus:border-red-300 focus:ring-2 focus:ring-red-100 focus:shadow-md focus:shadow-red-100
    ${Icon ? 'pl-11' : ''}
    ${error ? 'border-red-300 ring-1 ring-red-100' : ''}
  `
      : isDark
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
      <div className={`w-full flex flex-col gap-1.5 ${isDark ? 'auth-input-dark' : ''} ${className}`}>
        {label && (
          <label
            className={`text-sm font-semibold ${
              isBaymax ? 'text-red-500' : isDark ? 'text-xs font-medium tracking-wide uppercase text-[#888888]' : 'text-slate-700'
            }`}
          >
            {label}
          </label>
        )}
        <div className={`relative group ${isDark ? 'pb-0.5' : ''}`}>
          {Icon && (
            <div
              className={`absolute flex items-center pointer-events-none transition-colors ${
                isBaymax
                  ? 'left-3.5 top-[14px] text-rose-300 group-focus-within:text-red-500'
                  : isDark
                  ? 'top-[11px] left-0 pl-0 text-[#666666] group-focus-within:text-[#8b2b2b]'
                  : 'top-[11px] left-0 pl-3 text-slate-400 group-focus-within:text-slate-600'
              }`}
            >
              <Icon size={18} />
            </div>
          )}

          {type === 'select' ? (
            <select
              ref={ref}
              className={`${baseClasses} appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-slate-900`}
              {...props}
            >
              <option value="" disabled hidden>
                {props.placeholder || 'Select an option'}
              </option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea ref={ref} className={`${baseClasses} min-h-[80px] py-3 resize-y`} {...props} />
          ) : (
            <input
              ref={ref}
              type={isPasswordField && showToggle ? (showPassword ? 'text' : 'password') : type}
              className={`${baseClasses} ${type === 'date' ? '[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.8]' : ''}`}
              {...props}
            />
          )}
        </div>
        {error && (
          <span className={`text-xs font-medium ${isDark ? 'text-[#a33a3a]' : 'text-red-500'}`}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
