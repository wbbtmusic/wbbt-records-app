import React from 'react';
import { Home, Search, Library, Plus, ArrowRight, List, Pin, Monitor, Youtube, Music, Smartphone, Disc, LayoutGrid, Menu } from 'lucide-react';
import { TrendSong, SongMetadata, ArtistProfile, PreviewView } from '../types';

interface SidebarProps {
  onTrendClick: (song: TrendSong) => void;
  trends: TrendSong[];
  song: SongMetadata;
  profile: ArtistProfile;
  view: PreviewView;
  onViewChange: (view: PreviewView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onTrendClick, trends, song, profile, view, onViewChange }) => {
  
  const isSpotify = view === PreviewView.HOME || view === PreviewView.PLAYLIST || view === PreviewView.ARTIST_PAGE || view === PreviewView.SEARCH || view === PreviewView.EDITOR;
  const collapsed = !isSpotify;

  const NavItem = ({ id, icon: Icon, label, colorClass }: { id: PreviewView, icon: any, label: string, colorClass: string }) => (
    <div 
      onClick={() => onViewChange(id)}
      className={`flex items-center gap-4 cursor-pointer transition-all duration-200 group ${collapsed ? 'justify-center p-3 rounded-xl hover:bg-[#282828]' : 'px-4 py-3 hover:text-white'}`}
      title={label}
    >
      <Icon 
        size={collapsed ? 28 : 24} 
        className={`transition-colors ${view === id ? colorClass : 'text-[#b3b3b3] group-hover:text-white'}`} 
        strokeWidth={view === id ? 3 : 2.5}
      />
      {!collapsed && (
        <span className={`font-bold text-[16px] ${view === id ? 'text-white' : 'text-[#b3b3b3] group-hover:text-white'}`}>{label}</span>
      )}
    </div>
  );

  return (
    <div className={`${collapsed ? 'w-[80px]' : 'w-[350px]'} bg-black flex flex-col gap-2 h-full p-2 flex-shrink-0 transition-all duration-300 z-50`}>
      
      {/* Navigation Block (Replaces Home/Search) */}
      <div className={`bg-[#121212] rounded-lg flex flex-col ${collapsed ? 'gap-2 py-4 items-center' : 'gap-1 py-4 px-2'}`}>
        {!collapsed && <div className="px-4 pb-2 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">Platform</div>}
        
        <NavItem id={PreviewView.EDITOR} icon={Monitor} label="Editor" colorClass="text-blue-400" />
        <NavItem id={PreviewView.HOME} icon={Disc} label="Spotify" colorClass="text-[#1ed760]" />
        
        {!collapsed && <div className="h-[1px] bg-[#282828] mx-4 my-2"></div>}
        
        <NavItem id={PreviewView.YOUTUBE_MUSIC} icon={Youtube} label="YouTube Music" colorClass="text-[#ff0000]" />
        <NavItem id={PreviewView.APPLE_MUSIC} icon={Music} label="Apple Music" colorClass="text-[#fa243c]" />
        <NavItem id={PreviewView.INSTAGRAM} icon={Smartphone} label="Instagram" colorClass="text-[#d62976]" />
        <NavItem id={PreviewView.CANVAS_FULL} icon={LayoutGrid} label="Canvas" colorClass="text-white" />
      </div>

      {/* Library Area (Only visible in Spotify/Editor Mode) */}
      {isSpotify && (
        <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden animate-enter-view">
          {/* Library Header */}
          <div className="p-4 pt-4 shadow-lg z-10">
            <div className="flex items-center justify-between text-[#b3b3b3] mb-4">
              <div className="flex items-center gap-2 hover:text-white cursor-pointer transition group px-2">
                <Library size={28} className="group-hover:text-white text-[#b3b3b3] transition" strokeWidth={2.5} />
                <span className="font-bold text-base">Your Library</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="p-2 hover:bg-[#1f1f1f] rounded-full cursor-pointer transition text-[#b3b3b3] hover:text-white">
                  <Plus size={20} />
                </div>
                <div className="p-2 hover:bg-[#1f1f1f] rounded-full cursor-pointer transition text-[#b3b3b3] hover:text-white">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
            
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
               {['Playlists', 'Artists', 'Albums', 'Podcasts'].map(t => (
                   <span key={t} className="bg-[#232323] px-3 py-1.5 rounded-full text-sm font-medium text-white cursor-pointer hover:bg-[#2a2a2a] transition whitespace-nowrap">
                      {t}
                   </span>
               ))}
            </div>
          </div>

          {/* Search & Sort in Library */}
          <div className="px-4 flex justify-between items-center text-[#b3b3b3] mb-2 mt-1">
               <div className="p-2 hover:bg-[#222] rounded-full cursor-pointer">
                  <Search size={16} className="text-[#b3b3b3] hover:text-white" />
               </div>
               <div className="flex items-center gap-1 text-xs font-bold cursor-pointer hover:text-white hover:scale-105 transition px-2">
                  <span>Recents</span>
                  <List size={16} />
               </div>
          </div>

          {/* Scrollable List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-0 custom-scrollbar hover:overflow-y-auto">
             
             {/* User's Artist Profile (Pinned) */}
             <div 
               className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group active:bg-black"
               onClick={() => onViewChange(PreviewView.ARTIST_PAGE)}
             >
                  <img src={profile.imageUrl || "https://via.placeholder.com/50"} alt={profile.name} className="w-12 h-12 rounded-full object-cover shadow-sm bg-[#333]" />
                  <div className="flex flex-col overflow-hidden justify-center">
                    <span className="text-white font-medium truncate text-[16px] leading-tight">{profile.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                       <Pin size={12} className="text-[#1ed760] fill-[#1ed760] rotate-45" />
                       <span className="text-[#b3b3b3] text-[13px] truncate">Artist</span>
                    </div>
                  </div>
             </div>

             {/* User's Single (Pinned) */}
             <div 
               className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group active:bg-black"
               onClick={() => onViewChange(PreviewView.PLAYLIST)}
             >
                  <img src={song.coverImage || "https://via.placeholder.com/50"} alt={song.title} className="w-12 h-12 rounded-[4px] object-cover shadow-sm bg-[#333]" />
                  <div className="flex flex-col overflow-hidden justify-center">
                    <span className="text-white font-medium truncate text-[16px] leading-tight">{song.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                       <Pin size={12} className="text-[#1ed760] fill-[#1ed760] rotate-45" />
                       <span className="text-[#b3b3b3] text-[13px] truncate">Single • {profile.name}</span>
                    </div>
                  </div>
             </div>

             {/* Mock Trends */}
             {trends.map((song) => (
               <div 
                  key={song.id} 
                  onClick={() => onTrendClick(song)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group"
               >
                  <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-[4px] object-cover shadow-sm bg-[#333]" />
                  <div className="flex flex-col overflow-hidden justify-center">
                    <span className="text-white font-medium truncate text-[16px] leading-tight">{song.title}</span>
                    <span className="text-[#b3b3b3] text-[13px] truncate mt-1">Song • {song.artist}</span>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;