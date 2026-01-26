import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import YoutubeClaimCard from '../components/tools/YoutubeClaimCard';
import {
    Info, CheckCircle2, Youtube, Music, Shield, Users,
    Share2, AlertCircle, LifeBuoy, BarChart3, Radio
} from 'lucide-react';

const YoutubeClaim: React.FC = () => {
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
            default: return <LifeBuoy size={16} className="text-yellow-500" />;
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

    const youtubeClaims = claims.filter(c => c.type === 'youtube');

    const RequirementCard = ({ icon: Icon, title, desc, status }: any) => (
        <div className="flex gap-4 p-4 bg-[#111] border border-[#222] rounded-xl hover:bg-[#151515] transition-colors group">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${status ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-[#888] leading-relaxed mb-2">{desc}</p>
                <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${status ? 'text-green-500' : 'text-red-500'}`}>
                    {status ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {status ? 'Requirement Met' : 'Requirement Not Met'}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 lg:px-8">
            {/* Header */}
            <div className="flex items-center gap-6 mb-10 mt-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-3 shadow-xl">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png" alt="YouTube" className="w-full h-full object-contain" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold font-display text-white mb-2">YouTube Official Artist Channel</h1>
                    <p className="text-[#888] text-base">Get the verified artist badge and merge your channel with your music topic.</p>
                </div>
            </div>

            {/* Alert */}
            <div className="bg-[#FF0000] rounded-2xl p-6 flex items-start gap-5 mb-10 shadow-lg shadow-[#FF0000]/10">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#FF0000] mt-0.5 shrink-0 shadow-sm">
                    <Info size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg mb-1">What is YouTube OAC?</h3>
                    <p className="text-white/80 text-sm font-medium leading-relaxed max-w-3xl">
                        Official Artist Channel (OAC) brings together all your content from your different YouTube channels into one place. It also automatically programs your music and gives you new ways to engage with fans.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
                {/* Left Column - Requirements */}
                <div className="xl:col-span-8 space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#222] pb-4">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <span className="bg-[#FF0000] w-1.5 h-6 rounded-full"></span>
                                Requirements
                            </h3>
                        </div>
                        <div className="grid gap-4">
                            <RequirementCard
                                icon={Music}
                                title="Music on YouTube"
                                desc="Artist must have at least 3 official releases delivered to YouTube Music (Topic Channel)."
                                status={true}
                            />
                            <RequirementCard
                                icon={Shield}
                                title="Channel Ownership"
                                desc="You must own and operate the YouTube channel you are applying for."
                                status={false}
                            />
                            <RequirementCard
                                icon={Users}
                                title="Subscribers & Watch Time"
                                desc="No minimum subscriber count required, but active engagement is recommended."
                                status={true}
                            />
                            <RequirementCard
                                icon={Share2}
                                title="Distributor Approval"
                                desc="Must be approved by your music distributor (our panel)."
                                status={true}
                            />
                            <RequirementCard
                                icon={Radio}
                                title="Topic Channel Match"
                                desc="Requires a match with an auto-generated Topic channel."
                                status={false}
                            />
                        </div>
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-4 mt-6">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={18} className="text-green-500" />
                            </div>
                            <div>
                                <h4 className="text-green-400 text-sm font-bold">You meet all requirements</h4>
                                <p className="text-[#888] text-xs">You can apply for OAC using the form.</p>
                            </div>
                        </div>
                    </div>

                    {/* Advantages */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                        <h3 className="font-bold text-white text-lg mb-6 flex items-center gap-2 border-b border-[#222] pb-4">
                            <Youtube size={20} /> OAC Advantages
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                "Verified artist note icon",
                                "Automatic topic channel merge",
                                "Advanced analytics in Studio",
                                "Concert tickets and merchandise",
                                "Promotional opportunities"
                            ].map((req, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-[#AAA]">
                                    <div className="w-5 h-5 rounded-full bg-[#FF0000]/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={12} className="text-[#FF0000]" />
                                    </div>
                                    {req}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Application Form */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-[#222] bg-[#0A0A0A]">
                            <h3 className="font-bold text-white text-base">OAC Application</h3>
                        </div>
                        <YoutubeClaimCard
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
                                {youtubeClaims.length} Requests
                            </span>
                        </div>

                        {youtubeClaims.length > 0 ? (
                            <div className="divide-y divide-[#222]">
                                {youtubeClaims.map((claim) => (
                                    <div key={claim.id} className="p-4 hover:bg-[#161616] transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(claim.status)}
                                                <span className="font-bold text-white text-sm">{claim.artistName || claim.email}</span>
                                            </div>
                                            <StatusBadge status={claim.status} />
                                        </div>
                                        {claim.channelUrl && (
                                            <div className="text-[10px] text-[#666] truncate pl-6">
                                                {claim.channelUrl}
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
                                <p className="text-xs text-white font-medium">No OAC applications found</p>
                                <p className="text-[10px] text-[#888] mt-1 max-w-[200px]">Applications submitted in the form above will appear here.</p>
                            </div>
                        )}
                    </div>

                    {/* Help Box */}
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-6">
                        <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                            <LifeBuoy size={16} /> Need Help?
                        </h3>
                        <p className="text-xs text-[#666] mb-5 leading-relaxed">Contact our support team for OAC application assistance.</p>
                        <button className="w-full py-2.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2">
                            <LifeBuoy size={14} /> Create Support Ticket
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default YoutubeClaim;

