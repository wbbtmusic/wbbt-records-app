import React, { useState } from 'react';
import { Card } from '../components/ui.tsx';
import { ChevronDown, HelpCircle, Music, DollarSign, Share2, FileText, AlertTriangle } from 'lucide-react';

const FAQ: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>('general');
    const [openQuestion, setOpenQuestion] = useState<number | null>(null);

    const categories = [
        { id: 'general', name: 'General', icon: HelpCircle },
        { id: 'distribution', name: 'Distribution', icon: Share2 },
        { id: 'royalties', name: 'Royalties & Payments', icon: DollarSign },
        { id: 'copyright', name: 'Copyright & Legal', icon: FileText },
        { id: 'content', name: 'Content Guidelines', icon: AlertTriangle },
        { id: 'ai', name: 'AI Tools', icon: Music },
        { id: 'teams', name: 'Teams & Splits', icon: Share2 },
    ];

    const faqs = {
        general: [
            { q: "What is WBBT Records?", a: "WBBT Records is a next-generation music distribution platform that empowers independent artists to release their music to major streaming services like Spotify, Apple Music, and more." },
            { q: "How much does it cost?", a: "WBBT Records is free to join - there are no upfront fees. We operate on a 30% commission model, meaning you keep 70% of your royalties. This allows us to provide professional distribution services without charging subscription fees." },
            { q: "How do I get approved?", a: "After signing up, you must submit a demo track and link your social profiles. Our team reviews every application to ensure quality and authenticity. Approval typically takes 24-48 hours." },
            { q: "What is WUPC and WISRC?", a: "WUPC (WBBT UPC) and WISRC (WBBT ISRC) are our internal tracking codes. While your releases get standard UPC and ISRC codes for distribution, we also assign WBBT-specific codes for internal tracking, analytics, and support purposes. You can view both on your release details page." },
            { q: "Can I migrate from another distributor?", a: "Yes! You can bring your existing releases to WBBT. If you have UPC and ISRC codes from your previous distributor, enter them during the upload process to maintain streaming continuity." },
            { q: "How do I contact support?", a: "Go to the Support page from the sidebar to open a ticket. Our team typically responds within 24 hours. You can also email support@wbbt.net directly." },
            { q: "Is there a mobile app?", a: "Currently, WBBT Records is web-based and fully responsive for mobile browsers. A dedicated mobile app is in development." }
        ],
        distribution: [
            { q: "How long does distribution take?", a: "Once approved, your release is sent to stores immediately. Spotify usually takes 2-5 business days, Apple Music 1-3 days, and other stores up to 1-2 weeks. We recommend uploading at least 2 weeks in advance." },
            { q: "Can I choose which countries to distribute to?", a: "Yes, during the upload process you can select specific territories or choose Global distribution." },
            { q: "Can I edit a release after it's live?", a: "You can edit metadata (titles, credits) but you cannot change the audio file or ISRC. To change audio, you must issue a takedown and create a new release." },
            { q: "What stores do you distribute to?", a: "We distribute to over 150+ platforms including Spotify, Apple Music, Amazon Music, YouTube Music, TikTok, Instagram/Facebook, Deezer, Tidal, and many more." },
            { q: "What is UPC and ISRC?", a: "UPC (Universal Product Code) is a unique barcode for your entire release (album/EP/single). ISRC (International Standard Recording Code) is a unique code for each individual track. These are required for royalty tracking and are auto-generated if you don't provide them." },
            { q: "Can I bring my own UPC/ISRC?", a: "Yes, if you have existing codes from a previous distributor, you can enter them during the upload process. Otherwise, we'll generate new ones for you automatically." },
            { q: "What is a release timing strategy?", a: "'As Soon As Possible' puts your release on stores within days. 'Specific Date' lets you choose a precise release date. We recommend specific dates for larger campaigns so you can get playlist placements before the release goes live." },
            { q: "Can I schedule a release for a future date?", a: "Yes! Select 'Specific Date' during upload and choose a date at least 7 days in the future. This gives stores time to process and allows Spotify for Artists pre-save pitching." },
            { q: "How do I request a takedown?", a: "Go to My Releases, find the release, and click 'Request Takedown'. It will be removed from all platforms within 24-72 hours. Note: Some platforms may take longer to fully remove content." }
        ],
        royalties: [
            { q: "When do I get paid?", a: "Stores report royalties on a delay of 2-3 months. For example, earnings from January are usually reported and available for withdrawal in April." },
            { q: "What is the minimum withdrawal?", a: "The minimum withdrawal amount is $50. You can request a payout via Bank Transfer (IBAN/SWIFT) from your Earnings dashboard." },
            { q: "What is your commission rate?", a: "WBBT Records operates on a 30% commission model. You receive 70% of the royalties we collect from streaming platforms. This commission allows us to offer the service with no upfront costs or subscription fees." },
            { q: "How are royalties calculated?", a: "Each platform has its own per-stream rate. We collect all royalties from stores and after deducting our 30% commission, the remaining 70% is credited to your account balance." },
            { q: "Do I get analytics?", a: "Yes! Your Overview dashboard shows total streams, recent earnings, and monthly trends. We integrate with Spotify and YouTube APIs to bring you real-time listening data." },
            { q: "What payment methods do you support?", a: "We support IBAN (for European banks), SWIFT (for international banks), and PayPal. You can add your payment methods in your Profile settings." },
            { q: "Are there any fees for withdrawals?", a: "We don't charge withdrawal fees. However, your bank may apply incoming wire transfer fees depending on your account type and country." }
        ],
        copyright: [
            { q: "Do I own my master recordings?", a: "Yes, you retain 100% ownership of your master recordings and compositions. WBBT Records does not take any ownership rights - we only take a commission on royalties." },
            { q: "What if someone steals my music?", a: "If you find your music uploaded by someone else, please contact our support team immediately with proof of ownership, and we will assist with takedown notices." },
            { q: "Can I use samples?", a: "You can use royalty-free samples. If you use uncleared samples from other copyrighted songs, your release will be rejected and your account may be banned." },
            { q: "What is Content ID?", a: "Content ID is YouTube's system for identifying and monetizing copyrighted content. When enabled, any video using your music will generate ad revenue that goes to you (minus our commission)." },
            { q: "Do I need to register my songs with a PRO?", a: "While WBBT handles mechanical royalties from streaming platforms, you should register your compositions with a Performing Rights Organization (BMI, ASCAP, PRS, GEMA, etc.) to collect performance royalties from radio, TV, and live performances." },
            { q: "What happens if I receive a copyright claim?", a: "If your release receives a claim, check if you have all necessary rights. Contact support with documentation proving ownership. False claims can be disputed, but deliberate infringement may result in account suspension." }
        ],
        content: [
            { q: "What format should my audio be?", a: "We require high-quality WAV files (16-bit or 24-bit, 44.1kHz or 48kHz). MP3s are not accepted for distribution." },
            { q: "What are the cover art requirements?", a: "Cover art must be 3000 x 3000 pixels, JPG or PNG, with no blurry text, social media handles, or pricing info. It must match the metadata of your release." },
            { q: "Can I use AI-generated content?", a: "Yes, but you must disclose AI usage during upload. Fully AI-generated vocals are allowed but must be clearly marked. However, you cannot impersonate other artists using AI." },
            { q: "Why was my release rejected?", a: "Common reasons include: low audio quality, incorrect metadata, cover art violations, suspected copyright infringement, or incomplete information. Check your release details for the specific rejection reason." },
            { q: "What languages are supported?", a: "We support over 50 languages including English, Turkish, Spanish, German, French, Japanese, Korean, Arabic, and many more. Select the primary language of your lyrics during upload." },
            { q: "Can I release instrumental tracks?", a: "Yes! Mark the track as 'Instrumental' during the upload process. For instrumental tracks, you don't need to provide lyricist credits." },
            { q: "What is explicit content?", a: "If your lyrics contain profanity, sexual references, drug references, or violence, mark it as 'Explicit'. Stores will display an 'E' badge and some family-friendly playlists will exclude it." }
        ],
        ai: [
            { q: "What AI tools are available?", a: "WBBT offers AI-powered tools including: AI Chat (for music advice), Lyrics Generator, Spotify Pitch Writer, Audio Analyzer, and Cover Art Generator. Access them from the 'AI Studio' or 'Tools' section." },
            { q: "Can AI write my Spotify pitch?", a: "Yes! Our AI Pitch Generator creates professional, high-converting pitches for Spotify playlist submissions. Just enter your artist name, track info, and genre." },
            { q: "How does the Audio Analyzer work?", a: "Upload an audio file and our AI analyzes the frequency spectrum, dynamic range, production quality, and provides specific mixing/mastering suggestions." },
            { q: "Is AI-generated cover art allowed?", a: "Yes, you can use AI-generated cover art as long as it meets our guidelines (3000x3000, no text violations, appropriate content). Our AI Image Generator can help you create unique artwork." },
            { q: "Do I need to disclose AI usage?", a: "If AI was used for significant elements (vocals, lyrics, composition), you must disclose it during upload. This is required by platform policies and helps maintain transparency." }
        ],
        teams: [
            { q: "What are Teams?", a: "Teams allow you to collaborate with other artists and automatically split royalties. Create a team, invite members, and assign percentage splits that are applied automatically when royalties come in." },
            { q: "How do I create a team?", a: "Go to 'Teams & Splits' from the sidebar, click 'Create Team', and name your team. Then invite members by entering their email and share percentage." },
            { q: "How do royalty splits work?", a: "When you assign splits (e.g., Artist A: 60%, Producer B: 40%), royalties for that release are automatically divided according to these percentages before being credited to each member's balance." },
            { q: "Can I have multiple teams?", a: "Yes! You can create different teams for different projects. For example, one team for your EP collaborators and another for your ongoing producer partnership." },
            { q: "What if a team member doesn't have a WBBT account?", a: "When you invite someone, they'll receive an invite code. They need to create a WBBT account and enter the code to join the team and receive their split of royalties." },
            { q: "Can I change splits after release?", a: "Splits can be modified for future royalties, but past earnings are distributed based on the split at the time of earning. Contact support for retroactive adjustments." }
        ]
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-display text-white mb-4">Frequently Asked Questions</h1>
                <p className="text-[#888]">Find answers to common questions about distribution, payments, and more.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="col-span-1 space-y-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setActiveCategory(cat.id); setOpenQuestion(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-[#111] text-[#888] hover:bg-[#222] hover:text-white'}`}
                        >
                            <cat.icon size={18} />
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="col-span-1 md:col-span-3">
                    <Card>
                        <h2 className="text-2xl font-bold text-white mb-6 capitalize flex items-center gap-2">
                            {categories.find(c => c.id === activeCategory)?.icon && React.createElement(categories.find(c => c.id === activeCategory)!.icon, { size: 24, className: "text-indigo-400" })}
                            {categories.find(c => c.id === activeCategory)?.name} Questions
                        </h2>
                        <div className="space-y-4">
                            {(faqs as any)[activeCategory]?.map((faq: any, i: number) => (
                                <div key={i} className="border border-[#222] rounded-2xl overflow-hidden bg-[#0A0A0A]">
                                    <button
                                        onClick={() => setOpenQuestion(openQuestion === i ? null : i)}
                                        className="w-full p-5 flex justify-between items-center text-left text-sm font-bold text-white hover:bg-[#111] transition-colors"
                                    >
                                        {faq.q}
                                        <ChevronDown size={16} className={`transition-transform duration-300 ${openQuestion === i ? 'rotate-180 text-indigo-400' : 'text-[#666]'}`} />
                                    </button>
                                    <div className={`grid transition-all duration-300 ease-in-out ${openQuestion === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="p-5 pt-0 text-sm text-[#888] leading-relaxed border-t border-[#1a1a1a]">
                                                {faq.a}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
