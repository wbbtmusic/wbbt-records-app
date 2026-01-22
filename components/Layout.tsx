import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';

import { apiService } from '../services/apiService';
import {
  LayoutDashboard, Disc, DollarSign, Upload, Shield,
  LogOut, Menu, User as UserIcon, AudioLines, Library, BarChart2, LifeBuoy, BrainCircuit, X, Users, FileSignature, Bell, TrendingUp
} from 'lucide-react';
import NeuralBackground from './NeuralBackground';
import Avatar from './Avatar';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  setUser: (u: User | null) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadSupport, setUnreadSupport] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const hasUnreadNotifs = notifications.some(n => !n.read);

  useEffect(() => {
    // Check for unread support tickets and notifications
    const checkUpdates = async () => {
      try {
        const tickets = await apiService.getTickets();
        const hasUnread = tickets.some((t: any) => {
          const lastResponse = t.responses?.[t.responses.length - 1];
          return lastResponse?.from === 'admin';
        });
        setUnreadSupport(hasUnread);

        const notifs = await apiService.getNotifications();
        setNotifications(notifs || []);
      } catch (e) {
        console.error(e);
      }
    };

    if (user) checkUpdates();
  }, [user, location.pathname]);

  const handleNotifClick = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && hasUnreadNotifs) {
      // Here we could trigger a "mark all read" if desired
    }
  };
  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    navigate('/');
  };

  const isDashboard = location.pathname === '/dashboard';

  const NavItem = ({ to, icon: Icon, label, alert }: { to: string, icon: any, label: string, alert?: boolean }) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        className={`flex items-center gap-4 px-5 py-3.5 mb-2 rounded-[20px] transition-all duration-500 ease-wise-ease group relative overflow-hidden ${active
          ? 'bg-white text-black shadow-xl shadow-white/10 scale-[1.02]'
          : 'text-[#888] hover:bg-white/5 hover:text-white hover:scale-[1.01]'
          }`}
      >
        <div className="relative">
          <Icon size={20} className={`relative z-10 transition-colors duration-300 ${active ? "text-indigo-600" : "text-[#666] group-hover:text-white"}`} />
          {alert && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#020204]" />}
        </div>
        <span className={`relative z-10 text-sm font-bold tracking-wide font-display whitespace-nowrap transition-all duration-500 ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[-10px] absolute left-14'}`}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#020204] text-[#EEE] relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      <NeuralBackground />

      {/* FLOATING SIDEBAR */}
      <aside
        className={`
          fixed top-4 bottom-4 left-4 z-40
          glass-panel rounded-[40px]
          transition-all duration-700 ease-wise-ease
          flex flex-col
          ${sidebarOpen ? 'w-[280px]' : 'w-[96px]'}
        `}
      >
        {/* Logo Area */}
        <div className="h-28 flex items-center justify-center relative px-6">
          {/* Expanded State: Text Logo */}
          <div className={`flex flex-col items-center justify-center transition-all duration-500 ${sidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 absolute pointer-events-none'}`}>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-white tracking-tighter font-display leading-none">WBBT</h1>
              <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Beta</span>
            </div>
            <span className="text-[10px] tracking-[0.4em] text-indigo-500 uppercase font-bold mt-1">Records</span>
          </div>

          {/* Collapsed State: Image Logo */}
          <div className={`absolute transition-all duration-500 flex items-center justify-center ${sidebarOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
            <img src="/logo.png" alt="W" className="w-10 h-10 object-contain" />
          </div>
        </div>

        {/* Navigation Items - Custom Scrollbar */}
        <nav className="flex-1 overflow-y-auto px-4 py-1 custom-scrollbar overflow-x-hidden">
          <p className={`px-4 text-[10px] text-[#444] font-bold uppercase mb-2 tracking-widest font-display transition-all duration-300 ${!sidebarOpen && 'opacity-0 h-0 mb-0'}`}>Main</p>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/promotion" icon={TrendingUp} label="Promotion" />
          <NavItem to="/releases" icon={Disc} label="My Releases" />

          <div className="my-3 border-t border-white/5 mx-4" />
          <p className={`px-4 text-[10px] text-[#444] font-bold uppercase mb-2 tracking-widest font-display transition-all duration-300 ${!sidebarOpen && 'opacity-0 h-0 mb-0'}`}>Label & Teams</p>
          <NavItem to="/earnings" icon={DollarSign} label="Financials" />
          <NavItem to="/teams" icon={Users} label="Teams & Splits" />
          <NavItem to="/contracts" icon={FileSignature} label="Contracts" />

          <div className="my-3 border-t border-white/5 mx-4" />
          <p className={`px-4 text-[10px] text-[#444] font-bold uppercase mb-2 tracking-widest font-display transition-all duration-300 ${!sidebarOpen && 'opacity-0 h-0 mb-0'}`}>Studio & Tools</p>
          <NavItem to="/ai-studio" icon={BrainCircuit} label="AI Studio" />
          <NavItem to="/tools" icon={AudioLines} label="Tools" />

          <div className="my-3 border-t border-white/5 mx-4" />
          <NavItem to="/support" icon={LifeBuoy} label="Support" alert={unreadSupport} />

          {user.role === UserRole.ADMIN && (
            <>
              <div className="my-3 border-t border-white/5 mx-4" />
              <NavItem to="/admin" icon={Shield} label="Admin Panel" />
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 mt-auto">
          {sidebarOpen && <div className="text-[10px] text-[#444] font-bold text-center mb-4 font-mono tracking-widest opacity-50">v0.9.0-BETA</div>}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-5 py-4 text-[#666] hover:text-white hover:bg-white/5 rounded-[20px] transition-all duration-300 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-xs font-bold uppercase tracking-wide font-display">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div
        className={`
            flex-1 flex flex-col h-full relative z-10 
            transition-all duration-700 ease-wise-ease
            ${sidebarOpen ? 'ml-[312px]' : 'ml-[128px]'}
            mr-4
        `}
      >
        {/* FLOATING HEADER - Only detailed on Dashboard */}
        <header className="mt-4 h-[88px] glass-panel rounded-[40px] flex items-center justify-between px-4 md:px-8 mb-6 transition-all duration-500 ease-wise-ease shrink-0 relative z-50">
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#AAA] hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Show title on Dashboard, hide specific "Current View" text on others for cleaner look */}
            {isDashboard && (
              <div className="flex flex-col animate-fade-in">
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-0.5">Current View</span>
                <h1 className="text-2xl font-bold tracking-tight text-white font-display">Overview</h1>
              </div>
            )}

            {/* Admin Header Portal Target */}
            {location.pathname === '/admin' && (
              <div id="admin-header-portal" className="flex-1 ml-4 overflow-hidden" />
            )}

            {!isDashboard && location.pathname !== '/admin' && (
              <h1 className="text-xl font-bold tracking-tight text-white/50 font-display uppercase">
                {location.pathname.split('/')[1].replace('-', ' ')}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/profile" className="flex items-center gap-3 bg-white/5 pl-4 pr-1.5 py-1.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-white font-display">{user.artistName}</span>
                <span className="text-[9px] text-[#666] tracking-wider uppercase">Pro Artist</span>
              </div>
              <Avatar src={user.profilePicture} alt={user.firstName} size="md" />
            </Link>

            <div className="relative z-[100]">
              <button
                onClick={handleNotifClick}
                className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#AAA] hover:text-white hover:bg-white/10 transition-colors"
              >
                <Bell size={20} />
                {hasUnreadNotifs && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#000]"></div>}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-[#111] border border-[#333] rounded-2xl shadow-2xl p-4 z-50 animate-slide-down origin-top-right">
                  <h4 className="text-sm font-bold text-white mb-4">Notifications</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 && <p className="text-xs text-[#666] text-center py-4">No notifications</p>}
                    {notifications.map(n => (
                      <div key={n.id} className={`p-3 rounded-xl border ${n.read ? 'bg-transparent border-transparent' : 'bg-[#1A1A1A] border-[#333]'}`}>
                        <h5 className="text-xs font-bold text-white">{n.title}</h5>
                        <p className="text-[10px] text-[#888] mt-1">{n.message}</p>
                        <p className="text-[9px] text-[#555] mt-2 text-right">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#222]">
                    <Link to="/notifications" onClick={() => setNotifOpen(false)} className="block w-full text-center text-xs font-bold text-white hover:text-indigo-400 transition-colors uppercase tracking-widest">
                      View All
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {isDashboard && (
              <Link to="/releases/create">
                <button className="h-[48px] px-6 md:px-6 rounded-full bg-white text-black hover:bg-[#F2F2F2] text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all duration-300 shadow-xl shadow-white/5 hover:scale-105 active:scale-95 font-display whitespace-nowrap">
                  <Upload size={18} />
                  <span className="hidden sm:inline">New Release</span>
                </button>
              </Link>
            )}
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        {/* Added p-8 to prevent content from being clipped by the rounded corners */}
        <div className="flex-1 overflow-y-auto rounded-[40px] custom-scrollbar p-8">
          <div key={location.pathname} className="animate-page-enter min-h-full">
            {children}
          </div>
        </div>
      </div >
    </div >
  );
};

export default Layout;
