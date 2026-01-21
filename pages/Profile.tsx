import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/ui.tsx';
import { User, Lock, Instagram, Music, Youtube, Globe, Twitter, CloudLightning, Camera } from 'lucide-react';
import { apiService } from '../services/apiService';
import Avatar from '../components/Avatar';

const Profile: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // User Data
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [artistName, setArtistName] = useState('');
    const [email, setEmail] = useState('');

    // Avatar
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    // Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Profile Data
    const [bio, setBio] = useState('');
    const [instagram, setInstagram] = useState('');
    const [spotify, setSpotify] = useState('');
    const [soundcloud, setSoundcloud] = useState('');
    const [youtube, setYoutube] = useState('');
    const [twitter, setTwitter] = useState('');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await apiService.getProfile();
            if (data.user) {
                setFirstName(data.user.firstName || '');
                setLastName(data.user.lastName || '');
                setArtistName(data.user.artistName || '');
                setEmail(data.user.email || '');
            }
            if (data.profile) {
                setBio(data.profile.bio || '');
                setProfilePicture(data.profile.profilePicture || null);
                setInstagram(data.profile.instagramUrl || '');
                setSpotify(data.profile.spotifyUrl || '');
                setSoundcloud(data.profile.soundcloudUrl || '');
                setYoutube(data.profile.youtubeUrl || '');
                setTwitter(data.profile.twitterUrl || '');
                setWebsite(data.profile.websiteUrl || '');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (file.size > 5 * 1024 * 1024) return alert('File size must be less than 5MB');
        if (!file.type.startsWith('image/')) return alert('File must be an image');

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                // Upload
                const result = await apiService.uploadFile(file.name, base64, 'image');
                const fullUrl = `http://localhost:3001${result.url}`;

                // Update Profile immediately
                await apiService.updateProfile({ profilePicture: fullUrl });
                setProfilePicture(fullUrl);

                alert('Profile picture updated!');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            alert('Failed to upload image');
        }
    };

    const handleSave = async (section: 'info' | 'password' | 'socials') => {
        setSaving(true);
        try {
            const updateData: any = {};

            if (section === 'info') {
                updateData.firstName = firstName;
                updateData.lastName = lastName;
                updateData.artistName = artistName;
                updateData.email = email;
                updateData.bio = bio;
            } else if (section === 'password') {
                if (!currentPassword || !newPassword) {
                    alert('Please fill in both password fields');
                    setSaving(false);
                    return;
                }
                updateData.currentPassword = currentPassword;
                updateData.newPassword = newPassword;
            } else if (section === 'socials') {
                updateData.instagramUrl = instagram;
                updateData.spotifyUrl = spotify;
                updateData.soundcloudUrl = soundcloud;
                updateData.youtubeUrl = youtube;
                updateData.twitterUrl = twitter;
                updateData.websiteUrl = website;
            }

            await apiService.updateProfile(updateData);

            if (section === 'password') {
                setCurrentPassword('');
                setNewPassword('');
                alert('Password updated successfully');
            } else {
                alert('Profile updated successfully');
            }

            loadData();
        } catch (error: any) {
            alert(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-[#666]">Loading profile...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            <div>
                <h1 className="text-3xl font-bold font-display text-white">Profile Settings</h1>
                <p className="text-[#888]">Manage your public profile and account security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Basic Info */}
                <Card className="md:col-span-1 text-center h-fit">
                    <div className="relative w-32 h-32 mx-auto mb-6 group">
                        <Avatar src={profilePicture} alt={artistName || firstName} size="2xl" className="shadow-2xl shadow-indigo-500/30 ring-4 ring-white/5" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                            <Camera size={24} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                    </div>
                    <h2 className="text-xl font-bold text-white">{artistName}</h2>
                    <p className="text-sm text-[#888] mb-6">{email}</p>
                    <div className="p-4 bg-[#111] rounded-xl text-left">
                        <p className="text-xs text-[#666] uppercase tracking-widest mb-2 font-bold">Bio</p>
                        <textarea
                            className="w-full bg-transparent text-sm text-[#AAA] border-none focus:ring-0 p-0 resize-none"
                            rows={4}
                            placeholder="Tell us about yourself..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>
                    <Button variant="accent" className="w-full mt-4 text-xs" onClick={() => handleSave('info')} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Bio'}
                    </Button>
                </Card>

                {/* Right Column: Forms */}
                <div className="md:col-span-2 space-y-8">
                    {/* Personal Info */}
                    <Card>
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <User size={18} className="text-indigo-400" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                            <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                            <Input label="Artist Name" value={artistName} onChange={e => setArtistName(e.target.value)} className="col-span-2" />
                            <Input label="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="col-span-2" />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button variant="accent" className="h-10 text-xs" onClick={() => handleSave('info')} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </Card>

                    {/* Social Media Links */}
                    <Card>
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Globe size={18} className="text-indigo-400" /> Social Media & Links
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Instagram size={16} className="absolute left-3 top-[38px] text-[#666]" />
                                <Input label="Instagram" placeholder="https://instagram.com/..." className="pl-10" value={instagram} onChange={e => setInstagram(e.target.value)} />
                            </div>
                            <div className="relative">
                                <Music size={16} className="absolute left-3 top-[38px] text-[#666]" />
                                <Input label="Spotify" placeholder="https://open.spotify.com/..." className="pl-10" value={spotify} onChange={e => setSpotify(e.target.value)} />
                            </div>
                            <div className="relative">
                                <CloudLightning size={16} className="absolute left-3 top-[38px] text-[#666]" />
                                <Input label="SoundCloud" placeholder="https://soundcloud.com/..." className="pl-10" value={soundcloud} onChange={e => setSoundcloud(e.target.value)} />
                            </div>
                            <div className="relative">
                                <Youtube size={16} className="absolute left-3 top-[38px] text-[#666]" />
                                <Input label="YouTube" placeholder="https://youtube.com/..." className="pl-10" value={youtube} onChange={e => setYoutube(e.target.value)} />
                            </div>
                            <div className="relative">
                                <Twitter size={16} className="absolute left-3 top-[38px] text-[#666]" />
                                <Input label="Twitter / X" placeholder="https://x.com/..." className="pl-10" value={twitter} onChange={e => setTwitter(e.target.value)} />
                            </div>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3 top-[38px] text-[#666]" />
                                <Input label="Website" placeholder="https://yourwebsite.com" className="pl-10" value={website} onChange={e => setWebsite(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button variant="secondary" className="h-10 text-xs" onClick={() => handleSave('socials')} disabled={saving}>
                                {saving ? 'Saving...' : 'Update Links'}
                            </Button>
                        </div>
                    </Card>

                    {/* Security */}
                    <Card>
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Lock size={18} className="text-indigo-400" /> Security
                        </h3>
                        <Input label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                        <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        <div className="flex justify-end mt-4">
                            <Button variant="secondary" className="h-10 text-xs" onClick={() => handleSave('password')} disabled={saving}>
                                {saving ? 'Saving...' : 'Update Password'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Profile;
