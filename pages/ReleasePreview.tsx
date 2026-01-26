import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/ReleasePreview/components/Sidebar';
import Player from '../components/ReleasePreview/components/Player';
import PreviewArea from '../components/ReleasePreview/components/PreviewArea';
import RightSidebar from '../components/ReleasePreview/components/RightSidebar';
import Onboarding from '../components/ReleasePreview/components/Onboarding';
import { SongMetadata, ArtistProfile, PreviewView, TrendSong } from '../components/ReleasePreview/types';
import { DEFAULT_COVER, DEFAULT_ARTIST } from '../components/ReleasePreview/constants';
import { fetchTrends } from '../components/ReleasePreview/services/dataService';
import { Maximize2, Minimize2 } from 'lucide-react';

const ReleasePreview: React.FC = () => {
    const [currentView, setCurrentView] = useState<PreviewView>(PreviewView.EDITOR);
    const [trends, setTrends] = useState<TrendSong[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // User Data State
    const [song, setSong] = useState<SongMetadata>({
        title: 'My New Hit Single',
        artist: 'Future Star',
        featArtist: '',
        albumName: 'Debut Album',
        duration: '3:42',
        coverImage: DEFAULT_COVER,
        canvasVideo: null,
        colorHex: '#5d3f6a',
        lyrics: "Verse 1\nStarted from the bottom now we here\nLook at all the lights, the atmosphere\n\nChorus\nWe are shining bright tonight\nEverything is gonna be alright\nJust hold on tight\n\nVerse 2\nMusic playing in my soul\nNever gonna lose control"
    });

    const [profile, setProfile] = useState<ArtistProfile>({
        id: 'temp-1',
        name: 'Future Star',
        bio: 'An emerging artist redefining the sound of tomorrow. Blending genres and breaking boundaries.',
        imageUrl: DEFAULT_ARTIST,
        verified: true
    });

    const [savedProfiles, setSavedProfiles] = useState<ArtistProfile[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

    // Initialize Data
    useEffect(() => {
        fetchTrends().then(setTrends);
    }, []);

    // Ensure Song Artist syncs with Profile Name
    useEffect(() => {
        setSong(prev => ({ ...prev, artist: profile.name }));
    }, [profile.name]);

    const handleSaveProfile = () => {
        const newProfile = { ...profile, id: Date.now().toString() };
        setSavedProfiles([...savedProfiles, newProfile]);
        alert("Profile Saved!");
    };

    const handleLoadProfile = (p: ArtistProfile) => {
        setProfile(p);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Determine which sidebar mode we are in
    const isSpotifyView = currentView === PreviewView.HOME ||
        currentView === PreviewView.PLAYLIST ||
        currentView === PreviewView.ARTIST_PAGE ||
        currentView === PreviewView.SEARCH ||
        currentView === PreviewView.EDITOR;

    return (
        <div ref={containerRef} className={`flex flex-col w-full bg-black text-white overflow-hidden select-none relative transition-all duration-300 ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-140px)] rounded-3xl border border-white/10 shadow-2xl'}`}>

            {/* Fullscreen Toggle Button */}
            <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-md transition-all text-white/70 hover:text-white"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            <Onboarding />

            {/* Main Content Area (Sidebar + Preview + RightSidebar) */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Sidebar (Navigation + Library) */}
                <Sidebar
                    trends={trends}
                    song={song}
                    profile={profile}
                    view={currentView}
                    onTrendClick={(t) => console.log('Trend clicked', t.title)}
                    onViewChange={setCurrentView}
                />

                {/* Center Content */}
                <PreviewArea
                    view={currentView}
                    setView={setCurrentView}
                    song={song}
                    setSong={setSong}
                    profile={profile}
                    setProfile={setProfile}
                    trends={trends}
                    savedProfiles={savedProfiles}
                    onSaveProfile={handleSaveProfile}
                    onLoadProfile={handleLoadProfile}
                />

                {/* Right Sidebar (Now Playing & Lyrics) - Only visible in Spotify/Editor modes */}
                {isSpotifyView && rightSidebarOpen && currentView !== PreviewView.EDITOR && (
                    <RightSidebar
                        isOpen={rightSidebarOpen}
                        onClose={() => setRightSidebarOpen(false)}
                        song={song}
                        profile={profile}
                        trends={trends}
                        isPlaying={isPlaying}
                        onViewChange={setCurrentView}
                    />
                )}
            </div>

            {/* Bottom Player (Only Visible in Spotify/Editor views to allow other views full height) */}
            {isSpotifyView && (
                <Player
                    song={song}
                    isPlaying={isPlaying}
                    togglePlay={() => setIsPlaying(!isPlaying)}
                    onViewChange={setCurrentView}
                    onOpenSidebar={() => setRightSidebarOpen(true)} // Re-open logic
                />
            )}

        </div>
    );
};

export default ReleasePreview;
