import React, { useState, useRef, useEffect } from 'react';
import { SongMetadata, TrendSong, ArtistProfile } from '../../types';
import { Play, Music, Radio, Grid, Search, List, Volume2, SkipBack, SkipForward, Plus, Heart, Share, ListMusic, MessageCircle, X, MoreHorizontal, ChevronRight } from 'lucide-react';

interface AppleMusicViewProps {
  song: SongMetadata;
  profile: ArtistProfile;
  trends: TrendSong[];
}

// Sub-component defined outside to prevent re-creation issues
const ContextMenu = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
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
            className="absolute right-0 top-full mt-2 z-[100] w-64 bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-enter-view origin-top-right text-white ring-1 ring-black/5"
        >
            <div className="flex flex-col p-1.5">
                <MenuItem icon={<ListMusic size={18} />} label="Play Next" />
                <MenuItem icon={<List size={18} />} label="Play Last" />
                <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
                <MenuItem icon={<Plus size={18} />} label="Add to Library" />
                <MenuItem icon={<List size={18} />} label="Add to a Playlist..." />
                <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
                <MenuItem icon={<MessageCircle size={18} />} label="View Lyrics" />
                <MenuItem icon={<Share size={18} />} label="Share Song..." />
                <div className="h-[1px] bg-white/10 my-1 mx-2"></div>
                <MenuItem icon={<Heart size={18} />} label="Love" />
                <MenuItem icon={<X size={18} />} label="Suggest Less" />
            </div>
        </div>
    );
};

