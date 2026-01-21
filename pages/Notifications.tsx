import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Card, Button, Badge } from '../components/ui';
import { Bell, Check, Clock, Inbox, CheckCircle } from 'lucide-react';

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await apiService.getNotifications();
            // Sort by date desc
            setNotifications((data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
            console.error('Failed to load notifications', e);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await apiService.markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            // Optimistic update
            const unread = notifications.filter(n => !n.read);
            setNotifications(notifications.map(n => ({ ...n, read: true })));

            // Execute in background
            await Promise.all(unread.map(n => apiService.markNotificationRead(n.id)));
        } catch (e) {
            console.error(e);
            loadData(); // Revert on error
        }
    };

    if (loading) return <div className="p-8 text-center text-[#666]">Loading notifications...</div>;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 font-display">Notifications</h1>
                    <p className="text-[#888]">Stay updated with your releases, earnings, and system alerts.</p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllRead} variant="secondary">
                        <CheckCircle size={16} className="mr-2" /> Mark all as read
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {notifications.length === 0 && (
                    <div className="py-20 text-center text-[#444] border border-[#222] border-dashed rounded-2xl">
                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No notifications yet</p>
                    </div>
                )}
                {notifications.map(n => (
                    <div
                        key={n.id}
                        className={`
                            relative p-5 rounded-xl border transition-all duration-300 group
                            ${n.read ? 'bg-[#0A0A0A] border-[#222] opacity-70 hover:opacity-100' : 'bg-[#141414] border-indigo-500/30 shadow-lg shadow-indigo-500/5'}
                        `}
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <h3 className={`text-base font-bold mb-1 ${n.read ? 'text-[#CCC]' : 'text-white'}`}>
                                    {n.title}
                                    {!n.read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-indigo-500 align-middle"></span>}
                                </h3>
                                <p className="text-sm text-[#888] mb-3 leading-relaxed">{n.message}</p>
                                <div className="flex items-center gap-4 text-xs text-[#555] font-mono">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(n.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            {!n.read && (
                                <button
                                    onClick={(e) => handleMarkRead(n.id, e)}
                                    className="p-2 rounded-full hover:bg-white/10 text-[#666] hover:text-white transition-colors"
                                    title="Mark as read"
                                >
                                    <Check size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
