import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/ui.tsx';
import { Users, Shield, Mail, Trash2, Crown, Percent, Copy, Check } from 'lucide-react';
import { apiService } from '../services/apiService';

const Teams: React.FC = () => {
    const [ownedTeams, setOwnedTeams] = useState<any[]>([]);
    const [memberTeams, setMemberTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [acceptOpen, setAcceptOpen] = useState(false);

    // Form Data
    const [teamName, setTeamName] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteShare, setInviteShare] = useState('0');
    const [inviteCode, setInviteCode] = useState('');
    const [copiedCode, setCopiedCode] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [teamsData, user] = await Promise.all([
                apiService.getTeams(),
                apiService.getCurrentUser()
            ]);
            setOwnedTeams(teamsData?.ownedTeams || []);
            setMemberTeams(teamsData?.memberTeams || []);
            setCurrentUser(user);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiService.createTeam(teamName);
            setCreateOpen(false);
            setTeamName('');
            loadData();
        } catch (error) {
            alert('Failed to create team');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeam) return;
        try {
            const res = await apiService.inviteToTeam(selectedTeam.id, inviteEmail, parseFloat(inviteShare));
            setInviteOpen(false);
            setInviteEmail('');
            setInviteShare('0');
            // Show invite code to user since emails dont work in dev
            alert(`Invite created! Share this code manually: ${res.inviteCode}`);
            loadData();
        } catch (error) {
            alert('Failed to send invite');
        }
    };

    const handleAcceptInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiService.acceptTeamInvite(inviteCode);
            setAcceptOpen(false);
            setInviteCode('');
            loadData();
        } catch (error) {
            alert('Invalid or expired invite code');
        }
    };

    const handleDeleteTeam = async (id: string) => {
        if (!confirm('Are you sure? This will disband the team.')) return;
        try {
            await apiService.deleteTeam(id);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveMember = async (teamId: string, userId: string) => {
        if (!confirm('Remove this member?')) return;
        try {
            await apiService.removeTeamMember(teamId, userId);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(''), 2000);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white">Team Management</h1>
                    <p className="text-[#888]">Manage your teams and royalty splits.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setAcceptOpen(true)}>Enter Invite Code</Button>
                    <Button variant="accent" onClick={() => setCreateOpen(true)}>+ Create Team</Button>
                </div>
            </div>

            {/* Owned Teams */}
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Crown size={18} className="text-yellow-400" /> Teams You Own</h2>

                {ownedTeams.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-[#222] rounded-xl text-[#666]">
                        You haven't created any teams yet.
                    </div>
                )}

                {ownedTeams.map(team => (
                    <Card key={team.id} className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{team.name}</h3>
                                <p className="text-xs text-[#666]">Created {new Date(team.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => { setSelectedTeam(team); setInviteOpen(true); }} className="h-8 text-xs">
                                    <Mail size={14} className="mr-1" /> Invite
                                </Button>
                                <button onClick={() => handleDeleteTeam(team.id)} className="text-[#444] hover:text-red-500 transition-colors p-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {team.members.map((member: any) => (
                                <div key={member.id} className="bg-[#111] p-4 rounded-xl border border-white/5 flex justify-between items-start group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#222] to-[#111] border border-white/10 flex items-center justify-center font-bold text-[#666]">
                                            {member.artistName?.[0] || member.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{member.artistName || 'User'}</p>
                                            <p className="text-[10px] text-[#666]">{member.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge status={member.role === 'owner' ? 'admin' : member.status === 'PENDING' ? 'PENDING' : 'active'} />
                                                <span className="text-xs text-indigo-400 font-mono font-bold">{member.sharePercentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    {member.role !== 'owner' && (
                                        <button onClick={() => handleRemoveMember(team.id, member.userId)} className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-500 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {team.invites && team.invites.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <p className="text-xs text-[#666] uppercase tracking-widest mb-3">Pending Invites</p>
                                <div className="space-y-2">
                                    {team.invites.map((invite: any) => (
                                        <div key={invite.id} className="flex items-center justify-between text-sm bg-[#0A0A0A] p-3 rounded-lg border border-white/5">
                                            <span className="text-[#888]">{invite.email} <span className="text-[#444]">({invite.sharePercentage}%)</span></span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-[#AAA] bg-[#222] px-2 py-1 rounded text-xs select-all">{invite.inviteCode}</span>
                                                <button onClick={() => copyToClipboard(invite.inviteCode)} className="text-[#666] hover:text-white">
                                                    {copiedCode === invite.inviteCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                </button>
                                                <Badge status="PENDING" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Member Teams */}
            <div className="space-y-6 pt-8 border-t border-white/10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-[#888]" /> Teams You Joined</h2>

                {memberTeams.length === 0 && (
                    <div className="text-center py-10 text-[#444]">
                        You are not a member of any other teams.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memberTeams.map(team => (
                        <Card key={team.id} className="opacity-80 hover:opacity-100 transition-opacity">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{team.name}</h3>
                                <Badge status="MEMBER" />
                            </div>
                            <div className="flex items-center gap-2 text-[#888] text-sm mb-2">
                                <Percent size={14} /> Your Share: <span className="text-white font-mono">{team.sharePercentage}%</span>
                            </div>
                            <div className="text-xs text-[#666]">
                                Joined {new Date(team.createdAt).toLocaleDateString()}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* CREATE MODAL */}
            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <Card className="w-full max-w-md relative bg-[#121212]">
                        <button onClick={() => setCreateOpen(false)} className="absolute top-6 right-6 text-[#666] hover:text-white">✕</button>
                        <h2 className="text-2xl font-bold font-display text-white mb-6">Create New Team</h2>
                        <form onSubmit={handleCreateTeam}>
                            <Input label="Team Name" value={teamName} onChange={e => setTeamName(e.target.value)} required placeholder="e.g. Dream Team" />
                            <Button type="submit" variant="accent" className="w-full">Create Team</Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* INVITE MODAL */}
            {inviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <Card className="w-full max-w-md relative bg-[#121212]">
                        <button onClick={() => setInviteOpen(false)} className="absolute top-6 right-6 text-[#666] hover:text-white">✕</button>
                        <h2 className="text-2xl font-bold font-display text-white mb-2">Invite Member</h2>
                        <p className="text-sm text-[#666] mb-6">to {selectedTeam?.name}</p>
                        <form onSubmit={handleInvite}>
                            <Input label="Email Address" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="friend@example.com" />
                            <Input label="Share Percentage (%)" type="number" value={inviteShare} onChange={e => setInviteShare(e.target.value)} required min="0" max="100" />
                            <Button type="submit" variant="accent" className="w-full">Send Invite</Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* ACCEPT INVITE MODAL */}
            {acceptOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <Card className="w-full max-w-md relative bg-[#121212]">
                        <button onClick={() => setAcceptOpen(false)} className="absolute top-6 right-6 text-[#666] hover:text-white">✕</button>
                        <h2 className="text-2xl font-bold font-display text-white mb-6">Join a Team</h2>
                        <form onSubmit={handleAcceptInvite}>
                            <Input label="Invite Code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required placeholder="XYZ-123..." />
                            <div className="bg-[#111] p-4 rounded-xl text-xs text-[#666] mb-6">
                                Ask the team owner for the invite code.
                            </div>
                            <Button type="submit" variant="accent" className="w-full">Join Team</Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Teams;
