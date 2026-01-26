import React from 'react';
import { Play, SkipBack, SkipForward, Repeat, Shuffle, ListMusic, MonitorSpeaker, Volume2, Maximize2, Heart, Mic2 } from 'lucide-react';
import { SongMetadata, PreviewView } from '../types';

interface PlayerProps {
  song: SongMetadata;
  isPlaying: boolean;
  togglePlay: () => void;
  onViewChange: (view: PreviewView) => void;
  onOpenSidebar: () => void;
}

const Player: React.FC<PlayerProps> = ({ song, isPlaying, togglePlay, onViewChange, onOpenSidebar }) => {
  return (
    <div className="h-[90px] bg-black border-t border-[#282828] px-4 flex items-center justify-between text-[#b3b3b3] z-50 relative" id="player-bar">
      
      {/* Left: Now Playing */}
      <div className="flex items-center w-[30%] min-w-[180px]">
        {/* Click to open Right Sidebar */}
        <div className="relative group cursor-pointer" id="player-cover" onClick={onOpenSidebar}>
           {song.coverImage ? (
             <img src={song.coverImage} alt="Cover" className="h-14 w-14 rounded-md shadow-lg" />
           ) : (
             <div className="h-14 w-14 bg-[#282828] rounded-md flex items-center justify-center">
                <span className="text-xs">No Art</span>
             </div>
           )}
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-md">
               <Maximize2 size={16} className="text-white" />
           </div>
        </div>
        <div className="ml-4 flex flex-col justify-center overflow-hidden">
           <div 
             className="text-white text-sm hover:underline cursor-pointer truncate"
             onClick={() => onViewChange(PreviewView.PLAYLIST)}
           >
             {song.title || "Song Title"}
           </div>
           <div 
             className="text-xs hover:underline cursor-pointer truncate hover:text-white"
             onClick={() => onViewChange(PreviewView.ARTIST_PAGE)}
           >
             {song.artist || "Artist Name"}
             {song.featArtist && `, ${song.featArtist}`}
           </div>
        </div>
        <div className="ml-4 cursor-pointer hover:text-white">
          <Heart size={16} />
        </div>
      </div>

      {/* Center: Controls */}
      <div className="flex flex-col items-center max-w-[40%] w-full">
         <div className="flex items-center gap-6 mb-2">
            <Shuffle size={16} className="cursor-pointer hover:text-white" />
            <SkipBack size={20} className="cursor-pointer hover:text-white" />
            <div 
              onClick={togglePlay}
              className="bg-white rounded-full p-2 text-black hover:scale-105 transition cursor-pointer"
            >
               {isPlaying ? <div className="w-4 h-4 border-l-2 border-r-2 border-black ml-px"></div> : <Play size={20} fill="black" />}
            </div>
            <SkipForward size={20} className="cursor-pointer hover:text-white" />
            <Repeat size={16} className="cursor-pointer hover:text-white" />
         </div>
         
         <div className="flex items-center w-full gap-2 text-xs">
            <span>0:00</span>
            <div className="h-1 bg-[#4d4d4d] rounded-full flex-1 group hover:h-1.5 cursor-pointer">
               <div className="bg-white w-0 h-full rounded-full group-hover:bg-[#1ed760] relative">
                  <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
               </div>
            </div>
            <span>{song.duration || "0:00"}</span>
         </div>
      </div>

      {/* Right: Volume & Options */}
      <div className="flex items-center justify-end w-[30%] min-w-[180px] gap-3">
         <div className="cursor-pointer hover:text-white" onClick={onOpenSidebar}>
             <Mic2 size={18} />
         </div>
         <ListMusic size={18} className="cursor-pointer hover:text-white" />
         <MonitorSpeaker size={18} className="cursor-pointer hover:text-white" />
         <div className="flex items-center gap-2 group">
            <Volume2 size={18} className="cursor-pointer hover:text-white" />
            <div className="w-24 h-1 bg-[#4d4d4d] rounded-full cursor-pointer">
              <div className="bg-white w-2/3 h-full rounded-full group-hover:bg-[#1ed760]"></div>
            </div>
         </div>
         <div 
           className="cursor-pointer hover:text-white"
           onClick={() => onViewChange(PreviewView.CANVAS_FULL)}
         >
            <Maximize2 size={18} />
         </div>
      </div>
    </div>
  );
};

export default Player;