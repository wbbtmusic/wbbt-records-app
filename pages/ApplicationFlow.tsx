import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../components/ui.tsx';
import { apiService } from '../services/apiService';
import { User, ApplicationStatus } from '../types';
import NeuralBackground from '../components/NeuralBackground';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ApplicationFlowProps {
  user: User;
  setUser: (u: User) => void;
}

const ApplicationFlow: React.FC<ApplicationFlowProps> = ({ user, setUser }) => {
  const navigate = useNavigate();

  const [bio, setBio] = useState('');
  const [insta, setInsta] = useState('');
  const [demo, setDemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(user.applicationStatus === ApplicationStatus.PENDING);

  const isPending = submitted || user.applicationStatus === ApplicationStatus.PENDING;


  // No auto-redirect - we'll show a success screen with button instead

  // Poll for status updates when pending
  React.useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(async () => {
      try {
        const updatedUser = await apiService.getCurrentUser();
        if (updatedUser && updatedUser.applicationStatus === ApplicationStatus.APPROVED) {
          setUser(updatedUser);
        } else if (updatedUser && updatedUser.applicationStatus === ApplicationStatus.REJECTED) {
          setUser(updatedUser);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPending, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.submitApplication(user.id, {
        bio,
        instagramUrl: insta,
        demoTrackUrl: demo
      });

      setSubmitted(true);
      setUser({ ...user, applicationStatus: ApplicationStatus.PENDING });
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null as any);
    navigate('/');
  };

  // APPROVED - Show success screen with Go to Dashboard button
  if (user.applicationStatus === ApplicationStatus.APPROVED) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <NeuralBackground />
        <Card className="max-w-md w-full text-center border-green-900/50 bg-[#051105] relative z-10">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Welcome to WBBT Records!</h2>
          <p className="text-[#888] mb-6">
            Your application has been approved. You now have full access to your artist dashboard.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (user.applicationStatus === ApplicationStatus.REJECTED) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <NeuralBackground />
        <Card className="max-w-md w-full text-center border-red-900/50 bg-[#110505] relative z-10">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Rejected</h2>
          <p className="text-[#888] mb-6">
            Unfortunately, your application to WBBT Records has been declined at this time.
            {user.banReason && <span className="block mt-2 text-red-400">Reason: {user.banReason}</span>}
          </p>
          <div className="flex justify-center">
            <Button onClick={handleLogout} variant="secondary">Log Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <NeuralBackground />
        <Card className="max-w-md w-full text-center relative z-10">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-[#888] mb-4">
            Thank you for applying to WBBT Records. Our team is reviewing your submission.
            This usually takes 24-48 hours. The page will update automatically once verified.
          </p>
          <p className="text-[#666] text-xs mb-6 bg-white/5 p-3 rounded-lg border border-white/10">
            💡 If you received an approval notification, please log out and log back in to access your dashboard.
          </p>
          <div className="flex justify-center">
            <Button onClick={handleLogout} variant="ghost">Return to Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <NeuralBackground />

      <div className="max-w-2xl w-full relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-light mb-2">Join <span className="font-bold">WBBT</span></h1>
          <p className="text-[#666]">We are an invite-only platform. Tell us about your art.</p>
          <p className="text-[#888] text-xs mt-4 bg-white/5 p-3 rounded-lg border border-white/10 inline-block">
            💡 If you received an approval notification, please log out and log back in to access your dashboard.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold mb-4 border-b border-[#222] pb-2">Artist Profile</h3>
              <Input label="Artist Bio" placeholder="Tell us about your genre, style, and goals..." value={bio} onChange={e => setBio(e.target.value)} required />
              <Input label="Instagram / TikTok URL" placeholder="https://" value={insta} onChange={e => setInsta(e.target.value)} required />
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 border-b border-[#222] pb-2">Demo Submission</h3>
              <p className="text-xs text-[#666] mb-4">Provide a link to a private SoundCloud playlist or Dropbox folder containing at least 2 unreleased tracks.</p>
              <Input label="Demo Link" placeholder="https://soundcloud.com/..." value={demo} onChange={e => setDemo(e.target.value)} required />
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button type="button" onClick={handleLogout} className="text-xs text-[#666] hover:text-white transition-colors">Log Out</button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationFlow;
