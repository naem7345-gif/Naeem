import { Track, Artist, Album, Playlist, LyricLine, PodcastCatalog } from '../types/spotify';

export const API_BASE_URL = 'https://headphonix2.vercel.app/api/v1';

export const DEFAULT_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23282828'/%3E%3Cstop offset='100%25' stop-color='%23121212'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23g)'/%3E%3Ccircle cx='150' cy='150' r='54' fill='none' stroke='%23535353' stroke-width='8'/%3E%3Ccircle cx='150' cy='150' r='16' fill='%23535353'/%3E%3C/svg%3E";

export interface ApiThumbnailObj {
  url?: string;
  endpoint?: string;
  sizes?: {
    small?: string;
    medium?: string;
    high?: string;
  };
}

export function buildTrackThumbnailUrl(trackId: string): string {
  return `${API_BASE_URL}/track/${encodeURIComponent(trackId)}/thumbnail`;
}

export function buildTrackStreamUrl(trackId: string): string {
  return `${API_BASE_URL}/track/${encodeURIComponent(trackId)}/stream`;
}

export function extractThumbnailUrl(
  thumbnail: string | ApiThumbnailObj | undefined | null,
  fallbackTrackId?: string
): string {
  if (typeof thumbnail === 'string' && thumbnail.trim()) {
    return thumbnail;
  }
  if (thumbnail && typeof thumbnail === 'object') {
    if (thumbnail.endpoint) return thumbnail.endpoint;
    if (thumbnail.url) return thumbnail.url;
    if (thumbnail.sizes?.high) return thumbnail.sizes.high;
    if (thumbnail.sizes?.medium) return thumbnail.sizes.medium;
    if (thumbnail.sizes?.small) return thumbnail.sizes.small;
  }
  if (fallbackTrackId) {
    return buildTrackThumbnailUrl(fallbackTrackId);
  }
  return DEFAULT_COVER_SVG;
}

export function extractDirectThumbnailUrl(
  thumbnail: string | ApiThumbnailObj | undefined | null
): string | undefined {
  if (typeof thumbnail === 'string' && thumbnail.trim()) {
    return thumbnail;
  }
  if (thumbnail && typeof thumbnail === 'object') {
    return thumbnail.url || thumbnail.sizes?.high || thumbnail.sizes?.medium || thumbnail.sizes?.small;
  }
  return undefined;
}

export function normalizeLyrics(rawLyrics: unknown): {
  syncedLyrics?: LyricLine[];
  lyrics?: string[];
} {
  if (!Array.isArray(rawLyrics) || rawLyrics.length === 0) {
    return {};
  }
  if (typeof rawLyrics[0] === 'string') {
    return { lyrics: rawLyrics as string[] };
  }
  const synced: LyricLine[] = rawLyrics
    .filter(
      (item): item is { timeSec: number; text: string } =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as { text?: unknown }).text === 'string' &&
        typeof (item as { timeSec?: unknown }).timeSec === 'number'
    )
    .map((item) => ({
      timeSec: item.timeSec,
      text: item.text,
    }));

  if (synced.length === 0) return {};
  return {
    syncedLyrics: synced,
    lyrics: synced.map((l) => l.text),
  };
}

