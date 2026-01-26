import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { Button, Badge } from '../ui';
import { Music, Send, CheckCircle, Clock, XCircle } from 'lucide-react';

interface SpotifyClaimCardProps {
    claims: any[];
    artists: any[];
    onClaimSubmit: () => void;
    variant?: 'card' | 'simple';
}

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

const SpotifyClaimCard: React.FC<SpotifyClaimCardProps> = ({ claims, artists, onClaimSubmit, variant = 'card' }) => {
    const [email, setEmail] = useState('');
    const [artist, setArtist] = useState('');
    const [link, setLink] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            alert('Please enter your Spotify account email.');
            return;
        }
        if (!artist) {
            alert('Please select an artist.');
            return;
        }
        setSubmitting(true);
        try {
            await apiService.createClaim({
                type: 'spotify',
                email: email,
                artistName: artist,
                artistLink: link
            });
            alert('Spotify claim submitted successfully!');
            setEmail('');
            setArtist('');
            setLink('');
            onClaimSubmit();
        } catch (e: any) {
            alert(e.message || 'Failed to submit claim');
        }
        setSubmitting(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle size={14} className="text-green-500" />;
            case 'REJECTED': return <XCircle size={14} className="text-red-500" />;
            default: return <Clock size={14} className="text-yellow-500" />;
        }
    };

    const artistOptions = artists.map(a => ({ value: a.name, label: a.name }));
    const spotifyClaims = claims.filter(c => c.type === 'spotify');

    const renderFormContent = () => (
        <form onSubmit={handleSubmit} className="space-y-2">
            <WhiteInput
                label="Spotify Account Email"
                type="email"
                placeholder="your-spotify@email.com"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
            />
            <WhiteSelect
                label="Select Artist"
                options={artistOptions}
                value={artist}
                onChange={(e: any) => setArtist(e.target.value)}
            />
            <WhiteInput
                label="Spotify Artist Link (Optional)"
                placeholder="https://open.spotify.com/artist/..."
                value={link}
                onChange={(e: any) => setLink(e.target.value)}
            />
            <Button type="submit" disabled={submitting} className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold">
                <Send size={16} className="mr-2" />
                {submitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
        </form>
    );

    const ClaimsList = () => (
        spotifyClaims.length > 0 ? (
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
        ) : null
    );

    if (variant === 'simple') {
        return (
            <div className="p-6">
                {renderFormContent()}
            </div>
        );
    }

    return (
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
                {renderFormContent()}
                <ClaimsList />
            </div>
        </div>
    );
};

export default SpotifyClaimCard;
