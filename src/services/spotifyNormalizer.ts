import type { Track, Artist, Album, Playlist } from '../types/spotify.ts';

export const SPOTIFY_FALLBACK_COVER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23282828'/%3E%3Cstop offset='100%25' stop-color='%23121212'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='300' fill='url(%23g)'/%3E%3Ccircle cx='150' cy='150' r='54' fill='none' stroke='%23535353' stroke-width='8'/%3E%3Ccircle cx='150' cy='150' r='16' fill='%23535353'/%3E%3C/svg%3E";

export interface SpotifyImageSource {
  url?: string;
  width?: number | null;
  height?: number | null;
}

export function extractSpotifyId(uriOrId?: string | null): string {
  if (!uriOrId) return '';
  const str = String(uriOrId).trim();
  if (!str) return '';
  const parts = str.split(':');
  return parts[parts.length - 1] || str;
}

export function decodeHtmlEntities(input?: string | null): string {
  if (!input) return '';
  return String(input)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#61;/g, '=')
    .replace(/&#64;/g, '@')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function pickBestImageUrl(
  sources?: SpotifyImageSource[] | null
): { primary?: string; fallback?: string } {
  if (!Array.isArray(sources) || sources.length === 0) {
    return {};
  }
  const valid = sources.filter(
    (s): s is SpotifyImageSource & { url: string } =>
      Boolean(s && typeof s.url === 'string' && s.url.startsWith('http'))
  );
  if (valid.length === 0) {
    return {};
  }

  const sorted = [...valid].sort((a, b) => {
    const wa = typeof a.width === 'number' && a.width > 0 ? a.width : 500;
    const wb = typeof b.width === 'number' && b.width > 0 ? b.width : 500;
    return wb - wa;
  });

  const primary = sorted[0]?.url;
  const medium =
    sorted.find((s) => (s.width ?? 0) >= 240 && (s.width ?? 0) < 600)?.url ||
    sorted[1]?.url ||
    primary;

  return { primary, fallback: medium };
}

export function formatSpotifyNumber(count?: number | string | null): string {
  const num = typeof count === 'string' ? Number(count) : count;
  if (typeof num !== 'number' || !Number.isFinite(num) || num <= 0) {
    return 'Verified Spotify Artist';
  }
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${val}M monthly listeners`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${val}K monthly listeners`;
  }
  return `${num.toLocaleString('en-US')} monthly listeners`;
}

export function formatPlayCount(playcount?: string | number | null): string | undefined {
  if (playcount === undefined || playcount === null) return undefined;
  const num = Number(playcount);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return num.toLocaleString('en-US');
}

