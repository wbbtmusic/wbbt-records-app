import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/ui.tsx';
import { apiService } from '../services/apiService';
import { DollarSign, TrendingUp, Download, Building2, CreditCard, ArrowUpRight, History, CheckCircle, BarChart2, Music, Youtube } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import { useLocation } from 'react-router-dom';

const Earnings: React.FC = () => {
    const location = useLocation();
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'revenue' | 'analytics'>('revenue');

    // Revenue Data
    const [earnings, setEarnings] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Analytics Data
    const [analyticsData, setAnalyticsData] = useState<any>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'analytics' || tab === 'revenue') {
            setActiveTab(tab);
        }
        loadData();
    }, [location.search]);

    const loadData = async () => {
        try {
            const u = await apiService.getCurrentUser();
            setUser(u);

            const [allEarnings, userWithdrawals, methods, analytics] = await Promise.all([
                apiService.getMyEarnings(),
                apiService.getWithdrawals(),
                apiService.getPaymentMethods(),
                apiService.getAnalytics()
            ]);

            setEarnings(allEarnings || []);
            setWithdrawals(userWithdrawals || []);
            setPaymentMethods(methods || []);
            setAnalyticsData(analytics);

            // Load external analytics separately (non-blocking)
            apiService.getAnalyticsExternal().then(externalData => {
                setAnalyticsData(prev => ({ ...prev, external: externalData }));
            }).catch(() => { });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Derived Revenue Stats
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING').reduce((sum, w) => sum + w.amount, 0);
    const defaultMethod = paymentMethods.find(m => m.isDefault) || paymentMethods[0];

    // Analytics Chart Data
    const chartData = analyticsData?.monthlyData?.map((d: any) => ({
        month: d.month,
        streams: d.streams,
        earnings: d.earnings
    })) || [];

    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [addMethodOpen, setAddMethodOpen] = useState(false);

    // Withdrawal Form
    const [amount, setAmount] = useState('');
    const [success, setSuccess] = useState(false);

    // New Payment Method Form
    const [newBank, setNewBank] = useState('');
    const [newHolder, setNewHolder] = useState('');
    const [newIban, setNewIban] = useState('');
    const [newSwift, setNewSwift] = useState('');
    const [savingMethod, setSavingMethod] = useState(false);

    const handleAddMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingMethod(true);
        try {
            await apiService.createPaymentMethod({
                bankName: newBank,
                accountHolder: newHolder,
                iban: newIban,
                swiftBic: newSwift,
                isDefault: paymentMethods.length === 0
            });
            await loadData();
            setAddMethodOpen(false);
            setNewBank('');
            setNewHolder('');
            setNewIban('');
            setNewSwift('');
        } catch (error) {
            alert('Failed to add payment method');
        } finally {
            setSavingMethod(false);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await apiService.setDefaultPaymentMethod(id);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteMethod = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payment method?')) return;
        try {
            await apiService.deletePaymentMethod(id);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!defaultMethod) {
            alert('Please add a payment method first');
            return;
        }
        try {
            await apiService.requestWithdrawal(
                parseFloat(amount) || user.balance,
                'IBAN',
                `Bank: ${defaultMethod.bankName}, Holder: ${defaultMethod.accountHolder}, IBAN: ${defaultMethod.iban}, SWIFT: ${defaultMethod.swiftBic}`
            );
            setSuccess(true);
            setTimeout(() => {
                setWithdrawOpen(false);
                setSuccess(false);
                loadData();
            }, 2000);
        } catch (error) {
            alert('Failed to request withdrawal. Ensure you have sufficient balance.');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2">My Business</h1>
                    <p className="text-[#888]">Manage your revenue and analyze performance.</p>
                </div>

                <div className="flex bg-[#111] p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'revenue' ? 'bg-white text-black shadow-lg' : 'text-[#888] hover:text-white'}`}
                    >
                        Revenue
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-white text-black shadow-lg' : 'text-[#888] hover:text-white'}`}
                    >
                        Analytics
                    </button>
                </div>
            </div>

            {loading && <div className="text-center py-20 text-[#666]">Loading data...</div>}

            {!loading && activeTab === 'revenue' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Revenue Header Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-indigo-900/40 to-black border-indigo-500/20">
                            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">Available Balance</p>
                            <h2 className="text-5xl font-display font-bold text-white mb-4">${user?.balance?.toFixed(2) || '0.00'}</h2>
                            <Button variant="accent" onClick={() => { setAmount(user?.balance?.toString()); setWithdrawOpen(true); }} className="w-full">
                                <Download size={18} className="mr-2" /> Withdraw Funds
                            </Button>
                        </Card>

                        <Card>
                            <p className="text-[#888] text-xs font-bold uppercase tracking-widest mb-2">Pending Payouts</p>
                            <h2 className="text-4xl font-display font-bold text-white mb-2">${pendingWithdrawals.toFixed(2)}</h2>
                            <p className="text-xs text-[#666]">{withdrawals.filter(w => w.status === 'PENDING').length} active requests</p>
                        </Card>

                        <Card>
                            <p className="text-[#888] text-xs font-bold uppercase tracking-widest mb-2">Total Withdrawn</p>
                            <h2 className="text-4xl font-display font-bold text-white mb-2">${withdrawals.filter(w => w.status === 'COMPLETED').reduce((sum, w) => sum + w.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                            <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                                <CheckCircle size={14} /> Approved Payouts
                            </div>
                        </Card>
                    </div>

                    {/* Transactions & Splits */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
                                        <History size={20} className="text-[#888]" /> Monthly Statements
                                    </h3>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {earnings.length === 0 && <div className="text-center text-[#666] py-8">No earnings history yet.</div>}
                                    {earnings.map((e) => (
                                        <div key={e.id} className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                                                    <ArrowUpRight size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">Royalty Payout - {e.month}</p>
                                                    <p className="text-[10px] text-[#888]">Streams: {e.streams?.toLocaleString()} • Downloads: {e.downloads}</p>
                                                </div>
                                            </div>
                                            <span className="font-mono text-green-400 text-sm font-bold">+${e.amount?.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* WITHDRAWAL HISTORY */}
                            <Card>
                                <h3 className="text-xl font-bold font-display text-white mb-4 text-[#888]">Withdrawal History</h3>
                                <div className="space-y-2">
                                    {withdrawals.length === 0 && <div className="text-center text-[#666] py-4 text-sm">No payout history.</div>}
                                    {withdrawals
                                        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
                                        .slice(0, 10)
                                        .map(w => (
                                            <div key={w.id} className="flex justify-between items-center p-3 bg-[#111] rounded-xl border border-white/5">
                                                <div>
                                                    <p className="text-white text-sm font-bold opacity-60">${w.amount.toFixed(2)}</p>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-[#666] font-mono">Req: {new Date(w.requestedAt).toLocaleDateString()}</span>
                                                        {w.processedAt && <span className={`text-[10px] font-mono ${w.status === 'COMPLETED' ? 'text-green-500/50' : 'text-red-500/50'}`}>
                                                            {w.status === 'COMPLETED' ? 'Paid' : 'Rejected'}: {new Date(w.processedAt).toLocaleDateString()}
                                                        </span>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge status={w.status} />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="h-full bg-white/[0.02]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold font-display text-white">Payment Methods</h3>
                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => setAddMethodOpen(true)}>+</Button>
                                </div>

                                <div className="space-y-4">
                                    {paymentMethods.length === 0 && <div className="text-sm text-[#666] text-center py-4">No payment methods added.</div>}
                                    {paymentMethods.map(pm => (
                                        <div key={pm.id} className={`p-6 rounded-3xl border transition-all relative group ${pm.isDefault ? 'bg-gradient-to-br from-[#1a1a1a] to-black border-indigo-500/30' : 'bg-[#111] border-white/5 hover:border-white/10'}`}>
                                            {pm.isDefault && <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-[50px]"></div>}
                                            <div className="relative z-10">
                                                <div className="flex justify-between mb-4">
                                                    <Building2 className={pm.isDefault ? "text-indigo-400" : "text-white/40"} />
                                                    {pm.isDefault && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-1 rounded">Primary</span>}
                                                    {!pm.isDefault && (
                                                        <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                                                            <button onClick={() => handleSetDefault(pm.id)} className="text-[10px] text-white underline">Set Default</button>
                                                            <button onClick={() => handleDeleteMethod(pm.id)} className="text-[10px] text-red-500 underline">Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#888] uppercase tracking-wider mb-1">{pm.bankName}</p>
                                                <p className="text-sm text-white font-bold mb-1">{pm.accountHolder}</p>
                                                <p className="text-xs font-mono text-[#666]">{pm.iban}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button variant="secondary" className="w-full mt-6 border-dashed border-white/10" onClick={() => setAddMethodOpen(true)}>
                                    <CreditCard size={18} className="mr-2" /> Add Method
                                </Button>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'analytics' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6 bg-gradient-to-br from-indigo-900/20 to-transparent border-indigo-500/20">
                            <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold">Total Streams</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{analyticsData?.overview?.totalStreams?.toLocaleString() || 0}</h3>
                            <div className="flex items-center gap-1 text-xs text-indigo-400 mt-2">
                                <BarChart2 size={12} /> Lifetime
                            </div>
                        </Card>
                        <Card className="p-6">
                            <p className="text-[10px] uppercase tracking-widest text-[#888] font-bold">Total Earnings</p>
                            <h3 className="text-3xl font-bold text-white mt-1">${analyticsData?.overview?.totalEarnings?.toFixed(2) || '0.00'}</h3>
                            <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
                                <DollarSign size={12} /> Revenue
                            </div>
                        </Card>
                        <Card className="p-6">
                            <p className="text-[10px] uppercase tracking-widest text-[#888] font-bold">Active Releases</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{analyticsData?.overview?.approvedReleases || 0}</h3>
                            <div className="flex items-center gap-1 text-xs text-blue-400 mt-2">
                                <Music size={12} /> Live in Stores
                            </div>
                        </Card>
                        <Card className="p-6">
                            <p className="text-[10px] uppercase tracking-widest text-[#888] font-bold">Avg. Per Release</p>
                            <h3 className="text-3xl font-bold text-white mt-1">
                                {analyticsData?.overview?.approvedReleases > 0
                                    ? Math.round(analyticsData?.overview?.totalStreams / analyticsData?.overview?.approvedReleases).toLocaleString()
                                    : 0}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-purple-400 mt-2">
                                <TrendingUp size={12} /> Streams
                            </div>
                        </Card>


                    </div>

                    {/* External Analytics (Social Impact) */}
                    <h3 className="text-xl font-bold font-display text-white mt-8 mb-4">Social Impact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 bg-[#1DB954]/10 border-[#1DB954]/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-24 bg-[#1DB954]/10 rounded-full blur-[60px] group-hover:bg-[#1DB954]/20 transition-all"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-[#1DB954] font-bold mb-1">Spotify</p>
                                        <p className="text-[10px] text-[#888] uppercase">Total Followers</p>
                                        <h3 className="text-3xl font-bold text-white">{analyticsData?.external?.spotify?.followers?.toLocaleString() || 'N/A'}</h3>
                                    </div>
                                    <div className="p-2 bg-[#1DB954]/20 rounded-lg text-[#1DB954]">
                                        <Music size={24} />
                                    </div>
                                </div>
                                <div className="space-y-3 mt-4 pt-4 border-t border-[#1DB954]/20">
                                    {/* Monthly Listeners */}
                                    <div>
                                        <p className="text-[10px] text-[#888] uppercase">Total Monthly Listeners</p>
                                        <p className="text-xl font-bold text-white">
                                            {analyticsData?.external?.spotify?.monthlyListeners
                                                ? analyticsData.external.spotify.monthlyListeners.toLocaleString()
                                                : <span className="text-[#444]">—</span>}
                                        </p>
                                    </div>
                                    {/* Popularity Score */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-[#888]">Avg. Popularity</span>
                                            <span className="text-white font-bold">{analyticsData?.external?.spotify?.popularity || 0}/100</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#1DB954] to-[#1ed760]" style={{ width: `${analyticsData?.external?.spotify?.popularity || 0}%` }}></div>
                                        </div>
                                    </div>
                                    {analyticsData?.external?.spotify?.accounts?.length > 1 && (
                                        <p className="text-[9px] text-[#555]">{analyticsData.external.spotify.accounts.length} artists combined</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-[#FF0000]/10 border-[#FF0000]/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-24 bg-[#FF0000]/10 rounded-full blur-[60px] group-hover:bg-[#FF0000]/20 transition-all"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-[#FF0000] font-bold mb-1">YouTube</p>
                                        <p className="text-[10px] text-[#888] uppercase">Total Followers</p>
                                        <h3 className="text-3xl font-bold text-white">{analyticsData?.external?.youtube?.subscribers?.toLocaleString() || 'N/A'}</h3>
                                    </div>
                                    <div className="p-2 bg-[#FF0000]/20 rounded-lg text-[#FF0000]">
                                        <Youtube size={24} />
                                    </div>
                                </div>
                                <div className="space-y-3 mt-4 pt-4 border-t border-[#FF0000]/20">
                                    {/* Total Views */}
                                    <div>
                                        <p className="text-[10px] text-[#888] uppercase">Total Views</p>
                                        <p className="text-xl font-bold text-white">{analyticsData?.external?.youtube?.totalViews?.toLocaleString() || 'N/A'}</p>
                                    </div>
                                    {/* Video Count and Accounts */}
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[#888]">Videos</span>
                                        <span className="text-white font-bold">{analyticsData?.external?.youtube?.videoCount || 0}</span>
                                    </div>
                                    {analyticsData?.external?.youtube?.accounts?.length > 1 && (
                                        <p className="text-[9px] text-[#555]">{analyticsData.external.youtube.accounts.length} channels combined</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Artist Breakdown Section */}
                    {(analyticsData?.external?.spotify?.accounts?.length > 0 || analyticsData?.external?.youtube?.accounts?.length > 0) && (
                        <Card className="p-6">
                            <h3 className="font-bold text-white mb-4">Artist Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Spotify Artists */}
                                {analyticsData?.external?.spotify?.accounts?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] uppercase text-[#1DB954] font-bold mb-3">Spotify Artists</p>
                                        <div className="space-y-2">
                                            {analyticsData.external.spotify.accounts.map((account: any, index: number) => (
                                                <div key={index} className="flex justify-between items-center p-3 rounded bg-[#1DB954]/10 border border-[#1DB954]/20">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{account.name || 'Artist'}</p>
                                                        <p className="text-xs text-[#888]">{account.followers?.toLocaleString() || 0} followers</p>
                                                    </div>
                                                    <div className="text-center px-4">
                                                        <p className="text-xs text-[#888]">Monthly Listeners</p>
                                                        <p className="text-sm font-bold text-white">{account.monthlyListeners?.toLocaleString() || '—'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-[#888]">Popularity</p>
                                                        <p className="text-sm font-bold text-[#1DB954]">{account.popularity || 0}/100</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* YouTube Channels */}
                                {analyticsData?.external?.youtube?.accounts?.length > 0 && (
                                    <div>
                                        <p className="text-[10px] uppercase text-[#FF0000] font-bold mb-3">YouTube Channels</p>
                                        <div className="space-y-2">
                                            {analyticsData.external.youtube.accounts.map((account: any, index: number) => (
                                                <div key={index} className="flex justify-between items-center p-3 rounded bg-[#FF0000]/10 border border-[#FF0000]/20">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{account.name || 'Channel'}</p>
                                                        <p className="text-xs text-[#888]">{account.subscribers?.toLocaleString() || 0} subscribers</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-[#888]">Total Views</p>
                                                        <p className="text-sm font-bold text-[#FF0000]">{account.totalViews?.toLocaleString() || 0}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-2 h-[400px]">
                            <h3 className="font-bold text-white mb-6">Monthly Streams</h3>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                        <Tooltip
                                            cursor={{ fill: '#222' }}
                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: any) => [value.toLocaleString(), 'Streams']}
                                        />
                                        <Bar dataKey="streams" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-[#444]">
                                    No stream data available yet.
                                </div>
                            )}
                        </Card>

                        <Card>
                            <h3 className="font-bold text-white mb-6">Recent Releases</h3>
                            <div className="space-y-4">
                                {analyticsData?.releases?.slice(0, 5).map((r: any) => (
                                    <div key={r.id} className="flex items-center justify-between p-3 bg-[#111] rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-white text-sm font-bold truncate max-w-[150px]">{r.title}</p>
                                            <p className="text-[10px] text-[#666]">{new Date(r.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold ${r.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                ))}
                                {(!analyticsData?.releases || analyticsData?.releases?.length === 0) && (
                                    <div className="text-center text-[#444] text-sm py-4">No releases found.</div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )
            }

            {/* ADD METHOD MODAL */}
            {
                addMethodOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                        <Card className="w-full max-w-lg relative bg-[#121212]">
                            <button onClick={() => setAddMethodOpen(false)} className="absolute top-6 right-6 text-[#666] hover:text-white">✕</button>
                            <h2 className="text-2xl font-bold font-display text-white mb-6">Add Payment Method</h2>
                            <form onSubmit={handleAddMethod} className="space-y-4">
                                <Input label="Bank Name" value={newBank} onChange={e => setNewBank(e.target.value)} required placeholder="e.g. Garanti BBVA" />
                                <Input label="Account Holder" value={newHolder} onChange={e => setNewHolder(e.target.value)} required placeholder="Full Legal Name" />
                                <Input label="IBAN" value={newIban} onChange={e => setNewIban(e.target.value)} required placeholder="TR..." />
                                <Input label="SWIFT / BIC" value={newSwift} onChange={e => setNewSwift(e.target.value)} placeholder="Optional" />
                                <Button type="submit" variant="accent" className="w-full" disabled={savingMethod}>
                                    {savingMethod ? 'Saving...' : 'Save Method'}
                                </Button>
                            </form>
                        </Card>
                    </div>
                )
            }

            {/* WITHDRAWAL MODAL */}
            {
                withdrawOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                        <Card className="w-full max-w-lg relative bg-[#121212]">
                            <button onClick={() => setWithdrawOpen(false)} className="absolute top-6 right-6 text-[#666] hover:text-white">✕</button>

                            <h2 className="text-2xl font-bold font-display text-white mb-2">Request Withdrawal</h2>

                            {success ? (
                                <div className="py-12 text-center text-green-400 animate-pulse">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold">Request Submitted</h3>
                                </div>
                            ) : (
                                <form onSubmit={handleWithdraw}>
                                    {!defaultMethod ? (
                                        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm mb-4">
                                            Please add a payment method first.
                                        </div>
                                    ) : (
                                        <div className="bg-[#111] p-4 rounded-xl border border-white/10 mb-6">
                                            <p className="text-xs text-[#666] mb-1">Sending to:</p>
                                            <p className="text-white font-bold text-sm">{defaultMethod.bankName}</p>
                                            <p className="text-white/60 text-xs">{defaultMethod.iban}</p>
                                        </div>
                                    )}

                                    <Input
                                        label="Amount ($)"
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                        min="50"
                                        max={user?.balance}
                                    />
                                    <p className="text-[10px] text-[#666] mb-6 mt-1">Available: ${user?.balance?.toFixed(2)} (Min $50)</p>

                                    <Button type="submit" variant="accent" className="w-full" disabled={!defaultMethod || parseFloat(amount) > user?.balance}>
                                        Confirm Withdrawal
                                    </Button>
                                </form>
                            )}
                        </Card>
                    </div>
                )
            }
        </div >
    );
};

export default Earnings;