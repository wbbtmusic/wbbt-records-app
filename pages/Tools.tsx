import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import SpotifyClaimCard from '../components/tools/SpotifyClaimCard';
import YoutubeClaimCard from '../components/tools/YoutubeClaimCard';

const Tools: React.FC = () => {
    const [claims, setClaims] = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const currentUser = await apiService.getCurrentUser();
            if (!currentUser) {
                setLoading(false);
                return;
            }
            const [claimsData, artistsData] = await Promise.all([
                apiService.getClaims(),
                apiService.getArtistLibrary(currentUser.id)
            ]);
            setClaims(claimsData || []);
            setArtists(artistsData || []);
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-[#666]">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-display text-white mb-2">Tools</h1>
                <p className="text-[#888]">Access platform tools and claim your artist profiles.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SpotifyClaimCard
                    claims={claims}
                    artists={artists}
                    onClaimSubmit={loadData}
                />

                <YoutubeClaimCard
                    claims={claims}
                    artists={artists}
                    onClaimSubmit={loadData}
                />
            </div>
        </div>
    );
};

export default Tools;
