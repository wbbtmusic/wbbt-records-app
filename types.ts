export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum ApplicationStatus {
  NOT_APPLIED = 'NOT_APPLIED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ReleaseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EDITING = 'EDITING',
  TAKEDOWN = 'TAKEDOWN',
}

export enum ContentOwnership {
  ORIGINAL = 'ORIGINAL',
  LICENSED = 'LICENSED',
  AI_GENERATED = 'AI_GENERATED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  artistName: string; // Primary artist name
  role: UserRole;
  isBanned: boolean;
  banReason?: string;
  applicationStatus: ApplicationStatus;
  balance: number;
  spotifyUrl?: string;
  youtubeUrl?: string;
}

export interface ArtistApplication {
  userId: string;
  bio: string;
  instagramUrl?: string;
  spotifyUrl?: string;
  soundcloudUrl?: string;
  demoTrackUrl: string;
  submissionDate: string;
}

export interface ReleaseArtist {
  id: string;
  name: string;
  legalName?: string;
  role: 'Primary Artist' | 'Featured' | 'Remixer' | 'Producer' | 'Contributor' | 'Composer' | 'Lyricist' | 'Songwriter';
  spotifyUrl?: string;
  spotifyId?: string;
  appleId?: string;
}

export interface TrackWriter {
  id: string;
  name: string;
  legalName?: string;
  role: 'Composer' | 'Lyricist' | 'Songwriter';
  share?: number; // Percentage
}

export interface Track {
  id: string;
  title: string;
  version?: string; // e.g., "Radio Edit", "Remix"
  isrc?: string;
  iswc?: string;
  duration: number; // in seconds
  fileUrl: string; // Blob URL for demo
  fileId?: string; // Server file ID for uploaded files
  artists: ReleaseArtist[];
  writers?: TrackWriter[]; // Composers, Lyricists, Songwriters

  // Genres (Per Track)
  genre?: string;
  subGenre?: string;

  // Lyrics & Lang
  language: string;
  isInstrumental: boolean;
  isExplicit: boolean;
  lyrics?: string;
  previewStartTime?: string; // "00:00"

  // Rights & Composition
  compositionType: 'Original' | 'Cover';
  copyrightType: 'Original' | 'RoyaltyFree' | 'Licensed' | 'PublicDomain';
  aiUsage: 'None' | 'Partial' | 'Full';

  originalComposers?: string[]; // For cover songs or detailed credits
}

export interface Release {
  id: string;
  userId: string;
  title: string;
  type: 'Single' | 'EP' | 'Album';
  coverUrl: string;
  upc?: string;
  wupc?: string;
  status: ReleaseStatus;

  releaseDate: string; // Must be >= 20 days in future
  releaseTiming: 'ASAP' | 'Specific';

  createdDate: string;

  // Release Level Info
  mainArtist?: string; // New: Main Release Artist
  originalReleaseDate?: string; // New: If distributed before

  genre: string;
  subGenre?: string;
  cLine: string; // Composition owner
  cYear: string;
  pLine: string; // Master owner
  pYear: string;
  recordLabel?: string;
  distributedBefore: boolean;

  // Distribution Settings
  selectedStores: string[]; // Store IDs
  monetization: {
    tikTok: boolean;
    youtubeContentId: boolean;
    facebookInstagram: boolean;
  };
  territoryPolicy: 'Global' | 'Restricted';

  tracks: Track[];
  rejectionReason?: string;
  documents?: string[];
}

export interface Store {
  id: string;
  name: string;
  logo: string; // URL or placeholder
  category: 'Streaming' | 'Social' | 'Download';
}

export interface EarningsRecord {
  month: string;
  amount: number;
  streams: number;
  downloads: number;
}
