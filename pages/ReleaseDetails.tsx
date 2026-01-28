import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Release, Track } from '../types';
import { Button, Badge } from '../components/ui.tsx';
import { ArrowLeft, Edit2, Disc, Music, Calendar, Building, Globe, Tag, DollarSign, FileText, ExternalLink } from 'lucide-react';

const ReleaseDetails: React.FC = () => {
    const params = useParams();
    const navigate = useNavigate();
    const [release, setRelease] = useState<Release | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [copyrights, setCopyrights] = useState<any>({}); // Store copyright data per track
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [showDocs, setShowDocs] = useState(false);

    useEffect(() => {
        const fetchRelease = async () => {
            try {
                // Fetch Release
                const releaseData = await apiService.getReleaseById(params.id!);
                // Fetch Tracks
                const tracksData = await apiService.getTracksByRelease(params.id!);

                // Fetch Copyright Data for each track
                const copyrightData: any = {};
                for (const t of tracksData) {
                    try {
                        const check = await apiService.getTrackCopyrightStatus(t.id);
                        if (check) copyrightData[t.id] = check;
                    } catch (e) { }
                }

                setRelease(releaseData);
                setTracks(tracksData);
                setCopyrights(copyrightData);
            } catch (error) {
                console.error('Error fetching details:', error);
                navigate('/releases'); // Navigate back if release not found or error
            } finally {
                setLoading(false);
            }
        };

        fetchRelease();
    }, [params.id, navigate]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">Live</span>;
            case 'PENDING': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Pending</span>;
            case 'REJECTED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">Rejected</span>;
            case 'TAKEDOWN_REQUESTED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">Takedown Req</span>;
            case 'TAKEDOWN_APPROVED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">Taken Down</span>;
            default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">{status}</span>;
        }
    };

    const getCopyrightBadge = (trackId: string) => {
        const status = copyrights[trackId]?.status;
        if (!status) return null; // No check yet

        if (status === 'MATCH') {
            const match = copyrights[trackId].match_data ? JSON.parse(copyrights[trackId].match_data).matches[0] : {};
            return (
                <div className="group relative ml-2 inline-flex items-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 cursor-help">
                        COPYRIGHT MATCH
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 rounded-lg bg-black border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-xs">
                        <p className="font-bold text-white mb-1">Match Detected:</p>
                        <p><span className="text-gray-400">Title:</span> {match.title}</p>
                        <p><span className="text-gray-400">Artist:</span> {match.artist}</p>
                        <p><span className="text-gray-400">Score:</span> {match.score}%</p>
                    </div>
                </div>
            );
        }
        if (status === 'NO_MATCH') {
            return <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500/50 border border-green-500/20">Clean</span>;
        }
        return <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-500">Checking...</span>;
    };
    const InfoRow = ({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: any }) => (
        <div className="flex items-center gap-3 py-3 border-b border-[#222]">
            {Icon && <Icon size={16} className="text-[#666] flex-shrink-0" />}
            <span className="text-[#888] w-36 flex-shrink-0">{label}</span>
            <span className="text-white font-medium">{value || 'N/A'}</span>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!release) {
        return null;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/releases')} className="flex items-center gap-2 text-[#888] hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Releases</span>
                </button>
                <Button onClick={() => navigate(`/releases/edit/${release.id}`)}>
                    <Edit2 size={16} className="mr-2" />
                    Edit Release
                </Button>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#2a2a2a] rounded-2xl p-8 flex gap-8">
                <img
                    src={release.coverUrl || 'https://via.placeholder.com/200'}
                    alt="Cover"
                    className="w-48 h-48 rounded-xl object-cover shadow-2xl bg-[#222] flex-shrink-0"
                />
                <div className="flex-1">
                    <Badge status={release.status} />
                    <h1 className="text-4xl font-bold text-white mt-3 mb-2">{release.title || 'Untitled Release'}</h1>
                    <p className="text-lg text-[#888] mb-4">{release.mainArtist || 'Unknown Artist'}</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                        <span className="bg-[#222] px-3 py-1 rounded-full text-[#aaa]">{release.type}</span>
                        <span className="bg-[#222] px-3 py-1 rounded-full text-[#aaa]">{release.genre}</span>
                        {release.subGenre && <span className="bg-[#222] px-3 py-1 rounded-full text-[#aaa]">{release.subGenre}</span>}
                        <span className="bg-[#222] px-3 py-1 rounded-full text-[#aaa]">{(release.tracks || []).length} Tracks</span>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Release Info */}
                <div className="bg-[#121212] border border-[#222] rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Disc size={18} className="text-indigo-400" />
                        Release Information
                    </h2>
                    <InfoRow label="UPC" value={release.upc && !release.upc.startsWith('WBBT') ? release.upc : null} icon={Tag} />
                    <InfoRow label="WUPC (Internal)" value={release.wupc || null} icon={Tag} />
                    <InfoRow label="Release Date" value={release.releaseDate} icon={Calendar} />
                    <InfoRow label="Original Release" value={release.originalReleaseDate} icon={Calendar} />
                    <InfoRow label="Record Label" value={release.recordLabel} icon={Building} />
                    <InfoRow label="Territory" value={release.territory} icon={Globe} />
                </div>

                {/* Copyright Info */}
                <div className="bg-[#121212] border border-[#222] rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-indigo-400" />
                        Copyright & Legal
                    </h2>
                    <InfoRow label="© Line" value={release.cLine} />
                    <InfoRow label="© Year" value={release.cYear} />
                    <InfoRow label="℗ Line" value={release.pLine} />
                    <InfoRow label="℗ Year" value={release.pYear} />
                    <InfoRow label="Distributed Before" value={release.distributedBefore ? 'Yes' : 'No'} />
                </div>
            </div>

            {/* Monetization */}
            {release.monetization && (
                <div className="bg-[#121212] border border-[#222] rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-green-400" />
                        Monetization Settings
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(release.monetization as Record<string, boolean>).map(([key, value]) => (
                            <div key={key} className={`p-3 rounded-lg border ${value ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-[#1a1a1a] border-[#333] text-[#666]'}`}>
                                <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="block text-xs mt-1">{value ? 'Enabled' : 'Disabled'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tracks */}
            <div className="bg-[#121212] border border-[#222] rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Music size={18} className="text-indigo-400" />
                    Tracklist ({(release.tracks || []).length})
                </h2>
                <div className="space-y-3">
                    {(release.tracks || []).map((track: Track, index: number) => (
                        <div key={track.id} className="flex items-center gap-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#444] transition-colors">
                            <span className="text-[#666] w-8 text-center font-mono">{index + 1}</span>
                            <div className="flex-1">
                                <div>
                                    <div className="flex items-center">
                                        <h4 className="font-medium text-white">{track.title}</h4>
                                        {getCopyrightBadge(track.id)}
                                    </div>
                                    <p className="text-sm text-[#888]">{track.version || 'Original Mix'} • {track.isExplicit ? 'Explicit' : 'Clean'}</p>
                                </div>              <div className="flex gap-4 mt-1 text-xs text-[#888]">
                                    {track.isrc && <span>ISRC: {track.isrc}</span>}
                                    {track.language && <span>Lang: {track.language}</span>}
                                    {track.isExplicit && <span className="text-red-400">Explicit</span>}
                                    {track.isInstrumental && <span className="text-blue-400">Instrumental</span>}
                                </div>
                            </div>
                            {track.fileUrl && (
                                <a href={track.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                                    <ExternalLink size={16} />
                                </a>
                            )}
                        </div>
                    ))}
                    {(release.tracks || []).length === 0 && (
                        <p className="text-[#666] text-center py-8">No tracks added yet.</p>
                    )}
                </div>
            </div>

            {/* Selected Stores */}
            {release.selectedStores && release.selectedStores.length > 0 && (
                <div className="bg-[#121212] border border-[#222] rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Globe size={18} className="text-indigo-400" />
                        Distribution Platforms
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {release.selectedStores.map((store: string) => (
                            <span key={store} className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-full text-sm text-[#aaa]">
                                {store}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReleaseDetails;
