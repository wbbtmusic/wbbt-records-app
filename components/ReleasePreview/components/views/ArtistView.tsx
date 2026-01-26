import React from 'react';
import { SongMetadata, ArtistProfile } from '../../types';
import { Play, CheckCircle2 } from 'lucide-react';

interface ArtistViewProps {
  song: SongMetadata;
  profile: ArtistProfile;
}

const ArtistView: React.FC<ArtistViewProps> = ({ song, profile }) => {
  return (
    <div className="min-h-full pb-32">
        {/* Banner */}
        <div 
          className="relative h-[40vh] bg-cover bg-center flex items-end p-8"
          style={{ 
             backgroundImage: profile.imageUrl ? `url(${profile.imageUrl})` : 'none',
             backgroundColor: '#333'
          }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-white mb-2">
                   {profile.verified && <CheckCircle2 fill="#3d91f4" className="text-white" size={24} />}
                   <span>Verified Artist</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6">{profile.name || song.artist}</h1>
                <p className="text-white text-base mb-2">1,234,567 monthly listeners</p>
            </div>
        </div>

        <div className="p-8 bg-gradient-to-b from-[#121212] via-[#121212] to-black">
             <div className="flex items-center gap-6 mb-8">
                 <div className="bg-[#1ed760] rounded-full p-4 hover:scale-105 transition cursor-pointer">
                    <Play size={28} fill="black" className="text-black ml-1" />
                 </div>
                 <button className="border border-[#777] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider hover:border-white hover:scale-105 transition">
                    Follow
                 </button>
                 <button className="text-[#b3b3b3] hover:text-white font-bold text-2xl pb-3">...</button>
             </div>

             <h2 className="text-2xl font-bold text-white mb-4">Popular</h2>
             
             {/* Song Rows */}
             <div className="flex flex-col mb-10">
                <div className="group flex items-center gap-4 px-4 py-3 rounded-md hover:bg-[#ffffff10] text-[#b3b3b3] transition">
                    <div className="w-4 text-center text-white">1</div>
                    <img src={song.coverImage || ""} className="w-10 h-10 rounded" alt="" />
                    <span className="text-white font-medium flex-1">{song.title}</span>
                    <span className="text-sm">1,005,293</span>
                    <span className="text-sm w-12 text-right">{song.duration}</span>
                </div>
                
                {/* Fake Rows */}
                {[2,3,4,5].map(i => (
                    <div key={i} className="group flex items-center gap-4 px-4 py-3 rounded-md hover:bg-[#ffffff10] text-[#b3b3b3] transition opacity-60">
                        <div className="w-4 text-center">{i}</div>
                        <div className="w-10 h-10 bg-[#333] rounded"></div>
                        <span className="text-white font-medium flex-1">Older Song {i}</span>
                        <span className="text-sm">{Math.floor(Math.random() * 900000).toLocaleString()}</span>
                        <span className="text-sm w-12 text-right">3:42</span>
                    </div>
                ))}
             </div>

             <h2 className="text-2xl font-bold text-white mb-4">About</h2>
             <div 
               className="relative h-80 bg-[#282828] rounded-lg overflow-hidden cursor-pointer hover:scale-[1.01] transition"
               style={{ 
                  backgroundImage: profile.imageUrl ? `url(${profile.imageUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
               }}
             >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <div className="mb-4">
                        <span className="font-bold text-white text-lg">1,234,567 Monthly Listeners</span>
                    </div>
                    <p className="text-white line-clamp-3 font-medium">
                        {profile.bio || "No biography available."}
                    </p>
                </div>
             </div>
        </div>
    </div>
  );
};

export default ArtistView;