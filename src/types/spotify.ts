export interface LyricLine {
  timeSec: number;
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  coverUrl: string;
  fallbackCoverUrl?: string;
  streamUrl?: string;
  fallbackStreamUrl?: string;
  quality?: string;
  duration: number; // in seconds
  releaseYear?: number;
  plays?: string;
  lyrics?: string[];
  syncedLyrics?: LyricLine[];
  ambientColor?: string;
  dnaSummary?: string;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  fallbackAvatarUrl?: string;
  monthlyListeners: string;
  followersCount?: number;
  bio: string;
  verified: boolean;
  topTracks: Track[];
  albums: (string | Album)[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  fallbackCoverUrl?: string;
  year: number;
  tracks: Track[];
  ambientColor?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  fallbackCoverUrl?: string;
  owner: string;
  followers?: string;
  tracks: Track[];
  isCustom?: boolean;
  isPinned?: boolean;
  isPodcast?: boolean;
  gradient?: string;
}

export interface PodcastCatalog {
  episodes: Track[];
  shows: Artist[];
  playlists: Playlist[];
}

export interface Category {
  id: string;
  title: string;
  color: string;
  coverUrl: string;
}

export type ViewType = 'home' | 'search' | 'playlist' | 'album' | 'artist' | 'liked-songs' | 'podcasts';

export interface ViewState {
  type: ViewType;
  id?: string;
  searchQuery?: string;
  filterTab?: 'all' | 'music' | 'podcasts';
}
