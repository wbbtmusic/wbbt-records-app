import { TrendSong } from './types';

export const DEFAULT_COVER = "https://picsum.photos/seed/cover1/400/400";
export const DEFAULT_ARTIST = "https://picsum.photos/seed/artist1/400/400";

export const MOCK_TRENDS: TrendSong[] = [
  { id: '1', title: 'Espresso', artist: 'Sabrina Carpenter', plays: '452,102,933', duration: '2:55', cover: 'https://picsum.photos/seed/espresso/300' },
  { id: '2', title: 'Birds of a Feather', artist: 'Billie Eilish', plays: '312,881,001', duration: '3:20', cover: 'https://picsum.photos/seed/billie/300' },
  { id: '3', title: 'Good Luck, Babe!', artist: 'Chappell Roan', plays: '289,110,542', duration: '3:01', cover: 'https://picsum.photos/seed/chappell/300' },
  { id: '4', title: 'Not Like Us', artist: 'Kendrick Lamar', plays: '190,443,211', duration: '4:12', cover: 'https://picsum.photos/seed/kendrick/300' },
  { id: '5', title: 'Too Sweet', artist: 'Hozier', plays: '566,322,190', duration: '3:33', cover: 'https://picsum.photos/seed/hozier/300' },
  { id: '6', title: 'Beautiful Things', artist: 'Benson Boone', plays: '400,120,000', duration: '3:00', cover: 'https://picsum.photos/seed/benson/300' },
  { id: '7', title: 'End of Beginning', artist: 'Djo', plays: '210,000,000', duration: '2:39', cover: 'https://picsum.photos/seed/djo/300' },
  { id: '8', title: 'Lose Control', artist: 'Teddy Swims', plays: '350,500,100', duration: '3:30', cover: 'https://picsum.photos/seed/teddy/300' },
  { id: '9', title: 'Training Season', artist: 'Dua Lipa', plays: '180,200,000', duration: '3:29', cover: 'https://picsum.photos/seed/dua/300' },
  { id: '10', title: 'we can\'t be friends', artist: 'Ariana Grande', plays: '290,000,000', duration: '3:35', cover: 'https://picsum.photos/seed/ariana/300' },
  { id: '11', title: 'Texas Hold \'Em', artist: 'Beyoncé', plays: '410,000,000', duration: '3:56', cover: 'https://picsum.photos/seed/beyonce/300' },
  { id: '12', title: 'Carnival', artist: 'Kanye West', plays: '300,000,000', duration: '4:24', cover: 'https://picsum.photos/seed/kanye/300' },
];

export const NAV_ITEMS = [
  { icon: 'Home', label: 'Home', active: true },
  { icon: 'Search', label: 'Search', active: false },
  { icon: 'Library', label: 'Your Library', active: false },
];