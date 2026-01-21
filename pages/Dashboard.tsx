import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Release, EarningsRecord } from '../types';
import { apiService } from '../services/apiService';
import { Card, Badge, Button } from '../components/ui.tsx';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PlayCircle, TrendingUp, DollarSign, Music, CheckCircle, ExternalLink, Youtube, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [releases, setReleases] = useState<Release[]>([]);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // Time state (System Clock)
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [chartType, setChartType] = useState<'revenue' | 'streams'>('revenue');
  const [externalAnalytics, setExternalAnalytics] = useState<any>(null);

  useEffect(() => {
    // Update hour every minute to stay synced
    const timer = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rels, earns] = await Promise.all([
          apiService.getReleases(user.id),
          apiService.getEarnings(user.id)
        ]);
        setReleases(rels || []);
        setEarnings(earns || []);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      }
      setLoading(false);
    };
    loadData();

    // Load external analytics separately (non-blocking)
    apiService.getAnalyticsExternal().then(data => {
      setExternalAnalytics(data);
    }).catch(() => { });
  }, [user.id]);

  // Calculate REAL stats from backend data
  const totalStreams = earnings.reduce((sum, e) => sum + (e.streams || 0), 0);
  const totalDownloads = earnings.reduce((sum, e) => sum + (e.downloads || 0), 0);
  const approvedReleases = releases.filter(r => r.status === 'APPROVED').length;
  const pendingReleases = releases.filter(r => r.status === 'PENDING').length;

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const recentReleases = [...releases].sort((a, b) => new Date(b.createdDate || '').getTime() - new Date(a.createdDate || '').getTime()).slice(0, 3);

  const KPICard = ({ title, value, trend, icon: Icon, color, onClick, className }: any) => (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 group hover:border-[#444] transition-colors ${onClick ? 'cursor-pointer hover:bg-[#1A1A1A] hover:border-indigo-500/50' : ''} ${className || ''} z-10`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[#888] text-[10px] font-bold uppercase mb-2 font-display tracking-widest">{title}</p>
          <h3 className="text-3xl font-display font-bold text-white group-hover:text-[#50A0FF] transition-colors">{value}</h3>
          <p className="text-xs text-[#666] mt-2 flex items-center gap-1 font-medium">
            {trend}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-[#1A1A1A] text-[#888] group-hover:text-white transition-colors`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[#666]">
        Loading...
      </div>
    );
  }

  // Determine time of day
  const isDay = currentHour >= 6 && currentHour < 18;
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 17;
  const isEvening = currentHour >= 17 && currentHour < 21;

  // Dynamic Background
  const getGradient = () => {
    if (isMorning) return 'from-orange-500/20 via-yellow-500/10 to-transparent'; // Morning Warmth
    if (isAfternoon) return 'from-blue-400/20 via-cyan-500/10 to-transparent'; // Day Brightness
    if (isEvening) return 'from-indigo-500/20 via-purple-500/20 to-transparent'; // Evening Sunset/Twilight
    return 'from-indigo-900/40 via-slate-800/20 to-transparent'; // Night deep blue
  };

  return (
    <div className="space-y-8 relative">
      {/* Ambient Background Glow with Feathering */}
      {/* Ambient Background Glow with Feathering - Portaled to avoid clipping */}
      {createPortal(
        <div
          className={`fixed inset-0 pointer-events-none transition-all duration-1000 bg-gradient-to-b ${getGradient()}`}
          style={{
            zIndex: 1,
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
          }}
        />,
        document.body
      )}



      <div className="flex justify-between items-end relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            {isDay ? (
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse transition-all duration-1000">
                <Sun size={32} className="text-yellow-400" />
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-900/40 flex items-center justify-center animate-pulse transition-all duration-1000">
                <Moon size={32} className="text-indigo-300" />
                <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full"></div>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-white mb-1 transition-all">
              {(() => {
                if (isMorning) return 'Good Morning,';
                if (isAfternoon) return 'Good Afternoon,';
                if (isEvening) return 'Good Evening,';
                return 'Good Night,';
              })()} {user.artistName}
            </h2>
            <p className="text-[#888] text-sm">Welcome back to your command center.</p>
          </div>
        </div>
      </div>

      {/* KPI Grid - ALL REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
        <KPICard
          title="Total Lifetime Earnings"
          value={`$${earnings.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}`}
          trend="All time revenue"
          icon={DollarSign}
          onClick={() => navigate('/earnings')}
        />
        <KPICard
          title="Current Balance"
          value={`$${user.balance.toFixed(2)}`}
          trend={earnings.length > 0 ? `${earnings.length} month(s) data` : 'Net Earnings'}
          icon={DollarSign}
          onClick={() => navigate('/earnings')}
        />
        <KPICard
          title="Total Streams"
          value={formatNumber(totalStreams)}
          trend={totalDownloads > 0 ? `${totalDownloads} downloads` : 'No streams yet'}
          icon={PlayCircle}
          onClick={() => navigate('/earnings')}
        />
        <KPICard
          title="Active Releases"
          value={approvedReleases}
          trend={pendingReleases > 0 ? `${pendingReleases} pending` : 'Submit your first release'}
          icon={Music}
        />
        <KPICard
          title="Total Monthly Listeners"
          value={externalAnalytics?.spotify?.monthlyListeners ? formatNumber(externalAnalytics.spotify.monthlyListeners) : (externalAnalytics?.spotify?.followers ? formatNumber(externalAnalytics.spotify.followers) : '—')}
          trend={externalAnalytics?.spotify?.followers ? `${formatNumber(externalAnalytics.spotify.followers)} total followers` : 'Add Spotify account'}
          icon={Music}
          onClick={() => navigate('/earnings')}
          className="bg-gradient-to-br from-[#1DB954]/20 to-transparent border-[#1DB954]/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Chart */}
        <div className="lg:col-span-2">
          <Card className="h-[400px] flex flex-col bg-[#121212]/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold font-display">{chartType === 'revenue' ? 'Revenue Analytics' : 'Stream Analytics'}</h3>
                <div className="flex bg-[#1A1A1A] p-0.5 rounded-lg border border-[#333]">
                  <button
                    onClick={() => setChartType('revenue')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${chartType === 'revenue' ? 'bg-[#50A0FF] text-white shadow-lg' : 'text-[#666] hover:text-white'}`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setChartType('streams')}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${chartType === 'streams' ? 'bg-[#50A0FF] text-white shadow-lg' : 'text-[#666] hover:text-white'}`}
                  >
                    Streams
                  </button>
                </div>
              </div>
              <Link to={`/earnings?tab=${chartType === 'revenue' ? 'revenue' : 'analytics'}`} className="text-xs text-[#50A0FF] hover:text-white transition-colors font-bold uppercase">See Details</Link>
            </div>

            {earnings.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[#666] text-sm">
                No data available yet.
              </div>
            ) : (
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earnings}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartType === 'revenue' ? "#50A0FF" : "#10B981"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartType === 'revenue' ? "#50A0FF" : "#10B981"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                    <XAxis dataKey="month" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => chartType === 'revenue' ? `$${v}` : `${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '4px' }}
                      itemStyle={{ color: '#EEE' }}
                      formatter={(value: any) => [
                        chartType === 'revenue' ? `$${value}` : `${value.toLocaleString()}`,
                        chartType === 'revenue' ? 'Revenue' : 'Streams'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartType === 'revenue' ? "amount" : "streams"}
                      stroke={chartType === 'revenue' ? "#50A0FF" : "#10B981"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Releases */}
        <div className="lg:col-span-1">
          <Card className="h-[400px] overflow-hidden flex flex-col bg-[#121212]/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold font-display">Recent Releases</h3>
              <Link to="/releases" className="text-xs text-[#50A0FF] hover:text-white transition-colors font-bold uppercase">View All</Link>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {recentReleases.map(release => (
                <div key={release.id} className="flex items-center gap-4 p-3 rounded bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#50A0FF] transition-all group">
                  <img src={release.coverUrl || 'https://via.placeholder.com/48'} alt={release.title} className="w-12 h-12 rounded object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-white truncate font-display">{release.title}</h4>
                    <p className="text-[10px] text-[#888] truncate uppercase tracking-wider">{release.type} • {release.releaseDate}</p>
                  </div>
                  <Badge status={release.status} />
                </div>
              ))}
              {recentReleases.length === 0 && (
                <div className="text-center py-10 text-[#666] text-sm border border-dashed border-[#2A2A2A] rounded">
                  No releases yet. Start your legacy.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