const MenuItem = ({ icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
    <div 
      onClick={(e) => {
          e.stopPropagation();
          if(onClick) onClick();
      }}
      className="flex items-center gap-3 px-3 py-2 hover:bg-[#2c2c2e] rounded-lg cursor-pointer transition text-[13px] font-medium"
    >
        <span className="text-[#fa243c]">{icon}</span>
        <span className="text-white/90">{label}</span>
    </div>
);

const AppleMusicView: React.FC<AppleMusicViewProps> = ({ song, profile, trends }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [internalView, setInternalView] = useState<'album' | 'artist'>('album');

  const handleMenuClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  const renderContent = () => {
      if (internalView === 'artist') {
          return (
              <div className="p-8 animate-enter-view max-w-7xl mx-auto">
                  {/* Artist Header */}
                  <div className="flex flex-col items-center mb-12 text-center">
                      <div className="w-56 h-56 rounded-full overflow-hidden shadow-2xl mb-6 relative group border-4 border-[#2c2c2e]">
                          <img src={profile.imageUrl || "https://via.placeholder.com/300"} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center cursor-pointer">
                                <Play fill="white" size={48} className="opacity-0 group-hover:opacity-100 transition scale-90 group-hover:scale-100 drop-shadow-lg" />
                          </div>
                      </div>
                      <h1 className="text-4xl font-bold mb-2 tracking-tight">{profile.name}</h1>
                      <div className="flex items-center gap-2 text-[#fa243c] font-medium text-lg cursor-pointer hover:underline decoration-2">
                          <span>Alternative</span> <ChevronRight size={16} />
                      </div>
                      <div className="flex gap-4 mt-6">
                           <button className="bg-[#fa243c] text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-red-500/20 flex items-center gap-2">
                              <Play fill="white" size={14} /> Play
                           </button>
                           <button className="bg-[#2c2c2e] text-[#fa243c] px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-[#3a3a3c] transition">
                              Shuffle
                           </button>
                      </div>
                  </div>

                  {/* Latest Release */}
                  <div className="mb-12">
                      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                          <h2 className="text-xl font-bold">Latest Release</h2>
                      </div>
                      <div className="flex gap-4">
                           <div 
                             className="w-[320px] bg-[#2c2c2e] p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[#3a3a3c] transition shadow-lg group"
                             onClick={() => setInternalView('album')}
                           >
                                <img src={song.coverImage || ""} className="w-20 h-20 rounded-md shadow-md group-hover:scale-105 transition" />
                                <div>
                                    <div className="font-bold text-lg leading-tight mb-1">{song.title}</div>
                                    <div className="text-[#8e8e93] text-sm font-medium">{new Date().getFullYear()} • Single</div>
                                </div>
                           </div>
                      </div>
                  </div>

                  {/* Top Songs */}
                  <div className="mb-12">
                       <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                          <h2 className="text-xl font-bold">Top Songs</h2>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                            {/* User Song */}
                           <div className="flex items-center p-3 hover:bg-[#2c2c2e] rounded-lg group relative border-b border-white/5 cursor-pointer">
                                <img src={song.coverImage || ""} className="w-12 h-12 rounded-[4px] mr-4 shadow-sm" />
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="font-medium text-white truncate">{song.title}</span>
                                    <span className="text-[9px] bg-[#3a3a3c] text-[#8e8e93] px-1 rounded-[2px] h-3.5 flex items-center justify-center border border-white/10">E</span>
                                </div>
                                <MoreHorizontal className="text-[#fa243c] opacity-0 group-hover:opacity-100 cursor-pointer" />
                           </div>
                           
                           {/* Trends */}
                           {trends.slice(0, 3).map((t, i) => (
                               <div key={i} className="flex items-center p-3 hover:bg-[#2c2c2e] rounded-lg group relative border-b border-white/5 cursor-pointer">
                                    <img src={t.cover} className="w-12 h-12 rounded-[4px] mr-4 shadow-sm" />
                                    <div className="flex-1 font-medium text-white truncate">{t.title}</div>
                                    <MoreHorizontal className="text-[#fa243c] opacity-0 group-hover:opacity-100 cursor-pointer" />
                               </div>
                           ))}
                       </div>
                  </div>
              </div>
          )
      }

      // Default Album View
      return (
          <div className="p-10 animate-enter-view max-w-7xl mx-auto">
               {/* Hero */}
               <div className="flex flex-col md:flex-row items-center md:items-end gap-10 mb-12">
                   <div className="w-64 h-64 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] bg-[#2c2c2e] flex-shrink-0 relative group cursor-pointer hover:scale-[1.02] transition duration-500">
                        <img src={song.coverImage || ""} className="w-full h-full object-cover rounded-xl" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition rounded-xl flex items-center justify-center">
                             <Play fill="white" size={48} className="opacity-0 group-hover:opacity-100 transition transform scale-90 group-hover:scale-100 drop-shadow-lg" />
                        </div>
                   </div>
                   <div className="flex flex-col mb-2 flex-1 text-center md:text-left items-center md:items-start">
                       <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{song.title}</h1>
                       <h2 
                          className="text-2xl text-[#fa243c] font-medium mb-4 cursor-pointer hover:underline decoration-2"
                          onClick={() => setInternalView('artist')}
                       >
                           {song.artist}
                       </h2>
                       <div className="flex items-center gap-2 text-[#8e8e93] text-xs font-bold uppercase tracking-wider">
                           <span>Alternative</span>
                           <span>•</span>
                           <span>{new Date().getFullYear()}</span>
                           <span>•</span>
                           <span className="border border-[#8e8e93] px-1 rounded-[2px]">Lossless</span>
                       </div>
                       <div className="flex gap-3 mt-8">
                           <button className="bg-[#fa243c] text-white px-8 py-2.5 rounded-lg font-bold text-sm hover:scale-[1.02] active:scale-95 transition shadow-lg shadow-red-500/20 flex items-center gap-2">
                               <Play fill="white" size={14} /> Play
                           </button>
                           <button className="bg-[#2c2c2e] text-[#fa243c] px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-[#3a3a3c] transition">
                               Shuffle
                           </button>
                       </div>
                   </div>
                   
                   {/* Main Actions Menu Button */}
                   <div className="relative self-center md:self-end mb-2">
                        <button 
                            className={`w-8 h-8 rounded-full border border-[#fa243c] flex items-center justify-center text-[#fa243c] hover:bg-[#fa243c] hover:text-white transition ${activeMenu === 'main' ? 'bg-[#fa243c] text-white' : ''}`}
                            onClick={(e) => handleMenuClick(e, 'main')}
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        <ContextMenu visible={activeMenu === 'main'} onClose={() => setActiveMenu(null)} />
                   </div>
               </div>

               {/* Tracklist Table */}
               <div className="mb-10">
                   <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                      <h3 className="text-xl font-bold">Songs</h3>
                   </div>
                   
                   <div className="flex flex-col">
                       {/* User Song */}
                       <div className="flex items-center p-3 hover:bg-[#2c2c2e] rounded-lg group relative transition border-b border-white/5">
                            <div className="w-8 text-[#8e8e93] font-medium text-right mr-5 group-hover:hidden text-sm">1</div>
                            <div className="w-8 text-[#8e8e93] font-medium text-right mr-5 hidden group-hover:block cursor-pointer"><Play size={16} fill="#8e8e93" /></div>
                            
                            <div className="flex-1 font-medium text-white cursor-default text-base">{song.title}</div>
                            
                            <div className="text-[#8e8e93] text-sm font-mono mr-4">{song.duration}</div>
                            
                            {/* Row Menu */}
                            <div className="relative">
                                <button
                                    onClick={(e) => handleMenuClick(e, 'row-user')}
                                    className="p-1 rounded hover:bg-white/10 transition"
                                >
                                    <MoreHorizontal size={18} className="text-[#fa243c] opacity-0 group-hover:opacity-100 transition" />
                                </button>
                                <ContextMenu visible={activeMenu === 'row-user'} onClose={() => setActiveMenu(null)} />
                            </div>
                       </div>
                       
                       {/* Trends */}
                       {trends.slice(0, 6).map((t, i) => (
                           <div key={i} className="flex items-center p-3 hover:bg-[#2c2c2e] rounded-lg group relative transition border-b border-white/5">
                                <div className="w-8 text-[#8e8e93] font-medium text-right mr-5 group-hover:hidden text-sm">{i+2}</div>
                                <div className="w-8 text-[#8e8e93] font-medium text-right mr-5 hidden group-hover:block cursor-pointer"><Play size={16} fill="#8e8e93" /></div>
                                
                                <div className="flex-1 font-medium text-white cursor-default text-base">{t.title}</div>
                                
                                <div className="text-[#8e8e93] text-sm font-mono mr-4">{t.duration}</div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => handleMenuClick(e, `row-${i}`)}
                                        className="p-1 rounded hover:bg-white/10 transition"
                                    >
                                        <MoreHorizontal size={18} className="text-[#fa243c] opacity-0 group-hover:opacity-100 transition" />
                                    </button>
                                    <ContextMenu visible={activeMenu === `row-${i}`} onClose={() => setActiveMenu(null)} />
                                </div>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
      )
  };

  return (
    <div className="h-full bg-[#1e1e1e] text-white font-sans flex relative overflow-hidden">
       {/* Internal Sidebar */}
       <div className="w-[260px] bg-[#2a2a2a]/30 backdrop-blur-xl border-r border-white/5 h-full flex flex-col pt-8 pb-4 px-4 flex-shrink-0 hidden md:flex">
            <div className="flex items-center gap-3 mb-8 px-3 text-white cursor-pointer group" onClick={() => setInternalView('album')}>
                <div className="bg-gradient-to-br from-[#fc3c44] to-[#f94c57] rounded-lg p-1.5 shadow-lg group-hover:scale-105 transition">
                    <Music fill="white" size={24} />
                </div>
                <span className="font-semibold text-xl tracking-tight">Music</span>
            </div>
            
            <div className="space-y-1 mb-8">
                <input type="text" placeholder="Search" className="w-full bg-[#1c1c1e] border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#fa243c]/50 transition mb-4" />
                
                <div className="px-3 py-2 bg-[#3a3a3c] rounded-lg text-[#fa243c] font-medium flex items-center gap-3 cursor-pointer">
                    <Play fill="currentColor" size={18} /> <span className="text-sm">Listen Now</span>
                </div>
                <div className="px-3 py-2 text-[#98989d] hover:text-white font-medium flex items-center gap-3 cursor-pointer transition">
                    <Grid size={18} /> <span className="text-sm">Browse</span>
                </div>
                <div className="px-3 py-2 text-[#98989d] hover:text-white font-medium flex items-center gap-3 cursor-pointer transition">
                    <Radio size={18} /> <span className="text-sm">Radio</span>
                </div>
            </div>

            <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#98989d] uppercase px-3 mb-2 tracking-wider">Library</h3>
                <div className="px-3 py-2 text-[#98989d] hover:text-white font-medium flex items-center gap-3 cursor-pointer transition">
                    <List size={18} /> <span className="text-sm">Recently Added</span>
                </div>
                <div className="px-3 py-2 text-[#98989d] hover:text-white font-medium flex items-center gap-3 cursor-pointer transition">
                    <UserIcon /> <span className="text-sm">Artists</span>
                </div>
                <div className="px-3 py-2 text-[#98989d] hover:text-white font-medium flex items-center gap-3 cursor-pointer transition">
                    <DiscIcon /> <span className="text-sm">Albums</span>
                </div>
                <div className="px-3 py-2 text-[#98989d] hover:text-white font-medium flex items-center gap-3 cursor-pointer transition">
                    <Music2Icon /> <span className="text-sm">Songs</span>
                </div>
            </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#1e1e1e] pb-24 relative">
           {/* Top Bar (Sticky) */}
           <div className="h-16 border-b border-white/5 sticky top-0 bg-[#1e1e1e]/80 backdrop-blur-xl z-20 flex items-center justify-end px-6">
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => setInternalView('artist')}>
                    <span className="text-sm font-medium text-white/90">{profile.name}</span>
                    <div className="w-8 h-8 rounded-full bg-[#3a3a3c] flex items-center justify-center text-xs font-bold shadow-md overflow-hidden ring-1 ring-white/10">
                        {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover"/> : profile.name.charAt(0)}
                    </div>
                </div>
           </div>

           {/* Content Area */}
           {renderContent()}
           
           {/* Lyrics Overlay Mock */}
           {showLyrics && (
               <div className="fixed inset-0 z-[200] bg-[#1e1e1e]/95 backdrop-blur-xl flex items-center justify-center p-10 animate-enter-view cursor-pointer" onClick={() => setShowLyrics(false)}>
                   <div className="max-w-3xl text-center space-y-10 font-bold text-4xl md:text-6xl text-white/90 leading-tight cursor-default" onClick={e => e.stopPropagation()}>
                       <p className="opacity-30 blur-[1px]">Verse 1</p>
                       <p className="opacity-60">This is the simulated lyrics view.</p>
                       <p className="text-[#fa243c] scale-105 drop-shadow-[0_0_30px_rgba(250,36,60,0.4)]">Singing along to your new hit song.</p>
                       <p className="opacity-90">It looks amazing on Apple Music.</p>
                       <p className="opacity-60">And the crowd goes wild.</p>
                       <button onClick={() => setShowLyrics(false)} className="mt-12 text-sm bg-white/10 px-6 py-2 rounded-full hover:bg-white/20 transition backdrop-blur-md">Close</button>
                   </div>
               </div>
           )}
           
           {/* AM Player Top Bar Control inside Content */}
           <div className="fixed top-0 left-0 right-0 h-0 flex justify-center z-50 pointer-events-none">
             <div className="mt-2 bg-[#2a2a2a]/80 backdrop-blur-2xl h-[60px] border border-white/10 rounded-xl flex items-center px-4 gap-6 shadow-2xl pointer-events-auto transform translate-y-0 hover:scale-[1.01] transition duration-300 max-w-2xl w-full">
                 <div className="flex items-center gap-5">
                     <SkipBack fill="#8e8e93" size={20} className="text-[#8e8e93] hover:text-white cursor-pointer transition" />
                     <Play fill="white" size={28} className="cursor-pointer hover:scale-110 transition drop-shadow-md" />
                     <SkipForward fill="#8e8e93" size={20} className="text-[#8e8e93] hover:text-white cursor-pointer transition" />
                 </div>
                 
                 <div className="w-[1px] h-6 bg-white/10"></div>
                 
                 <div className="flex items-center flex-1 gap-3 cursor-pointer group" onClick={() => setInternalView('album')}>
                      <img src={song.coverImage || ""} className="w-10 h-10 rounded-md shadow-sm group-hover:shadow-md transition" />
                      <div className="flex flex-col overflow-hidden">
                          <div className="text-[13px] font-medium truncate">{song.title}</div>
                          <div className="text-[11px] text-[#8e8e93] truncate">{song.artist}</div>
                      </div>
                 </div>
                 
                 <div className="flex items-center gap-4 text-[#8e8e93]">
                     <div className="cursor-pointer hover:text-[#fa243c] transition" onClick={() => setShowLyrics(!showLyrics)} title="Lyrics">
                         <MessageCircle size={20} fill={showLyrics ? "#fa243c" : "none"} />
                     </div>
                     <List size={20} className="cursor-pointer hover:text-white transition" />
                     <Volume2 size={20} className="cursor-pointer hover:text-white transition" />
                 </div>
            </div>
           </div>
       </div>
    </div>
  );
};

// Icons helpers
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const DiscIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
const Music2Icon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="18" r="4"/><path d="M12 18V2l7 4"/></svg>

export default AppleMusicView;