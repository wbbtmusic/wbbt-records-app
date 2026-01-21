import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Release } from '../types';
import { Card, Badge, Button } from '../components/ui.tsx';
import { Disc, Edit2, AlertCircle, X, Eye } from 'lucide-react';

const Releases: React.FC = () => {
    const navigate = useNavigate();
    const [releases, setReleases] = useState<Release[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingReason, setViewingReason] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT'>('ALL');

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const user = await apiService.getCurrentUser();
                if (!user) {
                    navigate('/');
                    return;
                }
                const allReleases = await apiService.getReleases(user.id);
                // Filter client-side just in case, though API should handle it if passed userId
                const myReleases = allReleases
                    .filter((r: Release) => r.userId === user.id)
                    .sort((a: Release, b: Release) => {
                        const dateA = new Date(a.createdDate || 0).getTime();
                        const dateB = new Date(b.createdDate || 0).getTime();
                        if (dateA !== dateB) return dateB - dateA;
                        // Fallback to ID (assuming time-based or numeric IDs)
                        return b.id.localeCompare(a.id);
                    });
                setReleases(myReleases);
            } catch (error) {
                console.error('Failed to fetch releases:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, [navigate]);

    const activeReleases = releases.filter(r => r.status !== 'DRAFT');
    const draftReleases = releases.filter(r => r.status === 'DRAFT');

    const renderReleaseList = (list: Release[]) => {
        if (list.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-[#333] rounded-lg">
                    <Disc size={48} className="text-[#444] mb-4" />
                    <p className="text-[#666]">No releases found.</p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 gap-4">
                {list.map(release => (
                    <div key={release.id} className="bg-[#121212] border border-[#2A2A2A] rounded-lg p-4 flex gap-6 items-center hover:border-[#50A0FF] transition-colors group">
                        <img src={release.coverUrl || 'https://via.placeholder.com/80'} alt="Cover" className="w-20 h-20 rounded object-cover shadow-lg bg-[#222]" />
                        <div className="flex-1">
                            <h3 className="text-xl font-bold font-display text-white">{release.title || 'Untitled Release'}</h3>
                            <p className="text-sm text-[#888]">{release.type} • {(release.tracks || []).length} Tracks • {release.releaseDate || 'No Date'}</p>
                            <div className="mt-2 flex gap-2 flex-wrap">
                                <Badge status={release.status} />
                                {/* Show WUPC - only auto-generated code */}
                                {release.wupc && (
                                    <span className="text-[10px] bg-indigo-500/10 px-2 py-1 rounded text-indigo-400 border border-indigo-500/30">
                                        WUPC: {release.wupc}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-row gap-2 items-center">
                            <Button variant="ghost" className="border border-[#333] text-white hover:bg-indigo-500 hover:border-indigo-500 w-32" onClick={() => navigate(`/releases/${release.id}`)}>
                                <Eye size={16} className="mr-2" /> View More
                            </Button>
                            <Button variant="ghost" className="border border-[#333] text-white hover:bg-[#50A0FF] hover:border-[#50A0FF] w-32" onClick={() => navigate(`/releases/edit/${release.id}`)}>
                                <Edit2 size={16} className="mr-2" /> {release.status === 'DRAFT' ? 'Continue' : 'Edit'}
                            </Button>
                            {release.status === 'REJECTED' && (
                                <Button variant="danger" className="w-32 text-xs h-8" onClick={() => setViewingReason(release.rejectionReason || 'No reason specified')}>
                                    View Reason
                                </Button>
                            )}
                            {release.status === 'APPROVED' && (
                                <Button variant="danger" className="w-32 text-xs h-8" onClick={async () => {
                                    if (confirm('Are you sure you want to request a takedown for this release? This will remove it from all stores.')) {
                                        try {
                                            await apiService.requestTakedown(release.id);
                                            alert('Request submitted.');
                                            // Re-fetch releases to update UI without reload
                                            const updated = await apiService.getReleases(release.userId);
                                            // Filter and sort same as initial load
                                            const myReleases = updated.filter((r: Release) => r.userId === release.userId)
                                                .sort((a: Release, b: Release) => {
                                                    const dateA = new Date(a.createdDate || 0).getTime();
                                                    const dateB = new Date(b.createdDate || 0).getTime();
                                                    if (dateA !== dateB) return dateB - dateA;
                                                    return b.id.localeCompare(a.id);
                                                });
                                            setReleases(myReleases);
                                        } catch (e) {
                                            alert('Failed to submit request.');
                                        }
                                    }
                                }}>
                                    Request Takedown
                                </Button>
                            )}
                        </div>
                    </div>
                ))
                }
            </div >
        );
    };

    return (
        <div className="space-y-6">
            {/* Modal */}
            {viewingReason && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setViewingReason(null)}>
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewingReason(null)} className="absolute top-4 right-4 text-[#666] hover:text-white"><X size={20} /></button>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Rejection Reason</h3>
                            <p className="text-[#CCC] bg-[#111] p-4 rounded-xl border border-[#333] w-full text-sm">
                                {viewingReason}
                            </p>
                            <Button className="mt-6 w-full" onClick={() => navigate('/support')}>Contact Support</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-display text-white">My Releases</h1>
                <Button onClick={() => navigate('/releases/create')}>+ New Release</Button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 border-b border-[#333] pb-4 overflow-x-auto">
                {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'DRAFT'].map(status => (
                    <button
                        key={status}
                        onClick={() => setActiveTab(status as any)}
                        className={`
                            px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                            ${activeTab === status
                                ? 'bg-white text-black shadow-lg scale-105'
                                : 'bg-[#111] text-[#666] hover:bg-[#222] hover:text-white border border-[#333]'}
                        `}
                    >
                        {status === 'ALL' ? 'All Releases' : status}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-[#666]">Loading catalog...</div>
            ) : (
                renderReleaseList(releases.filter(r => activeTab === 'ALL' ? true : r.status === activeTab))
            )}
        </div>
    );
};

export default Releases;
