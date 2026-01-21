import React from 'react';

// --- Wise / Liquid Glass Design System ---
// Extremely round corners (Rounded-3xl / Full)
// Smooth transitions (ease-wise-ease)
// Floating interactions

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const base = "h-[56px] px-8 rounded-full font-display font-bold text-[13px] tracking-wide transition-all duration-300 ease-wise-ease flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

  const variants = {
    primary: "bg-white text-black hover:bg-[#F2F2F2] shadow-lg shadow-white/10 hover:shadow-white/20 border-2 border-transparent",
    accent: "bg-[#6366f1] text-white hover:bg-[#5558e6] shadow-lg shadow-indigo-500/30 border-2 border-transparent",
    secondary: "bg-white/5 backdrop-blur-md border-2 border-white/5 text-white hover:bg-white/10 hover:border-white/10",
    ghost: "bg-transparent text-[#999] hover:text-white hover:bg-white/5 border-2 border-transparent",
    danger: "bg-red-500/10 border-2 border-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300"
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, helper, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2.5 mb-5 w-full group">
      {label && <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest font-display ml-6 group-focus-within:text-white transition-colors duration-300">{label}</label>}
      <input
        className={`h-[60px] bg-white/[0.03] backdrop-blur-sm border-2 border-white/[0.05] rounded-[2rem] px-8 text-[#EEE] placeholder-white/20 focus:border-indigo-500 focus:bg-white/[0.05] focus:ring-0 focus:outline-none transition-all duration-300 ease-wise-ease text-sm font-medium ${error ? 'border-red-500/50 bg-red-500/5' : ''} ${className}`}
        {...props}
      />
      {helper && !error && <span className="text-white/40 text-[10px] ml-6">{helper}</span>}
      {error && <span className="text-red-400 text-[10px] ml-6">{error}</span>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2.5 mb-5 w-full group">
      {label && <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest font-display ml-6 group-focus-within:text-white transition-colors duration-300">{label}</label>}
      <div className="relative">
        <select
          className={`h-[60px] w-full bg-white/[0.03] backdrop-blur-sm border-2 border-white/[0.05] rounded-[2rem] px-8 text-[#EEE] focus:border-indigo-500 focus:bg-white/[0.05] focus:ring-0 focus:outline-none transition-all duration-300 ease-wise-ease appearance-none text-sm font-medium cursor-pointer ${className}`}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#1A1A1A] text-[#EEE]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`glass-panel rounded-[40px] p-8 md:p-10 transition-transform duration-500 ease-wise-ease hover:translate-y-[-2px] ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ status: string }> = ({ status }) => {
  let style = "bg-white/5 text-[#888] border-white/5"; // Default

  switch (status.toUpperCase()) {
    case 'PENDING': style = "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"; break;
    case 'APPROVED': style = "bg-green-500/10 text-green-300 border-green-500/20"; break;
    case 'REJECTED':
    case 'TAKEDOWN': style = "bg-red-500/10 text-red-300 border-red-500/20"; break;
    case 'TAKEDOWN_REQUESTED':
    case 'TAKEDOWN_PENDING': style = "bg-orange-500/10 text-orange-400 border-orange-500/20"; break; // Orange as requested
    case 'EDITING': style = "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"; break;
  }
  return (
    <span className={`h-[36px] px-6 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center justify-center w-fit border backdrop-blur-md font-display transition-all duration-300 ${style}`}>
      {status}
    </span>
  );
};
