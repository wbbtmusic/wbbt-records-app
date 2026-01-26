import React from 'react';
import { SongMetadata, TrendSong, ArtistProfile, PreviewView } from '../types';
import InputPanel from './InputPanel';
import HomeView from './views/HomeView';
import PlaylistView from './views/PlaylistView';
import ArtistView from './views/ArtistView';
import CanvasView from './views/CanvasView';
import YouTubeMusicView from './views/YouTubeMusicView';
import AppleMusicView from './views/AppleMusicView';
import InstagramView from './views/InstagramView';

interface PreviewAreaProps {
  view: PreviewView;
  setView: (v: PreviewView) => void;
  song: SongMetadata;
  setSong: React.Dispatch<React.SetStateAction<SongMetadata>>;
  profile: ArtistProfile;
  setProfile: React.Dispatch<React.SetStateAction<ArtistProfile>>;
  trends: TrendSong[];
  savedProfiles: ArtistProfile[];
  onSaveProfile: () => void;
  onLoadProfile: (p: ArtistProfile) => void;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({ 
    view, setView, song, setSong, profile, setProfile, trends, 
    savedProfiles, onSaveProfile, onLoadProfile 
}) => {
  
  // Render Input Panel separately
  if (view === PreviewView.EDITOR) {
      return (
          <div className="flex-1 bg-[#121212] rounded-lg overflow-hidden m-2 ml-0 relative custom-scrollbar animate-enter-view">
               <InputPanel 
                    song={song} setSong={setSong} 
                    profile={profile} setProfile={setProfile}
                    currentView={view} setView={setView}
                    savedProfiles={savedProfiles}
                    onSaveProfile={onSaveProfile}
                    onLoadProfile={onLoadProfile}
               />
          </div>
      )
  }

  const isSpotify = view === PreviewView.HOME || view === PreviewView.PLAYLIST || view === PreviewView.ARTIST_PAGE || view === PreviewView.SEARCH;
  
  // For Spotify views, we use the rounded container. For others, we might want full edge-to-edge or different roundedness.
  const containerClass = isSpotify 
      ? "flex-1 bg-[#121212] rounded-lg overflow-hidden m-2 ml-0 relative custom-scrollbar group/area"
      : "flex-1 bg-black overflow-hidden relative custom-scrollbar group/area";

  return (
    <div className={containerClass}>
       <div className="h-full overflow-y-auto custom-scrollbar relative">
          {/* We wrap the view in a key'd div to trigger the CSS animation on change */}
          <div key={view} className="h-full animate-enter-view origin-bottom">
            {view === PreviewView.HOME && <HomeView song={song} profile={profile} trends={trends} onViewChange={setView} />}
            {view === PreviewView.PLAYLIST && <PlaylistView song={song} trends={trends} />}
            {view === PreviewView.ARTIST_PAGE && <ArtistView song={song} profile={profile} />}
            {view === PreviewView.CANVAS_FULL && <CanvasView song={song} />}
            {view === PreviewView.SEARCH && <div className="p-10 text-center text-[#b3b3b3] mt-20">Search View acts as a placeholder.</div>}
            
            {/* New Platforms */}
            {view === PreviewView.YOUTUBE_MUSIC && <YouTubeMusicView song={song} profile={profile} trends={trends} />}
            {view === PreviewView.APPLE_MUSIC && <AppleMusicView song={song} profile={profile} trends={trends} />}
            {view === PreviewView.INSTAGRAM && <InstagramView song={song} profile={profile} />}
          </div>
       </div>
    </div>
  );
};

export default PreviewArea;