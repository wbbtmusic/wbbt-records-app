import React, { useState } from 'react';
import { SongMetadata, ArtistProfile } from '../../types';
import { X, MoreHorizontal, Send, Heart, Search } from 'lucide-react';

interface InstagramViewProps {
  song: SongMetadata;
  // Added profile prop to use user data
  profile?: ArtistProfile; 
}

// Update component signature to accept profile, but fallback if not passed directly (though it should be passed via spread or prop in parent)
// Actually, looking at PreviewArea, it only passes 'song'. I need to update PreviewArea to pass profile, 
// OR simpler: assume the parent passes it. Let's make sure PreviewArea passes it in the next file change. 
// For now, I will update this file to accept it.

const InstagramView: React.FC<InstagramViewProps & { profile: ArtistProfile }> = ({ song, profile }) => {
  const [stickerVariant, setStickerVariant] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Format username from artist name: "Future Star" -> "future_star"
  const username = profile.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const toggleSticker = () => {
    setStickerVariant((prev) => (prev + 1) % 3);
  };

  const getStickerContent = () => {
    switch(stickerVariant) {
        case 0: // Compact (Default)
            return (
                <div className="bg-white/90 rounded-xl p-3 flex items-center gap-3 shadow-xl transform rotate-[-5deg] backdrop-blur-md animate-enter-view cursor-pointer" onClick={toggleSticker}>
                       <div className="w-14 h-14 rounded-md overflow-hidden bg-black flex-shrink-0 relative">
                            <img src={song.coverImage || ""} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Tiny equalizer bars animation mock */}
                                <div className="flex gap-0.5 items-end h-4">
                                    <div className="w-1.5 bg-white h-2 animate-pulse"></div>
                                    <div className="w-1.5 bg-white h-5 animate-pulse delay-75"></div>
                                    <div className="w-1.5 bg-white h-3 animate-pulse delay-100"></div>
                                </div>
                            </div>
                       </div>
                       <div className="flex flex-col overflow-hidden pr-2 max-w-[150px]">
                           <span className="font-bold text-black text-sm truncate">{song.title}</span>
                           <span className="text-gray-600 text-xs truncate">{song.artist}</span>
                       </div>
                </div>
            );
        case 1: // Large Card
            return (
                <div className="bg-white/90 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-xl transform rotate-0 backdrop-blur-md animate-enter-view cursor-pointer w-[240px]" onClick={toggleSticker}>
                    <img src={song.coverImage || ""} className="w-full aspect-square rounded-xl object-cover shadow-sm" />
                    <div className="flex flex-col items-center text-center w-full">
                           <span className="font-black text-black text-lg truncate w-full">{song.title}</span>
                           <span className="text-gray-600 text-sm truncate w-full">{song.artist}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-black w-1/3 animate-pulse"></div>
                    </div>
                </div>
            );
        case 2: // Lyrics / Minimal
             return (
                <div className="flex flex-col items-center justify-center gap-1 cursor-pointer animate-enter-view" onClick={toggleSticker}>
                    <div className="text-3xl font-black text-white drop-shadow-lg text-center leading-tight">
                        {song.title.toUpperCase()}
                    </div>
                    <div className="text-xl font-bold text-white/80 drop-shadow-md">
                        {song.artist}
                    </div>
                    <div className="mt-4 flex gap-1 items-end h-6 opacity-80">
                         <div className="w-1 bg-white h-3 animate-pulse"></div>
                         <div className="w-1 bg-white h-6 animate-pulse delay-75"></div>
                         <div className="w-1 bg-white h-4 animate-pulse delay-150"></div>
                         <div className="w-1 bg-white h-5 animate-pulse delay-100"></div>
                    </div>
                </div>
             );
        default: return null;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#111] p-4 font-sans">
       {/* Phone Mockup */}
       <div className="w-[360px] h-[720px] bg-black rounded-[35px] overflow-hidden relative border-[8px] border-[#333] shadow-2xl">
           
           {/* Background Image (Blurred) */}
           <div className="absolute inset-0 z-0">
               {song.coverImage ? (
                   <img src={song.coverImage} className="w-full h-full object-cover blur-2xl opacity-50 scale-125" />
               ) : (
                   <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400"></div>
               )}
               <div className="absolute inset-0 bg-black/20"></div>
           </div>

           {/* Story UI Overlay */}
           <div className="absolute inset-0 z-10 flex flex-col justify-between pt-12 pb-8 px-4">
               {/* Top Bar */}
               <div className="flex justify-between items-center text-white/90">
                   <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-white/50">
                           {/* User Avatar */}
                           <img src={profile.imageUrl || "https://via.placeholder.com/100"} className="w-full h-full object-cover" />
                       </div>
                       <span className="font-semibold text-sm drop-shadow-md">{username}</span>
                       <span className="text-white/70 text-sm drop-shadow-md">12h</span>
                   </div>
                   <div className="flex gap-4 drop-shadow-md">
                       <MoreHorizontal className="cursor-pointer" />
                       <X className="cursor-pointer" />
                   </div>
               </div>

               {/* Main Content Area - The Music Sticker */}
               <div className="flex-1 flex items-center justify-center relative">
                   <div className="absolute top-10 text-white/60 text-xs font-bold uppercase tracking-widest pointer-events-none">
                      Tap sticker to change style
                   </div>
                   {getStickerContent()}
               </div>

               {/* Share Menu Overlay */}
               {showShareMenu && (
                   <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-enter-view" onClick={() => setShowShareMenu(false)}>
                       <div 
                          className="bg-[#222] rounded-t-3xl p-6 flex flex-col gap-4 border-t border-white/10"
                          onClick={(e) => e.stopPropagation()} // Prevent close when clicking menu
                       >
                           <div className="w-10 h-1 bg-gray-500 rounded-full mx-auto mb-2"></div>
                           <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input type="text" placeholder="Search" className="w-full bg-[#333] rounded-xl py-2 pl-10 pr-4 text-white text-sm outline-none placeholder-gray-400" />
                           </div>
                           <div className="grid grid-cols-4 gap-4 mt-2">
                               {[1,2,3,4,5,6,7,8].map(i => (
                                   <div key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                                       <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden">
                                           <img src={`https://picsum.photos/seed/${i}/100`} className="w-full h-full object-cover" />
                                       </div>
                                       <span className="text-xs text-white/80">User {i}</span>
                                   </div>
                               ))}
                           </div>
                           <button 
                               className="bg-blue-500 text-white font-bold py-3 rounded-xl mt-2 active:scale-95 transition"
                               onClick={() => setShowShareMenu(false)}
                           >
                               Send
                           </button>
                       </div>
                   </div>
               )}

               {/* Bottom Bar (Reply) */}
               {!showShareMenu && (
                   <div className="flex items-center gap-4">
                       <div className="flex-1 h-11 border border-white/40 rounded-full flex items-center px-4 cursor-pointer hover:bg-white/10 transition">
                           <span className="text-white/90 text-sm drop-shadow-sm">Send message</span>
                       </div>
                       <Heart className="text-white w-7 h-7 drop-shadow-md cursor-pointer hover:scale-110 transition active:text-red-500" />
                       <Send 
                           className="text-white w-7 h-7 -rotate-45 mb-1 drop-shadow-md cursor-pointer hover:scale-110 transition" 
                           onClick={() => setShowShareMenu(true)}
                       />
                   </div>
               )}
           </div>

           {/* Progress Bar Top */}
           <div className="absolute top-3 left-2 right-2 flex gap-1 h-[2px] z-20">
                <div className="flex-1 bg-white/40 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[60%]"></div>
                </div>
           </div>
       </div>
    </div>
  );
};

export default InstagramView;