export function buildSpotifyStreamEndpoint(
  id: string,
  title?: string,
  artist?: string,
  previewUrl?: string
): string {
  const params = new URLSearchParams();
  if (id) params.set('id', id);
  if (title) params.set('title', title);
  if (artist) params.set('artist', artist);
  if (previewUrl) params.set('preview', previewUrl);
  return `/api/spotify/stream?${params.toString()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractArtistsFromContainer(container: any): {
  names: string;
  primaryArtistId?: string;
} {
  const items = Array.isArray(container?.items) ? container.items : [];
  const namesList: string[] = [];
  let primaryArtistId: string | undefined;

  for (const entry of items) {
    const name = entry?.profile?.name || entry?.name;
    if (typeof name === 'string' && name.trim()) {
      namesList.push(name.trim());
    }
    if (!primaryArtistId) {
      const id = extractSpotifyId(entry?.uri || entry?.id);
      if (id) primaryArtistId = id;
    }
  }

  return {
    names: namesList.join(', ') || 'Unknown Artist',
    primaryArtistId,
  };
}

export interface NormalizeTrackContext {
  albumTitle?: string;
  albumId?: string;
  coverUrl?: string;
  fallbackCoverUrl?: string;
  releaseYear?: number;
  previewUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpotifyPathfinderTrack(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  context?: NormalizeTrackContext
): Track | null {
  const node = raw?.itemV2?.data || raw?.item?.data || raw?.track || raw?.data || raw;
  if (!node || typeof node !== 'object') return null;

  const id = extractSpotifyId(node.id || node.uri);
  const title = decodeHtmlEntities(node.name || node.title);
  if (!id || !title) return null;

  const { names, primaryArtistId } = extractArtistsFromContainer(
    node.artists || node.firstArtist || node.otherArtists
  );
  const artistName =
    names !== 'Unknown Artist'
      ? names
      : decodeHtmlEntities(node.artist || context?.albumTitle || 'Spotify Artist');

  const albumObj = node.albumOfTrack || node.album;
  const albumTitle = decodeHtmlEntities(albumObj?.name || context?.albumTitle || title);
  const albumId = extractSpotifyId(albumObj?.uri || albumObj?.id) || context?.albumId;

  const coverSources =
    albumObj?.coverArt?.sources ||
    node.visualIdentity?.squareCoverImage?.sources ||
    node.coverArt?.sources;
  const pickedCover = pickBestImageUrl(coverSources);

  const coverUrl = pickedCover.primary || context?.coverUrl || SPOTIFY_FALLBACK_COVER_SVG;
  const fallbackCoverUrl = pickedCover.fallback || context?.fallbackCoverUrl || SPOTIFY_FALLBACK_COVER_SVG;

  const durationMs =
    node.duration?.totalMilliseconds ??
    node.trackDuration?.totalMilliseconds ??
    node.durationMs;
  const duration =
    typeof durationMs === 'number' && durationMs > 0
      ? Math.max(1, Math.round(durationMs / 1000))
      : typeof node.duration === 'number' && node.duration > 0
        ? Math.round(node.duration > 1000 ? node.duration / 1000 : node.duration)
        : 200;

  const releaseYear =
    albumObj?.date?.year ??
    (typeof albumObj?.date?.isoString === 'string'
      ? Number(albumObj.date.isoString.slice(0, 4)) || undefined
      : undefined) ??
    context?.releaseYear;

  const previewUrl =
    node.audioPreview?.url || context?.previewUrl;

  return {
    id,
    title,
    artist: artistName,
    artistId: primaryArtistId,
    album: albumTitle,
    albumId,
    coverUrl,
    fallbackCoverUrl,
    streamUrl: buildSpotifyStreamEndpoint(id, title, artistName, previewUrl),
    fallbackStreamUrl: previewUrl,
    quality: 'Spotify Audio',
    duration,
    releaseYear,
    plays: formatPlayCount(node.playcount),
    ambientColor:
      albumObj?.coverArt?.extractedColors?.colorDark?.hex ||
      node.visualIdentity?.squareCoverImage?.extractedColorSet?.highContrast?.backgroundBase?.hex,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpotifyPathfinderArtist(raw: any): Artist | null {
  const node = raw?.data || raw;
  if (!node || typeof node !== 'object') return null;

  const id = extractSpotifyId(node.uri || node.id);
  const name = decodeHtmlEntities(node.profile?.name || node.name);
  if (!id || !name) return null;

  const avatarSources =
    node.visuals?.avatarImage?.sources ||
    node.visualIdentity?.squareCoverImage?.sources ||
    node.visuals?.headerImage?.sources ||
    node.coverArt?.sources;

  const picked = pickBestImageUrl(avatarSources);
  const rawTopTracks = Array.isArray(node.discography?.topTracks?.items)
    ? node.discography.topTracks.items
    : [];

  const topTracks: Track[] = rawTopTracks
    .map((entry: unknown) => normalizeSpotifyPathfinderTrack(entry))
    .filter((t: Track | null): t is Track => Boolean(t));

  const rawAlbumGroups = [
    ...(Array.isArray(node.discography?.albums?.items) ? node.discography.albums.items : []),
    ...(Array.isArray(node.discography?.popularReleasesAlbums?.items)
      ? node.discography.popularReleasesAlbums.items
      : []),
    ...(Array.isArray(node.discography?.singles?.items) ? node.discography.singles.items : []),
  ];

  const albums: Album[] = [];
  const seenAlbumIds = new Set<string>();
  for (const group of rawAlbumGroups) {
    const releases = Array.isArray(group?.releases?.items)
      ? group.releases.items
      : [group];
    for (const rel of releases) {
      const normalized = normalizeSpotifyPathfinderAlbum(rel, name);
      if (normalized && !seenAlbumIds.has(normalized.id)) {
        seenAlbumIds.add(normalized.id);
        albums.push(normalized);
      }
    }
  }

  const followersCount =
    typeof node.stats?.followers === 'number'
      ? node.stats.followers
      : typeof node.stats?.monthlyListeners === 'number'
        ? node.stats.monthlyListeners
        : undefined;

  const monthlyListeners =
    typeof node.stats?.monthlyListeners === 'number'
      ? formatSpotifyNumber(node.stats.monthlyListeners)
      : node.profile?.verified || node.onPlatformReputationTrait?.verification?.isVerified
        ? 'Verified Spotify Artist'
        : 'Spotify Artist';

  const bio =
    decodeHtmlEntities(node.profile?.biography?.text) ||
    `${name} on Spotify.`;

  return {
    id,
    name,
    avatarUrl: picked.primary || SPOTIFY_FALLBACK_COVER_SVG,
    fallbackAvatarUrl: picked.fallback || SPOTIFY_FALLBACK_COVER_SVG,
    monthlyListeners,
    followersCount,
    bio,
    verified: Boolean(
      node.profile?.verified ??
        node.onPlatformReputationTrait?.verification?.isVerified ??
        true
    ),
    topTracks,
    albums,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpotifyPathfinderAlbum(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  fallbackArtistName?: string
): Album | null {
  const node = raw?.data || raw;
  if (!node || typeof node !== 'object') return null;

  const id = extractSpotifyId(node.uri || node.id);
  const title = decodeHtmlEntities(node.name || node.title);
  if (!id || !title) return null;

  const { names } = extractArtistsFromContainer(node.artists);
  const artist =
    names !== 'Unknown Artist' ? names : fallbackArtistName || 'Various Artists';

  const picked = pickBestImageUrl(node.coverArt?.sources);
  const coverUrl = picked.primary || SPOTIFY_FALLBACK_COVER_SVG;
  const fallbackCoverUrl = picked.fallback || SPOTIFY_FALLBACK_COVER_SVG;

  const year =
    typeof node.date?.year === 'number'
      ? node.date.year
      : typeof node.date?.isoString === 'string'
        ? Number(node.date.isoString.slice(0, 4)) || 2024
        : 2024;

  const rawTracks = Array.isArray(node.tracksV2?.items)
    ? node.tracksV2.items
    : Array.isArray(node.tracks?.items)
      ? node.tracks.items
      : [];

  const tracks: Track[] = rawTracks
    .map((entry: unknown) =>
      normalizeSpotifyPathfinderTrack(entry, {
        albumTitle: title,
        albumId: id,
        coverUrl,
        fallbackCoverUrl,
        releaseYear: year,
      })
    )
    .filter((t: Track | null): t is Track => Boolean(t));

  return {
    id,
    title,
    artist,
    coverUrl,
    fallbackCoverUrl,
    year,
    tracks,
    ambientColor: node.coverArt?.extractedColors?.colorDark?.hex,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpotifyPathfinderPlaylist(raw: any): Playlist | null {
  const node = raw?.data || raw;
  if (!node || typeof node !== 'object') return null;

  const id = extractSpotifyId(node.uri || node.id);
  const title = decodeHtmlEntities(node.name || node.title);
  if (!id || !title) return null;

  const attrImage = Array.isArray(node.attributes)
    ? node.attributes.find((a: { key?: string; value?: string }) => a?.key === 'image_url')?.value
    : undefined;

  const imageItems = Array.isArray(node.images?.items) ? node.images.items : [];
  const picked = pickBestImageUrl(imageItems[0]?.sources);
  const coverUrl = picked.primary || attrImage || SPOTIFY_FALLBACK_COVER_SVG;
  const fallbackCoverUrl = picked.fallback || attrImage || SPOTIFY_FALLBACK_COVER_SVG;

  const owner = decodeHtmlEntities(node.ownerV2?.data?.name || node.owner?.name || 'Spotify');
  const description =
    decodeHtmlEntities(node.description) || `Curated playlist by ${owner}`;

  const rawItems = Array.isArray(node.content?.items) ? node.content.items : [];
  const tracks: Track[] = rawItems
    .map((entry: unknown) => normalizeSpotifyPathfinderTrack(entry))
    .filter((t: Track | null): t is Track => Boolean(t));

  const followers =
    typeof node.followers === 'number'
      ? `${node.followers.toLocaleString('en-US')} saves`
      : typeof node.content?.totalCount === 'number'
        ? `${node.content.totalCount} tracks`
        : undefined;

  return {
    id,
    title,
    description,
    coverUrl,
    fallbackCoverUrl,
    owner,
    followers,
    tracks,
    gradient: 'from-[#1e4a38] to-[#121212]',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpotifyPodcastShow(raw: any): Artist | null {
  const node = raw?.data || raw;
  if (!node || typeof node !== 'object') return null;

  const id = extractSpotifyId(node.uri || node.id);
  const name = decodeHtmlEntities(node.name);
  if (!id || !name) return null;

  const picked = pickBestImageUrl(node.coverArt?.sources);
  const publisher = decodeHtmlEntities(node.publisher?.name || 'Spotify Podcast');

  return {
    id,
    name,
    avatarUrl: picked.primary || SPOTIFY_FALLBACK_COVER_SVG,
    fallbackAvatarUrl: picked.fallback || SPOTIFY_FALLBACK_COVER_SVG,
    monthlyListeners: publisher,
    bio: `${name} — Podcast by ${publisher}`,
    verified: true,
    topTracks: [],
    albums: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpotifyEpisodeTrack(raw: any): Track | null {
  const node = raw?.data || raw;
  if (!node || typeof node !== 'object') return null;

  const id = extractSpotifyId(node.uri || node.id);
  const title = decodeHtmlEntities(node.name);
  if (!id || !title) return null;

  const podcastName = decodeHtmlEntities(
    node.podcastV2?.data?.name || node.podcastV2?.data?.publisher?.name || 'Spotify Podcast'
  );
  const showId = extractSpotifyId(node.podcastV2?.data?.uri);
  const picked = pickBestImageUrl(
    node.coverArt?.sources || node.podcastV2?.data?.coverArt?.sources
  );

  const durationMs = node.duration?.totalMilliseconds;
  const duration =
    typeof durationMs === 'number' && durationMs > 0
      ? Math.max(1, Math.round(durationMs / 1000))
      : 600;

  return {
    id,
    title,
    artist: podcastName,
    artistId: showId || undefined,
    album: podcastName,
    coverUrl: picked.primary || SPOTIFY_FALLBACK_COVER_SVG,
    fallbackCoverUrl: picked.fallback || SPOTIFY_FALLBACK_COVER_SVG,
    streamUrl: buildSpotifyStreamEndpoint(id, title, podcastName),
    quality: 'Spotify Podcast',
    duration,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSpotifyEmbedEntity(entity: any): {
  type: 'artist' | 'album' | 'playlist' | 'track' | string;
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  fallbackCoverUrl: string;
  tracks: Track[];
  previewUrl?: string;
} | null {
  if (!entity || typeof entity !== 'object') return null;

  const id = extractSpotifyId(entity.id || entity.uri);
  const title = decodeHtmlEntities(entity.name || entity.title);
  if (!id || !title) return null;

  const picked = pickBestImageUrl(entity.visualIdentity?.image);
  const coverUrl = picked.primary || SPOTIFY_FALLBACK_COVER_SVG;
  const fallbackCoverUrl = picked.fallback || SPOTIFY_FALLBACK_COVER_SVG;
  const subtitle = decodeHtmlEntities(entity.subtitle || '');
  const previewUrl =
    typeof entity.audioPreview?.url === 'string' ? entity.audioPreview.url : undefined;

  const rawList = Array.isArray(entity.trackList) ? entity.trackList : [];
  const tracks: Track[] = [];

  for (const item of rawList) {
    const tid = extractSpotifyId(item?.uri || item?.id);
    const tTitle = decodeHtmlEntities(item?.title || item?.name);
    if (!tid || !tTitle) continue;
    const tArtists = decodeHtmlEntities(item?.subtitle) || subtitle || title;
    const tPreview =
      typeof item?.audioPreview?.url === 'string' ? item.audioPreview.url : undefined;
    const durMs = item?.duration;
    const duration =
      typeof durMs === 'number' && durMs > 0 ? Math.max(1, Math.round(durMs / 1000)) : 200;

    tracks.push({
      id: tid,
      title: tTitle,
      artist: tArtists,
      artistId: entity.type === 'artist' ? id : undefined,
      album: entity.type === 'album' ? title : tTitle,
      albumId: entity.type === 'album' ? id : undefined,
      coverUrl,
      fallbackCoverUrl,
      streamUrl: buildSpotifyStreamEndpoint(tid, tTitle, tArtists, tPreview),
      fallbackStreamUrl: tPreview,
      quality: 'Spotify Audio',
      duration,
    });
  }

  return {
    type: String(entity.type || 'track'),
    id,
    title,
    subtitle,
    coverUrl,
    fallbackCoverUrl,
    tracks,
    previewUrl,
  };
}
