import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import PreviewArea from './components/PreviewArea';
import RightSidebar from './components/RightSidebar';
import Onboarding from './components/Onboarding';
import { SongMetadata, ArtistProfile, PreviewView, TrendSong } from './types';
import { DEFAULT_COVER, DEFAULT_ARTIST } from './constants';
import { fetchTrends } from './services/dataService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<PreviewView>(PreviewView.EDITOR);
  const [trends, setTrends] = useState<TrendSong[]>([]);
  
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
    setSong(prev => ({...prev, artist: profile.name}));
  }, [profile.name]);

  const handleSaveProfile = () => {
    const newProfile = { ...profile, id: Date.now().toString() };
    setSavedProfiles([...savedProfiles, newProfile]);
    alert("Profile Saved!");
  };

  const handleLoadProfile = (p: ArtistProfile) => {
    setProfile(p);
  };

  // Determine which sidebar mode we are in
  const isSpotifyView = currentView === PreviewView.HOME || 
                        currentView === PreviewView.PLAYLIST || 
                        currentView === PreviewView.ARTIST_PAGE || 
                        currentView === PreviewView.SEARCH ||
                        currentView === PreviewView.EDITOR;

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden select-none">
      
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

export default App;