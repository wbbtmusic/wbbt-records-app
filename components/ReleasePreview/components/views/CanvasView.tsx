import React from 'react';
import { SongMetadata } from '../../types';
import { Play, SkipBack, SkipForward, Heart } from 'lucide-react';

interface CanvasViewProps {
  song: SongMetadata;
}

const CanvasView: React.FC<CanvasViewProps> = ({ song }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black p-4">
        {/* Mobile Format Simulation */}
        <div className="w-[360px] h-[740px] bg-black rounded-[40px] border-8 border-[#222] overflow-hidden relative shadow-2xl">
            {/* Status Bar Fake */}
            <div className="absolute top-4 left-6 text-white text-xs font-bold z-20">9:41</div>
            
            {/* The Canvas */}
            <div className="absolute inset-0 z-0">
                {song.canvasVideo ? (
                    <video src={song.canvasVideo} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                    <img src={song.coverImage || ""} className="w-full h-full object-cover blur-sm brightness-50" alt="" />
                )}
            </div>

            {/* UI Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-10 flex flex-col justify-between p-6 pb-12">
                 <div className="mt-8 text-center text-xs font-bold text-white/80 uppercase tracking-widest">
                     Playing from playlist <br/> <span className="text-white">Release Radar</span>
                 </div>

                 <div>
                    <div className="flex justify-between items-end mb-6">
                        <div className="flex flex-col">
                            <h2 className="text-white font-bold text-2xl mb-1">{song.title}</h2>
                            <p className="text-white/80 font-medium">{song.artist}</p>
                        </div>
                        <Heart fill="#1ed760" className="text-[#1ed760] mb-2" size={24} />
                    </div>

                    {/* Scrubber */}
                    <div className="w-full h-1 bg-white/30 rounded-full mb-6">
                        <div className="w-1/3 h-full bg-white rounded-full"></div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between px-4">
                         <SkipBack fill="white" size={32} className="text-white" />
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <Play fill="black" size={32} className="text-black ml-1" />
                         </div>
                         <SkipForward fill="white" size={32} className="text-white" />
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default CanvasView;