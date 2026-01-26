import React from 'react';
import { SongMetadata, TrendSong } from '../../types';
import { Play, Clock3, Heart, MoreHorizontal } from 'lucide-react';

interface PlaylistViewProps {
  song: SongMetadata;
  trends: TrendSong[];
}

const PlaylistView: React.FC<PlaylistViewProps> = ({ song, trends }) => {
  return (
    <div className="min-h-full pb-32">
        {/* Header */}
        <div 
          className="flex items-end gap-6 p-8 h-80 bg-gradient-to-b from-indigo-800 to-indigo-950"
          style={{ background: `linear-gradient(to bottom, ${song.colorHex || '#4b5563'}, #121212)` }}
        >
            <div className="h-56 w-56 shadow-2xl shadow-black/50 flex-shrink-0">
                <img src={song.coverImage || "https://via.placeholder.com/300"} alt="Playlist Cover" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-2 text-white">
                <span className="uppercase text-xs font-bold">Single</span>
                <h1 className="text-6xl font-black md:text-8xl tracking-tighter">{song.title || "Title"}</h1>
                <div className="flex items-center gap-2 mt-4 text-sm font-medium">
                   <div className="w-6 h-6 rounded-full bg-gray-500 overflow-hidden">
                       {/* Artist Image Small */}
                       <div className="w-full h-full bg-white"></div>
                   </div>
                   <span className="hover:underline cursor-pointer font-bold">{song.artist || "Artist"}</span>
                   <span className="text-white/70">• {new Date().getFullYear()} • {song.duration || "3:00"}</span>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="bg-[#121212]/30 backdrop-blur-3xl px-8 py-6">
            <div className="flex items-center gap-8 mb-8">
                <div className="bg-[#1ed760] rounded-full p-4 hover:scale-105 transition cursor-pointer">
                    <Play size={28} fill="black" className="text-black ml-1" />
                </div>
                <Heart size={32} className="text-[#b3b3b3] hover:text-white cursor-pointer transition" />
                <MoreHorizontal size={32} className="text-[#b3b3b3] hover:text-white cursor-pointer transition" />
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 border-b border-[#ffffff10] pb-2 text-[#b3b3b3] text-sm uppercase sticky top-0 bg-[#121212] pt-2 z-10">
                <span>#</span>
                <span>Title</span>
                <span>Album</span>
                <div className="flex justify-end"><Clock3 size={16} /></div>
            </div>

            {/* User Song Row (Highlighted) */}
            <div className="group grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-3 rounded-md hover:bg-[#ffffff10] text-[#b3b3b3] items-center mt-2 transition">
                 <div className="text-green-500 group-hover:hidden">1</div>
                 <div className="hidden group-hover:block text-white"><Play size={14} fill="white" /></div>
                 
                 <div className="flex items-center gap-4">
                    <img src={song.coverImage || ""} className="w-10 h-10 rounded" alt="" />
                    <div className="flex flex-col">
                        <span className="text-green-500 font-medium text-base truncate max-w-[300px]">{song.title}</span>
                        <span className="text-sm group-hover:text-white transition cursor-pointer">
                             {song.artist}{song.featArtist ? `, ${song.featArtist}` : ''}
                        </span>
                    </div>
                 </div>
                 
                 <span className="text-sm group-hover:text-white transition truncate cursor-pointer">{song.albumName || song.title}</span>
                 <span className="text-sm text-right font-mono">{song.duration}</span>
            </div>

            {/* Fake Next Songs (Trends) */}
            {trends.map((track, i) => (
                <div key={i} className="group grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-3 rounded-md hover:bg-[#ffffff10] text-[#b3b3b3] items-center transition">
                    <div className="group-hover:hidden">{i + 2}</div>
                    <div className="hidden group-hover:block text-white"><Play size={14} fill="white" /></div>
                    
                    <div className="flex items-center gap-4">
                        <img src={track.cover} className="w-10 h-10 rounded" alt="" />
                        <div className="flex flex-col">
                            <span className="text-white font-medium text-base truncate max-w-[300px]">{track.title}</span>
                            <span className="text-sm group-hover:text-white transition cursor-pointer">{track.artist}</span>
                        </div>
                    </div>
                    
                    <span className="text-sm group-hover:text-white transition truncate cursor-pointer">{track.title} (Single)</span>
                    <span className="text-sm text-right font-mono">{track.duration}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default PlaylistView;