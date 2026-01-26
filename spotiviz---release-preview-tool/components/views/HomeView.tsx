import React from 'react';
import { SongMetadata, TrendSong, ArtistProfile, PreviewView } from '../../types';
import { Play, Bell, Users, ChevronLeft, ChevronRight, ArrowDownCircle } from 'lucide-react';

interface HomeViewProps {
  song: SongMetadata;
  profile: ArtistProfile;
  trends: TrendSong[];
  onViewChange: (view: PreviewView) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ song, profile, trends, onViewChange }) => {
  // Helper to create rows of cards
  const renderSection = (title: string, items: TrendSong[], showUserSong = false) => (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-4 px-6">
        <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer tracking-tight">{title}</h2>
        <span className="text-[#b3b3b3] text-sm font-bold hover:underline cursor-pointer">Show all</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-6">
        {showUserSong && (
          <div 
            className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition duration-300 group cursor-pointer shadow-md hover:shadow-xl ease-out"
            onClick={() => onViewChange(PreviewView.PLAYLIST)}
          >
            <div className="relative mb-4 rounded-md overflow-hidden shadow-lg aspect-square">
              <img src={song.coverImage || ""} className="w-full h-full object-cover" alt={song.title} />
              <div className="absolute bottom-2 right-2 bg-[#1ed760] rounded-full p-3 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105">
                <Play size={22} fill="black" className="text-black ml-1" />
              </div>
            </div>
            <h3 className="font-bold text-white truncate mb-1 text-base">{song.title}</h3>
            <p className="text-[#b3b3b3] text-sm line-clamp-2 leading-snug">Single • {song.artist}</p>
          </div>
        )}
        {items.map((t, i) => (
          <div key={i} className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition duration-300 group cursor-pointer shadow-md hover:shadow-xl ease-out">
            <div className="relative mb-4 rounded-md overflow-hidden shadow-lg aspect-square">
              <img src={t.cover} className="w-full h-full object-cover" alt={t.title} />
              <div className="absolute bottom-2 right-2 bg-[#1ed760] rounded-full p-3 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-105">
                <Play size={22} fill="black" className="text-black ml-1" />
              </div>
            </div>
            <h3 className="font-bold text-white truncate mb-1 text-base">{t.title}</h3>
            <p className="text-[#b3b3b3] text-sm line-clamp-2 leading-snug">
              {i % 2 === 0 ? `Single • ${t.artist}` : `${t.artist}, ${trends[(i+1)%trends.length]?.artist} and more`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-full bg-[#121212] overflow-x-hidden">
      {/* Background Gradient */}
      <div 
        className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-b from-opacity-70 to-[#121212] pointer-events-none z-0 transition-colors duration-500"
        style={{ background: `linear-gradient(to bottom, ${song.colorHex}99, #121212)` }}
      ></div>

      {/* Top Header (Sticky) */}
      <div className="sticky top-0 z-40 bg-[#121212]/0 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors duration-200">
         <div className="flex gap-2 text-[#b3b3b3]">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center cursor-not-allowed hover:bg-black/70 transition">
                <ChevronLeft size={22} />
            </div>
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center cursor-not-allowed hover:bg-black/70 transition">
                <ChevronRight size={22} />
            </div>
         </div>
         
         {/* Search Pill */}
         <div className="flex-1 max-w-[480px] mx-4 transition-all">
             <div className="bg-[#242424] rounded-full flex items-center px-3 py-3 border border-transparent hover:bg-[#2a2a2a] hover:border-[#444] group transition-all cursor-text shadow-lg">
                <div className="mr-3 text-[#b3b3b3] group-hover:text-white pl-1">
                   <svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.227 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.058l4.353 4.353a1 1 0 1 0 1.414-1.414l-4.344-4.344a9.157 9.157 0 0 0 2.077-5.816c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.279c0-4.006 3.302-7.28 7.407-7.28s7.407 3.274 7.407 7.28-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.28z"></path></svg>
                </div>
                <input type="text" placeholder="What do you want to play?" className="bg-transparent border-none outline-none text-[15px] font-normal text-white w-full placeholder-[#777]" />
                <div className="border-l border-[#555] pl-3 ml-2 text-[#b3b3b3] hover:text-white cursor-pointer pr-1">
                   <svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM4 18V4h16v14H4z"></path><path d="M7 6h10v2H7V6zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"></path></svg>
                </div>
             </div>
         </div>

         <div className="flex items-center gap-2 text-[#b3b3b3]">
            <div className="hidden lg:flex items-center gap-1 bg-white text-black px-3 py-1.5 rounded-full text-sm font-bold hover:scale-105 transition cursor-pointer mr-2">
                 <span className="text-[13px]">Explore Premium</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-[#0f0f0f] text-white px-3 py-1.5 rounded-full text-sm font-bold hover:scale-105 transition cursor-pointer mr-2">
                 <ArrowDownCircle size={16} />
                 <span className="text-[13px] font-bold">Install App</span>
            </div>
            <div className="p-2 hover:bg-[#222] rounded-full cursor-pointer hover:text-white transition">
                <Bell size={18} />
            </div>
            <div className="p-2 hover:bg-[#222] rounded-full cursor-pointer hover:text-white transition">
                <Users size={18} />
            </div>
            <div 
              className="w-8 h-8 rounded-full p-0.5 bg-[#1f1f1f] cursor-pointer hover:scale-105 transition ml-1"
              onClick={() => onViewChange(PreviewView.ARTIST_PAGE)}
            >
                <img src={profile.imageUrl || "https://via.placeholder.com/40"} className="w-full h-full rounded-full object-cover" alt="Profile" />
            </div>
         </div>
      </div>

      <div className="pb-20 relative z-10 pt-2">
          
          {/* Pills */}
          <div className="flex gap-2 mb-8 px-6">
             <span className="bg-white text-black px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition hover:bg-gray-200">All</span>
             <span className="bg-[#ffffff15] text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-[#ffffff25] cursor-pointer transition">Music</span>
             <span className="bg-[#ffffff15] text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-[#ffffff25] cursor-pointer transition">Podcasts</span>
          </div>

          {/* User's Song Hero Banner */}
          <div className="px-6 mb-8">
              <div 
                className="rounded-lg p-8 flex flex-col justify-between h-[300px] relative overflow-hidden group shadow-2xl border border-white/5 cursor-pointer hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-300"
                style={{ background: `linear-gradient(to right, ${song.colorHex || '#392b45'}, #181818)` }}
                onClick={() => onViewChange(PreviewView.PLAYLIST)}
              >
                  <div className="absolute right-0 bottom-0 top-0 w-2/3 opacity-50 group-hover:opacity-70 transition duration-500 pointer-events-none mix-blend-overlay">
                     <img src={song.coverImage || ""} className="h-full w-full object-cover mask-image-gradient" style={{maskImage: 'linear-gradient(to right, transparent, black)'}} />
                  </div>
                  <div className="relative z-10 flex flex-col justify-center h-full max-w-2xl">
                      <span className="text-xs font-bold uppercase tracking-widest mb-3 block text-white/90">New Release</span>
                      <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 shadow-black drop-shadow-xl truncate">{song.title}</h1>
                      <p className="text-xl font-medium mb-8 drop-shadow-md text-white/90">Now streaming • {song.artist}</p>
                      
                      <div className="flex gap-4">
                          <button className="bg-[#1ed760] text-black rounded-full px-8 py-3.5 font-bold text-base hover:scale-105 hover:bg-[#1fdf64] transition flex items-center gap-2 shadow-lg">
                              Play
                          </button>
                          <button className="bg-black/30 text-white border border-white/30 rounded-full px-8 py-3.5 font-bold text-base hover:bg-black/50 hover:border-white transition backdrop-blur-sm">
                              Save
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          {/* Quick Access Grid */}
          <div className="px-6 mb-10">
              <h2 className="text-2xl font-bold mb-4 text-white tracking-tight">Good afternoon</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {/* User Song First */}
                 <div 
                   className="flex items-center bg-[#ffffff10] rounded-md overflow-hidden hover:bg-[#ffffff20] transition duration-300 group cursor-pointer pr-4 h-[64px] relative shadow-md"
                   onClick={() => onViewChange(PreviewView.PLAYLIST)}
                 >
                    <img src={song.coverImage || ""} className="h-[64px] w-[64px] object-cover shadow-lg flex-shrink-0" />
                    <span className="font-bold text-[14px] px-4 truncate">{song.title}</span>
                    <div className="absolute right-4 bg-[#1ed760] rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-black drop-shadow-md hover:scale-105">
                       <Play size={20} fill="black" className="text-black ml-0.5" />
                    </div>
                 </div>

                 {/* Trends */}
                 {trends.slice(0, 7).map((t, i) => (
                    <div key={i} className="flex items-center bg-[#ffffff10] rounded-md overflow-hidden hover:bg-[#ffffff20] transition duration-300 group cursor-pointer pr-4 h-[64px] relative shadow-md">
                        <img src={t.cover} className="h-[64px] w-[64px] object-cover shadow-lg flex-shrink-0" />
                        <span className="font-bold text-[14px] px-4 truncate">{t.title}</span>
                        <div className="absolute right-4 bg-[#1ed760] rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-black drop-shadow-md hover:scale-105">
                          <Play size={20} fill="black" className="text-black ml-0.5" />
                        </div>
                    </div>
                 ))}
              </div>
          </div>

          {/* Various Sections */}
          {renderSection(`Made For ${profile.name}`, trends.slice(0, 5), true)}
          {renderSection("Your Top Mixes", trends.slice(5, 10))}
          {renderSection("Recently Played", trends.slice(2, 7))}
          {renderSection("Jump Back In", trends.slice(4, 9))}
          {renderSection("Recommended Radio", trends.slice(1, 6))}
          {renderSection("Uniquely Yours", trends.slice(0, 5))}
      </div>
    </div>
  );
};

export default HomeView;