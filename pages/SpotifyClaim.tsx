import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import SpotifyClaimCard from '../components/tools/SpotifyClaimCard';
import {
    Info, CheckCircle2, ExternalLink, Play,
    BarChart2, UserCheck, Music2, Megaphone,
    ChevronRight, Globe, LifeBuoy
} from 'lucide-react';

const SpotifyClaim: React.FC = () => {
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

    // Helper for Status Icons (recreated here for sidebar use)
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'REJECTED': return <AlertCircle size={16} className="text-red-500" />;
            default: return <LifeBuoy size={16} className="text-yellow-500" />; // Using LifeBuoy as pending/clock replacement if Clock not imported, or import Clock.
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            APPROVED: "bg-green-500/20 text-green-500 border-green-500/20",
            REJECTED: "bg-red-500/20 text-red-500 border-red-500/20",
            PENDING: "bg-yellow-500/20 text-yellow-500 border-yellow-500/20"
        };
        const style = styles[status as keyof typeof styles] || styles.PENDING;
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${style}`}>
                {status}
            </span>
        );
    };

    const spotifyClaims = claims.filter(c => c.type === 'spotify');

    const Step = ({ num, title, desc }: { num: string, title: string, desc: string }) => (
        <div className="flex gap-4 p-4 bg-[#111] border border-[#222] rounded-xl hover:bg-[#151515] transition-colors group">
            <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 transition-transform">
                {num}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-[#888] leading-relaxed">{desc}</p>
            </div>
        </div>
    );

    const Benefit = ({ icon: Icon, title, desc }: any) => (
        <div className="p-4 bg-[#111] border border-[#222] rounded-xl hover:border-[#1DB954]/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#1DB954]/10 flex items-center justify-center mb-3 text-[#1DB954]">
                <Icon size={20} />
            </div>
            <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
            <p className="text-[11px] text-[#888] leading-relaxed">{desc}</p>
        </div>
    );

    const QuickLink = ({ icon: Icon, title, subtitle }: any) => (
        <a href="#" className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-xl hover:bg-[#151515] group transition-all">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1DB954] flex items-center justify-center text-black">
                    <Icon size={16} />
                </div>
                <div>
                    <h5 className="font-bold text-white text-xs">{title}</h5>
                    <p className="text-[10px] text-[#666]">{subtitle}</p>
                </div>
            </div>
            <ChevronRight size={16} className="text-[#444] group-hover:text-white transition-colors" />
        </a>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 lg:px-8">
            {/* Header */}
            <div className="flex items-center gap-6 mb-10 mt-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-3 shadow-xl">
                    <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_CMYK_Green.png" alt="Spotify" className="w-full h-full object-contain" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold font-display text-white mb-2">Spotify for Artists</h1>
                    <p className="text-[#888] text-base">Claim and manage your artist profile on Spotify.</p>
                </div>
            </div>

            {/* Alert */}
            <div className="bg-[#1DB954] rounded-2xl p-6 flex items-start gap-5 mb-10 shadow-lg shadow-[#1DB954]/10">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#1DB954] mt-0.5 shrink-0 shadow-sm">
                    <Info size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-black text-lg mb-1">What is Spotify for Artists?</h3>
                    <p className="text-black/80 text-sm font-medium leading-relaxed max-w-3xl">
                        Spotify for Artists is a free tool that lets you understand who is listening to your music, control your audience, and customize your profile.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
                {/* Left Column - Steps & Content */}
                <div className="xl:col-span-8 space-y-10">
                    {/* Steps */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4 border-b border-[#222] pb-4">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <span className="bg-[#1DB954] w-1.5 h-6 rounded-full"></span>
                                How to Apply?
                            </h3>
                        </div>
                        <div className="grid gap-4">
                            <Step
                                num="1"
                                title="Go to Spotify for Artists Page"
                                desc="Log in or create an account on the Spotify for Artists platform."
                            />
                            <Step
                                num="2"
                                title="Find Your Artist Profile"
                                desc="Search for the artist profile where your music is released on Spotify."
                            />
                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl ml-14 text-blue-400 text-sm flex items-start gap-3">
                                <Info size={18} className="shrink-0 mt-0.5" />
                                <span>Make sure to select the exact artist name and the correct profile.</span>
                            </div>
                            <Step
                                num="3"
                                title="Verify Ownership"
                                desc="Spotify offers several ways to verify that you are the artist."
                            />
                            <div className="space-y-3 ml-14">
                                <div className="flex items-center gap-3 text-sm text-[#888]">
                                    <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
                                    Social Media: Link your Instagram, Facebook, or Twitter accounts
                                </div>
                                <div className="flex items-center gap-3 text-sm text-[#888]">
                                    <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
                                    Music Distributor: Automatic verification via Distrokid, Tunecore, etc.
                                </div>
                            </div>
                            <Step
                                num="4"
                                title="Wait for Approval"
                                desc="Your application is usually reviewed and approved within 1-3 business days."
                            />
                        </div>
                    </div>

                    {/* Advantages */}
                    <div>
                        <div className="flex items-center gap-3 mb-6 border-b border-[#222] pb-4">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <span className="bg-[#1DB954] w-1.5 h-6 rounded-full"></span>
                                Advantages
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Benefit icon={BarChart2} title="Detailed Analytics" desc="Stream counts, listener demographics, playlist data." />
                            <Benefit icon={UserCheck} title="Profile Customization" desc="Add bio, photos, and social media links." />
                            <Benefit icon={Megaphone} title="Playlist Pitching" desc="Pitch your new songs to Spotify editorial playlists." />
                            <Benefit icon={Music2} title="Promotional Tools" desc="Special tools like Canvas and Artist Pick." />
                        </div>
                    </div>
                </div>

                {/* Right Column - Form & Sidebar */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Application Form */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-[#222] bg-[#0A0A0A]">
                            <h3 className="font-bold text-white text-base">Claim Application</h3>
                        </div>
                        <SpotifyClaimCard
                            claims={claims}
                            artists={artists}
                            onClaimSubmit={loadData}
                            variant="simple"
                        />
                    </div>

                    {/* Application Status */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-[#222] bg-[#0A0A0A] flex items-center justify-between">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Info size={16} /> Application Status
                            </h3>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                                {spotifyClaims.length} Requests
                            </span>
                        </div>

                        {spotifyClaims.length > 0 ? (
                            <div className="divide-y divide-[#222]">
                                {spotifyClaims.map((claim) => (
                                    <div key={claim.id} className="p-4 hover:bg-[#161616] transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(claim.status)}
                                                <span className="font-bold text-white text-sm">{claim.artistName || claim.email}</span>
                                            </div>
                                            <StatusBadge status={claim.status} />
                                        </div>
                                        {claim.artistLink && (
                                            <div className="text-[10px] text-[#666] truncate pl-6">
                                                {claim.artistLink}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2 pl-6 text-[10px] text-[#555]">
                                            <span>Submitted on {new Date(claim.createdAt || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 flex flex-col items-center justify-center text-center opacity-40">
                                <div className="w-12 h-12 border-2 border-white rounded-xl mb-3 border-dashed"></div>
                                <p className="text-xs text-white font-medium">No claim requests found</p>
                                <p className="text-[10px] text-[#888] mt-1 max-w-[200px]">Requests submitted in the form above will appear here.</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                        <h3 className="font-bold text-white text-base mb-5 flex items-center gap-2">
                            <ExternalLink size={16} /> Quick Links
                        </h3>
                        <div className="space-y-3">
                            <QuickLink icon={Globe} title="Spotify For Artists" subtitle="Official Platform" />
                            <QuickLink icon={UserCheck} title="Creator Center" subtitle="Support for Artists" />
                            <QuickLink icon={Music2} title="Guides & Tips" subtitle="Music Business & Canvas" />
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                        <h3 className="font-bold text-white text-base mb-5 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Requirements
                        </h3>
                        <div className="space-y-4">
                            {[
                                "At least 1 song released on Spotify",
                                "Ownership of the artist profile",
                                "Social media or email for verification",
                                "Music distributor approval (optional)"
                            ].map((req, i) => (
                                <div key={i} className="flex items-start gap-3 text-xs text-[#AAA] leading-relaxed">
                                    <div className="w-5 h-5 rounded-full bg-[#1DB954]/10 flex items-center justify-center shrink-0 mt-[-2px]">
                                        <CheckCircle2 size={12} className="text-[#1DB954]" />
                                    </div>
                                    {req}
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-[#222] text-center">
                            <p className="text-[10px] text-[#666]">All requirements are met by our company</p>
                        </div>
                    </div>

                    {/* Video Guide */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                        <h3 className="font-bold text-white text-base mb-5 flex items-center gap-2">
                            <Play size={16} /> Video Guide
                        </h3>
                        <div className="aspect-video bg-black rounded-xl border border-[#222] flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-lg">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center relative z-10 shadow-xl group-hover:scale-110 transition-transform">
                                <Play size={24} className="text-white fill-white ml-1" />
                            </div>
                            <span className="absolute bottom-4 text-xs text-white/90 font-bold z-10 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Coming soon</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpotifyClaim;
