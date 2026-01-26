import React, { useState, useEffect, useRef } from 'react';
import { SongMetadata, TrendSong, ArtistProfile } from '../../types';
import { Play, SkipForward, SkipBack, ThumbsUp, ThumbsDown, MoreVertical, ListVideo, Cast, Search, Radio, ListPlus, Share2, Disc, User, Bell } from 'lucide-react';

interface YouTubeMusicViewProps {
  song: SongMetadata;
  profile: ArtistProfile;
  trends: TrendSong[];
}

const ActionMenu = ({ visible, onClose, onArtistClick }: { visible: boolean, onClose: () => void, onArtistClick: () => void }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <div 
            ref={menuRef}
            className="absolute right-0 top-8 z-[100] w-72 bg-[#1f1f1f] shadow-[0_4px_24px_rgba(0,0,0,0.5)] rounded py-2 text-white animate-enter-view origin-top-right border border-[#ffffff05]"
        >
            <MenuItem icon={<Radio size={24} />} label="Start radio" />
            <MenuItem icon={<ListVideo size={24} />} label="Play next" />
            <MenuItem icon={<ListPlus size={24} />} label="Add to queue" />
            <MenuItem icon={<ListPlus size={24} />} label="Add to playlist" />
            <div className="h-[1px] bg-[#ffffff10] my-2"></div>
            <div onClick={onArtistClick}>
                <MenuItem icon={<User size={24} />} label="Go to artist" />
            </div>
            <MenuItem icon={<Disc size={24} />} label="Go to album" />
            <MenuItem icon={<Share2 size={24} />} label="Share" />
        </div>
    );
};

const MenuItem = ({ icon, label }: { icon: any, label: string }) => (
    <div className="flex items-center gap-5 px-4 py-3 hover:bg-[#333] cursor-pointer transition">
        <span className="text-[#aaa]">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
    </div>
);

