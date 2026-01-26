
export interface ArtistProfile {
  id: string;
  name: string;
  bio: string;
  imageUrl: string | null;
  verified: boolean;
}

export interface SongMetadata {
  title: string;
  artist: string;
  featArtist: string;
  albumName: string;
  duration: string;
  coverImage: string | null;
  canvasVideo: string | null; // URL to video
  colorHex: string; // Dominant color for gradients
  lyrics: string; // New: Song lyrics
}

export enum PreviewView {
  EDITOR = 'EDITOR',
  HOME = 'HOME',
  PLAYLIST = 'PLAYLIST',
  ARTIST_PAGE = 'ARTIST_PAGE',
  SEARCH = 'SEARCH',
  CANVAS_FULL = 'CANVAS_FULL',
  YOUTUBE_MUSIC = 'YOUTUBE_MUSIC',
  APPLE_MUSIC = 'APPLE_MUSIC',
  INSTAGRAM = 'INSTAGRAM'
}

export interface TrendSong {
  id: string;
  title: string;
  artist: string;
  plays: string;
  duration: string;
  cover: string;
}
