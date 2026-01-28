import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { User } from '../types';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import { Button, Input, Card } from '../components/ui.tsx';
import { Eye, EyeOff, X } from 'lucide-react';

interface LandingProps {
  setUser: (u: User) => void;
}

const Landing: React.FC<LandingProps> = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isFocused, setIsFocused] = useState(false); // New state for tracking focus

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await apiService.login(email, password, rememberMe);
      } else {
        // Password Complexity Validation
        const isStrong =
          password.length >= 8 &&
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[^A-Za-z0-9]/.test(password);

        if (!isStrong) throw new Error('Password is too weak. Please meet all requirements.');

        if (!isStrong) throw new Error('Password is too weak. Please meet all requirements.');

        if (!firstName || !lastName || !artistName || !email) throw new Error('Please fill in all fields');
        if (!termsAccepted) throw new Error('Please accept the Terms of Use and Publisher Agreement to proceed.');

        user = await apiService.signup(email, password, firstName, lastName, artistName);
      }
      setUser(user);

      // Redirect based on application status
      if (user.applicationStatus === 'APPROVED') {
        navigate('/dashboard');
      } else {
        navigate('/apply');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => { setIsLogin(!isLogin); setError(''); };

  // Mouse tracking for "Records" text effect - Optimized with CSS Variables
  const textRef = React.useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!textRef.current) return;
    const rect = textRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update CSS variables directly to avoid React re-renders (Performance fix)
    textRef.current.style.setProperty('--x', `${x}px`);
    textRef.current.style.setProperty('--y', `${y}px`);
  };

  return (
    <div className="min-h-screen bg-[#05060A] text-[#F5F5FA] flex font-sans relative overflow-hidden">
      <BackgroundSlideshow />

      {/* Dim Overlay when Focused */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-20 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${isFocused ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className="container mx-auto px-6 relative z-30 flex items-center justify-between h-screen">

        {/* Left Side: Animated Brand Text */}
        <div
          className={`flex flex-col justify-center h-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isFocused ? 'pointer-events-none opacity-0' : 'w-1/2 opacity-100'}`}
        >
          <div className={`relative group select-none transition-all duration-1000 ${isFocused ? 'scale-95 blur-sm' : 'scale-100 blur-0'}`}>

            {/* Dark Backdrop for Readability */}
            <div className="absolute -inset-32 bg-black/60 rounded-full blur-[80px] -z-10 mix-blend-multiply"></div>

            {/* Glow Effect from behind */}
            <div className="absolute -inset-20 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-full blur-[100px] opacity-100 transition-opacity duration-1000"></div>

            <div className="relative font-black tracking-tighter font-display animate-fade-in-up">
              <span className="block text-white drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] text-9xl lg:text-[11rem] xl:text-[13rem] leading-[0.85]">WBBT</span>

              {/* Interactive 'Records' Text */}
              <div
                ref={textRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="relative inline-block"
                style={{ '--x': '0px', '--y': '0px' } as React.CSSProperties}
              >
                {/* Base Layer */}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-9xl lg:text-[11rem] xl:text-[13rem] leading-[0.85] drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                  Records
                </span>

                {/* Green Flashlight Layer (Pistachio Green) */}
                <span
                  className="absolute inset-0 block text-[#BBE964] drop-shadow-[0_0_15px_rgba(187,233,100,0.8)] pointer-events-none mix-blend-overlay text-9xl lg:text-[11rem] xl:text-[13rem] leading-[0.85]"
                  style={{
                    // Use mask-image for soft feather edges instead of clip-path
                    maskImage: 'radial-gradient(circle 120px at var(--x) var(--y), black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(circle 120px at var(--x) var(--y), black 20%, transparent 70%)',
                    opacity: isFocused || !isHovering ? 0 : 1, // Hide when focused or not hovering
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  Records
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div
          className={`absolute top-0 h-full flex flex-col justify-center transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] z-40`}
          style={{
            // If focused: center horizontally (left 50%, translate -50%)
            // If NOT focused: positioned further to the right (83%)
            left: isFocused ? '50%' : '83%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '28rem' // max-w-md
          }}
        >
          {/* Centering Wrapper */}
          <div className={`w-full transition-all duration-1000 ${isFocused ? 'max-w-md mx-auto transform scale-105' : 'max-w-md ml-auto'}`}>

            <Card className={`backdrop-blur-2xl bg-[#11121C]/80 border-white/10 shadow-2xl !rounded-[2.5rem] p-8 md:p-12 transition-all duration-700 relative overflow-hidden group ${isFocused ? 'shadow-[0_0_50px_rgba(99,102,241,0.2)] border-indigo-500/30' : 'hover:border-white/20'}`}>

              {/* Close Button (X) */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsFocused(false); }}
                className={`absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all duration-300 z-50 ${isFocused ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90 pointer-events-none'}`}
              >
                <X size={18} />
              </button>

              {/* Focus Trigger Overlay (Only when NOT focused) */}
              {!isFocused && (
                <div
                  className="absolute inset-0 z-40 cursor-pointer"
                  onClick={() => setIsFocused(true)}
                />
              )}

              <h2 className="text-3xl font-bold mb-3 font-display text-center flex justify-center items-center gap-2">
                {/* Animated greeting */}
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {isLogin ? 'Welcome Back' : 'Join the Roster'}
                </span>
              </h2>
              <p className="text-[#8E8EA0] text-sm mb-8 text-center font-light tracking-wide">
                {isLogin ? 'Access your dashboard.' : 'Start your journey.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required={!isLogin} />
                    <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required={!isLogin} />
                    <div className="col-span-2">
                      <Input label="Artist Name" value={artistName} onChange={(e) => setArtistName(e.target.value)} required={!isLogin} />
                    </div>
                  </div>
                )}

                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

                <div className="space-y-2 relative">
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPassword(!showPassword); }}
                      className="absolute right-4 top-[58px] -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator (Signup Only) */}
                  {!isLogin && password.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/20 p-3 rounded-lg border border-white/5">
                      <span className={`${password.length >= 8 ? 'text-green-400' : 'text-[#666]'}`}>• 8+ Chars</span>
                      <span className={`${/[A-Z]/.test(password) ? 'text-green-400' : 'text-[#666]'}`}>• Uppercase</span>
                      <span className={`${/[a-z]/.test(password) ? 'text-green-400' : 'text-[#666]'}`}>• Lowercase</span>
                      <span className={`${/[0-9]/.test(password) ? 'text-green-400' : 'text-[#666]'}`}>• Number</span>
                      <span className={`${/[^A-Za-z0-9]/.test(password) ? 'text-green-400' : 'text-[#666]'}`}>• Symbol</span>
                    </div>
                  )}
                </div>

                {/* Remember Me Checkbox (Login Only) */}
                {isLogin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#333] bg-[#1A1A1A] text-indigo-500 focus:ring-indigo-500/50"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-[#888] cursor-pointer select-none">Remember me</label>
                  </div>
                )}

                {!isLogin && (
                  <div className="flex items-start gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-[#333] bg-[#1A1A1A] text-indigo-500 focus:ring-indigo-500/50"
                    />
                    <label htmlFor="terms" className="text-xs text-[#888] cursor-pointer select-none leading-relaxed">
                      By registering, I agree to the <Link to="/terms" target="_blank" className="text-indigo-400 hover:text-white transition-colors">Terms of Use</Link> and <Link to="/agreement" target="_blank" className="text-indigo-400 hover:text-white transition-colors">Publisher Agreement</Link>, and I consent to the use of my email for marketing purposes by WBBT Records and its affiliates.
                    </label>
                  </div>
                )}

                {error && <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 text-xs text-center">{error}</div>}

                <Button type="submit" variant="accent" className="w-full py-4 text-base mt-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-[1.02]">
                  {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleMode(); }} className="text-sm text-indigo-400 hover:text-white transition-colors hover:underline">
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </button>
              </div>


            </Card>
          </div>
        </div>

        <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      </div>
    </div>
  );
};

export default Landing;
