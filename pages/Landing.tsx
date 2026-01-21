import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { User } from '../types';
import NeuralBackground from '../components/NeuralBackground';
import { Button, Input, Card } from '../components/ui.tsx';

interface LandingProps {
  setUser: (u: User) => void;
}

const Landing: React.FC<LandingProps> = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
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

        if (!firstName || !lastName || !artistName || !email) throw new Error('Please fill in all fields');
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

  return (
    <div className="min-h-screen bg-[#05060A] text-[#F5F5FA] flex flex-col font-sans relative overflow-hidden">
      <NeuralBackground />

      {/* Exclusive Landing Navbar */}
      <nav className="h-24 px-8 md:px-12 flex items-center justify-between relative z-10">
        <div className="text-3xl font-black tracking-tighter font-display">WBBT <span className="text-indigo-500">Records</span></div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => setIsLogin(true)} className="hidden md:flex">Log In</Button>
          <Button variant="primary" onClick={() => setIsLogin(false)}>Sign Up</Button>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-20 gap-16 relative z-10 pb-20">

        {/* Left: Text */}
        <div className="md:w-1/2 space-y-8">
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] bg-clip-text text-transparent bg-gradient-to-r from-white to-[#8E8EA0] font-display tracking-tight">
            The Future <br />
            of <span className="text-indigo-500">Music.</span>
          </h1>
          <p className="text-xl text-[#C7C7D2] max-w-lg leading-relaxed font-light">
            Distribute to 120+ platforms with neural-powered analytics.
            Keep 100% of your rights.
          </p>
          <div className="flex gap-6 pt-4">
            <Button className="h-14 px-10 text-lg shadow-indigo-500/20 shadow-2xl" onClick={() => setIsLogin(false)}>Get Started</Button>
            <Button variant="secondary" className="h-14 px-10 text-lg">Learn More</Button>
          </div>
        </div>

        {/* Right: Auth Card */}
        <div className="md:w-1/2 max-w-md w-full">
          <Card className="backdrop-blur-2xl bg-[#11121C]/60 border-white/5 shadow-2xl shadow-black/50 !rounded-[3rem]">
            <h2 className="text-3xl font-bold mb-2 font-display">{isLogin ? 'Welcome Back' : 'Join Us'}</h2>
            <p className="text-[#8E8EA0] text-sm mb-8">
              {isLogin ? 'Access your neural dashboard.' : 'Start your legacy today.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

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

              {error && <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 text-xs text-center">{error}</div>}

              <Button type="submit" variant="accent" className="w-full mt-2">
                {isLogin ? 'Enter Dashboard' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button type="button" onClick={toggleMode} className="text-sm text-indigo-400 hover:text-white transition-colors">
                {isLogin ? "Create an account" : "I have an account"}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center text-[10px] text-[#555]">
              <p>Demo Admin: support@wbbt.net / WBBTRecords340</p>
              <p>Demo Artist: artist@example.com / anypass</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Landing;
