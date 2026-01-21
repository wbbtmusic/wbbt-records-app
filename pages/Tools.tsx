import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Card, Button, Badge } from '../components/ui.tsx';
import { Music, Youtube, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

interface Claim {
    id: string;
    type: 'spotify' | 'youtube';
    email: string;
    artistName?: string;
    artistLink?: string;
    channelUrl?: string;
    status: string;
    rejectionReason?: string;
    createdAt?: string;
}

// Moved outside component to prevent re-creation on every render
const WhiteInput = ({ label, ...props }: any) => (
    <div className="flex flex-col gap-2 mb-4 w-full">
        {label && <label className="text-xs font-bold text-white uppercase tracking-wider">{label}</label>}
        <input
            className="h-[50px] bg-black/30 border border-white/20 rounded-xl px-4 text-white placeholder-white/40 focus:border-white/50 focus:outline-none transition-all text-sm"
            {...props}
        />
    </div>
);

const WhiteSelect = ({ label, options, ...props }: any) => (
    <div className="flex flex-col gap-2 mb-4 w-full">
        {label && <label className="text-xs font-bold text-white uppercase tracking-wider">{label}</label>}
        <select
            className="h-[50px] bg-black/30 border border-white/20 rounded-xl px-4 text-white focus:border-white/50 focus:outline-none transition-all text-sm appearance-none cursor-pointer"
            {...props}
        >
            <option value="" className="bg-black">Select artist...</option>
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value} className="bg-black text-white">{opt.label}</option>
            ))}
        </select>
    </div>
);

