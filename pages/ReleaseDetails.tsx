import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Release, Track } from '../types';
import { Button, Badge } from '../components/ui.tsx';
import { ArrowLeft, Edit2, Disc, Music, Calendar, Building, Globe, Tag, DollarSign, FileText, ExternalLink } from 'lucide-react';

const ReleaseDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [release, setRelease] = useState<Release | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelease = async () => {
            try {
                const releases = await apiService.getReleases();
                const found = releases.find((r: Release) => r.id === id);
                if (found) {
                    setRelease(found);
                } else {
                    navigate('/releases');
                }
            } catch (e) {
                console.error('Failed to load release', e);
                navigate('/releases');
            } finally {
                setLoading(false);
            }
        };
        fetchRelease();
    }, [id, navigate]);

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

    const InfoRow = ({ label, value, icon: Icon }: { label: string; value?: string | number | null; icon?: any }) => (
        <div className="flex items-center gap-3 py-3 border-b border-[#222]">
            {Icon && <Icon size={16} className="text-[#666] flex-shrink-0" />}
            <span className="text-[#888] w-36 flex-shrink-0">{label}</span>
            <span className="text-white font-medium">{value || 'N/A'}</span>
        </div>
    );

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
                                <h3 className="text-white font-medium">{track.title} {track.version && <span className="text-[#666] text-sm">({track.version})</span>}</h3>
                                <div className="flex gap-4 mt-1 text-xs text-[#888]">
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