const YouTubeMusicView: React.FC<YouTubeMusicViewProps> = ({ song, profile, trends }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [internalView, setInternalView] = useState<'home' | 'artist'>('home');

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const goToArtist = () => {
      setInternalView('artist');
      setActiveMenu(null);
  };

  const renderContent = () => {
      if (internalView === 'artist') {
          return (
              <div className="animate-enter-view pb-10">
                  {/* Artist Banner */}
                  <div className="h-[340px] w-full relative mb-6">
                      <div 
                        className="absolute inset-0 bg-gradient-to-b from-[#444] to-[#030303]"
                        style={{ backgroundColor: song.colorHex }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-black/20"></div>
                      
                      <div className="absolute bottom-0 left-0 p-12 flex flex-col items-center md:items-start md:flex-row gap-10 w-full max-w-7xl mx-auto">
                           <div className="w-44 h-44 rounded-full overflow-hidden shadow-2xl border-4 border-[#030303] bg-[#212121]">
                               <img src={profile.imageUrl || "https://via.placeholder.com/300"} className="w-full h-full object-cover" />
                           </div>
                           <div className="flex flex-col gap-3 justify-end pb-2 text-center md:text-left flex-1">
                               <h1 className="text-5xl md:text-6xl font-black tracking-tight">{profile.name}</h1>
                               <div className="flex items-center gap-2 text-[#aaa] text-sm font-medium justify-center md:justify-start">
                                   <span>1.2M subscribers</span>
                               </div>
                               <div className="flex gap-4 mt-2 justify-center md:justify-start">
                                   <button className="bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:bg-[#e0e0e0] transition uppercase tracking-wide">Subscribe</button>
                                   <div className="flex gap-3">
                                       <button className="w-9 h-9 rounded-full bg-transparent border border-[#ffffff20] text-white flex items-center justify-center hover:bg-[#ffffff10]"><Radio size={20} /></button>
                                       <button className="w-9 h-9 rounded-full bg-transparent border border-[#ffffff20] text-white flex items-center justify-center hover:bg-[#ffffff10]"><Share2 size={20} /></button>
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>

                  <div className="px-12 py-6 max-w-7xl mx-auto">
                      <h2 className="text-3xl font-bold mb-6">Latest Release</h2>
                      <div className="flex items-start gap-6 mb-12 group cursor-pointer" onClick={() => setInternalView('home')}>
                           <div className="w-40 h-40 relative rounded overflow-hidden shadow-lg">
                               <img src={song.coverImage || ""} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                                   <Play fill="white" size={40} />
                               </div>
                           </div>
                           <div className="flex flex-col gap-1 pt-2">
                               <span className="font-bold text-2xl group-hover:underline">{song.title}</span>
                               <span className="text-[#aaa] text-base">Single • {song.artist} • 2024</span>
                               <div className="flex gap-3 mt-4">
                                   <button className="px-4 py-1.5 bg-[#ffffff10] rounded-full text-sm font-medium hover:bg-[#ffffff20] transition flex items-center gap-2">
                                        <ListPlus size={18} /> Save
                                   </button>
                                   <button className="px-4 py-1.5 bg-[#ffffff10] rounded-full text-sm font-medium hover:bg-[#ffffff20] transition flex items-center gap-2">
                                        <Share2 size={18} /> Share
                                   </button>
                               </div>
                           </div>
                      </div>

                      <h2 className="text-2xl font-bold mb-4">Top Songs</h2>
                      <div className="flex flex-col gap-0 max-w-5xl">
                          {/* User Song Row */}
                          <div className="flex items-center justify-between px-4 py-3 hover:bg-[#ffffff10] rounded-sm group transition border-b border-[#ffffff05]">
                              <div className="flex items-center gap-6 flex-1">
                                  <span className="text-[#aaa] w-4 text-center text-sm font-medium">1</span>
                                  <div className="w-12 h-12 relative flex-shrink-0">
                                       <img src={song.coverImage || ""} className="w-full h-full object-cover rounded-sm group-hover:opacity-50 transition" />
                                       <Play fill="white" size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition" />
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="font-medium text-white text-base">{song.title}</span>
                                      <span className="text-[#aaa] text-sm">{song.artist} • {song.duration}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <ThumbsUp className="text-[#aaa] hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer" size={20} />
                                  <ThumbsDown className="text-[#aaa] hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer" size={20} />
                                  <MoreVertical className="text-[#aaa] opacity-0 group-hover:opacity-100 cursor-pointer hover:text-white" size={20} />
                              </div>
                          </div>
                          {trends.slice(0,4).map((t, i) => (
                              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-[#ffffff10] rounded-sm group transition border-b border-[#ffffff05]">
                                  <div className="flex items-center gap-6 flex-1">
                                      <span className="text-[#aaa] w-4 text-center text-sm font-medium">{i+2}</span>
                                      <div className="w-12 h-12 relative flex-shrink-0">
                                            <img src={t.cover} className="w-full h-full object-cover rounded-sm group-hover:opacity-50 transition" />
                                            <Play fill="white" size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition" />
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="font-medium text-white text-base">{t.title}</span>
                                          <span className="text-[#aaa] text-sm">{t.artist} • {t.duration}</span>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <ThumbsUp className="text-[#aaa] hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer" size={20} />
                                    <ThumbsDown className="text-[#aaa] hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer" size={20} />
                                    <MoreVertical className="text-[#aaa] opacity-0 group-hover:opacity-100 cursor-pointer hover:text-white" size={20} />
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )
      }

      // Default Home View
      return (
           <div className="px-12 py-8 animate-enter-view max-w-[1600px] mx-auto">
               {/* Chips */}
               <div className="flex gap-3 mb-12 overflow-x-auto no-scrollbar pb-2 pt-2 sticky top-[60px] bg-[#030303] z-20 -mx-12 px-12">
                   {['Energize', 'Workout', 'Relax', 'Commute', 'Focus', 'Romance', 'Sleep', 'Party', 'Charts', 'New Releases'].map(c => (
                       <span key={c} className="bg-[#ffffff10] border border-[#ffffff10] px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-[#ffffff20] transition cursor-pointer whitespace-nowrap">
                           {c}
                       </span>
                   ))}
               </div>

               {/* Artist/Album Spotlight (The User's Release) */}
               <div className="flex items-end gap-10 mb-16">
                   <div className="w-56 h-56 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex-shrink-0 group relative">
                       <img src={song.coverImage || ""} className="w-full h-full object-cover rounded-sm" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer border border-white/10">
                           <Play fill="white" size={56} />
                       </div>
                   </div>
                   <div className="flex flex-col gap-4 mb-2">
                       <h1 className="text-5xl font-bold tracking-tight">{song.title}</h1>
                       <div className="flex items-center gap-2 text-[#aaa] text-lg">
                           <span 
                             className="text-white font-medium hover:underline cursor-pointer"
                             onClick={() => setInternalView('artist')}
                           >
                               {song.artist}
                           </span>
                           <span>•</span>
                           <span className="hover:underline cursor-pointer">Album</span>
                           <span>•</span>
                           <span>2024</span>
                       </div>
                       <div className="flex items-center gap-3 mt-2">
                           <button className="bg-white text-black px-8 py-2 rounded-full font-bold text-sm hover:bg-[#e0e0e0] transition uppercase tracking-wide">Play</button>
                           <button className="bg-transparent text-white px-8 py-2 rounded-full font-bold text-sm hover:bg-[#ffffff10] transition border border-[#ffffff30] uppercase tracking-wide">Save to Library</button>
                           <div className="relative">
                                <button 
                                    className="w-10 h-10 rounded-full hover:bg-[#ffffff10] flex items-center justify-center transition"
                                    onClick={(e) => handleMenuClick(e, 'main-hero')}
                                >
                                    <MoreVertical className="text-white" size={24} />
                                </button>
                                <ActionMenu visible={activeMenu === 'main-hero'} onClose={() => setActiveMenu(null)} onArtistClick={goToArtist} />
                           </div>
                       </div>
                   </div>
               </div>

               {/* Songs List */}
               <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-6">Songs</h2>
                    <div className="bg-[#030303] border border-[#ffffff10] rounded-md">
                        <div className="flex items-center justify-between p-3 hover:bg-[#ffffff10] group border-b border-[#ffffff10] transition">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 relative flex items-center justify-center cursor-pointer">
                                    <img src={song.coverImage || ""} className="w-full h-full object-cover rounded-sm opacity-100 group-hover:opacity-40 transition" />
                                    <Play fill="white" size={24} className="absolute opacity-0 group-hover:opacity-100 transition z-10" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-white hover:underline cursor-pointer text-base">{song.title}</span>
                                    <span className="text-sm text-[#aaa]">{song.artist} • {song.duration}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition text-[#aaa]">
                                <ThumbsUp size={20} className="hover:text-white cursor-pointer" />
                                <ThumbsDown size={20} className="hover:text-white cursor-pointer" />
                                <div className="relative">
                                    <MoreVertical 
                                        size={20} 
                                        className="hover:text-white cursor-pointer" 
                                        onClick={(e) => handleMenuClick(e, 'row-user')}
                                    />
                                    <ActionMenu visible={activeMenu === 'row-user'} onClose={() => setActiveMenu(null)} onArtistClick={goToArtist} />
                                </div>
                            </div>
                        </div>
                        {/* Mock Trends in YTM style */}
                        {trends.slice(0,4).map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-[#ffffff10] group transition border-b border-[#ffffff05]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 relative flex items-center justify-center cursor-pointer">
                                        <img src={t.cover} className="w-full h-full object-cover rounded-sm opacity-100 group-hover:opacity-40 transition" />
                                        <Play fill="white" size={24} className="absolute opacity-0 group-hover:opacity-100 transition z-10" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white hover:underline cursor-pointer text-base">{t.title}</span>
                                        <span className="text-sm text-[#aaa]">{t.artist} • {t.duration}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition text-[#aaa]">
                                    <ThumbsUp size={20} className="hover:text-white cursor-pointer" />
                                    <ThumbsDown size={20} className="hover:text-white cursor-pointer" />
                                    <div className="relative">
                                        <MoreVertical 
                                            size={20} 
                                            className="hover:text-white cursor-pointer" 
                                            onClick={(e) => handleMenuClick(e, `row-${i}`)}
                                        />
                                        <ActionMenu visible={activeMenu === `row-${i}`} onClose={() => setActiveMenu(null)} onArtistClick={goToArtist} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
               </div>

               {/* "Quick Picks" (Horizontal Grid) */}
               <div className="pb-10">
                   <div className="flex justify-between items-end mb-6">
                       <h2 className="text-3xl font-bold">Quick picks</h2>
                       <span className="border border-[#ffffff20] rounded-full px-4 py-1.5 text-xs font-bold uppercase hover:bg-[#ffffff10] cursor-pointer hover:border-white transition tracking-wide">Play all</span>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                       {trends.slice(4,10).map((t, i) => (
                           <div key={i} className="flex flex-col gap-3 cursor-pointer group">
                               <div className="aspect-square relative overflow-hidden rounded-md shadow-lg">
                                   <img src={t.cover} className="w-full h-full object-cover group-hover:brightness-50 transition" />
                                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                       <Play fill="white" size={48} className="hover:scale-110 transition drop-shadow-lg" />
                                   </div>
                               </div>
                               <div className="flex flex-col">
                                   <span className="font-bold text-sm truncate group-hover:underline">{t.title}</span>
                                   <span className="text-[#aaa] text-sm truncate">{t.artist}</span>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
      )
  };

  return (
    <div className="h-full bg-[#030303] text-white font-sans pb-24 relative overflow-y-auto custom-scrollbar">
       {/* YTM Navbar */}
       <div className="sticky top-0 z-50 bg-[#030303] flex items-center justify-between px-8 py-3 shadow-md border-b border-[#ffffff10]">
           <div className="flex items-center gap-1 cursor-pointer" onClick={() => setInternalView('home')}>
               <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center">
                   <Play fill="white" size={12} className="ml-0.5" />
               </div>
               <span className="font-bold tracking-tighter text-2xl ml-1 font-sans">Music</span>
           </div>
           
           <div className="flex items-center gap-12 text-[#aaa] font-medium text-lg hidden lg:flex">
               <span 
                 className={`cursor-pointer pb-4 -mb-4 transition-colors ${internalView === 'home' ? 'text-white border-b-2 border-white' : 'hover:text-white'}`}
                 onClick={() => setInternalView('home')}
               >
                   Home
               </span>
               <span className="hover:text-white cursor-pointer transition-colors">Explore</span>
               <span className="hover:text-white cursor-pointer transition-colors">Library</span>
               <span className="hover:text-white cursor-pointer transition-colors">Upgrade</span>
           </div>

           <div className="flex items-center gap-6 text-white">
               <div className="flex items-center gap-2 cursor-pointer hover:bg-[#ffffff10] rounded-full px-3 py-1.5 transition">
                    <Search size={22} className="text-white" />
                    <span className="text-[#aaa] font-medium hidden md:block">Search</span>
               </div>
               <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 cursor-pointer hover:ring-2 ring-white transition" onClick={() => setInternalView('artist')}>
                    <img src={profile.imageUrl || ""} className="w-full h-full object-cover" />
               </div>
           </div>
       </div>

       {renderContent()}

       {/* YTM Player Bar */}
       <div className="fixed bottom-0 left-0 w-full h-[72px] bg-[#212121] flex items-center justify-between px-4 z-50 border-t border-[#ffffff10]">
            <div className="flex items-center gap-4 w-[30%]">
                 <div className="flex gap-4 text-[#aaa]">
                     <SkipBack size={26} fill="currentColor" className="cursor-pointer hover:text-white" />
                     <Play size={26} fill="white" className="text-white cursor-pointer hover:scale-110 transition drop-shadow-md" />
                     <SkipForward size={26} fill="currentColor" className="cursor-pointer hover:text-white" />
                 </div>
                 <span className="text-xs text-[#aaa] font-medium ml-2">0:00 / {song.duration}</span>
            </div>

            <div className="flex flex-col items-center w-[40%]">
                 <div className="flex items-center gap-4">
                     <img src={song.coverImage || ""} className="w-10 h-10 rounded-sm cursor-pointer shadow-sm" />
                     <div className="flex flex-col">
                         <span className="text-white font-medium text-sm hover:underline cursor-pointer">{song.title}</span>
                         <span className="text-[#aaa] text-xs flex items-center gap-1">
                             <span className="hover:underline cursor-pointer" onClick={() => setInternalView('artist')}>{song.artist}</span> 
                             <span>•</span> 
                             <span className="hover:underline cursor-pointer">{song.albumName}</span> 
                             <span>•</span> 
                             2024
                         </span>
                     </div>
                     <div className="flex gap-5 ml-6">
                        <ThumbsUp size={20} className="text-[#aaa] hover:text-white cursor-pointer transition" />
                        <ThumbsDown size={20} className="text-[#aaa] hover:text-white cursor-pointer transition" />
                        <MoreVertical size={20} className="text-[#aaa] hover:text-white cursor-pointer transition" />
                     </div>
                 </div>
            </div>

            <div className="flex items-center justify-end gap-5 w-[30%] text-[#aaa]">
                 <ListVideo size={22} className="hover:text-white cursor-pointer transition" />
                 <Cast size={22} className="hover:text-white cursor-pointer transition" />
                 <div className="w-24 h-1 bg-[#aaa] rounded-full group cursor-pointer relative hover:scale-y-150 transition">
                    <div className="absolute left-0 top-0 h-full bg-white w-1/2 rounded-full"></div>
                 </div>
            </div>
            
            {/* Progress Bar Top of Player */}
            <div className="absolute top-0 left-0 h-[2px] bg-red-600 w-[15%] cursor-pointer hover:h-[4px] transition-all"></div>
       </div>
    </div>
  );
};

export default YouTubeMusicView;