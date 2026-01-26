import React, { useState } from 'react';
import { SongMetadata, ArtistProfile, PreviewView, TrendSong } from '../types';
import { X, MoreHorizontal, Maximize2, Video, Image as ImageIcon, Mic2, Disc, Minimize2 } from 'lucide-react';
import { DEFAULT_COVER } from '../constants';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  song: SongMetadata;
  profile: ArtistProfile;
  trends: TrendSong[];
  isPlaying: boolean;
  onViewChange: (view: PreviewView) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, onClose, song, profile, trends, isPlaying, onViewChange }) => {
  const [activeTab, setActiveTab] = useState<'playing' | 'lyrics'>('playing');
  const [mediaMode, setMediaMode] = useState<'cover' | 'canvas'>('canvas');
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen) return null;

  // Determine what media to show
  const showVideo = mediaMode === 'canvas' && song.canvasVideo;

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  if (isFullScreen) {
      return (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
              <button 
                  onClick={toggleFullScreen}
                  className="absolute top-8 right-8 text-white/50 hover:text-white bg-black/50 p-3 rounded-full"
              >
                  <Minimize2 size={32} />
              </button>
              
              {activeTab === 'playing' ? (
                  <div className="w-full h-full relative">
                      {showVideo ? (
                          <video src={song.canvasVideo!} autoPlay loop muted className="w-full h-full object-contain" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center p-20">
                              <img src={song.coverImage || DEFAULT_COVER} className="max-h-full max-w-full shadow-2xl rounded-lg" />
                          </div>
                      )}
                      <div className="absolute bottom-20 left-20 text-white">
                          <h1 className="text-6xl font-bold mb-4">{song.title}</h1>
                          <p className="text-3xl text-gray-300">{song.artist}</p>
                      </div>
                  </div>
              ) : (
                  <div className="w-full h-full overflow-y-auto p-20 flex flex-col items-center">
                      <div className="max-w-4xl w-full text-center space-y-8">
                        {(song.lyrics || "No lyrics available.").split('\n').map((line, i) => (
                            <p 
                                key={i} 
                                className={`text-5xl font-bold transition-all duration-500 cursor-pointer hover:text-white ${i === 3 ? 'text-white scale-105' : 'text-gray-500'}`}
                            >
                                {line}
                            </p>
                        ))}
                      </div>
                  </div>
              )}
          </div>
      )
  }

  return (
    <div className="w-[300px] xl:w-[420px] bg-[#121212] m-2 ml-0 rounded-lg hidden lg:flex flex-col overflow-hidden h-[calc(100vh-105px)] animate-enter-view relative border border-[#282828]" id="right-sidebar">
       {/* Header Tabs */}
       <div className="flex justify-between items-center p-4 sticky top-0 bg-[#121212] z-20">
          <div className="flex gap-4 font-bold text-sm text-[#b3b3b3]">
              <span 
                className={`cursor-pointer hover:text-white transition ${activeTab === 'playing' ? 'text-white border-b-2 border-white pb-1' : ''}`}
                onClick={() => setActiveTab('playing')}
              >
                  Now Playing
              </span>
              <span 
                className={`cursor-pointer hover:text-white transition ${activeTab === 'lyrics' ? 'text-white border-b-2 border-white pb-1' : ''}`}
                onClick={() => setActiveTab('lyrics')}
              >
                  Lyrics
              </span>
          </div>
          <X size={20} className="cursor-pointer hover:text-white text-[#b3b3b3]" onClick={onClose} />
       </div>
       
       <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
          
          {activeTab === 'playing' ? (
              <div className="flex flex-col gap-6">
                {/* Album Art / Canvas Switcher */}
                <div className="relative group">
                    <div 
                      className={`w-full ${showVideo ? 'aspect-[9/16]' : 'aspect-square'} rounded-lg overflow-hidden relative shadow-lg cursor-pointer bg-[#202020] transition-all duration-300`}
                      onClick={() => onViewChange(PreviewView.PLAYLIST)}
                    >
                        {showVideo ? (
                            <video src={song.canvasVideo!} autoPlay loop muted className="w-full h-full object-cover" />
                        ) : (
                            <img src={song.coverImage || DEFAULT_COVER} className="w-full h-full object-cover" alt="Art" />
                        )}
                        
                        {/* Fullscreen Trigger */}
                        <div 
                            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition cursor-pointer hover:bg-black/80"
                            onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }}
                        >
                            <Maximize2 size={16} />
                        </div>
                    </div>

                    {/* Media Toggle Pills (Only if canvas exists) */}
                    {song.canvasVideo && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex bg-black/60 backdrop-blur-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setMediaMode('canvas'); }}
                                className={`p-1.5 rounded-full transition ${mediaMode === 'canvas' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white'}`}
                                title="Show Canvas"
                            >
                                <Video size={14} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setMediaMode('cover'); }}
                                className={`p-1.5 rounded-full transition ${mediaMode === 'cover' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white'}`}
                                title="Show Cover"
                            >
                                <ImageIcon size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Song Info */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <h2 
                          className="text-2xl font-bold hover:underline cursor-pointer leading-tight text-white"
                          onClick={() => onViewChange(PreviewView.PLAYLIST)}
                        >
                          {song.title}
                        </h2>
                        <p 
                          className="text-[#b3b3b3] hover:text-white cursor-pointer font-medium text-base"
                          onClick={() => onViewChange(PreviewView.ARTIST_PAGE)}
                        >
                          {song.artist}
                        </p>
                    </div>
                    <div className="mt-1 bg-[#1ed760] rounded-full p-1 cursor-pointer hover:scale-105">
                        <MoreHorizontal className="text-black" size={20} />
                    </div>
                </div>

                {/* About the Artist Card */}
                <div 
                  className="bg-[#1f1f1f] rounded-lg overflow-hidden group hover:bg-[#2a2a2a] transition cursor-pointer relative mt-2"
                  onClick={() => onViewChange(PreviewView.ARTIST_PAGE)}
                >
                    <div className="h-40 w-full bg-[#333] relative">
                         {profile.imageUrl && (
                             <img src={profile.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" alt="Artist" />
                         )}
                         <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase tracking-wider text-white">
                             About the artist
                         </div>
                    </div>
                    
                    <div className="p-4">
                        <h3 className="font-bold text-lg mb-1 text-white">{song.artist}</h3>
                        <div className="flex justify-between items-center text-[#b3b3b3] text-sm mb-3">
                            <span className="font-medium">1,234,567 monthly listeners</span>
                            <button className="border border-[#777] text-white px-3 py-1 rounded-full text-xs font-bold hover:border-white hover:scale-105 transition bg-transparent">
                                Follow
                            </button>
                        </div>
                        <p className="text-[#b3b3b3] text-sm line-clamp-4 leading-relaxed group-hover:text-white transition">
                            {profile.bio}
                        </p>
                    </div>
                </div>

                {/* Next Up */}
                 <div className="bg-[#1f1f1f] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                         <span className="font-bold text-white text-sm">Next in Queue</span>
                         <span className="text-[#b3b3b3] text-xs font-bold cursor-pointer hover:underline">Open Queue</span>
                    </div>
                    <div className="flex items-center gap-3 group cursor-pointer hover:bg-[#333] p-1 rounded transition">
                        <div className="w-10 h-10 rounded bg-[#333] overflow-hidden flex-shrink-0 relative">
                             <img src={trends[0]?.cover} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                                 <Disc size={16} className="text-white" />
                             </div>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                             <span className="text-white font-medium text-sm truncate">{trends[0]?.title}</span>
                             <span className="text-[#b3b3b3] text-xs truncate">{trends[0]?.artist}</span>
                        </div>
                    </div>
                 </div>
              </div>
          ) : (
              // Lyrics View
              <div 
                className="flex flex-col gap-6 py-4 rounded-lg min-h-full"
                style={{ backgroundColor: song.colorHex ? `${song.colorHex}30` : '#282828' }}
              >
                  {song.lyrics ? (
                      <div className="px-4 space-y-6">
                           {song.lyrics.split('\n').map((line, i) => (
                               <p 
                                 key={i} 
                                 className={`text-xl font-bold transition-colors cursor-pointer hover:text-white ${i === 1 ? 'text-white' : 'text-white/50'}`}
                               >
                                   {line}
                               </p>
                           ))}
                           <div className="pt-10 text-xs text-white/40 uppercase">
                               Lyrics provided by Musixmatch
                           </div>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                          <Mic2 size={48} className="text-white/20 mb-4" />
                          <h3 className="font-bold text-white text-lg">No Lyrics Available</h3>
                          <p className="text-[#b3b3b3] text-sm mt-2">Add lyrics in the Editor tab to see them appear here.</p>
                      </div>
                  )}
                  
                  <button 
                    onClick={toggleFullScreen}
                    className="mt-4 mx-4 bg-white/10 hover:bg-white/20 text-white py-2 rounded-full font-bold text-sm transition flex items-center justify-center gap-2"
                  >
                      <Maximize2 size={16} /> Full Screen
                  </button>
              </div>
          )}
       </div>
    </div>
  );
};

export default RightSidebar;