export function findActiveLyricIndex(
  track: Pick<Track, 'duration' | 'lyrics' | 'syncedLyrics'> | null,
  currentTime: number
): number {
  if (!track) return -1;
  if (track.syncedLyrics && track.syncedLyrics.length > 0) {
    let activeIdx = 0;
    for (let i = 0; i < track.syncedLyrics.length; i++) {
      if (currentTime >= track.syncedLyrics[i].timeSec) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }
  if (track.lyrics && track.lyrics.length > 0) {
    const lineDuration = (track.duration || 180) / track.lyrics.length;
    return Math.min(
      Math.floor(currentTime / Math.max(lineDuration, 1)),
      track.lyrics.length - 1
    );
  }
  return -1;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTrack(raw: any): Track {
  const id = String(raw?.id || '');
  const endpointThumb = raw?.endpoints?.thumbnail || raw?.thumbnail?.endpoint || (id ? buildTrackThumbnailUrl(id) : DEFAULT_COVER_SVG);
  const directThumb = extractDirectThumbnailUrl(raw?.thumbnail);
  const endpointStream = raw?.endpoints?.stream || (id ? buildTrackStreamUrl(id) : undefined);
  const { syncedLyrics, lyrics } = normalizeLyrics(raw?.lyrics);

  return {
    id,
    title: String(raw?.title || 'Unknown Track'),
    artist: String(raw?.artist || 'Unknown Artist'),
    artistId: raw?.artistId ? String(raw.artistId) : undefined,
    album: String(raw?.album || raw?.title || 'Single'),
    albumId: raw?.albumId ? String(raw.albumId) : undefined,
    coverUrl: endpointThumb,
    fallbackCoverUrl: directThumb || DEFAULT_COVER_SVG,
    streamUrl: endpointStream,
    fallbackStreamUrl: typeof raw?.streamUrl === 'string' ? raw.streamUrl : undefined,
    quality: typeof raw?.quality === 'string' ? raw.quality : undefined,
    duration: typeof raw?.duration === 'number' && raw.duration > 0 ? raw.duration : 180,
    releaseYear: typeof raw?.releaseYear === 'number' ? raw.releaseYear : undefined,
    syncedLyrics,
    lyrics,
    dnaSummary: typeof raw?.dna?.summary === 'string' ? raw.dna.summary : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeArtist(raw: any): Artist {
  const id = String(raw?.id || '');
  const avatarUrl = extractThumbnailUrl(raw?.thumbnail);
  const fallbackAvatarUrl = extractDirectThumbnailUrl(raw?.thumbnail) || DEFAULT_COVER_SVG;
  const rawTracks = Array.isArray(raw?.topTracks) ? raw.topTracks : Array.isArray(raw?.tracks) ? raw.tracks : [];
  const rawAlbums = Array.isArray(raw?.albums) ? raw.albums : [];

  return {
    id,
    name: String(raw?.name || 'Unknown Artist'),
    avatarUrl,
    fallbackAvatarUrl,
    monthlyListeners: String(raw?.monthlyListeners || raw?.followersFormatted || '1M+ monthly listeners'),
    followersCount: typeof raw?.followers === 'number' ? raw.followers : undefined,
    bio: String(raw?.bio || raw?.subtitle || 'Verified recording artist on Headphonix.'),
    verified: Boolean(raw?.verified ?? true),
    topTracks: rawTracks.map(normalizeTrack),
    albums: rawAlbums.map((alb: unknown) =>
      typeof alb === 'string' ? alb : normalizeAlbum(alb)
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAlbum(raw: any): Album {
  const id = String(raw?.id || '');
  const rawTracks = Array.isArray(raw?.tracks) ? raw.tracks : [];
  const coverUrl = extractThumbnailUrl(raw?.thumbnail);
  const fallbackCoverUrl = extractDirectThumbnailUrl(raw?.thumbnail) || DEFAULT_COVER_SVG;

  return {
    id,
    title: String(raw?.title || 'Unknown Album'),
    artist: String(raw?.artist || 'Various Artists'),
    coverUrl,
    fallbackCoverUrl,
    year: typeof raw?.releaseYear === 'number' ? raw.releaseYear : 2024,
    tracks: rawTracks.map(normalizeTrack),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePlaylist(raw: any): Playlist {
  const id = String(raw?.id || '');
  const rawTracks = Array.isArray(raw?.tracks) ? raw.tracks : [];
  const coverUrl = extractThumbnailUrl(raw?.thumbnail);
  const fallbackCoverUrl = extractDirectThumbnailUrl(raw?.thumbnail) || DEFAULT_COVER_SVG;

  return {
    id,
    title: String(raw?.title || 'Featured Playlist'),
    description: String(raw?.description || raw?.subtitle || 'Curated music collection'),
    coverUrl,
    fallbackCoverUrl,
    owner: String(raw?.curator || 'Spotify'),
    followers: raw?.trackCount ? `${raw.trackCount} tracks` : undefined,
    tracks: rawTracks.map(normalizeTrack),
    gradient: 'from-[#1e4a38] to-[#121212]',
  };
}

export interface SearchResponse {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export interface HomeCatalog {
  tracks: Track[];
  freshTracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export const SPOTIFY_API_BASE = '/api/spotify';

const searchCache = new Map<string, SearchResponse>();
const trackDetailCache = new Map<string, Track>();
const relatedCache = new Map<string, Track[]>();
const artistCache = new Map<string, Artist>();
const albumCache = new Map<string, Album>();
const playlistCache = new Map<string, Playlist>();
let homeCatalogCache: HomeCatalog | null = null;
let podcastCatalogCache: PodcastCatalog | null = null;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export async function searchMusic(
  query: string,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { tracks: [], artists: [], albums: [], playlists: [] };
  }

  const cacheKey = trimmed.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const json = await fetchJson<Partial<SearchResponse>>(
    `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(trimmed)}&limit=24`,
    signal
  );

  const result: SearchResponse = {
    tracks: dedupeById(Array.isArray(json?.tracks) ? json.tracks : []),
    artists: dedupeById(Array.isArray(json?.artists) ? json.artists : []),
    albums: dedupeById(Array.isArray(json?.albums) ? json.albums : []),
    playlists: dedupeById(Array.isArray(json?.playlists) ? json.playlists : []),
  };

  searchCache.set(cacheKey, result);
  return result;
}

export async function getTrackDetails(trackId: string): Promise<Track | null> {
  if (!trackId) return null;
  const cached = trackDetailCache.get(trackId);
  if (cached) return cached;

  try {
    const json = await fetchJson<{ data?: Track }>(
      `${SPOTIFY_API_BASE}/track/${encodeURIComponent(trackId)}`
    );
    if (!json?.data) return null;
    trackDetailCache.set(trackId, json.data);
    return json.data;
  } catch {
    return null;
  }
}

export async function getRelatedTracks(trackId: string): Promise<Track[]> {
  if (!trackId) return [];
  const cached = relatedCache.get(trackId);
  if (cached) return cached;

  try {
    const json = await fetchJson<{ data?: Track[] }>(
      `${SPOTIFY_API_BASE}/track/${encodeURIComponent(trackId)}/related`
    );
    const tracks = Array.isArray(json?.data) ? json.data : [];
    relatedCache.set(trackId, tracks);
    return tracks;
  } catch {
    return [];
  }
}

export async function getArtistDetails(artistId: string): Promise<Artist | null> {
  if (!artistId) return null;
  const cached = artistCache.get(artistId);
  if (cached) return cached;

  try {
    const json = await fetchJson<{ data?: Artist }>(
      `${SPOTIFY_API_BASE}/artist/${encodeURIComponent(artistId)}`
    );
    if (!json?.data) return null;
    artistCache.set(artistId, json.data);
    return json.data;
  } catch {
    return null;
  }
}

export async function getAlbumDetails(albumId: string): Promise<Album | null> {
  if (!albumId) return null;
  const cached = albumCache.get(albumId);
  if (cached) return cached;

  try {
    const json = await fetchJson<{ data?: Album }>(
      `${SPOTIFY_API_BASE}/album/${encodeURIComponent(albumId)}`
    );
    if (!json?.data) return null;
    albumCache.set(albumId, json.data);
    return json.data;
  } catch {
    return null;
  }
}

export async function getPlaylistDetails(playlistId: string): Promise<Playlist | null> {
  if (!playlistId) return null;
  const cached = playlistCache.get(playlistId);
  if (cached) return cached;

  try {
    const json = await fetchJson<{ data?: Playlist }>(
      `${SPOTIFY_API_BASE}/playlist/${encodeURIComponent(playlistId)}`
    );
    if (!json?.data) return null;
    playlistCache.set(playlistId, json.data);
    return json.data;
  } catch {
    return null;
  }
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function mergeUniqueTracks(primary: Track[], extra: Track[]): Track[] {
  return dedupeById([...primary, ...extra]);
}

export function interleaveArrays<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const maxLen = lists.reduce((max, list) => Math.max(max, list.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length) {
        out.push(list[i]);
      }
    }
  }
  return out;
}

export function isValidArtworkUrl(url?: string): boolean {
  if (!url || url === DEFAULT_COVER_SVG) return false;
  if (url.includes('artist_avatar@')) return false;
  return true;
}

const TRIBUTE_NAME_PATTERN = /\b(piano covers|karaoke|tribute|pirate|too close|nightcore|cover band|instrumental version|ka fan|fan club)\b/i;

export const HOME_SEED_QUERIES = [
  'Arijit Singh',
  'Diljit Dosanjh',
  'Shreya Ghoshal',
  'Karan Aujla',
  'Anirudh Ravichander',
  'A.R. Rahman',
  'Pritam',
  'The Weeknd',
];

export function selectPrimaryArtist(artists: Artist[], query: string): Artist | undefined {
  if (!artists.length) return undefined;
  const normalizedQuery = query.trim().toLowerCase();

  const scored = artists
    .filter((artist) => isValidArtworkUrl(artist.avatarUrl) && !TRIBUTE_NAME_PATTERN.test(artist.name))
    .map((artist) => {
      const nameLower = artist.name.trim().toLowerCase();
      let score = 0;
      if (nameLower === normalizedQuery) score += 1000;
      else if (nameLower.includes(normalizedQuery)) score += 400;
      if (artist.avatarUrl.includes('scdn.co') || artist.avatarUrl.includes('saavncdn.com')) score += 150;
      if (artist.followersCount) {
        score += Math.min(Math.log10(Math.max(artist.followersCount, 1)) * 20, 200);
      }
      return { artist, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.artist ?? artists.find((a) => isValidArtworkUrl(a.avatarUrl)) ?? artists[0];
}

export function selectPrimaryPlaylist(playlists: Playlist[]): Playlist | undefined {
  if (!playlists.length) return undefined;
  const scored = playlists
    .filter((pl) => isValidArtworkUrl(pl.coverUrl))
    .map((pl) => {
      let score = 0;
      if (pl.owner.toLowerCase().includes('editorial') || pl.owner.toLowerCase() === 'spotify') score += 500;
      if (pl.title.toLowerCase().startsWith('this is ')) score += 300;
      if (pl.coverUrl.includes('scdn.co') || pl.coverUrl.includes('saavncdn.com')) score += 200;
      if (pl.owner.toLowerCase().includes('radio')) score -= 250;
      return { pl, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.pl ?? playlists[0];
}

export const VIBE_SEED_QUERIES = [
  'Bollywood Hits',
  'Punjabi Hits',
  '90s Hindi Hits',
  'Hindi Lofi',
];

export async function getHomeCatalog(): Promise<HomeCatalog> {
  if (homeCatalogCache) return homeCatalogCache;

  const json = await fetchJson<Partial<HomeCatalog>>(`${SPOTIFY_API_BASE}/home`);
  const catalog: HomeCatalog = {
    tracks: Array.isArray(json?.tracks) ? json.tracks : [],
    freshTracks: Array.isArray(json?.freshTracks) ? json.freshTracks : [],
    artists: Array.isArray(json?.artists) ? json.artists : [],
    albums: Array.isArray(json?.albums) ? json.albums : [],
    playlists: Array.isArray(json?.playlists) ? json.playlists : [],
  };

  if (catalog.tracks.length > 0 || catalog.artists.length > 0) {
    homeCatalogCache = catalog;
  }

  return catalog;
}

export const PODCAST_SEED_QUERIES = [
  'podcast',
  'fearless motivation speech',
  'andrew huberman',
  'bhagavad gita hindi',
  'horror story hindi',
  'panchatantra stories',
  'true crime garage',
  'sadhguru speech',
];

const PODCAST_KEYWORDS =
  /\b(podcast|episode|speech|story|stories|nsdr|geeta|gita|motivation|motivational|talk|talks|chapter|chapters|kahani|kahaniya|audiobook|true crime|huberman|sadhguru|panchatantra|meditation|ramayan)\b/i;

const HINDI_STORY_SCRIPT_PATTERN = /[\u0900-\u097F]/;

const EXCLUDED_PODCAST_ARTIST_PATTERN =
  /\b(instrumentals|marconi union|american horror story cast|karaoke|tribute|cover band|chillout|relaxing spa|sleep helpers|nashville demo|chatterbox|car driving)\b/i;

const EXCLUDED_PODCAST_PLAYLIST_PATTERN =
  /\b(fall asleep|gentle acoustic|80s sing-alongs|running to metal|deep chill|feel-good classic|presenting chris)\b/i;

export function scorePodcastEpisode(track: Track): number {
  const titleLower = track.title.trim().toLowerCase();
  const haystack = `${track.title} ${track.artist} ${track.album}`;

  let score = 0;
  if (PODCAST_KEYWORDS.test(haystack)) score += 300;
  if (HINDI_STORY_SCRIPT_PATTERN.test(track.title)) score += 350;
  if (/\b(episode|ep\.?\s*\d+|speech|nsdr|geeta|gita|chapter)\b/i.test(track.title)) score += 250;
  if (track.duration >= 300) score += 200;
  else if (track.duration >= 180) score += 80;
  if (isValidArtworkUrl(track.coverUrl)) score += 100;

  if (titleLower === 'podcast' && track.duration < 240) {
    score -= 400;
  }
  if (/\b(remix|lofi|edm|chillout|workout music)\b/i.test(haystack)) {
    score -= 350;
  }

  return score;
}

export function isPodcastShowArtist(artist: Artist): boolean {
  if (!isValidArtworkUrl(artist.avatarUrl)) return false;
  if (EXCLUDED_PODCAST_ARTIST_PATTERN.test(artist.name)) return false;
  if (TRIBUTE_NAME_PATTERN.test(artist.name)) return false;
  return (
    PODCAST_KEYWORDS.test(artist.name) ||
    PODCAST_KEYWORDS.test(artist.bio) ||
    /\b(huberman|sadhguru|rogan|garage|rohn|peterson|shailendra|apurva|raj shamani)\b/i.test(artist.name)
  );
}

export function isPodcastPlaylist(playlist: Playlist): boolean {
  if (!isValidArtworkUrl(playlist.coverUrl)) return false;
  if (playlist.id.startsWith('pl-radio-')) return false;
  if (EXCLUDED_PODCAST_PLAYLIST_PATTERN.test(playlist.title)) return false;
  return PODCAST_KEYWORDS.test(playlist.title) || PODCAST_KEYWORDS.test(playlist.description);
}

export async function getPodcastCatalog(): Promise<PodcastCatalog> {
  if (podcastCatalogCache) return podcastCatalogCache;

  const json = await fetchJson<Partial<PodcastCatalog>>(`${SPOTIFY_API_BASE}/podcasts`);
  const catalog: PodcastCatalog = {
    episodes: Array.isArray(json?.episodes) ? json.episodes : [],
    shows: Array.isArray(json?.shows) ? json.shows : [],
    playlists: Array.isArray(json?.playlists) ? json.playlists : [],
  };

  if (catalog.episodes.length > 0 || catalog.shows.length > 0 || catalog.playlists.length > 0) {
    podcastCatalogCache = catalog;
  }

  return catalog;
}
