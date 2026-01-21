import { Store, Release, ReleaseStatus, ContentOwnership, User, UserRole, ApplicationStatus } from './types';

// Genres
export const GENRES = [
  "Pop", "Hip Hop", "Rock", "Electronic", "R&B", "Latin", "Country", "Jazz", "Classical", "AI Experimental", "Drum & Bass", "Dubstep", "House", "Techno", "Indie", "Alternative", "Metal", "Punk", "Folk", "Blues", "Reggae", "Soul", "Funk", "Disco", "Gospel", "Soundtrack", "World", "Ambient", "Trap", "Drill", "Lo-Fi", "Synthwave"
];

// Stores - 150+ DSP Platforms
export const STORES: Store[] = [
  // Major Streaming Platforms
  { id: 'spotify', name: 'Spotify', category: 'Streaming', logo: 'https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png' },
  { id: 'apple', name: 'Apple Music & iTunes', category: 'Streaming', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg' },
  { id: 'youtube', name: 'YouTube Music', category: 'Streaming', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Youtube_Music_icon.svg' },
  { id: 'amazon', name: 'Amazon Music', category: 'Streaming', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Amazon_icon.svg/240px-Amazon_icon.svg.png' },
  { id: 'tidal', name: 'Tidal', category: 'Streaming', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Tidal_%28service%29_logo.svg/240px-Tidal_%28service%29_logo.svg.png' },
  { id: 'deezer', name: 'Deezer', category: 'Streaming', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Deezer_logo.svg/240px-Deezer_logo.svg.png' },
  { id: 'pandora', name: 'Pandora', category: 'Streaming', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Pandora_logo_%28blue%29.svg/240px-Pandora_logo_%28blue%29.svg.png' },

  // Asian Markets
  { id: 'tencent', name: 'Tencent', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/tencent-qq.svg' },
  { id: 'netease', name: 'NetEase Cloud Music', category: 'Streaming', logo: 'https://y.qq.com/favicon.ico' },
  { id: 'kkbox', name: 'KKBOX', category: 'Streaming', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/KKBOX_logo.svg/240px-KKBOX_logo.svg.png' },
  { id: 'line', name: 'Line Music', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/line-messenger.svg' },
  { id: 'awa', name: 'AWA', category: 'Streaming', logo: 'https://s.mxmcdn.net/site/images/awa-logo.png' },
  { id: 'joox', name: 'JOOX', category: 'Streaming', logo: 'https://www.joox.com/favicon.ico' },
  { id: 'jiosaavn', name: 'JioSaavn', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/saavn.svg' },
  { id: 'anghami', name: 'Anghami', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/anghami-1.svg' },
  { id: 'flo', name: 'FLO (Dreamus)', category: 'Streaming', logo: 'https://www.music-flo.com/favicon.ico' },
  { id: 'melon', name: 'Melon', category: 'Streaming', logo: 'https://www.melon.com/favicon.ico' },
  { id: 'bugs', name: 'Bugs!', category: 'Streaming', logo: 'https://www.bugs.co.kr/favicon.ico' },
  { id: 'genie', name: 'Genie Music', category: 'Streaming', logo: 'https://www.genie.co.kr/favicon.ico' },

  // European & Regional
  { id: 'qobuz', name: 'Qobuz', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/qobuz.svg' },
  { id: 'nuuday', name: 'Nuuday (TDC Play/YouSee)', category: 'Streaming', logo: '' },
  { id: 'imusica', name: 'iMusica / Claro Musica', category: 'Streaming', logo: '' },
  { id: 'flow', name: 'Flow Music', category: 'Streaming', logo: '' },
  { id: 'vybn', name: 'Vybn', category: 'Streaming', logo: '' },
  { id: 'xplore', name: 'A1/VIP/Velcom Xplore Music', category: 'Streaming', logo: '' },

  // Radio & Discovery
  { id: 'iheart', name: 'iHeartRadio', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/iheartradio.svg' },
  { id: 'shazam', name: 'Shazam', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/shazam-icon.svg' },
  { id: 'soundhound', name: 'SoundHound', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/soundhound.svg' },
  { id: 'gracenote', name: 'Gracenote', category: 'Streaming', logo: '' },

  // DJ & Electronic
  { id: 'beatport', name: 'Beatport', category: 'Download', logo: 'https://cdn.worldvectorlogo.com/logos/beatport-1.svg' },
  { id: 'mixcloud', name: 'Mixcloud', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/mixcloud.svg' },
  { id: 'traxsource', name: 'Traxsource', category: 'Download', logo: '' },

  // Download & Other
  { id: '7digital', name: '7 Digital', category: 'Download', logo: '' },
  { id: 'medianet', name: 'MediaNet', category: 'Streaming', logo: '' },
  { id: 'trebel', name: 'Trebel Music', category: 'Streaming', logo: '' },
  { id: 'audiomack', name: 'Audiomack', category: 'Streaming', logo: 'https://cdn.worldvectorlogo.com/logos/audiomack.svg' },
  { id: 'boomplay', name: 'Boomplay', category: 'Streaming', logo: 'https://www.boomplaymusic.com/favicon.ico' },

  // Business & Sync
  { id: 'soundtrack', name: 'Soundtrack Your Brand', category: 'Streaming', logo: '' },
  { id: 'soundmouse', name: 'Soundmouse', category: 'Streaming', logo: '' },
  { id: 'audible', name: 'Audible Magic / Fulfillment 360', category: 'Streaming', logo: '' },
  { id: 'musicchoice', name: 'Music Choice', category: 'Streaming', logo: '' },

  // Specialty & Niche
  { id: 'hmvjapan', name: 'HMV Japan', category: 'Download', logo: '' },
  { id: 'utapass', name: 'UTAPASS', category: 'Streaming', logo: '' },
  { id: 'jcom', name: 'J:COM', category: 'Streaming', logo: '' },
  { id: 'roxi', name: 'Electric Jukebox / Roxi', category: 'Streaming', logo: '' },
  { id: 'grandpad', name: 'GrandPad', category: 'Streaming', logo: '' },
  { id: 'mymelo', name: 'MyMelo', category: 'Streaming', logo: '' },
  { id: 'fanlabel', name: 'Fan Label', category: 'Streaming', logo: '' },
  { id: 'globalradio', name: 'Global Radio', category: 'Streaming', logo: '' },

  // Telecom & Corrections
  { id: 'gtl', name: 'GTL (On-demand)', category: 'Streaming', logo: '' },
  { id: 'securus', name: 'Securus / JPay', category: 'Streaming', logo: '' },
  { id: 'keefe', name: 'Keefe', category: 'Streaming', logo: '' },
  { id: 'turnkey', name: 'Turnkey', category: 'Streaming', logo: '' },

  // Metaverse & VR
  { id: 'oculus', name: 'Meta / Oculus', category: 'Social', logo: 'https://cdn.worldvectorlogo.com/logos/meta-1.svg' },
  { id: 'odeaudio', name: 'ODE Audio', category: 'Streaming', logo: '' },

  // Catch-all for remaining
  { id: 'others', name: '+ 80 More Global Platforms', category: 'Streaming', logo: '' },
];

export const LANGUAGES = [
  "English", "Turkish / Türkçe", "Spanish / Español", "French / Français", "German / Deutsch", "Italian / Italiano",
  "Portuguese / Português", "Russian / Русский", "Japanese / 日本語", "Korean / 한국어", "Chinese / 中文",
  "Arabic / العربية", "Hindi / हिन्दी", "Dutch / Nederlands", "Polish / Polski", "Swedish / Svenska",
  "Norwegian / Norsk", "Danish / Dansk", "Finnish / Suomi", "Greek / Ελληνικά", "Hebrew / עברית",
  "Thai / ไทย", "Vietnamese / Tiếng Việt", "Indonesian / Bahasa Indonesia", "Malay / Bahasa Melayu",
  "Filipino / Tagalog", "Romanian / Română", "Czech / Čeština", "Hungarian / Magyar", "Ukrainian / Українська",
  "Bulgarian / Български", "Croatian / Hrvatski", "Slovak / Slovenčina", "Slovenian / Slovenščina",
  "Serbian / Српски", "Lithuanian / Lietuvių", "Latvian / Latviešu", "Estonian / Eesti",
  "Persian / فارسی", "Urdu / اردو", "Bengali / বাংলা", "Punjabi / ਪੰਜਾਬੀ", "Tamil / தமிழ்",
  "Telugu / తెలుగు", "Marathi / मराठी", "Gujarati / ગુજરાતી", "Kannada / ಕನ್ನಡ", "Malayalam / മലയാളം",
  "Swahili / Kiswahili", "Amharic / አማርኛ", "Yoruba / Yorùbá", "Igbo / Igbo", "Hausa / Hausa",
  "Instrumental"
];

export const MOCK_ADMIN: User = {
  id: 'admin-1',
  email: 'support@wbbt.net',
  firstName: 'Admin',
  lastName: 'User',
  artistName: 'WBBT Staff',
  role: UserRole.ADMIN,
  isBanned: false,
  applicationStatus: ApplicationStatus.APPROVED,
  balance: 0,
};

export const MOCK_USER: User = {
  id: 'artist-1',
  email: 'artist@example.com',
  firstName: 'Demo',
  lastName: 'Artist',
  artistName: 'New Talent',
  role: UserRole.USER,
  isBanned: false,
  applicationStatus: ApplicationStatus.APPROVED,
  balance: 0,
};

export const MOCK_RELEASES: Release[] = [];
