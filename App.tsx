import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ReleaseWizard from './pages/ReleaseWizard';
import AdminPanel from './pages/AdminPanel';
import ApplicationFlow from './pages/ApplicationFlow';
import Releases from './pages/Releases';
import ReleaseDetails from './pages/ReleaseDetails';
import Catalog from './pages/Catalog';
import Earnings from './pages/Earnings';
import Teams from './pages/Teams';
import Contracts from './pages/Contracts';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Notifications from './pages/Notifications';
import Tools from './pages/Tools';
import FAQ from './pages/FAQ';
import AIStudio from './pages/AIStudio';
import Promotion from './pages/Promotion';
import BannedView from './pages/BannedView';
import { User, UserRole, ApplicationStatus } from './types';
import { apiService } from './services/apiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await apiService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (e) {
        console.error('Failed to load user:', e);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  if (loading) return null;

  if (user && user.isBanned) {
    return <BannedView user={user} setUser={setUser} />;
  }

  const isApproved = (u: User) => u.applicationStatus === ApplicationStatus.APPROVED;

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/" />;
    if (!isApproved(user)) return <Navigate to="/apply" />;
    return <Layout user={user} setUser={setUser}>{children}</Layout>;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing setUser={setUser} />} />

        <Route path="/apply" element={user ? (isApproved(user) ? <Navigate to="/dashboard" /> : <ApplicationFlow user={user} setUser={setUser} />) : <Navigate to="/" />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user!} /></ProtectedRoute>} />
        <Route path="/releases" element={<ProtectedRoute><Releases /></ProtectedRoute>} />
        <Route path="/releases/create" element={<ProtectedRoute><ReleaseWizard /></ProtectedRoute>} />
        <Route path="/releases/:id" element={<ProtectedRoute><ReleaseDetails /></ProtectedRoute>} />
        <Route path="/releases/edit/:id" element={<ProtectedRoute><ReleaseWizard /></ProtectedRoute>} />

        <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
        <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
        <Route path="/promotion" element={<ProtectedRoute><Promotion /></ProtectedRoute>} />
        <Route path="/ai-studio" element={<ProtectedRoute><AIStudio /></ProtectedRoute>} />

        <Route path="/admin" element={user && user.role === UserRole.ADMIN ? <Layout user={user} setUser={setUser}><AdminPanel /></Layout> : <Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;
