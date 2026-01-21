import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Card, Badge } from '../components/ui.tsx';
import { Library, Music, LayoutGrid, List } from 'lucide-react';

const Catalog: React.FC = () => {
    const [releases, setReleases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await apiService.getReleases();
            setReleases(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Flatten tracks from all releases (Approved only for Catalog?)
    const allTracks = releases
        .filter(r => r.status === 'APPROVED')
        .flatMap(r => (r.tracks || []).map((t: any) => ({ ...t, releaseTitle: r.title, releaseDate: r.releaseDate, cover: r.coverUrl })));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white">Asset Catalog</h1>
                    <p className="text-[#888]">Manage individual track assets, ISRCs, and rights data.</p>
                </div>
                <div className="flex bg-[#111] rounded-lg p-1 border border-[#222]">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-[#666] hover:text-[#888]'}`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-[#666] hover:text-[#888]'}`}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {allTracks.length === 0 ? (
                <div className="p-12 text-center text-[#444] border border-dashed border-[#222] rounded-xl">
                    <Library size={48} className="mx-auto mb-4 opacity-50" />
                    No assets in catalog.
                </div>
            ) : viewMode === 'list' ? (
                <Card className="overflow-hidden p-0">
                    <table className="w-full text-left">
                        <thead className="bg-[#1A1A1A] text-xs font-bold text-[#666] uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Track</th>
                                <th className="p-4">Release</th>
                                <th className="p-4">ISRC</th>
                                <th className="p-4">Rights</th>
                                <th className="p-4">AI Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2A]">
                            {allTracks.map((track, i) => (
                                <tr key={`${track.id}-${i}`} className="hover:bg-[#151515] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#222] rounded flex items-center justify-center overflow-hidden">
                                                {track.cover ? <img src={track.cover} className="w-full h-full object-cover" /> : <Music size={14} className="text-[#666]" />}
                                            </div>
                                            <span className="text-white font-medium text-sm">{track.title}</span>
                                            {track.isExplicit && <span className="text-[8px] border border-[#666] px-1 rounded text-[#CCC]">E</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-[#AAA]">{track.releaseTitle}</td>
                                    <td className="p-4 text-xs font-mono text-[#666]">{track.isrc || '-'}</td>
                                    <td className="p-4 text-xs text-[#AAA]">{track.copyrightType}</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] px-2 py-1 rounded ${track.aiUsage === 'None' ? 'bg-[#222] text-[#888]' : 'bg-blue-900/30 text-blue-400 border border-blue-800'}`}>
                                            {track.aiUsage}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {allTracks.map((track, i) => (
                        <div key={`${track.id}-${i}`} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-[#444] transition-colors group">
                            <div className="aspect-square bg-[#222] relative overflow-hidden">
                                {track.cover ? (
                                    <img src={track.cover} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#444]"><Music size={32} /></div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-mono text-white bg-black/80 px-2 py-1 rounded">{track.isrc || 'No ISRC'}</span>
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-white text-sm line-clamp-1 mb-1">{track.title}</h3>
                                <p className="text-xs text-[#888] line-clamp-1">{track.releaseTitle}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${track.aiUsage === 'None' ? 'border-[#333] text-[#666]' : 'border-blue-900 text-blue-400 bg-blue-900/10'}`}>
                                        {track.aiUsage === 'None' ? 'Human' : 'AI'}
                                    </span>
                                    {track.isExplicit && <span className="text-[10px] border border-[#666] px-1 rounded text-[#CCC]">E</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Catalog;
