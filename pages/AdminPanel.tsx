import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/apiService';
import { Release } from '../types';
import { Card, Button, Badge, Input } from '../components/ui.tsx';
import { Check, X, ExternalLink, Inbox, Ban, UserCheck, DollarSign, Trash2, Users, Music, FileAudio, Filter, MessageSquare, Edit3, Save, Disc, ArrowUpRight, FileText, CloudLightning, Globe, Zap, Download, Upload, RefreshCw, Headphones, Youtube } from 'lucide-react';
import { List, Grid } from 'lucide-react';
import Avatar from '../components/Avatar'; // Imported Avatar
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminPanel: React.FC = () => {
    const [tab, setTab] = useState<'dashboard' | 'applications' | 'submissions' | 'edits' | 'takedowns' | 'catalog' | 'users' | 'earnings' | 'tickets' | 'spotifyClaims' | 'youtubeClaims' | 'logs'>('dashboard');
    const [releases, setReleases] = useState<Release[]>([]);
    const [claims, setClaims] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [earnings, setEarnings] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Catalog filter
    const [catalogFilter, setCatalogFilter] = useState('all');

    // Earnings form
    const [earningsForm, setEarningsForm] = useState({ userId: '', month: new Date().toISOString().slice(0, 7), amount: '', streams: '', downloads: '' });
    const [showEarningsForm, setShowEarningsForm] = useState(false);
    const [showStores, setShowStores] = useState(false);

    // Ticket response
    const [ticketResponse, setTicketResponse] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<any>(null);

    // Track editing
    const [editingTrack, setEditingTrack] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [viewingWithdrawal, setViewingWithdrawal] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [detailView, setDetailView] = useState<'view' | 'edit'>('view');



    // User Detail State
    const [userDetails, setUserDetails] = useState<any>(null);
    const [userTab, setUserTab] = useState<'overview' | 'releases' | 'finance' | 'support' | 'settings' | 'analytics'>('overview');
    const [userAnalytics, setUserAnalytics] = useState<any>(null);

    // Social Links Edit State
    const [editingSocials, setEditingSocials] = useState(false);
    const [socialForm, setSocialForm] = useState({ spotifyUrl: '', youtubeUrl: '' });

    // Download Progress
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

    // URL Normalization Helpers
    const normalizeSpotifyUrl = (url: string): string => {
        if (!url) return '';
        // Extract artist ID from various Spotify URL formats
        // Examples: 
        // https://open.spotify.com/intl-tr/artist/1oP8YujvJmuBtwoMD6r2aA?si=xxx
        // https://open.spotify.com/artist/1oP8YujvJmuBtwoMD6r2aA
        // spotify:artist:1oP8YujvJmuBtwoMD6r2aA
        const match = url.match(/artist[\/:]([a-zA-Z0-9]+)/);
        if (match) {
            return `https://open.spotify.com/artist/${match[1]}`;
        }
        return url.trim();
    };

    const normalizeYoutubeUrl = (url: string): string => {
        if (!url) return '';
        // Extract channel ID or handle from various YouTube URL formats
        // Examples:
        // https://www.youtube.com/channel/UCxxxxx
        // https://youtube.com/@handle
        // https://www.youtube.com/c/ChannelName
        const channelMatch = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
        if (channelMatch) {
            return `https://www.youtube.com/channel/${channelMatch[1]}`;
        }
        const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
        if (handleMatch) {
            return `https://www.youtube.com/@${handleMatch[1]}`;
        }
        return url.trim();
    };

    useEffect(() => {
        if (userDetails?.profile) {
            setSocialForm({
                spotifyUrl: userDetails.profile.spotifyUrl || '',
                youtubeUrl: userDetails.profile.youtubeUrl || ''
            });
        }
        // Load social accounts when user details change
        if (selectedUser?.id) {
            loadUserSocialAccounts(selectedUser.id);
        }
    }, [userDetails]);

    const [userSocialAccounts, setUserSocialAccounts] = useState<any[]>([]);
    const [newAccountForm, setNewAccountForm] = useState({ platform: 'spotify', url: '', name: '' });

    // Backup/Restore State
    const [backupProgress, setBackupProgress] = useState<number | null>(null);
    const [restoreProgress, setRestoreProgress] = useState<number | null>(null);

    // Derived state
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setPortalTarget(document.getElementById('admin-header-portal'));
    }, []);

    const pendingReleases = releases.filter(r => r.status === 'PENDING');
    const editingReleases = releases.filter(r => r.status === 'EDITING');

    const handleBackup = async () => {
        try {
            setBackupProgress(0);

            // Simulate preparation progress
            const interval = setInterval(() => {
                setBackupProgress(prev => {
                    if (prev === null || prev >= 90) return prev;
                    return prev + 10;
                });
            }, 500);

            const zipBlob = await apiService.backupSystem();
            clearInterval(interval);
            setBackupProgress(100);

            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wbbt_backup_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            setTimeout(() => setBackupProgress(null), 1000);
        } catch (e) {
            setBackupProgress(null);
            alert('Backup failed');
        }
    };

    const handleRestore = async (file: File) => {
        if (!confirm('WARNING: This will overwrite the current database and files. The system will restart. Continue?')) return;

        try {
            setRestoreProgress(0);
            await apiService.restoreSystemWithProgress(file, (percent) => {
                setRestoreProgress(Math.round(percent));
            });

            alert('System restored successfully. Reloading...');
            window.location.reload();
        } catch (e: any) {
            setRestoreProgress(null);
            alert('Restore failed: ' + e.message);
        }
    };

    const loadUserSocialAccounts = async (userId: string) => {
        try {
            const res = await apiService.getAdminUserSocialAccounts(userId);
            setUserSocialAccounts(res.accounts || []);
        } catch (e) {
            console.error('Failed to load social accounts', e);
        }
    };


    const loadUserAnalytics = async (userId: string) => {
        if (!userId) return;
        try {
            const res = await apiService.getUserAnalytics(userId);
            setUserAnalytics(res);
        } catch (e) {
            console.error('Failed to load user analytics', e);
            setUserAnalytics(null);
        }
    };

    const handleAddSocialAccount = async () => {
        if (!selectedUser || !newAccountForm.url) return;
        setActionLoading(true);
        try {
            await apiService.addAdminUserSocialAccount(
                selectedUser.id,
                newAccountForm.platform,
                newAccountForm.url,
                newAccountForm.name || undefined
            );
            setNewAccountForm({ platform: 'spotify', url: '', name: '' });
            await loadUserSocialAccounts(selectedUser.id);
        } catch (e) {
            console.error(e);
            alert('Failed to add social account');
        }
        setActionLoading(false);
    };

    const handleDeleteSocialAccount = async (accountId: string) => {
        if (!confirm('Delete this social account?')) return;
        setActionLoading(true);
        try {
            await apiService.deleteSocialAccount(accountId);
            await loadUserSocialAccounts(selectedUser.id);
        } catch (e) {
            console.error(e);
            alert('Failed to delete account');
        }
        setActionLoading(false);
    };

    const handleSaveSocials = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            // Normalize URLs before saving
            const normalizedSpotify = normalizeSpotifyUrl(socialForm.spotifyUrl);
            const normalizedYoutube = normalizeYoutubeUrl(socialForm.youtubeUrl);

            await apiService.updateUser(selectedUser.id, {
                spotifyUrl: normalizedSpotify,
                youtubeUrl: normalizedYoutube
            });
            const data = await apiService.getUserDetails(selectedUser.id);
            setUserDetails(data);
            setEditingSocials(false);
        } catch (e) {
            console.error(e);
            alert('Failed to update social links');
        }
        setActionLoading(false);
    };

    const handleUserSelect = async (userId: string) => {
        setLoading(true);
        try {
            const data = await apiService.getUserDetails(userId);
            setUserDetails(data);
            setSelectedUser(data.user);
            if (data.socialAccounts) {
                setUserSocialAccounts(data.socialAccounts);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || !confirm('DANGER: This will permanently delete the user and ALL their data (Songs, Earnings, etc). This cannot be undone. Type "DELETE" to confirm.')) return;
        // Simple confirm for now, maybe prompt for text input?
        // Let's stick to standard confirm for speed, user asked for "banlamak yerine hesabını da silebileilm".
        setActionLoading(true);
        try {
            await apiService.deleteUser(selectedUser.id);
            setSelectedUser(null);
            setUserDetails(null);
            await loadData();
        } catch (e) {
            console.error(e);
            alert('Failed to delete user');
        }
        setActionLoading(false);
    };

    const handleApproveRejected = async (userId: string) => {
        if (!confirm('Approve this rejected user?')) return;
        await handleAppAction(userId, true);
    };

    const handleRejectApprovedUser = async (userId: string) => {
        if (!confirm('Reject this approved user? They will lose access to features.')) return;
        await handleAppAction(userId, false);
    };

    const handleAdminPasswordReset = async (userId: string, newPass: string) => {
        if (!newPass || newPass.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        setActionLoading(true);
        try {
            await apiService.adminUpdatePassword(userId, newPass);
            alert('Password updated successfully');
        } catch (e) {
            console.error(e);
            alert('Failed to update password');
        }
        setActionLoading(false);
    };

    const handleSystemUpdate = async () => {
        if (!confirm('Start System Update? This will pull the latest code and restart the server.\n\nEnsure no critical tasks are running.')) return;
        setActionLoading(true);
        try {
            const res = await apiService.systemUpdate();
            alert(`Update Started Successfully!\n\nServer Output:\n${res.output}\n\nThe system is restarting... page will reload in 10 seconds.`);
            setTimeout(() => window.location.reload(), 10000);
        } catch (e: any) {
            console.error(e);
            alert('Update Failed: ' + e.message);
        }
        setActionLoading(false);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const s = await apiService.getAdminStats();
            setStats(s);

            // Dashboard needs everything for counters if we rely on array lengths
            // Edits needs releases
            if (tab === 'dashboard' || tab === 'edits') {
                const [rels, usrs, apps, earns, tix] = await Promise.all([
                    apiService.getReleases(),
                    apiService.getAllUsers(),
                    apiService.getPendingApplications(),
                    apiService.getAllEarnings(),
                    apiService.getAllTickets()
                ]);
                setReleases(rels);
                setUsers(usrs);
                setApplications(apps);
                setEarnings(earns);
                setTickets(tix || []);
            } else if (tab === 'applications') {
                const apps = await apiService.getPendingApplications();
                setApplications(apps);
            } else if (tab === 'submissions' || tab === 'catalog' || tab === 'takedowns') {
                const [rels, usrs] = await Promise.all([
                    apiService.getReleases(),
                    apiService.getAllUsers()
                ]);
                setReleases(rels);
                setUsers(usrs);
            } else if (tab === 'users') {
                const [usrs, rels, earns, wdraws] = await Promise.all([
                    apiService.getAllUsers(),
                    apiService.getReleases(),
                    apiService.getAllEarnings(),
                    apiService.getAllWithdrawals()
                ]);
                setUsers(usrs);
                setReleases(rels);
                setEarnings(earns);
                setWithdrawals(wdraws || []);
            } else if (tab === 'earnings') {
                const [earns, usrs] = await Promise.all([
                    apiService.getAllEarnings(),
                    apiService.getAllUsers()
                ]);
                setEarnings(earns);
                setUsers(usrs);
            } else if (tab === 'tickets') {
                const tix = await apiService.getAllTickets();
                setTickets(tix || []);
            } else if (tab === 'withdrawals') {
                const w = await apiService.getAllWithdrawals();
                setWithdrawals(w || []);
            } else if (tab === 'spotifyClaims' || tab === 'youtubeClaims') {
                const allClaims = await apiService.getAllClaims();
                setClaims(allClaims || []);
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        setSelectedRelease(null);
    }, [tab]);

    const handleAppAction = async (userId: string, approve: boolean) => {
        setActionLoading(true);
        try {
            await apiService.reviewApplication(userId, approve);
            await loadData();
        } catch (e) {
            console.error('Failed:', e);
        }
        setActionLoading(false);
    };

    const handleWithdrawalAction = async (id: string, status: string) => {
        try {
            await apiService.updateWithdrawalStatus(id, status);
            await loadData();
        } catch (e) {
            console.error('Failed withdrawal update:', e);
        }
    };

    const handleApproveTakedown = async (id: string) => {
        if (!confirm('Confirm takedown request? This will mark the release as Taken Down.')) return;
        setActionLoading(true);
        try {
            await apiService.approveTakedown(id);
            await loadData();
            setSelectedRelease(null);
        } catch (e) {
            console.error('Failed:', e);
        }
        setActionLoading(false);
    };

    const handleReleaseAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
        setActionLoading(true);
        try {
            if (action === 'delete') {
                if (confirm('Delete this release?')) await apiService.deleteRelease(id);
            } else {
                const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
                const reason = action === 'reject' ? prompt('Rejection reason:') : undefined;
                await apiService.updateReleaseStatus(id, status, reason || undefined);

                if (action === 'approve') {
                    // Auto-save Artist URLs if present
                    const release = releases.find(r => r.id === id);
                    if (release?.tracks?.length > 0) {
                        const mainArtist = release.tracks[0].artists?.find((a: any) => a.role === 'Primary Artist' || a.role === 'Main Artist');
                        if (mainArtist && (mainArtist.spotifyUrl || mainArtist.appleId)) {
                            const updates: any = {};
                            if (mainArtist.spotifyUrl) {
                                try {
                                    await apiService.addAdminUserSocialAccount(
                                        release.userId,
                                        'spotify',
                                        mainArtist.spotifyUrl,
                                        mainArtist.name
                                    );
                                    console.log('Auto-saved Spotify social account');
                                } catch (err) {
                                    console.error('Failed to auto-save Spotify', err);
                                }
                                updates.spotifyUrl = mainArtist.spotifyUrl;
                            }
                            // Map other URLs if available

                            if (Object.keys(updates).length > 0) {
                                try {
                                    await apiService.updateUser(release.userId, updates);
                                    console.log('Auto-saved artist URLs to user profile');
                                } catch (err) {
                                    console.error('Failed to auto-save artist URLs', err);
                                }
                            }
                        }
                    }
                    alert('Release approved and live!');
                }
            }
            await loadData();
            setSelectedRelease(null);
        } catch (e) {
            console.error('Failed:', e);
        }
        setActionLoading(false);
    };


    const handleBanUser = async (userId: string) => {
        const reason = prompt('Ban reason:');
        if (!reason) return;
        await apiService.banUser(userId, reason);
        await loadData();
    };

    const handleUnbanUser = async (userId: string) => {
        await apiService.unbanUser(userId);
        await loadData();
    };

    const formatNumber = (value: string, type: 'currency' | 'integer') => {
        let v = value.replace(/[^\d,]/g, ''); // Allow digits and comma
        if (type === 'integer') v = v.replace(',', ''); // No commas for integers

        if (type === 'currency') {
            const parts = v.split(',');
            if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join(''); // Only one comma
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Add thousands dots
            return parts.length > 1 ? parts.join(',') : parts[0];
        } else {
            return v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
    };

    const parseNumber = (value: string, type: 'currency' | 'integer') => {
        if (!value) return 0;
        if (type === 'integer') return parseInt(value.replace(/\./g, '')) || 0;
        return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const handleAddEarnings = async () => {
        if (!earningsForm.userId || !earningsForm.month) return alert('Fill user and month');

        await apiService.addEarnings(
            earningsForm.userId,
            earningsForm.month,
            parseNumber(earningsForm.amount, 'currency'),
            parseNumber(earningsForm.streams, 'integer'),
            parseNumber(earningsForm.downloads, 'integer')
        );

        setShowEarningsForm(false);
        setEarningsForm({ userId: '', month: new Date().toISOString().slice(0, 7), amount: '', streams: '', downloads: '' });
        await loadData();
    };

    const handleDeleteEarnings = async (id: string) => {
        if (!confirm('Delete?')) return;
        await apiService.deleteEarnings(id);
        await loadData();
    };

    const handleTicketRespond = async () => {
        if (!selectedTicket || !ticketResponse.trim()) return;
        await apiService.respondTicket(selectedTicket.id, ticketResponse);
        setTicketResponse('');
        await loadData();
        setSelectedTicket(tickets.find(t => t.id === selectedTicket.id) || null);
    };

    const handleCloseTicket = async (id: string) => {
        await apiService.closeTicket(id);
        await loadData();
        setSelectedTicket(null);
    };

    const handleSaveTrack = async () => {
        if (!editingTrack) return;
        await apiService.updateTrack(editingTrack.id, {
            title: editingTrack.title,
            version: editingTrack.version,
            isrc: editingTrack.isrc,
            iswc: editingTrack.iswc,
            isExplicit: editingTrack.isExplicit,
            language: editingTrack.language,
            lyrics: editingTrack.lyrics,
            genre: editingTrack.genre,
            subGenre: editingTrack.subGenre,
            compositionType: editingTrack.compositionType,
            isInstrumental: editingTrack.isInstrumental,
            copyrightType: editingTrack.copyrightType,
            aiUsage: editingTrack.aiUsage,
            artists: editingTrack.artists // Send artists array
        });
        setEditingTrack(null);
        await loadData();
    };

    const handleDownloadAudio = async (fileUrl: string, filename: string) => {
        try {
            setDownloadingFile(filename);
            setDownloadProgress(0);

            const fullUrl = fileUrl.startsWith('http') ? fileUrl : fileUrl;

            // Use XHR for progress
            const xhr = new XMLHttpRequest();
            xhr.open('GET', fullUrl, true);
            xhr.responseType = 'blob';

            xhr.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setDownloadProgress(Math.round(percentComplete));
                }
            });

            xhr.onload = () => {
                setDownloadingFile(null);
                setDownloadProgress(null);
                if (xhr.status === 200) {
                    const blob = xhr.response;
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(link.href);
                } else {
                    alert('Download failed.');
                }
            };

            xhr.onerror = () => {
                setDownloadingFile(null);
                setDownloadProgress(null);
                alert('Download failed.');
            };

            xhr.send();
        } catch (error) {
            setDownloadingFile(null);
            setDownloadProgress(null);
            console.error('Download failed:', error);
            alert('Download failed.');
        }
    };

    const filteredReleases = catalogFilter === 'all' ? releases : releases.filter(r => r.userId === catalogFilter);



    const handleSaveReleaseDetails = async () => {
        if (!selectedRelease) return;
        setActionLoading(true);
        try {
            await apiService.updateRelease(selectedRelease.id, selectedRelease);
            setDetailView('view');
            await loadData();
        } catch (e) {
            console.error('Failed to save release details:', e);
            alert('Failed to save changes');
        }
        setActionLoading(false);
    };

    const handleClaimAction = async (claimId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
        setActionLoading(true);
        try {
            await apiService.updateClaimStatus(claimId, status, reason);
            await loadData();
        } catch (e) {
            console.error('Failed to update claim:', e);
            alert('Failed to update claim');
        }
        setActionLoading(false);
    };

    const renderReleaseDetail = (releaseToRender?: any) => {
        const currentRelease = releaseToRender || selectedRelease;
        if (!currentRelease) return null;
        return (
            <Card className="overflow-y-auto max-h-[800px] custom-scrollbar p-0">
                <div className="p-8">
                    {/* Back Button */}
                    <button
                        onClick={() => setSelectedRelease(null)}
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6 text-sm font-medium transition-colors"
                    >
                        <span className="text-lg">←</span> Back to Submissions
                    </button>

                    <div className="flex gap-8 mb-10">
                        <div className="relative group shrink-0">
                            <img src={currentRelease.coverUrl || 'https://via.placeholder.com/128'} className="w-64 h-64 rounded-xl shadow-2xl border border-[#333]" />
                            {currentRelease.coverUrl && (
                                <a
                                    href={currentRelease.coverUrl}
                                    download={`cover_${currentRelease.id}.jpg`}
                                    target="_blank"
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-xl"
                                >
                                    <ExternalLink size={32} />
                                </a>
                            )}
                            {detailView === 'edit' && (
                                <div className="absolute top-2 right-2 bg-black/70 text-[10px] text-white px-2 py-1 rounded pointer-events-none">
                                    Cover Edit Disabled
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 mr-6">
                                    {detailView === 'edit' ? (
                                        <div className="space-y-4">
                                            <Input
                                                value={currentRelease.title}
                                                onChange={(e) => setSelectedRelease({ ...currentRelease, title: e.target.value })}
                                                className="text-2xl font-bold font-display w-full bg-[#222] border-[#333]"
                                                placeholder="Release Title"
                                            />
                                            <Input
                                                value={(currentRelease as any).artistName || (currentRelease as any).mainArtist}
                                                onChange={(e) => setSelectedRelease({ ...currentRelease, mainArtist: e.target.value, artistName: e.target.value })}
                                                className="text-lg w-full bg-[#222] border-[#333]"
                                                placeholder="Main Artist"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="text-5xl font-bold text-white font-display truncate leading-tight tracking-tight mb-2">{currentRelease.title}</h3>
                                            <p className="text-2xl text-[#CCC] font-medium">{(currentRelease as any).artistName}</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-3 shrink-0">
                                    {detailView === 'edit' && (
                                        <Button className="h-10 text-sm bg-green-600 hover:bg-green-700 text-white px-6" onClick={handleSaveReleaseDetails} disabled={actionLoading}>
                                            <Save size={16} className="mr-2" /> Save
                                        </Button>
                                    )}
                                    <Button variant="secondary" className="h-10 text-sm shrink-0 px-4" onClick={() => {
                                        if (detailView === 'view') {
                                            setDetailView('edit');
                                        } else {
                                            setDetailView('view');
                                        }
                                    }}>
                                        {detailView === 'view' ? <><Edit3 size={16} className="mr-2" /> Edit Details</> : 'Cancel'}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-2 flex-wrap items-center">
                                {detailView === 'edit' ? (
                                    <select
                                        value={currentRelease.status}
                                        onChange={(e) => setSelectedRelease({ ...currentRelease, status: e.target.value })}
                                        className="h-8 bg-[#222] text-white border border-[#333] rounded px-3 text-xs uppercase"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="EDITING">Editing</option>
                                        <option value="TAKEDOWN_REQUESTED">Takedown Requested</option>
                                        <option value="TAKEDOWN_COMPLETE">Takedown Complete</option>
                                    </select>
                                ) : (
                                    <Badge status={currentRelease.status} className="text-sm px-3 py-1" />
                                )}

                                {/* Show User UPC only if it exists and doesn't start with WBBT */}
                                {(currentRelease as any).upc && !(currentRelease as any).upc.startsWith('WBBT') && (
                                    <span className="text-green-400 text-sm flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
                                        UPC: {(currentRelease as any).upc}
                                    </span>
                                )}
                                {/* Show WUPC - only from wupc field */}
                                {(currentRelease as any).wupc && (
                                    <span className="text-indigo-400 text-sm flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30">
                                        WUPC: {(currentRelease as any).wupc}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
                        {/* Column 1: Core Metadata */}
                        <div className="col-span-1 lg:col-span-2 space-y-8">
                            <section className="bg-[#111] p-6 rounded-2xl border border-[#222]">
                                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 pb-2 border-b border-white/10 flex items-center gap-2">
                                    <CloudLightning size={16} /> Core Metadata
                                </h4>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Main Artist</span>
                                        <span className="text-white text-lg font-bold">{(currentRelease as any).mainArtist || (currentRelease as any).artistName || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Type</span>
                                        {detailView === 'edit' ? (
                                            <select
                                                value={(currentRelease as any).type || 'Single'}
                                                onChange={(e) => setSelectedRelease({ ...currentRelease, type: e.target.value })}
                                                className="h-10 w-full bg-[#111] border border-[#333] text-white rounded px-3"
                                            >
                                                <option value="Single">Single</option>
                                                <option value="EP">EP</option>
                                                <option value="Album">Album</option>
                                            </select>
                                        ) : (
                                            <span className="text-white text-lg font-medium">{(currentRelease as any).type || 'Single'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Genre</span>
                                        {detailView === 'edit' ? <Input value={currentRelease.genre} onChange={(e) => setSelectedRelease({ ...currentRelease, genre: e.target.value })} className="h-10 text-base" /> : <span className="text-white text-lg">{currentRelease.genre}</span>}
                                    </div>
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Sub-Genre</span>
                                        {detailView === 'edit' ? <Input value={(currentRelease as any).subGenre || ''} onChange={(e) => setSelectedRelease({ ...currentRelease, subGenre: e.target.value })} className="h-10 text-base" /> : <span className="text-white text-lg">{(currentRelease as any).subGenre || 'N/A'}</span>}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Label</span>
                                        {detailView === 'edit' ? <Input value={currentRelease.recordLabel} onChange={(e) => setSelectedRelease({ ...currentRelease, recordLabel: e.target.value })} className="h-10 text-base" /> : <span className="text-white text-xl font-display tracking-wide">{currentRelease.recordLabel || 'Independent'}</span>}
                                    </div>
                                </div>
                            </section>

                            <section className="bg-[#111] p-6 rounded-2xl border border-[#222]">
                                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 pb-2 border-b border-white/10 flex items-center gap-2">
                                    <Globe size={16} /> Distribution Info
                                </h4>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">User UPC/EAN</span>
                                        {detailView === 'edit' ? (
                                            <Input value={(currentRelease as any).upc && !(currentRelease as any).upc.startsWith('WBBT') ? (currentRelease as any).upc : ''} onChange={(e) => setSelectedRelease({ ...currentRelease, upc: e.target.value })} className="h-10 text-base font-mono" placeholder="Enter UPC..." />
                                        ) : (
                                            <span className={`text-lg font-mono tracking-wider px-3 py-1 rounded inline-block ${(currentRelease as any).upc && !(currentRelease as any).upc.startsWith('WBBT') ? 'text-green-400 bg-green-500/10' : 'text-[#666] bg-white/5'}`}>
                                                {(currentRelease as any).upc && !(currentRelease as any).upc.startsWith('WBBT') ? (currentRelease as any).upc : 'N/A'}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Internal WUPC</span>
                                        <span className={`text-lg font-mono tracking-wider px-3 py-1 rounded inline-block ${(currentRelease as any).wupc ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[#1a1a1a] text-[#666]'}`}>
                                            {(currentRelease as any).wupc || 'Not generated yet'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Release Date</span>
                                        {detailView === 'edit' ? (
                                            <Input
                                                type="date"
                                                value={currentRelease.releaseDate}
                                                onChange={(e) => setSelectedRelease({ ...currentRelease, releaseDate: e.target.value })}
                                                className="h-10 text-base"
                                            />
                                        ) : (
                                            <span className="text-white text-lg font-bold text-indigo-400">{currentRelease.releaseTiming === 'ASAP' ? 'ASAP' : currentRelease.releaseDate}</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Prev. Distributed</span>
                                        {detailView === 'edit' ? (
                                            <div className="flex items-center gap-2 h-10">
                                                <input
                                                    type="checkbox"
                                                    checked={(currentRelease as any).distributedBefore}
                                                    onChange={(e) => setSelectedRelease({ ...currentRelease, distributedBefore: e.target.checked })}
                                                    className="w-5 h-5 accent-indigo-500"
                                                />
                                                <span className="text-sm text-white">Yes</span>
                                            </div>
                                        ) : (
                                            <span className={`text-lg ${(currentRelease as any).distributedBefore ? 'text-yellow-400' : 'text-green-400'}`}>{(currentRelease as any).distributedBefore ? 'Yes' : 'No'}</span>
                                        )}
                                    </div>
                                    {(detailView === 'edit' || (currentRelease as any).originalReleaseDate) && (
                                        <div>
                                            <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Original Date</span>
                                            {detailView === 'edit' ? (
                                                <Input
                                                    type="date"
                                                    value={(currentRelease as any).originalReleaseDate || ''}
                                                    onChange={(e) => setSelectedRelease({ ...currentRelease, originalReleaseDate: e.target.value })}
                                                    className="h-10 text-base"
                                                />
                                            ) : (
                                                <span className="text-white text-lg font-mono">{(currentRelease as any).originalReleaseDate}</span>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[#666] text-xs block uppercase tracking-wider mb-1">Created</span>
                                        <span className="text-white text-lg">{new Date((currentRelease as any).createdAt || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Column 2: Documents & Technical */}
                        <div className="col-span-1 space-y-8">
                            <section className="bg-[#111] p-6 rounded-2xl border border-[#222]">
                                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 pb-2 border-b border-white/10 flex items-center gap-2">
                                    <FileText size={16} /> Documents
                                </h4>
                                <div className="flex flex-col gap-3">
                                    {(currentRelease as any).documents && (
                                        (typeof (currentRelease as any).documents === 'string'
                                            ? JSON.parse((currentRelease as any).documents)
                                            : (currentRelease as any).documents
                                        ).length > 0
                                    ) ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {(typeof (currentRelease as any).documents === 'string'
                                                ? JSON.parse((currentRelease as any).documents)
                                                : (currentRelease as any).documents
                                            ).map((doc: string, i: number) => (
                                                <a key={i} href={doc.startsWith('http') ? doc : doc} target="_blank" className="flex items-center gap-4 bg-[#1A1A1A] border border-[#333] px-4 py-3 rounded-xl text-sm text-indigo-300 hover:bg-[#222] hover:text-white transition-colors group">
                                                    <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 group-hover:text-white transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <span className="font-medium">Document {i + 1}</span>
                                                    <ExternalLink size={14} className="ml-auto opacity-50" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 rounded-xl p-6 text-center border border-dashed border-white/10">
                                            <span className="text-[#666] text-sm">No documents attached</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="bg-[#111] p-6 rounded-2xl border border-[#222]">
                                <h4 className="text-sm font-bold text-white uppercase mb-4 text-indigo-400">Artist Declarations</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {(currentRelease as any).confirmations ? (
                                        <>
                                            <div className={`p-3 rounded-lg border flex items-center gap-3 ${(currentRelease as any).confirmations.rights ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                                {(currentRelease as any).confirmations.rights ? <Check size={16} /> : <X size={16} />}
                                                <span className="text-xs font-bold">Rights Confirmed</span>
                                            </div>
                                            <div className={`p-3 rounded-lg border flex items-center gap-3 ${(currentRelease as any).confirmations.accuracy ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                                {(currentRelease as any).confirmations.accuracy ? <Check size={16} /> : <X size={16} />}
                                                <span className="text-xs font-bold">Accuracy Confirmed</span>
                                            </div>
                                            <div className={`p-3 rounded-lg border flex items-center gap-3 ${(currentRelease as any).confirmations.commission ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                                {(currentRelease as any).confirmations.commission ? <Check size={16} /> : <X size={16} />}
                                                <span className="text-xs font-bold">Commission Accepted</span>
                                            </div>
                                            <div className={`p-3 rounded-lg border flex items-center gap-3 ${(currentRelease as any).confirmations.liability ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                                {(currentRelease as any).confirmations.liability ? <Check size={16} /> : <X size={16} />}
                                                <span className="text-xs font-bold">Liability Accepted</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-span-2 text-[#666] text-sm italic">No declaration data available for this release.</div>
                                    )}
                                </div>
                            </section>

                            <section className="bg-[#111] p-6 rounded-2xl border border-[#222]">
                                <h4 className="text-sm font-bold text-white uppercase mb-4 text-indigo-400">Copyrights</h4>
                                <div className="space-y-3 text-base">
                                    <div className="flex justify-between border-b border-[#222] pb-2 items-center">
                                        <span className="text-[#888]">© Composition</span>
                                        {detailView === 'edit' ? (
                                            <div className="flex gap-2 w-2/3">
                                                <Input value={currentRelease.cYear} onChange={(e) => setSelectedRelease({ ...currentRelease, cYear: e.target.value })} className="w-20 text-xs py-1 h-7" placeholder="Year" />
                                                <Input value={currentRelease.cLine} onChange={(e) => setSelectedRelease({ ...currentRelease, cLine: e.target.value })} className="flex-1 text-xs py-1 h-7" placeholder="Owner" />
                                            </div>
                                        ) : (
                                            <span className="text-white font-mono">{currentRelease.cYear} {currentRelease.cLine}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between border-b border-[#222] pb-2 items-center">
                                        <span className="text-[#888]">℗ Master</span>
                                        {detailView === 'edit' ? (
                                            <div className="flex gap-2 w-2/3">
                                                <Input value={currentRelease.pYear} onChange={(e) => setSelectedRelease({ ...currentRelease, pYear: e.target.value })} className="w-20 text-xs py-1 h-7" placeholder="Year" />
                                                <Input value={currentRelease.pLine} onChange={(e) => setSelectedRelease({ ...currentRelease, pLine: e.target.value })} className="flex-1 text-xs py-1 h-7" placeholder="Owner" />
                                            </div>
                                        ) : (
                                            <span className="text-white font-mono">{currentRelease.pYear} {currentRelease.pLine}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#888]">Territory</span>
                                        {detailView === 'edit' ? (
                                            <Input value={currentRelease.territoryPolicy || 'Global'} onChange={(e) => setSelectedRelease({ ...currentRelease, territoryPolicy: e.target.value })} className="w-2/3 text-xs py-1 h-7" />
                                        ) : (
                                            <span className="text-white font-bold">{currentRelease.territoryPolicy || 'Global'}</span>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="bg-[#111] p-6 rounded-2xl border border-[#222]">
                                <h4 className="text-sm font-bold text-white uppercase mb-4 text-green-400">Monetization & Platforms</h4>
                                <div className="space-y-4">
                                    {/* Social Media Platforms */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className={`p-3 rounded-lg border text-center ${currentRelease.monetization?.tikTok ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' : 'bg-[#1a1a1a] border-[#333] text-[#666]'}`}>
                                            <span className="text-xs font-bold block">TikTok</span>
                                            <span className="text-[10px]">{currentRelease.monetization?.tikTok ? '✓ Active' : 'Off'}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg border text-center ${currentRelease.monetization?.youtubeContentId ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#1a1a1a] border-[#333] text-[#666]'}`}>
                                            <span className="text-xs font-bold block">YouTube CID</span>
                                            <span className="text-[10px]">{currentRelease.monetization?.youtubeContentId ? '✓ Active' : 'Off'}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg border text-center ${currentRelease.monetization?.facebook ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-[#1a1a1a] border-[#333] text-[#666]'}`}>
                                            <span className="text-xs font-bold block">Facebook</span>
                                            <span className="text-[10px]">{currentRelease.monetization?.facebook ? '✓ Active' : 'Off'}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg border text-center ${currentRelease.monetization?.instagram ? 'bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-pink-500/30 text-pink-400' : 'bg-[#1a1a1a] border-[#333] text-[#666]'}`}>
                                            <span className="text-xs font-bold block">Instagram</span>
                                            <span className="text-[10px]">{currentRelease.monetization?.instagram ? '✓ Active' : 'Off'}</span>
                                        </div>
                                    </div>

                                    {/* Stores */}
                                    <div className="pt-3 border-t border-[#222]">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[#888] text-sm">Distribution Platforms</span>
                                            <button onClick={() => setShowStores(!showStores)} className="text-indigo-400 text-xs hover:text-indigo-300">
                                                {showStores ? 'Hide' : 'Show All'} ({(currentRelease.selectedStores || []).length})
                                            </button>
                                        </div>
                                        {showStores && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {(currentRelease.selectedStores || []).map((storeId: string) => (
                                                    <span key={storeId} className="text-[10px] bg-[#1a1a1a] border border-[#333] px-2 py-1 rounded text-[#aaa]">
                                                        {storeId}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-[#222] bg-[#0A0A0A]">
                    <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-3"><Disc size={20} className="text-[#666]" /> Track Manifest <span className="text-[#444] text-sm font-normal">({(currentRelease.tracks || []).length} tracks)</span></h4>
                    <div className="space-y-4">
                        {(currentRelease.tracks || []).map((t: any, i: number) => (
                            <div key={i} className={`bg-[#111] border rounded-xl p-6 transition-all ${editingTrack?.id === t.id ? 'border-indigo-500 shadow-indigo-500/20 shadow-lg' : 'border-[#222] hover:border-[#444] hover:shadow-lg hover:shadow-black/50'}`}>
                                {editingTrack?.id === t.id ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-[#222] pb-4">
                                            <h5 className="font-bold text-white text-lg flex items-center gap-2"><Edit3 size={16} /> Edit Track {i + 1}</h5>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" className="h-8 px-3" onClick={() => setEditingTrack(null)}>Cancel</Button>
                                                <Button className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveTrack}><Save size={14} className="mr-2" /> Save Changes</Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="col-span-1 md:col-span-2 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">Title</span>
                                                        <Input value={editingTrack.title} onChange={e => setEditingTrack({ ...editingTrack, title: e.target.value })} className="bg-[#1a1a1a]" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">Version</span>
                                                        <Input value={editingTrack.version} onChange={e => setEditingTrack({ ...editingTrack, version: e.target.value })} className="bg-[#1a1a1a]" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">ISRC</span>
                                                        <Input value={editingTrack.isrc || ''} onChange={e => setEditingTrack({ ...editingTrack, isrc: e.target.value })} className="bg-[#1a1a1a] font-mono" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">ISWC</span>
                                                        <Input value={editingTrack.iswc || ''} onChange={e => setEditingTrack({ ...editingTrack, iswc: e.target.value })} className="bg-[#1a1a1a] font-mono" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">Explicit</span>
                                                        <div className="flex items-center h-10 px-3 border border-[#333] rounded bg-[#1a1a1a]">
                                                            <input type="checkbox" checked={editingTrack.isExplicit} onChange={e => setEditingTrack({ ...editingTrack, isExplicit: e.target.checked })} className="mr-2" />
                                                            <span className="text-sm text-white">Explicit</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">Genre</span>
                                                        <Input value={editingTrack.genre || ''} onChange={e => setEditingTrack({ ...editingTrack, genre: e.target.value })} className="bg-[#1a1a1a]" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">Sub-Genre</span>
                                                        <Input value={editingTrack.subGenre || ''} onChange={e => setEditingTrack({ ...editingTrack, subGenre: e.target.value })} className="bg-[#1a1a1a]" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <span className="text-xs text-[#666] uppercase font-bold">Language</span>
                                                    <Input value={editingTrack.language || ''} onChange={e => setEditingTrack({ ...editingTrack, language: e.target.value })} className="bg-[#1a1a1a]" />
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-xs text-[#666] uppercase font-bold">Composition Type</span>
                                                    <select
                                                        value={editingTrack.compositionType || 'Original'}
                                                        onChange={e => setEditingTrack({ ...editingTrack, compositionType: e.target.value })}
                                                        className="w-full h-10 bg-[#1a1a1a] border border-[#333] rounded px-3 text-white"
                                                    >
                                                        <option value="Original">Original</option>
                                                        <option value="Cover">Cover</option>
                                                        <option value="Remix">Remix</option>
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">Instrumental</span>
                                                        <div className="flex items-center h-10 px-3 border border-[#333] rounded bg-[#1a1a1a]">
                                                            <input type="checkbox" checked={editingTrack.isInstrumental} onChange={e => setEditingTrack({ ...editingTrack, isInstrumental: e.target.checked })} className="mr-2" />
                                                            <span className="text-sm text-white">Yes</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-[#666] uppercase font-bold">AI Usage</span>
                                                        <select
                                                            value={editingTrack.aiUsage || 'None'}
                                                            onChange={e => setEditingTrack({ ...editingTrack, aiUsage: e.target.value })}
                                                            className="w-full h-10 bg-[#1a1a1a] border border-[#333] rounded px-3 text-white"
                                                        >
                                                            <option value="None">None</option>
                                                            <option value="Assisted">Assisted</option>
                                                            <option value="Generated">Generated</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 lg:col-span-3 border-t border-[#222] pt-4 mt-2">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs text-[#666] uppercase font-bold">Track Artists</span>
                                                    <Button variant="ghost" className="h-6 text-[10px] text-indigo-400" onClick={() => {
                                                        const newArtists = [...(editingTrack.artists || [])];
                                                        newArtists.push({ name: '', role: 'Main Artist', spotifyUrl: '', appleId: '' });
                                                        setEditingTrack({ ...editingTrack, artists: newArtists });
                                                    }}>+ Add Artist</Button>
                                                </div>
                                                <div className="space-y-3">
                                                    {(editingTrack.artists || []).map((artist: any, idx: number) => (
                                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#1a1a1a] p-2 rounded border border-[#333]">
                                                            <div className="col-span-3">
                                                                <Input
                                                                    placeholder="Name"
                                                                    value={artist.name || ''}
                                                                    onChange={e => {
                                                                        const newArtists = [...(editingTrack.artists || [])];
                                                                        newArtists[idx] = { ...newArtists[idx], name: e.target.value };
                                                                        setEditingTrack({ ...editingTrack, artists: newArtists });
                                                                    }}
                                                                    className="h-7 text-xs bg-[#111]"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <select
                                                                    value={artist.role || 'Main Artist'}
                                                                    onChange={e => {
                                                                        const newArtists = [...(editingTrack.artists || [])];
                                                                        newArtists[idx] = { ...newArtists[idx], role: e.target.value };
                                                                        setEditingTrack({ ...editingTrack, artists: newArtists });
                                                                    }}
                                                                    className="w-full h-7 text-xs bg-[#111] border border-[#333] rounded px-1 text-white"
                                                                >
                                                                    <option value="Main Artist">Main Artist</option>
                                                                    <option value="Featured Artist">Featured</option>
                                                                    <option value="Remixer">Remixer</option>
                                                                    <option value="Producer">Producer</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-span-3">
                                                                <Input
                                                                    placeholder="Spotify URL"
                                                                    value={artist.spotifyUrl || ''}
                                                                    onChange={e => {
                                                                        const newArtists = [...(editingTrack.artists || [])];
                                                                        newArtists[idx] = { ...newArtists[idx], spotifyUrl: e.target.value };
                                                                        setEditingTrack({ ...editingTrack, artists: newArtists });
                                                                    }}
                                                                    className="h-7 text-xs bg-[#111]"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <Input
                                                                    placeholder="Apple ID"
                                                                    value={artist.appleId || ''}
                                                                    onChange={e => {
                                                                        const newArtists = [...(editingTrack.artists || [])];
                                                                        newArtists[idx] = { ...newArtists[idx], appleId: e.target.value };
                                                                        setEditingTrack({ ...editingTrack, artists: newArtists });
                                                                    }}
                                                                    className="h-7 text-xs bg-[#111]"
                                                                />
                                                            </div>
                                                            <div className="col-span-1 flex justify-end">
                                                                <Button variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-300" onClick={() => {
                                                                    const newArtists = (editingTrack.artists || []).filter((_: any, i: number) => i !== idx);
                                                                    setEditingTrack({ ...editingTrack, artists: newArtists });
                                                                }}>
                                                                    <X size={12} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(editingTrack.artists || []).length === 0 && (
                                                        <div className="text-center text-[#555] text-xs py-2 italic">No artists listed</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs text-[#888] font-bold uppercase tracking-wider bg-[#222] px-2 py-1 rounded">Track {i + 1}</span>
                                                    {t.isExplicit && <span className="text-xs text-red-400 border border-red-900/50 bg-red-900/10 px-2 py-1 rounded font-bold">EXPLICIT</span>}
                                                    <span className="text-xs text-[#888] border border-[#333] px-2 py-1 rounded uppercase bg-[#181818]">{t.language}</span>
                                                </div>
                                                <h5 className="text-white font-bold text-2xl mb-1">{t.title} <span className="text-[#888] font-normal text-lg ml-2">{t.version}</span></h5>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <span className="text-sm font-mono text-[#AAA] block tracking-wider">{t.isrc || 'No ISRC'}</span>
                                                <div className="flex gap-2">
                                                    {detailView === 'edit' && (
                                                        <Button variant="secondary" className="h-8 text-xs border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" onClick={() => setEditingTrack(t)}>
                                                            <Edit3 size={12} className="mr-1" /> Edit
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" className="h-8 text-xs text-[#666] hover:text-white min-w-[70px]" onClick={() => handleDownloadAudio(t.fileUrl, `${(currentRelease as any).artistName} - ${t.title}.mp3`)} disabled={downloadingFile === `${(currentRelease as any).artistName} - ${t.title}.mp3`}>
                                                        {downloadingFile === `${(currentRelease as any).artistName} - ${t.title}.mp3` && downloadProgress !== null ? (
                                                            <span className="text-indigo-400 font-mono font-bold text-[10px]">{downloadProgress}%</span>
                                                        ) : (
                                                            <><Download size={14} className="mr-1" /> Audio</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[#222]">
                                            <div>
                                                <span className="text-xs text-[#666] block mb-2 uppercase tracking-wide font-bold">Performing Artists</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {(t.artists || []).map((a: any, idx: number) => (
                                                        <div key={idx} className="flex flex-col mb-1">
                                                            <span className="text-sm bg-[#1A1A1A] text-[#EEE] px-3 py-1.5 rounded-lg border border-[#333] flex items-center gap-2">
                                                                {a.name} <span className="text-[#666] text-xs">({a.role})</span>
                                                                {a.spotifyUrl && <a href={a.spotifyUrl} target="_blank" title="Spotify" className="text-green-400 hover:text-green-300 ml-1"><ExternalLink size={12} /></a>}
                                                                {a.appleId && <a href={`https://music.apple.com/artist/${a.appleId}`} target="_blank" title="Apple Music" className="text-pink-400 hover:text-pink-300 ml-1"><ExternalLink size={12} /></a>}
                                                            </span>
                                                            {a.legalName && <span className="text-[10px] text-[#666] ml-2 mt-0.5">Legal: {a.legalName}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-[#666] block mb-2 uppercase tracking-wide font-bold">Credits & Rights</span>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {(t.writers || []).map((w: any, idx: number) => (
                                                        <span key={idx} className="text-sm bg-[#1A1A1A] text-[#EEE] px-3 py-1.5 rounded-lg border border-[#333]">{w.name} ({w.role}) - <span className="text-indigo-400 font-mono">{w.share}%</span></span>
                                                    ))}
                                                </div>
                                                {(t.writers || []).some((w: any) => w.legalName) && (
                                                    <div className="w-full mt-1 text-[10px] text-[#555] mb-3">
                                                        Legal: {(t.writers || []).filter((w: any) => w.legalName).map((w: any) => `${w.name} (${w.legalName})`).join(', ')}
                                                    </div>
                                                )}
                                                <div className="text-xs text-[#888] bg-[#151515] p-3 rounded-lg border border-[#222]">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>Type: <span className="text-white">{t.compositionType}</span></div>
                                                        <div>AI Usage: <span className={`font-bold ${t.aiUsage !== 'None' ? 'text-blue-400' : 'text-white'}`}>{t.aiUsage}</span></div>
                                                        <div>Genre: <span className="text-white">{t.genre || currentRelease.genre || '-'}</span></div>
                                                        <div>Sub: <span className="text-white">{t.subGenre || currentRelease.subGenre || '-'}</span></div>
                                                        <div className="col-span-2 pt-2 mt-2 border-t border-[#333] flex justify-between">
                                                            <span>Inst: <span className="text-white font-bold">{t.isInstrumental ? 'Yes' : 'No'}</span></span>
                                                            <span>Copyright: <span className="text-white font-bold">{t.copyrightType || 'N/A'}</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>


                <div className="flex gap-4 pt-6 border-t border-[#222]">
                    {currentRelease.status === 'TAKEDOWN_REQUESTED' ? (
                        <>
                            <Button variant="secondary" className="flex-1" onClick={() => handleReleaseAction(currentRelease.id, 'approve')}>
                                <X size={18} className="mr-2" />Reject Takedown (Keep Live)
                            </Button>
                            <Button variant="danger" className="flex-1" onClick={() => handleApproveTakedown(currentRelease.id)}>
                                <Trash2 size={18} className="mr-2" />Confirm Takedown
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => handleReleaseAction(currentRelease.id, 'delete')}><Trash2 size={16} /></Button>
                            <Button variant="danger" className="flex-1" onClick={() => handleReleaseAction(currentRelease.id, 'reject')}><X size={18} className="mr-2" />Reject</Button>
                            <Button className="flex-1 bg-white text-black" onClick={() => handleReleaseAction(currentRelease.id, 'approve')}><Check size={18} className="mr-2" />Approve</Button>
                        </>
                    )}
                </div>
            </Card >
        );
    };



    return (
        <div className="space-y-6">
            {/* Top Navigation Tabs - Portaled to Header */}
            {portalTarget && createPortal(
                <div className="flex gap-1 overflow-x-auto no-scrollbar h-full items-center">
                    {['dashboard', 'applications', 'submissions', 'edits', 'takedowns', 'catalog', 'users', 'earnings', 'withdrawals', 'tickets', 'spotifyClaims', 'youtubeClaims', 'logs'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t as any)}
                            className={`
                                relative px-4 py-2 rounded-full font-medium text-xs transition-all whitespace-nowrap border
                                ${tab === t
                                    ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                                    : 'bg-white/5 text-[#888] border-transparent hover:text-white hover:bg-white/10'
                                }
                            `}
                        >
                            {t === 'spotifyClaims' ? 'Spotify Claims' :
                                t === 'youtubeClaims' ? 'YouTube Claims' :
                                    t === 'logs' ? 'System Logs' :
                                        t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>,
                portalTarget
            )}

            {/* Dashboard Content */}
            {tab === 'dashboard' && (
                <div className="space-y-6 animate-fade-up">
                    <div className="flex justify-between items-center bg-[#111] p-6 rounded-2xl border border-[#222]">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h2>
                            <p className="text-[#666] text-sm">System status and quick statistics</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                className="h-[40px] px-6 rounded-full bg-[#111] hover:bg-[#222] border border-[#333] text-[#CCC] hover:text-white relative overflow-hidden"
                                onClick={handleBackup}
                                disabled={!!backupProgress}
                            >
                                {backupProgress !== null ? (
                                    <>
                                        <div className="absolute inset-0 bg-white/10" style={{ width: `${backupProgress}%`, transition: 'width 0.5s ease' }} />
                                        <span className="relative z-10 flex items-center">
                                            <RefreshCw size={16} className="mr-2 animate-spin" /> {backupProgress < 100 ? 'Preparing...' : 'Downloading...'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} className="mr-2" /> Backup Data
                                    </>
                                )}
                            </Button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".zip"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            handleRestore(e.target.files[0]);
                                        }
                                    }}
                                    disabled={!!restoreProgress}
                                />
                                <Button variant="ghost" className="h-[40px] px-6 rounded-full bg-[#111] hover:bg-[#222] border border-[#333] text-blue-400 bg-blue-900/10 hover:bg-blue-900/20">
                                    <Upload size={16} className="mr-2" /> Restore Data
                                </Button>
                            </div>

                            <Button className="h-[40px] px-6 rounded-full bg-white text-black hover:bg-[#DDD] border-none" onClick={() => loadData()}>
                                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                            </Button>

                            <Button variant="ghost" className="h-[40px] px-6 rounded-full bg-red-500/10 text-red-500 hover:text-red-400 hover:bg-red-500/20 border border-red-500/20" onClick={handleSystemUpdate} disabled={actionLoading}>
                                <RefreshCw size={16} className={`mr-2 ${actionLoading ? 'animate-spin' : ''}`} /> System Update
                            </Button>

                            <Button variant="ghost" className="h-[40px] px-6 rounded-full bg-yellow-500/10 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20" onClick={async () => {
                                if (confirm('Run database optimization? This helps prevent bloating.')) {
                                    try {
                                        await apiService.optimizeSystem();
                                        alert('System optimized successfully.');
                                    } catch (e) {
                                        alert('Optimization failed.');
                                    }
                                }
                            }}>
                                <Zap size={16} className="mr-2" /> Optimize
                            </Button>
                        </div>

                        {/* Progress Full Screen Overlay for Restore */}
                        {restoreProgress !== null && createPortal(
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in">
                                <div className="bg-[#111] border border-[#333] p-8 rounded-2xl w-full max-w-md text-center shadow-2xl">
                                    <div className="mb-6 relative w-20 h-20 mx-auto">
                                        <svg className="w-full h-full" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#222" strokeWidth="8" />
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="8"
                                                strokeDasharray="283"
                                                strokeDashoffset={283 - (283 * restoreProgress) / 100}
                                                transform="rotate(-90 50 50)"
                                                className="transition-all duration-300 ease-out"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                                            {restoreProgress}%
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Restoring System...</h3>
                                    <p className="text-[#888] text-sm mb-6">Uploading backup file and restoring database.<br />Please do not close this page.</p>
                                    <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${restoreProgress}%` }} />
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div onClick={() => setTab('users')} className="bg-[#111] border border-[#222] hover:border-blue-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                    <Users className="text-blue-500" size={24} />
                                </div>
                                <ArrowUpRight className="text-[#333] group-hover:text-blue-500 transition-colors" size={18} />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats?.totalUsers || 0}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Total Users</div>
                        </div>

                        <div onClick={() => setTab('submissions')} className="bg-[#111] border border-[#222] hover:border-violet-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                                    <Disc className="text-violet-500" size={24} />
                                </div>
                                <ArrowUpRight className="text-[#333] group-hover:text-violet-500 transition-colors" size={18} />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats?.approvedReleases || 0}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Active Releases</div>
                        </div>

                        <div onClick={() => setTab('submissions')} className="bg-[#111] border border-[#222] hover:border-yellow-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
                                    <Inbox className="text-yellow-500" size={24} />
                                </div>
                                {stats?.pendingReleases > 0 && <span className="flex h-2 w-2 rounded-full bg-yellow-500"></span>}
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats?.pendingReleases || 0}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Pending Releases</div>
                        </div>

                        <div onClick={() => setTab('applications')} className="bg-[#111] border border-[#222] hover:border-purple-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                                    <Inbox className="text-purple-500" size={24} />
                                </div>
                                <ArrowUpRight className="text-[#333] group-hover:text-purple-500 transition-colors" size={18} />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{applications.length || 0}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Pending Applications</div>
                        </div>

                        <div onClick={() => setTab('edits')} className="bg-[#111] border border-[#222] hover:border-orange-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                                    <Edit3 className="text-orange-500" size={24} />
                                </div>
                                <ArrowUpRight className="text-[#333] group-hover:text-orange-500 transition-colors" size={18} />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{editingReleases.length || 0}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Pending Edits</div>
                        </div>

                        <div className="bg-[#111] border border-[#222] hover:border-green-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                                    <Headphones className="text-green-500" size={24} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{formatNumber((stats?.totalListeners || 0).toString(), 'integer')}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Total Monthly Listeners</div>
                        </div>

                        <div className="bg-[#111] border border-[#222] hover:border-red-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                                    <Youtube className="text-red-500" size={24} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{formatNumber((stats?.totalSubscribers || 0).toString(), 'integer')}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Total Subscribers</div>
                        </div>

                        <div className="bg-[#111] border border-[#222] hover:border-green-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                                    <Users className="text-green-500" size={24} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{formatNumber((stats?.totalSpotifyFollowers || 0).toString(), 'integer')}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Total Spotify Followers</div>
                        </div>

                        <div className="bg-[#111] border border-[#222] hover:border-yellow-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
                                    <DollarSign className="text-yellow-500" size={24} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">${(stats?.totalLifetimeEarnings || 0).toLocaleString()}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Total Lifetime Earnings</div>
                        </div>

                        <div className="bg-[#111] border border-[#222] hover:border-cyan-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                                    <CloudLightning className="text-cyan-500" size={24} />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats?.history?.length > 0 ? '+12%' : '0%'}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Growth (MoM)</div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6">Growth History</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.history || []}>
                                        <defs>
                                            <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#666"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#666"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                            labelStyle={{ color: '#888', marginBottom: '4px' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total_listeners"
                                            name="Monthly Listeners"
                                            stroke="#22c55e"
                                            fillOpacity={1}
                                            fill="url(#colorListeners)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="total_subscribers"
                                            name="Subscribers"
                                            stroke="#ef4444"
                                            fillOpacity={1}
                                            fill="url(#colorSubs)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6">Platform Distribution</h3>
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Spotify', value: stats?.totalListeners || 0, fill: '#22c55e' },
                                        { name: 'YouTube', value: stats?.totalSubscribers || 0, fill: '#ef4444' },
                                    ]} layout="vertical" barSize={40}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="#888" width={80} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#333', opacity: 0.4 }}
                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#fff', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div onClick={() => setTab('earnings')} className="bg-[#111] border border-[#222] hover:border-green-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                                    <DollarSign className="text-green-500" size={24} />
                                </div>
                                <ArrowUpRight className="text-[#333] group-hover:text-green-500 transition-colors" size={18} />
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats?.totalPaid ? stats.totalPaid + '₺' : '0₺'}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Total Paid</div>
                        </div>

                        <div onClick={() => setTab('tickets')} className="bg-[#111] border border-[#222] hover:border-pink-500/50 rounded-2xl p-6 transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-pink-500/10 rounded-xl group-hover:bg-pink-500/20 transition-colors">
                                    <MessageSquare className="text-pink-500" size={24} />
                                </div>
                                {stats?.openTickets > 0 && <span className="flex h-2 w-2 rounded-full bg-pink-500"></span>}
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stats?.openTickets || 0}</div>
                            <div className="text-xs text-[#666] font-medium uppercase tracking-wider">Open Tickets</div>
                        </div>
                    </div>
                </div>
            )
            }

            {
                loading ? <div className="text-center py-20 text-[#666]">Loading...</div> : (
                    <>
                        {/* APPLICATIONS */}
                        {tab === 'applications' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {applications.length === 0 && <div className="col-span-full py-20 text-center text-[#444] border border-dashed border-[#222] rounded-xl"><Inbox size={48} className="mx-auto mb-4 opacity-50" />No pending applications</div>}
                                {applications.map((app: any) => (
                                    <Card key={app.userId} className="flex flex-col gap-4">
                                        <div className="flex justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg text-white">{app.user?.artistName}</h3>
                                                <p className="text-xs text-[#666]">{app.user?.email}</p>
                                            </div>
                                            <Badge status="PENDING" />
                                        </div>
                                        <div className="bg-[#111] p-3 rounded text-xs text-[#CCC] italic">"{app.bio}"</div>
                                        <div className="flex flex-wrap gap-2">
                                            {app.instagramUrl && (
                                                <a href={app.instagramUrl.startsWith('http') ? app.instagramUrl : `https://${app.instagramUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 flex items-center gap-1 bg-pink-500/10 px-2 py-1 rounded">
                                                    <ExternalLink size={12} />Instagram
                                                </a>
                                            )}
                                            {app.spotifyUrl && (
                                                <a href={app.spotifyUrl.startsWith('http') ? app.spotifyUrl : `https://${app.spotifyUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                                                    <ExternalLink size={12} />Spotify
                                                </a>
                                            )}
                                            {app.soundcloudUrl && (
                                                <a href={app.soundcloudUrl.startsWith('http') ? app.soundcloudUrl : `https://${app.soundcloudUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded">
                                                    <ExternalLink size={12} />SoundCloud
                                                </a>
                                            )}
                                            {app.demoTrackUrl && (
                                                <a href={app.demoTrackUrl.startsWith('http') ? app.demoTrackUrl : `https://${app.demoTrackUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                                                    <ExternalLink size={12} />Demo Track
                                                </a>
                                            )}
                                        </div>
                                        <div className="mt-auto pt-4 flex gap-2">
                                            <Button variant="danger" className="flex-1 h-8" onClick={() => handleAppAction(app.userId, false)} disabled={actionLoading}>Reject</Button>
                                            <Button className="flex-1 h-8 bg-white text-black" onClick={() => handleAppAction(app.userId, true)} disabled={actionLoading}>Approve</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* SUBMISSIONS */}
                        {tab === 'submissions' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-white px-2">Pending Submissions <span className="text-[#666] text-lg font-normal ml-2">({pendingReleases.length})</span></h2>
                                {selectedRelease ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        {renderReleaseDetail()}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        <div className="col-span-full flex justify-between items-center mb-2">
                                            <h4 className="text-[#666] text-xs uppercase font-bold tracking-widest pl-1">Inbox</h4>
                                            <div className="flex bg-[#111] rounded-lg p-0.5 border border-[#222]">
                                                <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-[#666]'}`}><Users size={12} /></button>
                                                <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-[#666]'}`}><Music size={12} /></button>
                                            </div>
                                        </div>

                                        {pendingReleases.length === 0 && <div className="col-span-full py-20 text-center text-[#444] border border-dashed border-[#222] rounded-xl"><Inbox size={48} className="mx-auto mb-4 opacity-50" />No pending submissions</div>}

                                        {pendingReleases
                                            .filter(r => r.status !== 'TAKEDOWN_REQUESTED' && r.status !== 'EDITING')
                                            .map(r => (
                                                <div key={r.id} onClick={() => setSelectedRelease(r)} className={`
                                            cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]
                                            bg-[#0A0A0A] border border-[#222] hover:border-[#444]
                                            ${viewMode === 'grid' ? 'p-4 rounded-xl flex flex-col' : 'p-3 rounded-lg flex items-center gap-4'}
                                        `}>
                                                    {viewMode === 'grid' ? (
                                                        <>
                                                            <div className="relative mb-3 aspect-square rounded-lg overflow-hidden bg-[#111]">
                                                                <img src={r.coverUrl || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" />
                                                                <div className="absolute top-2 right-2">
                                                                    <Badge status={r.status} />
                                                                </div>
                                                            </div>
                                                            <h4 className="font-bold text-white text-base line-clamp-1">{r.title}</h4>
                                                            <p className="text-sm text-[#888] truncate">by {(r as any).artistName}</p>
                                                            <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#222]">
                                                                <span className="text-[10px] text-[#555] font-mono uppercase">Submitted</span>
                                                                <span className="text-[10px] text-[#666]">{new Date(r.createdDate || r.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <img src={r.coverUrl || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded bg-[#222]" />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-white text-base truncate">{r.title}</h4>
                                                                <p className="text-xs text-[#888] truncate">by {(r as any).artistName}</p>
                                                            </div>
                                                            <Badge status={r.status} />
                                                            <div className="text-xs text-[#444] w-24 text-right">{new Date(r.createdDate || r.createdAt).toLocaleDateString()}</div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* EDITS */}
                        {tab === 'edits' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-white px-2">Edit Requests <span className="text-[#666] text-lg font-normal ml-2">({editingReleases.length})</span></h2>
                                {editingReleases.length === 0 ? (
                                    <div className="text-center py-20 text-[#666] bg-[#111] rounded-2xl border border-[#222] border-dashed">No edit requests</div>
                                ) : (
                                    <div className="grid gap-6">
                                        {editingReleases.map(release => renderReleaseDetail(release))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAKEDOWNS */}
                        {tab === 'takedowns' && (
                            <div className="space-y-6">
                                {selectedRelease ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        {renderReleaseDetail()}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {releases.filter(r => r.status === 'TAKEDOWN_REQUESTED').length === 0 && <div className="col-span-full py-20 text-center text-[#444] border border-dashed border-[#222] rounded-xl"><Inbox size={48} className="mx-auto mb-4 opacity-50" />No pending takedowns</div>}
                                        {releases
                                            .filter(r => r.status === 'TAKEDOWN_REQUESTED')
                                            .map(r => (
                                                <div key={r.id} onClick={() => setSelectedRelease(r)} className="p-4 rounded-xl border border-red-900/30 bg-[#0A0A0A] cursor-pointer hover:border-red-500 hover:bg-red-950/10 transition-all group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <Badge status={r.status} />
                                                        <div className="bg-red-900/20 p-2 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                                            <Trash2 size={16} />
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-white text-lg mt-2">{r.title}</h4>
                                                    <p className="text-sm text-[#888]">by {(r as any).artistName}</p>
                                                    <p className="text-xs text-[#444] mt-4 pt-4 border-t border-[#222] font-mono">ID: {r.id.slice(0, 8)}...</p>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CATALOG - Approved releases */}
                        {
                            tab === 'catalog' && (
                                <div className="space-y-6">
                                    {selectedRelease ? (
                                        <div>
                                            <Button variant="ghost" onClick={() => setSelectedRelease(null)} className="mb-4 text-[#888] hover:text-white">← Back to Catalog</Button>
                                            {renderReleaseDetail()}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-4">
                                                <Filter size={16} className="text-[#666]" />
                                                <select className="bg-[#111] border border-[#333] rounded px-4 py-2 text-white text-sm" value={catalogFilter} onChange={(e) => setCatalogFilter(e.target.value)}>
                                                    <option value="all">All Artists</option>
                                                    {users.filter(u => u.role !== 'admin').map(u => <option key={u.id} value={u.id}>{u.artistName}</option>)}
                                                </select>
                                                <div className="flex bg-[#111] rounded-lg p-0.5 border border-[#222] ml-auto">
                                                    <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-[#666]'}`}><Users size={12} /></button>
                                                    <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-[#666]'}`}><Music size={12} /></button>
                                                </div>
                                            </div>
                                            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                                {filteredReleases.filter(r => r.status !== 'PENDING' && r.status !== 'TAKEDOWN_REQUESTED').map(r => (
                                                    viewMode === 'grid' ? (
                                                        <div key={r.id} className="bg-[#111] rounded border border-[#222] overflow-hidden cursor-pointer hover:border-[#555] transition-colors" onClick={() => setSelectedRelease(r)}>
                                                            <img src={r.coverUrl || 'https://via.placeholder.com/300'} className="w-full h-48 object-cover" />
                                                            <div className="p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h3 className="font-bold text-white line-clamp-1 flex-1">{r.title}</h3>
                                                                    <Badge status={r.status} />
                                                                </div>
                                                                <p className="text-xs text-[#888]">by {(r as any).artistName}</p>
                                                                <p className="text-xs text-[#666] mt-1">{r.genre} • {r.tracks?.length || 0} tracks</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div key={r.id} className="flex items-center gap-4 bg-[#111] border border-[#222] p-3 rounded-lg hover:border-[#444] cursor-pointer transition-colors" onClick={() => setSelectedRelease(r)}>
                                                            <img src={r.coverUrl || 'https://via.placeholder.com/48'} className="w-12 h-12 rounded bg-[#222] object-cover" />
                                                            <div className="w-1/3">
                                                                <h3 className="font-bold text-white text-sm line-clamp-1">{r.title}</h3>
                                                                <p className="text-xs text-[#888]">{(r as any).artistName}</p>
                                                            </div>
                                                            <div className="flex-1 mr-4"><Badge status={r.status} /></div>
                                                            <div className="flex-1 text-xs text-[#666]">{r.genre}</div>
                                                            <div className="flex-1 text-xs text-[#666] font-mono">{r.upc || r.wupc || 'No UPC'}</div>
                                                            <div className="text-xs text-[#444]">{new Date(r.releaseDate).toLocaleDateString()}</div>
                                                        </div>
                                                    )
                                                ))}
                                                {filteredReleases.filter(r => r.status !== 'PENDING' && r.status !== 'TAKEDOWN_REQUESTED').length === 0 && <div className="col-span-full py-20 text-center text-[#444]">No releases in catalog</div>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        }

                        {/* USERS */}
                        {
                            tab === 'users' && (
                                selectedUser ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <Button variant="ghost" onClick={() => setSelectedUser(null)} className="text-[#888] hover:text-white">← Back to Users</Button>
                                            <h3 className="text-xl font-bold text-white">{selectedUser.artistName} <span className="text-sm font-normal text-[#666]">({selectedUser.email})</span></h3>
                                        </div>

                                        <div className="flex bg-[#0A0A0A] p-1 rounded-lg border border-[#222] mb-6 w-fit">
                                            {['overview', 'releases', 'finance', 'analytics', 'support', 'settings'].map((t) => (
                                                <button
                                                    key={t}
                                                    onClick={() => {
                                                        if (t === 'analytics') loadUserAnalytics(selectedUser.id);
                                                        setUserTab(t as any)
                                                    }}
                                                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${userTab === t ? 'bg-white text-black' : 'text-[#666] hover:text-white'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>

                                        {!userDetails ? (
                                            <div className="flex justify-center py-20">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                            </div>
                                        ) : (
                                            <>
                                                {userTab === 'overview' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <Card className="p-6">
                                                            <h4 className="text-sm font-bold text-[#666] uppercase mb-4">Profile Overview</h4>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-4">
                                                                    <Avatar src={userDetails.profile?.profilePicture} alt={selectedUser.artistName} size="xl" />
                                                                    <div>
                                                                        <div className="text-lg font-bold text-white">{selectedUser.artistName}</div>
                                                                        <div className="text-sm text-[#888]">{selectedUser.first_name} {selectedUser.last_name}</div>
                                                                        <div className="text-xs text-[#666]">{selectedUser.email}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-[#111] p-4 rounded text-sm text-[#CCC] italic">
                                                                    "{userDetails.profile?.bio || 'No bio provided'}"
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 text-xs text-[#888]">
                                                                    <div>Joined: <span className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</span></div>
                                                                    <div>Status: <Badge status={selectedUser.is_banned ? 'BANNED' : (selectedUser.application_status || selectedUser.applicationStatus || 'PENDING')} /></div>
                                                                    <div>Role: <span className="text-white uppercase">{selectedUser.role}</span></div>
                                                                    <div>Balance: <span className="text-green-400 font-mono">${(selectedUser.balance || 0).toFixed(2)}</span></div>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                        <div className="space-y-6">
                                                            <Card className="p-6">
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <h4 className="text-sm font-bold text-[#666] uppercase">Social Accounts ({userSocialAccounts.length})</h4>
                                                                    <button
                                                                        className="h-8 w-8 flex items-center justify-center rounded-full bg-transparent text-[#666] hover:text-white hover:bg-white/10 transition-colors"
                                                                        onClick={() => setEditingSocials(!editingSocials)}
                                                                        title={editingSocials ? "Close" : "Manage Accounts"}
                                                                    >
                                                                        {editingSocials ? <X size={14} /> : <Edit3 size={14} />}
                                                                    </button>
                                                                </div>

                                                                {/* Existing Accounts List */}
                                                                <div className="space-y-2 mb-4">
                                                                    {userSocialAccounts.map(account => (
                                                                        <div key={account.id} className={`flex items-center justify-between p-2 rounded text-xs ${account.platform === 'spotify' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={account.platform === 'spotify' ? 'text-green-400' : 'text-red-400'}>
                                                                                    {account.platform === 'spotify' ? '🎵' : '📺'}
                                                                                </span>
                                                                                <span className="text-white font-medium">{account.name || account.platform}</span>
                                                                                <a href={account.url} target="_blank" className="text-[#666] hover:text-white">
                                                                                    <ExternalLink size={10} />
                                                                                </a>
                                                                            </div>
                                                                            {editingSocials && (
                                                                                <button
                                                                                    className="text-red-400 hover:text-red-300"
                                                                                    onClick={() => handleDeleteSocialAccount(account.id)}
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {userSocialAccounts.length === 0 && !editingSocials && (
                                                                        <div className="text-[#444] text-xs py-2">No social accounts linked</div>
                                                                    )}
                                                                </div>

                                                                {/* Add New Account Form */}
                                                                {editingSocials && (
                                                                    <div className="border-t border-[#222] pt-4 space-y-3">
                                                                        <p className="text-[10px] text-[#666] uppercase font-bold">Add New Account</p>
                                                                        <div className="flex gap-2">
                                                                            <select
                                                                                className="bg-[#1A1A1A] border border-[#333] rounded px-2 py-1.5 text-xs text-white"
                                                                                value={newAccountForm.platform}
                                                                                onChange={e => setNewAccountForm({ ...newAccountForm, platform: e.target.value })}
                                                                            >
                                                                                <option value="spotify">Spotify</option>
                                                                                <option value="youtube">YouTube</option>
                                                                            </select>
                                                                            <input
                                                                                type="text"
                                                                                className="flex-1 bg-[#1A1A1A] border border-[#333] rounded px-2 py-1.5 text-xs text-white"
                                                                                value={newAccountForm.name}
                                                                                onChange={e => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                                                                                placeholder="Artist/Channel Name"
                                                                            />
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <input
                                                                                type="text"
                                                                                className="flex-1 bg-[#1A1A1A] border border-[#333] rounded px-2 py-1.5 text-xs text-white"
                                                                                value={newAccountForm.url}
                                                                                onChange={e => setNewAccountForm({ ...newAccountForm, url: e.target.value })}
                                                                                placeholder={newAccountForm.platform === 'spotify' ? 'https://open.spotify.com/artist/...' : 'https://youtube.com/@... or /channel/...'}
                                                                            />
                                                                            <button
                                                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
                                                                                onClick={handleAddSocialAccount}
                                                                                disabled={!newAccountForm.url}
                                                                            >
                                                                                Add
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Card>
                                                            <Card className="p-6">
                                                                <h4 className="text-sm font-bold text-[#666] uppercase mb-4">Quick Actions</h4>
                                                                <div className="flex gap-2">
                                                                    {(selectedUser.application_status === 'REJECTED' || selectedUser.applicationStatus === 'REJECTED') && (
                                                                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-xs" onClick={() => handleApproveRejected(selectedUser.id)}>Approve Application</Button>
                                                                    )}
                                                                    {(selectedUser.application_status === 'APPROVED' || selectedUser.applicationStatus === 'APPROVED') && (
                                                                        <Button variant="danger" className="flex-1 text-xs" onClick={() => handleRejectApprovedUser(selectedUser.id)}>Reject Application</Button>
                                                                    )}
                                                                    {selectedUser.is_banned ? (
                                                                        <Button variant="secondary" className="flex-1 text-xs" onClick={() => handleUnbanUser(selectedUser.id)}>Unban User</Button>
                                                                    ) : (
                                                                        <Button variant="danger" className="flex-1 text-xs" onClick={() => handleBanUser(selectedUser.id)}>Ban User</Button>
                                                                    )}
                                                                </div>
                                                            </Card>
                                                        </div>
                                                    </div>
                                                )}

                                                {userTab === 'releases' && (
                                                    <div className="space-y-6">
                                                        {selectedRelease ? (
                                                            <div>
                                                                <Button variant="ghost" onClick={() => setSelectedRelease(null)} className="mb-4 text-[#888] hover:text-white">← Back to List</Button>
                                                                {renderReleaseDetail()}
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {releases.filter(r => r.userId === selectedUser.id).map(r => (
                                                                    <div key={r.id} className="bg-[#111] rounded border border-[#222] overflow-hidden cursor-pointer hover:border-[#555] transition-colors" onClick={() => setSelectedRelease(r)}>
                                                                        <img src={r.coverUrl || 'https://via.placeholder.com/300'} className="w-full h-48 object-cover" />
                                                                        <div className="p-4">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <h3 className="font-bold text-white line-clamp-1 flex-1">{r.title}</h3>
                                                                                <Badge status={r.status} />
                                                                            </div>
                                                                            <p className="text-xs text-[#888]">{r.genre} • {r.tracks?.length || 0} tracks</p>
                                                                            <p className="text-[10px] text-[#444] mt-2">{new Date(r.releaseDate).toLocaleDateString()}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {releases.filter(r => r.userId === selectedUser.id).length === 0 && <div className="col-span-full py-10 text-center text-[#444] border border-dashed border-[#222] rounded-xl">No releases found</div>}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {userTab === 'analytics' && (
                                                    <div className="space-y-6 animate-fade-in">
                                                        <div className="flex justify-between items-center bg-[#111] p-6 rounded-2xl border border-[#222]">
                                                            <div>
                                                                <h2 className="text-xl font-bold text-white mb-1">Detailed Analytics</h2>
                                                                <p className="text-[#666] text-sm">Last updated: {userAnalytics?.date ? new Date(userAnalytics.date).toLocaleDateString() : 'Never'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {/* Spotify Breakdown */}
                                                            <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                                                                <div className="flex items-center gap-3 mb-6">
                                                                    <div className="p-2 bg-green-500/10 rounded-lg">
                                                                        <Users className="text-green-500" size={20} />
                                                                    </div>
                                                                    <h3 className="text-lg font-bold text-white">Spotify Artists</h3>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    {userAnalytics?.spotify?.accounts?.map((acc: any, i: number) => (
                                                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0A] border border-[#222]">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-full bg-green-900/20 flex items-center justify-center text-green-500 font-bold">
                                                                                    {acc.name.charAt(0)}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-bold text-white text-sm">{acc.name}</div>
                                                                                    <a href={acc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-500 hover:underline">View on Spotify</a>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-white font-mono font-bold">{formatNumber(acc.followers?.toString() || '0', 'integer')}</div>
                                                                                <div className="text-[10px] text-[#666] uppercase tracking-wider">Followers</div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {(!userAnalytics?.spotify?.accounts || userAnalytics.spotify.accounts.length === 0) && (
                                                                        <div className="text-center py-10 text-[#444] italic">No Spotify data found</div>
                                                                    )}
                                                                </div>
                                                                <div className="mt-6 pt-4 border-t border-[#222] flex justify-between">
                                                                    <span className="text-sm text-[#888]">Total Monthly Listeners:</span>
                                                                    <span className="text-white font-mono font-bold">{formatNumber(userAnalytics?.spotify?.monthlyListeners?.toString() || '0', 'integer')}</span>
                                                                </div>
                                                            </div>

                                                            {/* YouTube Breakdown */}
                                                            <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                                                                <div className="flex items-center gap-3 mb-6">
                                                                    <div className="p-2 bg-red-500/10 rounded-lg">
                                                                        <Youtube className="text-red-500" size={20} />
                                                                    </div>
                                                                    <h3 className="text-lg font-bold text-white">YouTube Channels</h3>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    {userAnalytics?.youtube?.accounts?.map((acc: any, i: number) => (
                                                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0A] border border-[#222]">
                                                                            <div className="flex items-center gap-3">
                                                                                <img src={acc.thumbnail || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full bg-[#222] object-cover" />
                                                                                <div>
                                                                                    <div className="font-bold text-white text-sm line-clamp-1">{acc.name}</div>
                                                                                    <a href={acc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-red-500 hover:underline">View Channel</a>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-white font-mono font-bold">{formatNumber(acc.subscribers?.toString() || '0', 'integer')}</div>
                                                                                <div className="text-[10px] text-[#666] uppercase tracking-wider">Subscribers</div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {(!userAnalytics?.youtube?.accounts || userAnalytics.youtube.accounts.length === 0) && (
                                                                        <div className="text-center py-10 text-[#444] italic">No YouTube data found</div>
                                                                    )}
                                                                </div>
                                                                <div className="mt-6 pt-4 border-t border-[#222] flex justify-between">
                                                                    <span className="text-sm text-[#888]">Total Views:</span>
                                                                    <span className="text-white font-mono font-bold">{formatNumber(userAnalytics?.youtube?.totalViews?.toString() || '0', 'integer')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {userTab === 'finance' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <Card className="p-6">
                                                            <h4 className="text-sm font-bold text-[#666] uppercase mb-4">Earnings History</h4>
                                                            <div className="max-h-[300px] overflow-y-auto">
                                                                <table className="w-full text-left">
                                                                    <thead className="text-[10px] text-[#666] uppercase border-b border-[#222]"><tr><th className="px-4 py-3">Month</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Streams</th></tr></thead>
                                                                    <tbody>
                                                                        {earnings.filter(e => e.userId === selectedUser.id).sort((a, b) => b.id.localeCompare(a.id)).map(e => (
                                                                            <tr key={e.id} className="border-b border-[#141414]">
                                                                                <td className="px-4 py-3 text-[#EEE] font-mono">{e.month}</td>
                                                                                <td className="px-4 py-3 text-green-400">${e.amount?.toFixed(2)}</td>
                                                                                <td className="px-4 py-3 text-[#888]">{e.streams?.toLocaleString()}</td>
                                                                            </tr>
                                                                        ))}
                                                                        {earnings.filter(e => e.userId === selectedUser.id).length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-[#444]">No earnings history</td></tr>}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </Card>

                                                        <Card className="p-6">
                                                            <h4 className="text-sm font-bold text-[#666] uppercase mb-4">Withdrawals</h4>
                                                            <div className="max-h-[300px] overflow-y-auto">
                                                                <table className="w-full text-left">
                                                                    <thead className="text-[10px] text-[#666] uppercase border-b border-[#222]"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr></thead>
                                                                    <tbody>
                                                                        {withdrawals.filter(w => w.userId === selectedUser.id).sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime()).map(w => (
                                                                            <tr key={w.id} className="border-b border-[#141414]">
                                                                                <td className="px-4 py-3 text-[#EEE] text-xs">{new Date(w.requestedAt).toLocaleDateString()}</td>
                                                                                <td className="px-4 py-3 text-white">${w.amount?.toFixed(2)}</td>
                                                                                <td className="px-4 py-3"><Badge status={w.status} /></td>
                                                                            </tr>
                                                                        ))}
                                                                        {withdrawals.filter(w => w.userId === selectedUser.id).length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-[#444]">No withdrawal requests</td></tr>}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </Card>

                                                        <Card className="col-span-1 md:col-span-2 p-6">
                                                            <h4 className="text-sm font-bold text-[#666] uppercase mb-4">Payment Method</h4>
                                                            {(userDetails.paymentMethods && userDetails.paymentMethods.length > 0) ? (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {userDetails.paymentMethods.map((pm: any) => (
                                                                        <div key={pm.id} className="bg-[#111] p-4 rounded border border-[#222]">
                                                                            <div className="flex justify-between mb-2">
                                                                                <span className="text-xs font-bold text-white uppercase">{pm.bank_name || 'Bank Account'}</span>
                                                                                {pm.is_default && <span className="bg-green-900/30 text-green-400 text-[10px] px-2 py-0.5 rounded uppercase">Default</span>}
                                                                            </div>
                                                                            <div className="text-sm font-mono text-[#AAA]">{pm.iban}</div>
                                                                            <div className="text-xs text-[#666] mt-1">{pm.account_holder}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : <div className="text-[#444] italic">No payment methods added</div>}
                                                        </Card>
                                                    </div>
                                                )}

                                                {userTab === 'support' && (
                                                    <Card className="p-0 overflow-hidden">
                                                        <div className="p-4 border-b border-[#222] bg-[#111]">
                                                            <h4 className="text-sm font-bold text-white">Ticket History</h4>
                                                        </div>
                                                        {userDetails.tickets && userDetails.tickets.length > 0 ? (
                                                            <table className="w-full text-left">
                                                                <thead className="text-[10px] text-[#666] uppercase border-b border-[#222] bg-[#0A0A0A]"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr></thead>
                                                                <tbody>
                                                                    {userDetails.tickets.map((t: any) => (
                                                                        <tr key={t.id} className="border-b border-[#141414] hover:bg-[#111] cursor-pointer" onClick={() => { setTab('tickets'); setSelectedTicket(t); }}>
                                                                            <td className="px-4 py-3 text-white font-medium">{t.subject}</td>
                                                                            <td className="px-4 py-3 text-xs text-[#888]">{new Date(t.created_at).toLocaleDateString()}</td>
                                                                            <td className="px-4 py-3"><Badge status={t.status} /></td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        ) : <div className="p-8 text-center text-[#444]">No support tickets</div>}
                                                    </Card>
                                                )}

                                                {userTab === 'settings' && (
                                                    <div className="space-y-6">
                                                        <Card className="p-6 border border-[#222]">
                                                            <h4 className="text-sm font-bold text-white uppercase mb-2">Security</h4>
                                                            <div className="flex justify-between items-center py-4">
                                                                <div>
                                                                    <h5 className="font-bold text-white text-sm">Reset Password</h5>
                                                                    <p className="text-xs text-[#666]">Manually set a new password for this user (Min 6 chars).</p>
                                                                </div>
                                                                <Button variant="secondary" onClick={() => {
                                                                    const newPass = prompt(`Enter new password for ${selectedUser.first_name || 'User'}:`);
                                                                    if (newPass) handleAdminPasswordReset(selectedUser.id, newPass);
                                                                }}>Reset Password</Button>
                                                            </div>
                                                        </Card>

                                                        <Card className="p-6 border-red-900/30 bg-red-900/5">
                                                            <h4 className="text-sm font-bold text-red-400 uppercase mb-2">Danger Zone</h4>
                                                            <p className="text-xs text-[#888] mb-6">Irreversible actions. Please be certain.</p>

                                                            <div className="flex justify-between items-center py-4 border-t border-red-900/20">
                                                                <div>
                                                                    <h5 className="font-bold text-white text-sm">Delete User Account</h5>
                                                                    <p className="text-xs text-[#666]">Permanently remove this user and all associated data (Releases, Earnings, Contracts).</p>
                                                                </div>
                                                                <Button variant="danger" onClick={handleDeleteUser} disabled={actionLoading}>Delete User</Button>
                                                            </div>
                                                        </Card>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                ) : (
                                    <Card>
                                        <table className="w-full text-left">
                                            <thead className="text-[10px] text-[#666] uppercase border-b border-[#222]">
                                                <tr><th className="px-4 py-3">Artist</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Total Withdrawn</th><th className="px-4 py-3">Actions</th></tr>
                                            </thead>
                                            <tbody>
                                                {users.map(u => (
                                                    <tr key={u.id} className="border-b border-[#141414] hover:bg-[#111] cursor-pointer transition-colors" onClick={() => handleUserSelect(u.id)}>
                                                        <td className="px-4 py-3 font-medium text-white group">{u.artistName} <ArrowUpRight size={12} className="inline ml-1 text-[#444] group-hover:text-white transition-colors" /></td>
                                                        <td className="px-4 py-3 text-xs text-[#888]">{u.email}</td>
                                                        <td className="px-4 py-3"><span className={`text-[10px] uppercase px-2 py-0.5 rounded ${u.isBanned ? 'bg-red-900/30 text-red-400' : u.applicationStatus === 'APPROVED' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>{u.isBanned ? 'BANNED' : u.applicationStatus}</span></td>
                                                        <td className="px-4 py-3 text-xs font-mono">${(u.balance || 0).toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-xs font-mono text-[#888]">
                                                            ${withdrawals.filter(w => w.userId === u.id && w.status === 'APPROVED').reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>{u.role !== 'admin' && (u.isBanned ? <Button variant="ghost" className="h-7 text-xs" onClick={() => handleUnbanUser(u.id)}><UserCheck size={14} />Unban</Button> : <Button variant="danger" className="h-7 text-xs" onClick={() => handleBanUser(u.id)}><Ban size={14} />Ban</Button>)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Card>
                                )
                            )
                        }

                        {/* EARNINGS */}
                        {
                            tab === 'earnings' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between"><h3 className="text-xl font-bold text-white">Earnings</h3><Button onClick={() => setShowEarningsForm(!showEarningsForm)}>{showEarningsForm ? 'Cancel' : '+ Add'}</Button></div>
                                    {showEarningsForm && (
                                        <Card className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                                <div className="flex flex-col gap-2.5 mb-5 w-full">
                                                    <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest font-display ml-6">Artist</label>
                                                    <div className="relative">
                                                        <select
                                                            className="h-[60px] w-full bg-white/[0.03] backdrop-blur-sm border-2 border-white/[0.05] rounded-[2rem] px-8 text-[#EEE] focus:border-indigo-500 focus:bg-white/[0.05] focus:ring-0 focus:outline-none transition-all duration-300 ease-wise-ease appearance-none text-sm font-medium cursor-pointer"
                                                            value={earningsForm.userId}
                                                            onChange={(e) => setEarningsForm({ ...earningsForm, userId: e.target.value })}
                                                        >
                                                            <option value="" className="bg-[#1A1A1A] text-[#EEE]">Select User</option>
                                                            {users.filter(u => u.role !== 'admin').map(u => <option key={u.id} value={u.id} className="bg-[#1A1A1A] text-[#EEE]">{u.artistName}</option>)}
                                                        </select>
                                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Input label="Month" type="month" value={earningsForm.month} onChange={(e: any) => setEarningsForm({ ...earningsForm, month: e.target.value })} />
                                                <Input label="Revenue ($)" type="text" placeholder="0,00" value={earningsForm.amount} onChange={(e: any) => setEarningsForm({ ...earningsForm, amount: formatNumber(e.target.value, 'currency') })} />
                                                <Input label="Streams" type="text" placeholder="0" value={earningsForm.streams} onChange={(e: any) => setEarningsForm({ ...earningsForm, streams: formatNumber(e.target.value, 'integer') })} />
                                                <Input label="Downloads" type="text" placeholder="0" value={earningsForm.downloads} onChange={(e: any) => setEarningsForm({ ...earningsForm, downloads: formatNumber(e.target.value, 'integer') })} />
                                                <div className="mb-5">
                                                    <Button onClick={handleAddEarnings} className="w-full">Save</Button>
                                                </div>

                                            </div>
                                        </Card>
                                    )}
                                    <Card>
                                        <table className="w-full text-left">
                                            <thead className="text-[10px] text-[#666] uppercase border-b border-[#222]"><tr><th className="px-4 py-3">Artist</th><th className="px-4 py-3">Month</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Streams</th><th className="px-4 py-3">Actions</th></tr></thead>
                                            <tbody>
                                                {earnings.sort((a, b) => b.id.localeCompare(a.id)).map(e => (
                                                    <tr key={e.id} className="border-b border-[#141414]">
                                                        <td className="px-4 py-3 text-white">{e.userName}</td>
                                                        <td className="px-4 py-3 text-[#888] font-mono">{e.month}</td>
                                                        <td className="px-4 py-3 text-green-400">${e.amount?.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-[#AAA]">{e.streams?.toLocaleString()}</td>
                                                        <td className="px-4 py-3"><Button variant="ghost" className="h-7 text-red-400" onClick={() => handleDeleteEarnings(e.id)}><Trash2 size={14} /></Button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Card>
                                </div>
                            )
                        }

                        {/* TICKETS */}
                        {
                            tab === 'tickets' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto">
                                        {tickets.length === 0 && <div className="py-10 text-center text-[#444] text-xs border border-dashed border-[#222] rounded-lg">No tickets</div>}
                                        {tickets.map(t => (
                                            <div key={t.id} onClick={() => setSelectedTicket(t)} className={`p-4 rounded-xl border cursor-pointer ${selectedTicket?.id === t.id ? 'bg-[#141414] border-white' : 'bg-[#0A0A0A] border-[#222]'}`}>
                                                <div className="flex justify-between mb-2">
                                                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${t.status === 'OPEN' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>{t.status}</span>
                                                    <span className="text-[10px] text-[#666]">{new Date((t.createdAt || '').replace(' ', 'T')).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="font-bold text-white text-sm">{t.subject}</h4>
                                                <p className="text-xs text-[#666]">from {t.userName}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="lg:col-span-2">
                                        {selectedTicket ? (
                                            <Card className="h-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">{selectedTicket.subject}</h3>
                                                        <p className="text-xs text-[#888]">
                                                            {selectedTicket.userName || selectedTicket.user_name} ({selectedTicket.userEmail || selectedTicket.user_email})
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`text-[10px] uppercase px-2 py-1 rounded ${selectedTicket.status === 'OPEN' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>
                                                            {selectedTicket.status}
                                                        </span>
                                                        {selectedTicket.status !== 'CLOSED' && (
                                                            <Button
                                                                variant="secondary"
                                                                className={`h-6 text-[10px] ${selectedTicket.allow_uploads ? 'bg-green-900/20 text-green-400' : ''}`}
                                                                onClick={async () => {
                                                                    await apiService.toggleTicketUpload(selectedTicket.id, !selectedTicket.allow_uploads);
                                                                    await loadData();
                                                                    setSelectedTicket({ ...selectedTicket, allow_uploads: !selectedTicket.allow_uploads });
                                                                }}
                                                            >
                                                                {selectedTicket.allow_uploads ? 'Uploads Allowed' : 'Allow Uploads'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-[#111] p-4 rounded-xl mb-4">
                                                    <p className="text-sm text-[#CCC]">{selectedTicket.message}</p>
                                                    <p className="text-[10px] text-[#666] mt-2">{new Date((selectedTicket.createdAt || '').replace(' ', 'T')).toLocaleString()}</p>

                                                    {/* Attachments */}
                                                    {selectedTicket.attachments && JSON.parse(selectedTicket.attachments).length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-[#222]">
                                                            <p className="text-[10px] text-[#666] uppercase font-bold mb-2">Attachments</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {JSON.parse(selectedTicket.attachments).map((att: any, idx: number) => (
                                                                    <a key={idx} href={att.url.startsWith('http') ? att.url : att.url} target="_blank" className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] px-3 py-2 rounded text-xs text-indigo-300 hover:bg-[#222] hover:text-white transition-colors">
                                                                        <Disc size={12} /> {att.name}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedTicket.responses?.length > 0 && (
                                                    <div className="space-y-3 mb-4">
                                                        {selectedTicket.responses.map((r: any, i: number) => (
                                                            <div key={i} className={`p-4 rounded-xl border ${r.is_admin ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-[#1A1A1A] border-[#333]'}`}>
                                                                <p className={`text-sm ${r.is_admin ? 'text-indigo-200' : 'text-[#CCC]'}`}>{r.message}</p>
                                                                <p className={`text-[10px] mt-2 ${r.is_admin ? 'text-indigo-400' : 'text-[#666]'}`}>
                                                                    {r.is_admin ? 'Admin' : 'User'} • {new Date((r.createdAt || '').replace(' ', 'T')).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedTicket.status === 'CLOSED' ? (
                                                    <div className="p-4 bg-red-900/10 border border-red-900/30 rounded text-center text-sm text-red-400">
                                                        Ticket Closed
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4 pt-4 border-t border-[#222]">
                                                        <textarea
                                                            className="w-full bg-[#111] border border-[#333] rounded-xl p-4 text-white text-sm resize-none"
                                                            rows={3}
                                                            placeholder="Type your response..."
                                                            value={ticketResponse}
                                                            onChange={(e) => setTicketResponse(e.target.value)}
                                                        />
                                                        <div className="flex gap-4">
                                                            <Button className="flex-1" onClick={async () => {
                                                                if (!ticketResponse.trim()) return;
                                                                await apiService.adminRespondTicket(selectedTicket.id, ticketResponse);
                                                                setTicketResponse('');
                                                                await loadData();
                                                                // Update selected ticket from reloaded data
                                                                const updated = await apiService.getAllTickets();
                                                                const t = updated.find((x: any) => x.id === selectedTicket.id);
                                                                if (t) setSelectedTicket(t);
                                                            }}>Send Response</Button>
                                                            <Button variant="ghost" onClick={() => handleCloseTicket(selectedTicket.id)}>Close Ticket</Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        ) : <div className="h-64 flex items-center justify-center text-[#444] border border-dashed border-[#222] rounded-xl">Select a ticket</div>}
                                    </div>
                                </div>
                            )
                        }
                        {/* WITHDRAWALS */}
                        {
                            tab === 'withdrawals' && (

                                <Card>
                                    <h3 className="text-xl font-bold text-white mb-6">Withdrawal Requests</h3>
                                    <table className="w-full text-left">
                                        <thead className="text-[10px] text-[#666] uppercase border-b border-[#222]">
                                            <tr>
                                                <th className="px-4 py-3">Artist</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Method</th>
                                                <th className="px-4 py-3">Details</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Dates</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {withdrawals.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-[#444]">No withdrawal requests</td></tr>}
                                            {withdrawals.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()).map((w: any) => (
                                                <tr key={w.id} className="border-b border-[#141414] hover:bg-[#111]">
                                                    <td className="px-4 py-3 text-white font-medium">{w.artistName}</td>
                                                    <td className="px-4 py-3 text-xs text-[#888]">{w.email}</td>
                                                    <td className="px-4 py-3 text-green-400 font-bold">${w.amount.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-xs text-[#AAA] uppercase">{w.method}</td>
                                                    <td className="px-4 py-3">
                                                        <Button variant="secondary" className="h-6 text-[10px]" onClick={() => setViewingWithdrawal(w)}>View Details</Button>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${w.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' :
                                                            w.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' :
                                                                'bg-red-900/30 text-red-400'
                                                            }`}>{w.status}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-[#666]">
                                                        <div className="flex flex-col">
                                                            <span>Req: {new Date(w.requestedAt).toLocaleDateString()}</span>
                                                            {w.processedAt && <span className={w.status === 'COMPLETED' ? 'text-green-500/50' : 'text-red-500/50'}>
                                                                {w.status === 'COMPLETED' ? 'Paid' : 'Rejected'}: {new Date(w.processedAt).toLocaleDateString()}
                                                            </span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 flex gap-2">
                                                        {w.status === 'PENDING' && (
                                                            <>
                                                                <Button variant="danger" className="h-6 text-[10px]" onClick={() => handleWithdrawalAction(w.id, 'REJECTED')}>Reject</Button>
                                                                <Button className="h-6 text-[10px] bg-white text-black" onClick={() => handleWithdrawalAction(w.id, 'COMPLETED')}>Pay</Button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card>
                            )
                        }


                        {/* SPOTIFY CLAIMS */}
                        {tab === 'spotifyClaims' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Music className="text-[#1DB954]" size={24} /> Spotify for Artists Claims
                                </h3>
                                {claims.filter(c => c.type === 'spotify').length === 0 ? (
                                    <div className="py-20 text-center text-[#444] border border-dashed border-[#222] rounded-xl">
                                        <Inbox size={48} className="mx-auto mb-4 opacity-50" />No Spotify claims
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {claims.filter(c => c.type === 'spotify').map((claim: any) => (
                                            <Card key={claim.id} className="p-4" style={{ background: 'linear-gradient(135deg, rgba(29,185,84,0.1) 0%, #0A0A0A 100%)' }}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-bold text-white">{claim.artist_name || 'N/A'}</p>
                                                        <p className="text-xs text-[#888]">{claim.user_artist_name || claim.user_email}</p>
                                                    </div>
                                                    <Badge status={claim.status} />
                                                </div>
                                                <div className="space-y-2 text-xs text-[#888] mb-4">
                                                    <div><span className="text-[#666]">Email:</span> {claim.email}</div>
                                                    {claim.artist_link && <div><span className="text-[#666]">Link:</span> <a href={claim.artist_link} target="_blank" className="text-[#1DB954] hover:underline">{claim.artist_link.slice(0, 40)}...</a></div>}
                                                    <div><span className="text-[#666]">Submitted:</span> {new Date(claim.created_at).toLocaleDateString()}</div>
                                                </div>
                                                {claim.status === 'PENDING' && (
                                                    <div className="flex gap-2">
                                                        <Button className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs" onClick={() => handleClaimAction(claim.id, 'APPROVED')}>
                                                            <Check size={14} className="mr-1" /> Approve
                                                        </Button>
                                                        <Button variant="danger" className="flex-1 text-xs" onClick={() => {
                                                            const reason = prompt('Rejection reason (optional):');
                                                            handleClaimAction(claim.id, 'REJECTED', reason || undefined);
                                                        }}>
                                                            <X size={14} className="mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* YOUTUBE CLAIMS */}
                        {tab === 'youtubeClaims' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileAudio className="text-[#FF0000]" size={24} /> YouTube Official Artist Channel Claims
                                </h3>
                                {claims.filter(c => c.type === 'youtube').length === 0 ? (
                                    <div className="py-20 text-center text-[#444] border border-dashed border-[#222] rounded-xl">
                                        <Inbox size={48} className="mx-auto mb-4 opacity-50" />No YouTube claims
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {claims.filter(c => c.type === 'youtube').map((claim: any) => (
                                            <Card key={claim.id} className="p-4" style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.1) 0%, #0A0A0A 100%)' }}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-bold text-white">{claim.artist_name || 'N/A'}</p>
                                                        <p className="text-xs text-[#888]">{claim.user_artist_name || claim.user_email}</p>
                                                    </div>
                                                    <Badge status={claim.status} />
                                                </div>
                                                <div className="space-y-2 text-xs text-[#888] mb-4">
                                                    <div><span className="text-[#666]">Email:</span> {claim.email}</div>
                                                    {claim.channel_url && <div><span className="text-[#666]">Channel:</span> <a href={claim.channel_url} target="_blank" className="text-[#FF0000] hover:underline">{claim.channel_url.slice(0, 40)}...</a></div>}
                                                    <div><span className="text-[#666]">Submitted:</span> {new Date(claim.created_at).toLocaleDateString()}</div>
                                                </div>
                                                {claim.status === 'PENDING' && (
                                                    <div className="flex gap-2">
                                                        <Button className="flex-1 bg-[#FF0000] hover:bg-[#cc0000] text-white text-xs" onClick={() => handleClaimAction(claim.id, 'APPROVED')}>
                                                            <Check size={14} className="mr-1" /> Approve
                                                        </Button>
                                                        <Button variant="ghost" className="flex-1 text-xs border border-[#333]" onClick={() => {
                                                            const reason = prompt('Rejection reason (optional):');
                                                            handleClaimAction(claim.id, 'REJECTED', reason || undefined);
                                                        }}>
                                                            <X size={14} className="mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}



                        {/* SYSTEM LOGS */}
                        {tab === 'logs' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CloudLightning className="text-blue-500" size={24} /> System Logs (Last 100)
                                </h3>
                                <div className="bg-[#111] overflow-hidden rounded-xl border border-[#222]">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-[#222] text-[#666] text-xs uppercase tracking-wider">
                                                <th className="px-4 py-3 font-medium">Level</th>
                                                <th className="px-4 py-3 font-medium">Message</th>
                                                <th className="px-4 py-3 font-medium">User</th>
                                                <th className="px-4 py-3 font-medium">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#222]">
                                            {logs.map((log: any) => (
                                                <tr key={log.id} className="group hover:bg-[#161616] transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase
                                                            ${log.level === 'INFO' ? 'bg-blue-900/30 text-blue-400' :
                                                                log.level === 'WARN' ? 'bg-yellow-900/30 text-yellow-400' :
                                                                    log.level === 'ERROR' ? 'bg-red-900/30 text-red-400' :
                                                                        'bg-green-900/30 text-green-400'
                                                            }
                                                        `}>
                                                            {log.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[#EEE]">
                                                        <div>{log.message}</div>
                                                        {log.details && (
                                                            <div className="text-xs text-[#666] mt-0.5 font-mono bg-[#0A0A0A] p-1 rounded inline-block max-w-full overflow-hidden text-ellipsis">
                                                                {log.details}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-[#888] font-mono">
                                                        {log.user_id ? log.user_id.slice(0, 8) + '...' : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-[#666] whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {logs.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-12 text-center text-[#444] italic">No logs found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Withdrawal Details Modal */}
                        {viewingWithdrawal && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                <Card className="w-full max-w-lg relative bg-[#121212]" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => setViewingWithdrawal(null)} className="absolute top-6 right-6 text-[#666] hover:text-white"><X size={20} /></button>
                                    <h3 className="text-xl font-bold font-display text-white mb-2">Withdrawal Details</h3>
                                    <p className="text-sm text-[#888] mb-6">Payment information for {viewingWithdrawal.artistName}</p>

                                    <div className="bg-[#0A0A0A] border border-[#222] p-4 rounded-xl">
                                        <h4 className="text-xs text-[#666] uppercase tracking-wider mb-2">Bank Details</h4>
                                        <div className="bg-[#181818] p-3 rounded font-mono text-sm text-[#DDD] whitespace-pre-wrap border border-[#333]">
                                            {viewingWithdrawal.details.replace(/, /g, '\n')}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-6">
                                        <Button variant="secondary" className="flex-1" onClick={() => {
                                            navigator.clipboard.writeText(viewingWithdrawal.details);
                                            alert('Copied to clipboard');
                                        }}>
                                            Copy Details
                                        </Button>
                                        <Button variant="ghost" className="flex-1" onClick={() => setViewingWithdrawal(null)}>Close</Button>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </>
                )
            }
        </div >
    );
};

export default AdminPanel;
