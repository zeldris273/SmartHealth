import { HeartPulse, Activity } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-12">
        {/* Animated Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[50%] -right-[20%] w-[50%] h-[70%] rounded-full bg-cyan-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[80px]" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <HeartPulse className="w-7 h-7 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SmartHealth</span>
          </div>
          
          <div className="max-w-lg mt-24">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
              The future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">digital healthcare</span> is here.
            </h1>
            <p className="text-lg text-blue-100/80 leading-relaxed">
              Experience a premium, enterprise-grade medical platform designed to streamline your health journey with unparalleled security and elegance.
            </p>
          </div>
        </div>

        {/* Footer/Metrics */}
        <div className="relative z-10 flex gap-8">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 max-w-[200px]">
            <Activity className="w-8 h-8 text-cyan-400 mb-3" />
            <h4 className="text-white font-semibold">24/7 Monitoring</h4>
            <p className="text-blue-200/70 text-sm mt-1">Real-time health insights at your fingertips.</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-900 lg:bg-none lg:bg-slate-900 py-12 px-4 sm:px-6 lg:px-16 xl:px-24">
        {/* Mobile Background Orbs (Hidden on desktop) */}
        <div className="absolute lg:hidden top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
        
        <div className="w-full max-w-md mx-auto relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <HeartPulse className="w-7 h-7 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SmartHealth</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-blue-200">
                {subtitle}
              </p>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-2xl py-8 px-6 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
