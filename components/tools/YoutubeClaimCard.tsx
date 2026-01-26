import React, { useState } from 'react';
import { apiService } from '../../services/apiService';
import { Button, Badge } from '../ui';
import { Youtube, Send, CheckCircle, Clock, XCircle } from 'lucide-react';

interface YoutubeClaimCardProps {
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

const YoutubeClaimCard: React.FC<YoutubeClaimCardProps> = ({ claims, artists, onClaimSubmit, variant = 'card' }) => {
    const [email, setEmail] = useState('');
    const [artist, setArtist] = useState('');
    const [channelUrl, setChannelUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !channelUrl) {
            alert('Please enter both email and channel URL.');
            return;
        }
        if (!artist) {
            alert('Please select an artist.');
            return;
        }
        // Validate YouTube channel URL format
        const ytPattern = /^https:\/\/(www\.)?youtube\.com\/channel\/UC[a-zA-Z0-9_-]{22}$/;
        if (!ytPattern.test(channelUrl)) {
            alert('Invalid YouTube channel URL format. Must be: https://www.youtube.com/channel/UC...');
            return;
        }
        setSubmitting(true);
        try {
            await apiService.createClaim({
                type: 'youtube',
                email: email,
                artistName: artist,
                channelUrl: channelUrl
            });
            alert('YouTube claim submitted successfully!');
            setEmail('');
            setArtist('');
            setChannelUrl('');
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
    const youtubeClaims = claims.filter(c => c.type === 'youtube');

    const renderFormContent = () => (
        <form onSubmit={handleSubmit} className="space-y-2">
            <WhiteInput
                label="Contact Email"
                type="email"
                placeholder="your-email@example.com"
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
            <div>
                <WhiteInput
                    label="YouTube Channel URL"
                    placeholder="https://www.youtube.com/channel/UCXgUj..."
                    value={channelUrl}
                    onChange={(e: any) => setChannelUrl(e.target.value)}
                    required
                />
                <p className="text-[10px] text-white/60 -mt-2 ml-1">
                    Format: https://www.youtube.com/channel/UC... (22 characters after UC)
                </p>
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold">
                <Send size={16} className="mr-2" />
                {submitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
        </form>
    );

    const ClaimsList = () => (
        youtubeClaims.length > 0 ? (
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
                {renderFormContent()}
                <ClaimsList />
            </div>
        </div>
    );
};

export default YoutubeClaimCard;