const Tools: React.FC = () => {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Spotify Form
    const [spotifyEmail, setSpotifyEmail] = useState('');
    const [spotifyArtist, setSpotifyArtist] = useState('');
    const [spotifyLink, setSpotifyLink] = useState('');
    const [spotifySubmitting, setSpotifySubmitting] = useState(false);

    // YouTube Form
    const [youtubeEmail, setYoutubeEmail] = useState('');
    const [youtubeArtist, setYoutubeArtist] = useState('');
    const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
    const [youtubeSubmitting, setYoutubeSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

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

    const handleSpotifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!spotifyEmail) {
            alert('Please enter your Spotify account email.');
            return;
        }
        if (!spotifyArtist) {
            alert('Please select an artist.');
            return;
        }
        setSpotifySubmitting(true);
        try {
            await apiService.createClaim({
                type: 'spotify',
                email: spotifyEmail,
                artistName: spotifyArtist,
                artistLink: spotifyLink
            });
            alert('Spotify claim submitted successfully!');
            setSpotifyEmail('');
            setSpotifyArtist('');
            setSpotifyLink('');
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to submit claim');
        }
        setSpotifySubmitting(false);
    };

    const handleYoutubeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!youtubeEmail || !youtubeChannelUrl) {
            alert('Please enter both email and channel URL.');
            return;
        }
        if (!youtubeArtist) {
            alert('Please select an artist.');
            return;
        }
        // Validate YouTube channel URL format
        const ytPattern = /^https:\/\/(www\.)?youtube\.com\/channel\/UC[a-zA-Z0-9_-]{22}$/;
        if (!ytPattern.test(youtubeChannelUrl)) {
            alert('Invalid YouTube channel URL format. Must be: https://www.youtube.com/channel/UC...');
            return;
        }
        setYoutubeSubmitting(true);
        try {
            await apiService.createClaim({
                type: 'youtube',
                email: youtubeEmail,
                artistName: youtubeArtist,
                channelUrl: youtubeChannelUrl
            });
            alert('YouTube claim submitted successfully!');
            setYoutubeEmail('');
            setYoutubeArtist('');
            setYoutubeChannelUrl('');
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to submit claim');
        }
        setYoutubeSubmitting(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle size={14} className="text-green-500" />;
            case 'REJECTED': return <XCircle size={14} className="text-red-500" />;
            default: return <Clock size={14} className="text-yellow-500" />;
        }
    };

    const spotifyClaims = claims.filter(c => c.type === 'spotify');
    const youtubeClaims = claims.filter(c => c.type === 'youtube');

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-[#666]">Loading...</div>;
    }

    const artistOptions = artists.map(a => ({ value: a.name, label: a.name }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-display text-white mb-2">Tools</h1>
                <p className="text-[#888]">Access platform tools and claim your artist profiles.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Spotify Claim */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1DB954 0%, #121212 100%)' }}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center">
                                <Music size={24} className="text-black" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white font-display">Spotify for Artists</h2>
                                <p className="text-xs text-white/70">Get verified and access analytics</p>
                            </div>
                        </div>

                        <form onSubmit={handleSpotifySubmit} className="space-y-2">
                            <WhiteInput
                                label="Spotify Account Email"
                                type="email"
                                placeholder="your-spotify@email.com"
                                value={spotifyEmail}
                                onChange={(e: any) => setSpotifyEmail(e.target.value)}
                                required
                            />
                            <WhiteSelect
                                label="Select Artist"
                                options={artistOptions}
                                value={spotifyArtist}
                                onChange={(e: any) => setSpotifyArtist(e.target.value)}
                            />
                            <WhiteInput
                                label="Spotify Artist Link (Optional)"
                                placeholder="https://open.spotify.com/artist/..."
                                value={spotifyLink}
                                onChange={(e: any) => setSpotifyLink(e.target.value)}
                            />
                            <Button type="submit" disabled={spotifySubmitting} className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold">
                                <Send size={16} className="mr-2" />
                                {spotifySubmitting ? 'Submitting...' : 'Submit Claim'}
                            </Button>
                        </form>

                        {spotifyClaims.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h4 className="text-xs font-bold text-white/70 uppercase mb-3">Your Claims</h4>
                                <div className="space-y-2">
                                    {spotifyClaims.map(claim => (
                                        <div key={claim.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(claim.status)}
                                                <span className="text-sm text-white">{claim.artistName || claim.email}</span>
                                            </div>
                                            <Badge status={claim.status} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* YouTube Claim */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF0000 0%, #121212 100%)' }}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-[#FF0000] rounded-full flex items-center justify-center">
                                <Youtube size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white font-display">Official Artist Channel</h2>
                                <p className="text-xs text-white/70">Merge your channel with topic channel</p>
                            </div>
                        </div>

                        <form onSubmit={handleYoutubeSubmit} className="space-y-2">
                            <WhiteInput
                                label="Contact Email"
                                type="email"
                                placeholder="your-email@example.com"
                                value={youtubeEmail}
                                onChange={(e: any) => setYoutubeEmail(e.target.value)}
                                required
                            />
                            <WhiteSelect
                                label="Select Artist"
                                options={artistOptions}
                                value={youtubeArtist}
                                onChange={(e: any) => setYoutubeArtist(e.target.value)}
                            />
                            <div>
                                <WhiteInput
                                    label="YouTube Channel URL"
                                    placeholder="https://www.youtube.com/channel/UCXgUj..."
                                    value={youtubeChannelUrl}
                                    onChange={(e: any) => setYoutubeChannelUrl(e.target.value)}
                                    required
                                />
                                <p className="text-[10px] text-white/60 -mt-2 ml-1">
                                    Format: https://www.youtube.com/channel/UC... (22 characters after UC)
                                </p>
                            </div>
                            <Button type="submit" disabled={youtubeSubmitting} className="w-full bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold">
                                <Send size={16} className="mr-2" />
                                {youtubeSubmitting ? 'Submitting...' : 'Submit Claim'}
                            </Button>
                        </form>

                        {youtubeClaims.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h4 className="text-xs font-bold text-white/70 uppercase mb-3">Your Claims</h4>
                                <div className="space-y-2">
                                    {youtubeClaims.map(claim => (
                                        <div key={claim.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(claim.status)}
                                                <span className="text-sm text-white">{claim.artistName || claim.email}</span>
                                            </div>
                                            <Badge status={claim.status} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tools;
