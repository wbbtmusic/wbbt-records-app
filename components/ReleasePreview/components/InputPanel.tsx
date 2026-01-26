import React, { useRef } from 'react';
import { SongMetadata, ArtistProfile, PreviewView } from '../types';
import { Upload, Save, Disc, User, FileText } from 'lucide-react';

interface InputPanelProps {
  song: SongMetadata;
  profile: ArtistProfile;
  setSong: React.Dispatch<React.SetStateAction<SongMetadata>>;
  setProfile: React.Dispatch<React.SetStateAction<ArtistProfile>>;
  onSaveProfile: () => void;
  savedProfiles: ArtistProfile[];
  onLoadProfile: (p: ArtistProfile) => void;
  currentView: PreviewView;
  setView: (v: PreviewView) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  song,
  setSong,
  profile,
  setProfile,
  onSaveProfile,
  savedProfiles,
  onLoadProfile,
  currentView,
  setView
}) => {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const canvasInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof SongMetadata | keyof ArtistProfile, isProfile = false) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      if (isProfile) {
        setProfile(prev => ({ ...prev, [field]: url }));
      } else {
        setSong(prev => ({ ...prev, [field]: url }));
      }
    }
  };

  return (
    <div className="bg-[#121212] p-8 overflow-y-auto h-full text-white" id="editor-panel">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center border-b border-[#333] pb-4">
          <h1 className="text-3xl font-bold">Release Preview Studio</h1>
          <div className="flex bg-[#282828] rounded-full p-1 gap-1">
             <button onClick={() => setView(PreviewView.HOME)} className="px-6 py-2 bg-[#1ed760] text-black font-bold rounded-full text-sm hover:scale-105 transition">Start Preview</button>
          </div>
        </div>

        {/* Profiles Section */}
        <div className="bg-[#181818] p-6 rounded-lg space-y-4 border border-[#282828]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="text-[#1ed760]" /> Artist Profile
          </h2>
          <div className="flex gap-4 items-start">
             <div 
               className="w-24 h-24 bg-[#333] rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer relative overflow-hidden group border-2 border-transparent hover:border-white transition"
               onClick={() => avatarInputRef.current?.click()}
             >
                {profile.imageUrl ? (
                  <img src={profile.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-gray-500" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Upload size={20} />
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'imageUrl', true)} />
             </div>
             
             <div className="flex-1 space-y-3">
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="Artist Name"
                  className="w-full bg-[#2a2a2a] p-3 rounded text-white border border-transparent focus:border-[#1ed760] outline-none"
                />
                <textarea 
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  placeholder="Artist Biography"
                  rows={3}
                  className="w-full bg-[#2a2a2a] p-3 rounded text-white border border-transparent focus:border-[#1ed760] outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={onSaveProfile} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition">
                    <Save size={16} /> Save Profile
                  </button>
                  {savedProfiles.length > 0 && (
                    <select 
                      onChange={(e) => {
                         const p = savedProfiles.find(s => s.id === e.target.value);
                         if(p) onLoadProfile(p);
                      }}
                      className="bg-[#2a2a2a] text-white rounded px-3 py-2 outline-none"
                    >
                      <option value="">Load Profile...</option>
                      {savedProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Song Metadata Section */}
        <div className="bg-[#181818] p-6 rounded-lg space-y-6 border border-[#282828]">
           <h2 className="text-xl font-bold flex items-center gap-2">
            <Disc className="text-[#1ed760]" /> Song Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <div>
                 <label className="block text-sm text-[#b3b3b3] mb-1">Track Title</label>
                 <input 
                    type="text" 
                    value={song.title}
                    onChange={(e) => setSong({...song, title: e.target.value})}
                    className="w-full bg-[#2a2a2a] p-3 rounded text-white outline-none focus:ring-1 focus:ring-white"
                 />
               </div>
               <div>
                 <label className="block text-sm text-[#b3b3b3] mb-1">Album Name</label>
                 <input 
                    type="text" 
                    value={song.albumName}
                    onChange={(e) => setSong({...song, albumName: e.target.value})}
                    className="w-full bg-[#2a2a2a] p-3 rounded text-white outline-none focus:ring-1 focus:ring-white"
                 />
               </div>
               <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-[#b3b3b3] mb-1">Artist</label>
                    <input 
                        type="text" 
                        value={song.artist}
                        disabled // Controlled by profile
                        className="w-full bg-[#202020] p-3 rounded text-[#777] cursor-not-allowed"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-[#b3b3b3] mb-1">Duration</label>
                    <input 
                        type="text" 
                        value={song.duration}
                        onChange={(e) => setSong({...song, duration: e.target.value})}
                        className="w-full bg-[#2a2a2a] p-3 rounded text-white outline-none focus:ring-1 focus:ring-white"
                    />
                  </div>
               </div>
               <div>
                 <label className="block text-sm text-[#b3b3b3] mb-1">Featured Artist (Optional)</label>
                 <input 
                    type="text" 
                    value={song.featArtist}
                    onChange={(e) => setSong({...song, featArtist: e.target.value})}
                    className="w-full bg-[#2a2a2a] p-3 rounded text-white outline-none focus:ring-1 focus:ring-white"
                 />
               </div>
               <div>
                 <label className="block text-sm text-[#b3b3b3] mb-1">Dominant Color</label>
                 <div className="flex items-center gap-3">
                    <input 
                        type="color" 
                        value={song.colorHex}
                        onChange={(e) => setSong({...song, colorHex: e.target.value})}
                        className="h-10 w-10 bg-transparent cursor-pointer rounded overflow-hidden"
                    />
                    <span className="text-[#b3b3b3] font-mono">{song.colorHex}</span>
                 </div>
               </div>
             </div>

             <div className="space-y-6">
                {/* Cover Art Upload */}
                <div 
                   className="aspect-square bg-[#2a2a2a] rounded shadow-lg flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden border border-dashed border-[#444] hover:border-white transition"
                   onClick={() => coverInputRef.current?.click()}
                >
                   {song.coverImage ? (
                     <img src={song.coverImage} alt="Cover" className="w-full h-full object-cover" />
                   ) : (
                     <div className="text-center p-4">
                        <Disc className="mx-auto mb-2 text-[#555]" size={48} />
                        <span className="text-[#b3b3b3] font-bold">Upload Artwork</span>
                        <p className="text-xs text-[#777] mt-1">1080x1080 Recommended</p>
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <span className="text-white font-bold">Change Cover</span>
                   </div>
                   <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'coverImage')} />
                </div>

                {/* Canvas Video Upload */}
                <div 
                   className="h-48 bg-[#2a2a2a] rounded shadow-lg flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden border border-dashed border-[#444] hover:border-white transition"
                   onClick={() => canvasInputRef.current?.click()}
                >
                   {song.canvasVideo ? (
                     <video src={song.canvasVideo} autoPlay loop muted className="w-full h-full object-cover opacity-50" />
                   ) : (
                     <div className="text-center p-4">
                        <Disc className="mx-auto mb-2 text-[#555]" size={32} />
                        <span className="text-[#b3b3b3] font-bold">Upload Canvas</span>
                        <p className="text-xs text-[#777] mt-1">9:16 Vertical Video</p>
                     </div>
                   )}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold shadow-black drop-shadow-md">{song.canvasVideo ? 'Change Video' : 'Add Video'}</span>
                   </div>
                   <input ref={canvasInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, 'canvasVideo')} />
                </div>
             </div>
          </div>
        </div>

        {/* Lyrics Section */}
        <div className="bg-[#181818] p-6 rounded-lg space-y-4 border border-[#282828]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-[#1ed760]" /> Song Lyrics
          </h2>
          <p className="text-sm text-[#777]">Paste your lyrics here to preview the synced lyrics view.</p>
          <textarea 
            value={song.lyrics}
            onChange={(e) => setSong({...song, lyrics: e.target.value})}
            placeholder="Paste lyrics here..."
            rows={10}
            className="w-full bg-[#2a2a2a] p-4 rounded text-white border border-transparent focus:border-[#1ed760] outline-none resize-y font-mono text-sm leading-relaxed"
          />
        </div>

      </div>
    </div>
  );
};

export default InputPanel;