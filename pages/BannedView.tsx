import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { User } from '../types';

interface BannedViewProps {
    user: User;
    setUser: (user: User | null) => void;
}

const BannedView: React.FC<BannedViewProps> = ({ user, setUser }) => {
    const [ticket, setTicket] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAppeal();
    }, []);

    const loadAppeal = async () => {
        try {
            const data = await apiService.getAppeal();
            if (data && data.ticket) {
                setTicket(data.ticket);
            }
        } catch (e) {
            console.error('Failed to load appeal', e);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSubmitting(true);
        setError('');
        try {
            await apiService.submitAppeal(message);
            await loadAppeal();
        } catch (err: any) {
            setError(err.message || 'Failed to submit appeal');
        }
        setSubmitting(false);
    };

    const handleLogout = () => {
        apiService.logout();
        setUser(null);
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#111] border border-red-900/50 rounded-lg p-8 text-center shadow-[0_0_50px_rgba(255,0,0,0.1)]">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-light mb-2 text-red-500">Account Suspended</h1>
                <p className="text-gray-400 mb-6">
                    Your account has been suspended due to a violation of our terms of service.<br />
                    <span className="text-gray-500 text-sm mt-2 block">Reason: {user.banReason}</span>
                </p>

                <div className="border-t border-gray-800 pt-6">
                    {ticket ? (
                        <div className={`p-4 rounded-lg bg-[#222] border ${ticket.status === 'CLOSED' ? 'border-red-900/30' : 'border-yellow-900/30'}`}>
                            <h3 className={`text-sm font-medium mb-1 ${ticket.status === 'CLOSED' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {ticket.status === 'CLOSED' ? 'Appeal Rejected' : 'Appeal Submitted'}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {ticket.status === 'CLOSED'
                                    ? 'Your appeal was reviewed and rejected. This decision is final.'
                                    : `Ticket ID: #${ticket.id.split('-')[1]} - Awaiting Admin Review`}
                            </p>
                            {ticket.responses && ticket.responses.length > 0 && (
                                <div className="mt-2 text-left text-xs bg-black/50 p-2 rounded">
                                    <div className="text-gray-500">Latest Response:</div>
                                    <div className="text-gray-300">{ticket.responses[ticket.responses.length - 1].message}</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="text-left">
                            <label className="block text-sm text-gray-400 mb-2">Submit an Appeal</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Explain why your account should be reinstated..."
                                className="w-full bg-black border border-gray-800 rounded p-3 text-sm text-white focus:border-red-500 outline-none transition-colors mb-4 min-h-[100px]"
                                required
                            />
                            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-white text-black py-2 rounded font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Submit Appeal'}
                            </button>
                            <p className="text-xs text-center text-gray-500 mt-3">
                                Note: You may only submit one appeal request.
                            </p>
                        </form>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="mt-8 text-sm text-gray-500 hover:text-white transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default BannedView;
