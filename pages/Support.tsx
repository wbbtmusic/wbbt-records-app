import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/ui.tsx';
import { apiService } from '../services/apiService';
import { Release } from '../types';
import { LifeBuoy, MessageSquare, ChevronDown, Send, X, CheckCircle, Clock, Disc, HelpCircle, Ticket, Plus } from 'lucide-react';

const Support: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'faq' | 'tickets' | 'new'>('faq');
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [releases, setReleases] = useState<Release[]>([]);
    const [selectedReleaseId, setSelectedReleaseId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const tickets = await apiService.getTickets();
            setMyTickets(tickets || []);

            const user = await apiService.getCurrentUser();
            if (user) {
                const userReleases = await apiService.getReleases(user.id);
                setReleases((userReleases || []).filter((r: Release) => r.userId === user.id));
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setSubmitting(true);
        try {
            let finalMessage = message;
            if (selectedReleaseId) {
                const release = releases.find(r => r.id === selectedReleaseId);
                if (release) {
                    finalMessage += `\n\nRelated Release: ${release.title} (UPC: ${release.upc || release.wupc || 'N/A'})`;
                }
            }

            await apiService.createTicket(subject, finalMessage);
            setSubmitted(true);
            setSubject('');
            setMessage('');
            setSelectedReleaseId('');
            loadTickets();
            setActiveTab('tickets');

            setTimeout(() => setSubmitted(false), 3000);
        } catch (e: any) {
            console.error('Failed to create ticket:', e);
            setError(e.message || 'Failed to send message. Please try again.');
        }
        setSubmitting(false);
    };

    const faqs = [
        { q: "What is the commission rate?", a: "WBBT Records operates on a 30% commission model. You receive 70% of royalties collected from streaming platforms." },
        { q: "How long does distribution take?", a: "Typically 2-5 business days for major platforms like Spotify and Apple Music." },
        { q: "How do I withdraw my earnings?", a: "Go to the Earnings page, click Withdraw, and enter your IBAN/SWIFT details. Minimum withdrawal is $50." },
        { q: "Can I edit a release after it's live?", a: "Only metadata can be edited. Audio files cannot be changed. For audio changes, you must issue a takedown and create a new release." },
        { q: "What is WUPC and WISRC?", a: "WUPC (WBBT UPC) and WISRC (WBBT ISRC) are our internal tracking codes for analytics and support purposes." },
        { q: "Is WBBT Records a distributor?", a: "No, WBBT Records is a record label, not just a distributor. We provide distribution services, but we also actively support and promote our artists." }
    ];

    const openTicketsCount = myTickets.filter(t => t.status === 'OPEN').length;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold font-display text-white mb-4">Support Center</h1>
                <p className="text-[#888]">Browse FAQs, view your tickets, or contact our support team.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#333] pb-4">
                <button
                    onClick={() => setActiveTab('faq')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'faq' ? 'bg-white text-black' : 'bg-[#111] text-[#888] hover:bg-[#222] hover:text-white'}`}
                >
                    <HelpCircle size={16} />
                    FAQ
                </button>
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'tickets' ? 'bg-white text-black' : 'bg-[#111] text-[#888] hover:bg-[#222] hover:text-white'}`}
                >
                    <Ticket size={16} />
                    My Tickets
                    {openTicketsCount > 0 && (
                        <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full">{openTicketsCount}</span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('new')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-indigo-500 text-white' : 'bg-[#111] text-[#888] hover:bg-indigo-500/20 hover:text-indigo-400'}`}
                >
                    <Plus size={16} />
                    New Ticket
                </button>
            </div>

            {/* FAQ Tab */}
            {activeTab === 'faq' && (
                <Card>
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                        <LifeBuoy size={20} className="text-indigo-400" /> Frequently Asked Questions
                    </h3>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border border-[#222] rounded-2xl overflow-hidden bg-[#0A0A0A]">
                                <button
                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    className="w-full p-5 flex justify-between items-center text-left text-sm font-bold text-white hover:bg-[#111] transition-colors"
                                >
                                    {faq.q}
                                    <ChevronDown size={16} className={`transition-transform duration-300 ${activeFaq === i ? 'rotate-180 text-indigo-400' : 'text-[#666]'}`} />
                                </button>
                                <div className={`grid transition-all duration-300 ease-in-out ${activeFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="p-5 pt-0 text-sm text-[#888] leading-relaxed border-t border-[#1a1a1a]">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-200">
                        <strong>Can't find what you're looking for?</strong> Open a new ticket and our team will respond within 24 hours.
                    </div>
                </Card>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'tickets' && (
                <Card>
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                        <Clock size={20} className="text-yellow-400" /> My Tickets ({myTickets.length})
                    </h3>
                    {myTickets.length === 0 ? (
                        <div className="text-center py-16">
                            <Ticket size={48} className="text-[#333] mx-auto mb-4" />
                            <p className="text-[#666]">No tickets yet. If you have a question, open a new ticket!</p>
                            <Button className="mt-4" onClick={() => setActiveTab('new')}>
                                <Plus size={16} className="mr-2" /> New Ticket
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myTickets.map(ticket => (
                                <div key={ticket.id} className="p-4 bg-[#111] rounded-2xl border border-[#222]">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white">{ticket.subject}</h4>
                                        <span className={`text-[10px] uppercase px-2 py-1 rounded ${ticket.status === 'OPEN' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#888] mb-2">{ticket.message}</p>
                                    <p className="text-[10px] text-[#666]">{new Date((ticket.createdAt || '').replace(' ', 'T')).toLocaleDateString()}</p>

                                    <div className="mt-4 pt-4 border-t border-[#222] space-y-3">
                                        {(ticket.responses || []).map((r: any, i: number) => (
                                            <div key={i} className={`p-3 rounded-xl border ${r.is_admin ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-[#1a1a1a] border-[#333]'}`}>
                                                <p className={`text-xs ${r.is_admin ? 'text-indigo-200' : 'text-[#CCC]'}`}>{r.message}</p>
                                                <p className={`text-[10px] mt-1 ${r.is_admin ? 'text-indigo-400' : 'text-[#666]'}`}>
                                                    {r.is_admin ? 'Support Team' : 'You'} • {new Date((r.createdAt || '').replace(' ', 'T')).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-[#222]">
                                        {ticket.status === 'CLOSED' ? (
                                            <div className="p-3 bg-red-900/10 border border-red-900/30 rounded text-center text-xs text-red-400">
                                                This ticket is closed.
                                            </div>
                                        ) : (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const form = e.target as HTMLFormElement;
                                                    const input = form.elements.namedItem('reply') as HTMLInputElement;
                                                    if (input.value.trim()) {
                                                        apiService.respondTicket(ticket.id, input.value).then(() => {
                                                            input.value = '';
                                                            loadTickets();
                                                        });
                                                    }
                                                }}
                                                className="flex flex-col gap-2"
                                            >
                                                {(ticket.allow_uploads === 1 || (ticket as any).allowUploads) && (
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300 flex items-center gap-1">
                                                            <Plus size={14} /> Upload File
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;

                                                                    if (!confirm(`Upload ${file.name}?`)) return;

                                                                    try {
                                                                        await apiService.uploadTicketFile(ticket.id, file);
                                                                        loadTickets();
                                                                        alert('File uploaded successfully');
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        alert('Failed to upload file');
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <input
                                                        name="reply"
                                                        className="flex-1 bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#666] focus:border-indigo-500 focus:outline-none"
                                                        placeholder="Write a reply..."
                                                    />
                                                    <Button className="h-[34px] px-4 text-xs">Reply</Button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* New Ticket Tab */}
            {activeTab === 'new' && (
                <Card>
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
                        <MessageSquare size={20} className="text-indigo-400" /> Contact Support
                    </h3>

                    {submitted ? (
                        <div className="text-center py-12">
                            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                            <h4 className="text-white font-bold mb-2">Message Sent!</h4>
                            <p className="text-[#888] text-sm">We'll get back to you within 24 hours.</p>
                        </div>
                    ) : (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-200 mb-4">
                                <p>We usually respond within 24 hours. Please provide as much detail as possible.</p>
                            </div>
                            {error && <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-2xl text-xs text-red-200 mb-4">{error}</div>}
                            <Input
                                label="Subject"
                                placeholder="e.g. Takedown Request, Royalty Question..."
                                value={subject}
                                onChange={(e: any) => setSubject(e.target.value)}
                                required
                            />

                            <div>
                                <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest font-display ml-6 mb-2 block">
                                    Related Release (Optional)
                                </label>
                                <div className="relative">
                                    <Disc size={16} className="absolute left-6 top-4 text-[#666] z-10" />
                                    <select
                                        value={selectedReleaseId}
                                        onChange={(e) => setSelectedReleaseId(e.target.value)}
                                        className="w-full bg-white/[0.03] backdrop-blur-sm border-2 border-white/[0.05] rounded-[2rem] pl-12 pr-6 py-3 text-[#EEE] focus:border-indigo-500 focus:bg-white/[0.05] focus:ring-0 focus:outline-none transition-all duration-300 text-sm font-medium appearance-none"
                                    >
                                        <option value="" className="bg-[#111]">Select a release...</option>
                                        {releases.map(release => (
                                            <option key={release.id} value={release.id} className="bg-[#111]">
                                                {release.title}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-6 top-4 text-[#666] pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mb-4 w-full group">
                                <label className="text-[11px] font-bold text-[#888] uppercase tracking-widest font-display ml-6">Message</label>
                                <textarea
                                    className="min-h-[150px] bg-white/[0.03] backdrop-blur-sm border-2 border-white/[0.05] rounded-[2rem] p-6 text-[#EEE] placeholder-white/20 focus:border-indigo-500 focus:bg-white/[0.05] focus:ring-0 focus:outline-none transition-all duration-300 text-sm font-medium resize-none"
                                    placeholder="Describe your issue in detail..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <Button variant="accent" className="w-full" disabled={submitting}>
                                {submitting ? 'Sending...' : 'Send Message'}
                            </Button>
                        </form>
                    )}
                </Card>
            )}
        </div>
    );
};

export default Support;
