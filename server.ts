import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Track,
  Artist,
  Album,
  Playlist,
  PodcastCatalog,
} from './src/types/spotify.ts';
import {
  extractSpotifyId,
  normalizeSpotifyPathfinderTrack,
  normalizeSpotifyPathfinderArtist,
  normalizeSpotifyPathfinderAlbum,
  normalizeSpotifyPathfinderPlaylist,
  normalizeSpotifyPodcastShow,
  normalizeSpotifyEpisodeTrack,
  normalizeSpotifyEmbedEntity,
  SPOTIFY_FALLBACK_COVER_SVG,
} from './src/services/spotifyNormalizer.ts';
import {
  FALLBACK_TOTP_SECRETS,
  type TotpSecretEntry,
  deriveTotpKey,
  generateTotp,
} from './src/services/spotifyTotp.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const PATHFINDER_HASHES: Record<string, string> = {
  home: '5fb7da7a03ee2776c0670856609cb85a189a3cecc36cc160b91cde79063b9cf1',
  searchDesktop: 'eef7cc54888d91bdd6802623477873caa3948ae173a0c34fd86827b267e94c03',
  queryArtistOverview: 'eafb1620d783ece118e72fbfede2b0064483e029d3c1aafafa1c2de0e25a89e7',
  getAlbum: '0b6ce3511e1b02e4a40fa95440f992acbe85080eb308af9194322d708fc1914f',
  fetchPlaylist: '21ea11a6ac75a5f3e01fd365d29c18e0a4a8b7dc09f89bbb5d73910190c6acaf',
  getTrack: 'e7b1bf4e95cb3d733d48b442f93006e9712fd504e8b88d7a82e6e3bac9306a6b',
};

interface CachedSession {
  accessToken: string;
  clientToken: string;
  clientId: string;
  expiresAt: number;
}

let sessionCache: CachedSession | null = null;
let sessionPromise: Promise<CachedSession> | null = null;
let activeTotpSecrets: TotpSecretEntry[] = [...FALLBACK_TOTP_SECRETS];

const homeCache: { data: unknown | null; expiresAt: number } = {
  data: null,
  expiresAt: 0,
};
const podcastCache: { data: PodcastCatalog | null; expiresAt: number } = {
  data: null,
  expiresAt: 0,
};
const searchResultCache = new Map<string, { data: unknown; expiresAt: number }>();
const streamResolveCache = new Map<string, { url: string | null; expiresAt: number }>();

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function refreshDynamicTotpSecrets(): Promise<void> {
  try {
    const htmlRes = await fetchWithTimeout('https://open.spotify.com/', {
      headers: { 'user-agent': USER_AGENT },
    });
    if (!htmlRes.ok) return;
    const html = await htmlRes.text();
    const match = html.match(
      /https:\/\/open\.spotifycdn\.com\/cdn\/build\/web-player\/web-player\.[^"']+\.js/
    );
    if (!match) return;

    const jsRes = await fetchWithTimeout(match[0], {
      headers: { 'user-agent': USER_AGENT },
    }, 12000);
    if (!jsRes.ok) return;
    const js = await jsRes.text();

    const secretArrMatch = js.match(
      /\[\{secret:(['"`])((?:\\.|(?!\1).)+)\1,version:(\d+)\}/
    );
    if (secretArrMatch) {
      const secret = secretArrMatch[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      const version = Number(secretArrMatch[3]);
      if (secret && Number.isFinite(version)) {
        activeTotpSecrets = [{ secret, version }, ...FALLBACK_TOTP_SECRETS];
      }
    }

    for (const opName of Object.keys(PATHFINDER_HASHES)) {
      const opRegex = new RegExp(`"${opName}","query","([a-f0-9]{64})"`);
      const opMatch = js.match(opRegex);
      if (opMatch?.[1]) {
        PATHFINDER_HASHES[opName] = opMatch[1];
      }
    }
  } catch {
    // Keep existing secrets/hashes on transient network error
  }
}

async function fetchTokenWithSecret(
  entry: TotpSecretEntry,
  serverTimeSec: number | null
): Promise<{ accessToken: string; clientId: string; accessTokenExpirationTimestampMs: number }> {
  const key = deriveTotpKey(entry.secret);
  const totp = generateTotp(key, Date.now());
  const totpServer = serverTimeSec ? generateTotp(key, serverTimeSec * 1000) : totp;

  const qs = new URLSearchParams({
    reason: 'init',
    productType: 'web-player',
    totp,
    totpServer,
    totpVer: String(entry.version),
  });

  const res = await fetchWithTimeout(`https://open.spotify.com/api/token?${qs.toString()}`, {
    headers: {
      'user-agent': USER_AGENT,
      referer: 'https://open.spotify.com/',
      origin: 'https://open.spotify.com',
    },
  });

  if (!res.ok) {
    throw new Error(`Spotify token error ${res.status}`);
  }

  const json = (await res.json()) as {
    accessToken?: string;
    clientId?: string;
    accessTokenExpirationTimestampMs?: number;
  };
  if (!json.accessToken || !json.clientId) {
    throw new Error('Spotify token response missing accessToken');
  }

  return {
    accessToken: json.accessToken,
    clientId: json.clientId,
    accessTokenExpirationTimestampMs:
      json.accessTokenExpirationTimestampMs || Date.now() + 30 * 60 * 1000,
  };
}

async function obtainSpotifySession(forceRefresh = false): Promise<CachedSession> {
  if (!forceRefresh && sessionCache && Date.now() < sessionCache.expiresAt) {
    return sessionCache;
  }
  if (!forceRefresh && sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    try {
      let serverTimeSec: number | null = null;
      try {
        const stRes = await fetchWithTimeout('https://open.spotify.com/api/server-time', {
          headers: { 'user-agent': USER_AGENT },
        });
        if (stRes.ok) {
          const stJson = (await stRes.json()) as { serverTime?: number };
          if (typeof stJson.serverTime === 'number') {
            serverTimeSec = stJson.serverTime;
          }
        }
      } catch {
        serverTimeSec = null;
      }

      let tokenData: {
        accessToken: string;
        clientId: string;
        accessTokenExpirationTimestampMs: number;
      } | null = null;

      for (const entry of activeTotpSecrets) {
        try {
          tokenData = await fetchTokenWithSecret(entry, serverTimeSec);
          break;
        } catch {
          // try next secret
        }
      }

      if (!tokenData) {
        await refreshDynamicTotpSecrets();
        tokenData = await fetchTokenWithSecret(activeTotpSecrets[0], serverTimeSec);
      }

      const ctRes = await fetchWithTimeout('https://clienttoken.spotify.com/v1/clienttoken', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({
          client_data: {
            client_version: '1.2.60.0',
            client_id: tokenData.clientId,
            js_sdk_data: {
              device_brand: 'unknown',
              device_model: 'unknown',
              os: 'linux',
              os_version: 'unknown',
              device_id: crypto.randomUUID(),
              device_type: 'computer',
            },
          },
        }),
      });

      let clientToken = '';
      if (ctRes.ok) {
        const ctJson = (await ctRes.json()) as { granted_token?: { token?: string } };
        clientToken = ctJson.granted_token?.token || '';
      }

      const nextSession: CachedSession = {
        accessToken: tokenData.accessToken,
        clientToken,
        clientId: tokenData.clientId,
        expiresAt: Math.min(
          tokenData.accessTokenExpirationTimestampMs - 60_000,
          Date.now() + 40 * 60 * 1000
        ),
      };
      sessionCache = nextSession;
      return nextSession;
    } finally {
      sessionPromise = null;
    }
  })();

  return sessionPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryPathfinder(
  operationName: keyof typeof PATHFINDER_HASHES,
  variables: Record<string, unknown>,
  retryOnAuthError = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const session = await obtainSpotifySession(false);
  const sha256Hash = PATHFINDER_HASHES[operationName];

  const headers: Record<string, string> = {
    authorization: `Bearer ${session.accessToken}`,
    'app-platform': 'WebPlayer',
    'content-type': 'application/json',
    'user-agent': USER_AGENT,
    origin: 'https://open.spotify.com',
    referer: 'https://open.spotify.com/',
  };
  if (session.clientToken) {
    headers['client-token'] = session.clientToken;
  }

  const res = await fetchWithTimeout('https://api-partner.spotify.com/pathfinder/v2/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operationName,
      variables,
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash,
        },
      },
    }),
  });

  if ((res.status === 401 || res.status === 403) && retryOnAuthError) {
    await obtainSpotifySession(true);
    return queryPathfinder(operationName, variables, false);
  }

  if (!res.ok) {
    throw new Error(`Spotify Pathfinder ${operationName} failed with ${res.status}`);
  }

  const json = await res.json();
  if (json?.errors?.length && !json?.data) {
    throw new Error(json.errors[0]?.message || `Pathfinder ${operationName} GraphQL error`);
  }
  return json;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSpotifyEmbedEntity(type: string, id: string): Promise<any | null> {
  try {
    const res = await fetchWithTimeout(
      `https://open.spotify.com/embed/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
      { headers: { 'user-agent': USER_AGENT } },
      7000
    );
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match?.[1]) return null;
    const parsed = JSON.parse(match[1]);
    return parsed?.props?.pageProps?.state?.data?.entity || null;
  } catch {
    return null;
  }
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
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

function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const maxLen = lists.reduce((m, l) => Math.max(m, l.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

async function runSpotifySearch(searchTerm: string, limit = 20) {
  const key = `${searchTerm.trim().toLowerCase()}:${limit}`;
  const cached = searchResultCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as {
      tracks: Track[];
      artists: Artist[];
      albums: Album[];
      playlists: Playlist[];
      episodes: Track[];
      shows: Artist[];
    };
  }

  const pf = await queryPathfinder('searchDesktop', {
    searchTerm,
    offset: 0,
    limit,
    numberOfTopResults: 5,
    includeAudiobooks: false,
    includeArtistHasConcertsField: false,
    includePreReleases: true,
    includeAlbumPreReleases: false,
    includeAuthors: false,
    includeEpisodeContentRatingsV2: true,
    isPrefix: null,
    sectionFilters: ['GENERIC'],
  });

  const searchV2 = pf?.data?.searchV2 || {};
  const tracks: Track[] = dedupeById(
    (searchV2.tracksV2?.items || [])
      .map((item: unknown) => normalizeSpotifyPathfinderTrack(item))
      .filter((t: Track | null): t is Track => Boolean(t))
  );

  const artists: Artist[] = dedupeById(
    (searchV2.artists?.items || [])
      .map((item: unknown) => normalizeSpotifyPathfinderArtist(item))
      .filter((a: Artist | null): a is Artist => Boolean(a))
  );

  const albums: Album[] = dedupeById(
    (searchV2.albumsV2?.items || [])
      .map((item: unknown) => normalizeSpotifyPathfinderAlbum(item))
      .filter((a: Album | null): a is Album => Boolean(a))
  );

  const playlists: Playlist[] = dedupeById(
    (searchV2.playlists?.items || [])
      .map((item: unknown) => normalizeSpotifyPathfinderPlaylist(item))
      .filter((p: Playlist | null): p is Playlist => Boolean(p))
  );

  const episodes: Track[] = dedupeById(
    (searchV2.episodes?.items || [])
      .map((item: unknown) => normalizeSpotifyEpisodeTrack(item))
      .filter((e: Track | null): e is Track => Boolean(e))
  );

  const shows: Artist[] = dedupeById(
    (searchV2.podcasts?.items || [])
      .map((item: unknown) => normalizeSpotifyPodcastShow(item))
      .filter((s: Artist | null): s is Artist => Boolean(s))
  );

  const result = { tracks, artists, albums, playlists, episodes, shows };
  searchResultCache.set(key, { data: result, expiresAt: Date.now() + 5 * 60 * 1000 });
  return result;
}

function scoreMatch(candidateTitle: string, candidateArtist: string, targetTitle: string, targetArtist: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const ct = norm(candidateTitle);
  const ca = norm(candidateArtist);
  const tt = norm(targetTitle);
  const ta = norm(targetArtist);

  let score = 0;
  if (ct === tt) score += 100;
  else if (ct.includes(tt) || tt.includes(ct)) score += 60;
  const firstArtist = ta.split(/[&,]/)[0]?.trim() || '';
  if (firstArtist && ca.includes(firstArtist)) score += 40;
  if (/\b(karaoke|instrumental|tribute|cover|lofi|slowed|reverb)\b/i.test(ct) && !/\b(karaoke|instrumental|tribute|cover|lofi|slowed|reverb)\b/i.test(tt)) {
    score -= 70;
  }
  return score;
}

async function resolvePlayableStream(
  id: string,
  title: string,
  artist: string,
  previewUrl?: string
): Promise<{ streamUrl: string | null; lyrics?: unknown }> {
  const cacheKey = `${id}:${title}:${artist}`.toLowerCase();
  const cached = streamResolveCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { streamUrl: cached.url };
  }

  let resolvedUrl: string | null = null;

  if (title) {
    try {
      const q = `${title} ${artist.split(',')[0] || ''}`.trim();
      const hpRes = await fetchWithTimeout(
        `https://headphonix2.vercel.app/api/v1/search?q=${encodeURIComponent(q)}&limit=5`,
        {},
        4500
      );
      if (hpRes.ok) {
        const hpJson = (await hpRes.json()) as {
          data?: Array<{
            id?: string;
            title?: string;
            artist?: string;
            streamUrl?: string;
            endpoints?: { stream?: string };
          }>;
        };
        const candidates = Array.isArray(hpJson?.data) ? hpJson.data : [];
        const ranked = candidates
          .filter((c) => Boolean(c.streamUrl || c.endpoints?.stream))
          .map((c) => ({
            candidate: c,
            score: scoreMatch(c.title || '', c.artist || '', title, artist),
          }))
          .sort((a, b) => b.score - a.score);

        if (ranked[0] && ranked[0].score >= 30) {
          resolvedUrl =
            ranked[0].candidate.streamUrl || ranked[0].candidate.endpoints?.stream || null;
        }
      }
    } catch {
      // fall through to Spotify previewUrl
    }
  }

  if (!resolvedUrl && previewUrl) {
    resolvedUrl = previewUrl;
  }

  if (!resolvedUrl && id) {
    const embed = await fetchSpotifyEmbedEntity('track', id);
    if (embed?.audioPreview?.url) {
      resolvedUrl = embed.audioPreview.url;
    }
  }

  streamResolveCache.set(cacheKey, {
    url: resolvedUrl,
    expiresAt: Date.now() + 30 * 60 * 1000,
  });

  return { streamUrl: resolvedUrl };
}

async function createApp() {
  const app = express();

  app.get('/api/spotify/home', async (_req, res) => {
    try {
      if (homeCache.data && Date.now() < homeCache.expiresAt) {
        return res.json(homeCache.data);
      }

      const [homeResult, arijitResult, diljitResult, shreyaResult, bollywoodResult] =
        await Promise.allSettled([
          queryPathfinder('home', {
            timeZone: 'Asia/Kolkata',
            sp_t: '',
            facet: '',
            sectionItemsLimit: 12,
            includeHomeChapterVideoCards: false,
            homeEndUserIntegration: 'INTEGRATION_WEB_PLAYER',
            includeEpisodeContentRatingsV2: true,
          }),
          runSpotifySearch('Arijit Singh', 8),
          runSpotifySearch('Diljit Dosanjh', 6),
          runSpotifySearch('Shreya Ghoshal', 6),
          runSpotifySearch('Bollywood Hits', 8),
        ]);

      const homeTracks: Track[] = [];
      const homeArtists: Artist[] = [];
      const homeAlbums: Album[] = [];
      const homePlaylists: Playlist[] = [];

      if (homeResult.status === 'fulfilled') {
        const sections =
          homeResult.value?.data?.home?.sectionContainer?.sections?.items || [];
        for (const section of sections) {
          const items = section?.sectionItems?.items || [];
          for (const entry of items) {
            const content = entry?.content;
            const typename = content?.__typename;
            if (typename === 'TrackResponseWrapper') {
              const t = normalizeSpotifyPathfinderTrack(content);
              if (t) homeTracks.push(t);
            } else if (typename === 'ArtistResponseWrapper') {
              const a = normalizeSpotifyPathfinderArtist(content);
              if (a) homeArtists.push(a);
            } else if (typename === 'AlbumResponseWrapper') {
              const alb = normalizeSpotifyPathfinderAlbum(content);
              if (alb) homeAlbums.push(alb);
            } else if (typename === 'PlaylistResponseWrapper') {
              const pl = normalizeSpotifyPathfinderPlaylist(content);
              if (pl) homePlaylists.push(pl);
            }
          }
        }
      }

      const seededTracks: Track[][] = [];
      const seededArtists: Artist[] = [];
      const seededAlbums: Album[][] = [];
      const seededPlaylists: Playlist[] = [];

      for (const settled of [arijitResult, diljitResult, shreyaResult, bollywoodResult]) {
        if (settled.status !== 'fulfilled') continue;
        if (settled.value.tracks.length > 0) seededTracks.push(settled.value.tracks.slice(0, 4));
        if (settled.value.artists[0]) seededArtists.push(settled.value.artists[0]);
        if (settled.value.albums.length > 0) seededAlbums.push(settled.value.albums.slice(0, 3));
        if (settled.value.playlists.length > 0) {
          seededPlaylists.push(...settled.value.playlists.slice(0, 2));
        }
      }

      const combinedTracks = dedupeById(
        interleave([interleave(seededTracks), homeTracks])
      ).slice(0, 12);

      const usedIds = new Set(combinedTracks.map((t) => t.id));
      const freshTracks = dedupeById([
        ...homeTracks.filter((t) => !usedIds.has(t.id)),
        ...(bollywoodResult.status === 'fulfilled'
          ? bollywoodResult.value.tracks.filter((t) => !usedIds.has(t.id))
          : []),
      ]).slice(0, 12);

      const artists = dedupeById(interleave([seededArtists, homeArtists])).slice(0, 12);
      const albums = dedupeById(interleave([interleave(seededAlbums), homeAlbums])).slice(0, 12);
      const playlists = dedupeById(interleave([seededPlaylists, homePlaylists])).slice(0, 12);

      const payload = {
        tracks: combinedTracks,
        freshTracks,
        artists,
        albums,
        playlists,
        source: 'open.spotify.com',
      };

      if (combinedTracks.length > 0 || artists.length > 0) {
        homeCache.data = payload;
        homeCache.expiresAt = Date.now() + 5 * 60 * 1000;
      }

      return res.json(payload);
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to fetch Spotify home catalog',
      });
    }
  });

  app.get('/api/spotify/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const limit = Math.min(Math.max(Number(req.query.limit || 24), 1), 40);
      if (!q) {
        return res.json({ tracks: [], artists: [], albums: [], playlists: [] });
      }

      const result = await runSpotifySearch(q, limit);
      const isPodcastQuery = /\b(podcast|episode|story|stories|speech|gita|geeta|huberman|sadhguru|crime|raj shamani)\b/i.test(
        q
      );

      return res.json({
        tracks: isPodcastQuery
          ? dedupeById([...result.episodes, ...result.tracks])
          : result.tracks,
        artists: isPodcastQuery
          ? dedupeById([...result.shows, ...result.artists])
          : result.artists,
        albums: result.albums,
        playlists: result.playlists,
        source: 'open.spotify.com',
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Spotify search failed',
      });
    }
  });

  app.get('/api/spotify/artist/:id', async (req, res) => {
    const id = extractSpotifyId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Missing artist ID' });

    try {
      const pf = await queryPathfinder('queryArtistOverview', {
        uri: `spotify:artist:${id}`,
        locale: '',
      });

      const artist = normalizeSpotifyPathfinderArtist(pf?.data?.artistUnion);
      if (artist) {
        if (artist.topTracks.length === 0) {
          const embed = await fetchSpotifyEmbedEntity('artist', id);
          const normEmbed = normalizeSpotifyEmbedEntity(embed);
          if (normEmbed?.tracks.length) {
            artist.topTracks = normEmbed.tracks;
          }
        }
        return res.json({ data: artist, source: 'open.spotify.com' });
      }
    } catch {
      // fall back to Spotify embed endpoint
    }

    const embed = await fetchSpotifyEmbedEntity('artist', id);
    const normEmbed = normalizeSpotifyEmbedEntity(embed);
    if (normEmbed) {
      return res.json({
        data: {
          id: normEmbed.id,
          name: normEmbed.title,
          avatarUrl: normEmbed.coverUrl,
          fallbackAvatarUrl: normEmbed.fallbackCoverUrl,
          monthlyListeners: 'Verified Spotify Artist',
          bio: `${normEmbed.title} on Spotify.`,
          verified: true,
          topTracks: normEmbed.tracks,
          albums: [],
        } satisfies Artist,
        source: 'open.spotify.com/embed',
      });
    }

    return res.status(404).json({ error: 'Artist not found on Spotify' });
  });

  app.get('/api/spotify/album/:id', async (req, res) => {
    const id = extractSpotifyId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Missing album ID' });

    try {
      const pf = await queryPathfinder('getAlbum', {
        uri: `spotify:album:${id}`,
        locale: '',
        offset: 0,
        limit: 50,
      });

      const album = normalizeSpotifyPathfinderAlbum(pf?.data?.albumUnion);
      if (album) {
        return res.json({ data: album, source: 'open.spotify.com' });
      }
    } catch {
      // fall back to Spotify embed endpoint
    }

    const embed = await fetchSpotifyEmbedEntity('album', id);
    const normEmbed = normalizeSpotifyEmbedEntity(embed);
    if (normEmbed) {
      return res.json({
        data: {
          id: normEmbed.id,
          title: normEmbed.title,
          artist: normEmbed.subtitle || 'Spotify Artist',
          coverUrl: normEmbed.coverUrl,
          fallbackCoverUrl: normEmbed.fallbackCoverUrl,
          year: 2024,
          tracks: normEmbed.tracks,
        } satisfies Album,
        source: 'open.spotify.com/embed',
      });
    }

    return res.status(404).json({ error: 'Album not found on Spotify' });
  });

  app.get('/api/spotify/playlist/:id', async (req, res) => {
    const id = extractSpotifyId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Missing playlist ID' });

    try {
      const pf = await queryPathfinder('fetchPlaylist', {
        uri: `spotify:playlist:${id}`,
        offset: 0,
        limit: 50,
        enableWatchFeedEntrypoint: false,
      });

      const playlist = normalizeSpotifyPathfinderPlaylist(pf?.data?.playlistV2);
      if (playlist) {
        return res.json({ data: playlist, source: 'open.spotify.com' });
      }
    } catch {
      // fall back to Spotify embed endpoint
    }

    const embed = await fetchSpotifyEmbedEntity('playlist', id);
    const normEmbed = normalizeSpotifyEmbedEntity(embed);
    if (normEmbed) {
      return res.json({
        data: {
          id: normEmbed.id,
          title: normEmbed.title,
          description: normEmbed.subtitle || 'Spotify Playlist',
          coverUrl: normEmbed.coverUrl,
          fallbackCoverUrl: normEmbed.fallbackCoverUrl,
          owner: 'Spotify',
          followers: `${normEmbed.tracks.length} tracks`,
          tracks: normEmbed.tracks,
          gradient: 'from-[#1e4a38] to-[#121212]',
        } satisfies Playlist,
        source: 'open.spotify.com/embed',
      });
    }

    return res.status(404).json({ error: 'Playlist not found on Spotify' });
  });

  app.get('/api/spotify/track/:id', async (req, res) => {
    const id = extractSpotifyId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Missing track ID' });

    try {
      const [pfResult, embedResult] = await Promise.allSettled([
        queryPathfinder('getTrack', { uri: `spotify:track:${id}` }),
        fetchSpotifyEmbedEntity('track', id),
      ]);

      const embedData = embedResult.status === 'fulfilled' ? embedResult.value : null;
      const previewUrl =
        typeof embedData?.audioPreview?.url === 'string'
          ? embedData.audioPreview.url
          : undefined;

      if (pfResult.status === 'fulfilled' && pfResult.value?.data?.trackUnion) {
        const normEmbed = embedData ? normalizeSpotifyEmbedEntity(embedData) : null;
        const norm = normalizeSpotifyPathfinderTrack(pfResult.value.data.trackUnion, {
          previewUrl,
          coverUrl: normEmbed?.coverUrl,
          fallbackCoverUrl: normEmbed?.fallbackCoverUrl,
        });
        if (norm) {
          if (norm.artist === 'Spotify Artist' && normEmbed?.subtitle) {
            norm.artist = normEmbed.subtitle;
          }
          return res.json({ data: norm, source: 'open.spotify.com' });
        }
      }

      if (embedData) {
        const normEmbed = normalizeSpotifyEmbedEntity(embedData);
        if (normEmbed) {
          return res.json({
            data: {
              id: normEmbed.id,
              title: normEmbed.title,
              artist: normEmbed.subtitle || 'Spotify Artist',
              album: normEmbed.title,
              coverUrl: normEmbed.coverUrl,
              fallbackCoverUrl: normEmbed.fallbackCoverUrl,
              streamUrl: `/api/spotify/stream?id=${encodeURIComponent(normEmbed.id)}&title=${encodeURIComponent(normEmbed.title)}&artist=${encodeURIComponent(normEmbed.subtitle)}`,
              fallbackStreamUrl: normEmbed.previewUrl,
              duration:
                typeof embedData.duration === 'number'
                  ? Math.round(embedData.duration / 1000)
                  : 200,
            } satisfies Track,
            source: 'open.spotify.com/embed',
          });
        }
      }

      return res.status(404).json({ error: 'Track not found on Spotify' });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to fetch track',
      });
    }
  });

  app.get('/api/spotify/track/:id/related', async (req, res) => {
    const id = extractSpotifyId(req.params.id);
    if (!id) return res.json({ data: [] });

    try {
      const pfTrack = await queryPathfinder('getTrack', { uri: `spotify:track:${id}` });
      const trackNode = pfTrack?.data?.trackUnion;
      const artistUri =
        trackNode?.firstArtist?.items?.[0]?.uri ||
        trackNode?.otherArtists?.items?.[0]?.uri;
      const artistId = extractSpotifyId(artistUri);

      if (artistId) {
        const artistOverview = await queryPathfinder('queryArtistOverview', {
          uri: `spotify:artist:${artistId}`,
          locale: '',
        });
        const normArtist = normalizeSpotifyPathfinderArtist(
          artistOverview?.data?.artistUnion
        );
        if (normArtist?.topTracks.length) {
          return res.json({
            data: normArtist.topTracks.filter((t) => t.id !== id),
            source: 'open.spotify.com',
          });
        }
      }

      if (trackNode?.name) {
        const search = await runSpotifySearch(trackNode.name, 12);
        return res.json({
          data: search.tracks.filter((t) => t.id !== id),
          source: 'open.spotify.com',
        });
      }

      return res.json({ data: [] });
    } catch {
      return res.json({ data: [] });
    }
  });

  app.get('/api/spotify/stream', async (req, res) => {
    const id = extractSpotifyId(String(req.query.id || ''));
    const title = String(req.query.title || '').trim();
    const artist = String(req.query.artist || '').trim();
    const preview = String(req.query.preview || '').trim() || undefined;

    try {
      const { streamUrl } = await resolvePlayableStream(id, title, artist, preview);
      if (streamUrl) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.redirect(302, streamUrl);
      }
      return res.status(404).json({ error: 'No audio stream available' });
    } catch {
      return res.status(404).json({ error: 'Unable to resolve stream' });
    }
  });

  app.get('/api/spotify/podcasts', async (_req, res) => {
    try {
      if (podcastCache.data && Date.now() < podcastCache.expiresAt) {
        return res.json(podcastCache.data);
      }

      const queries = [
        'Andrew Huberman podcast',
        'Sadhguru speech podcast',
        'Bhagavad Gita Hindi',
        'Raj Shamani podcast',
      ];
      const settled = await Promise.allSettled(
        queries.map((q) => runSpotifySearch(q, 8))
      );

      const episodeBuckets: Track[][] = [];
      const showBuckets: Artist[][] = [];
      const playlistBuckets: Playlist[][] = [];

      for (const s of settled) {
        if (s.status !== 'fulfilled') continue;
        if (s.value.episodes.length > 0) episodeBuckets.push(s.value.episodes.slice(0, 5));
        if (s.value.shows.length > 0) showBuckets.push(s.value.shows.slice(0, 3));
        if (s.value.playlists.length > 0) {
          playlistBuckets.push(
            s.value.playlists
              .slice(0, 3)
              .map((pl) => ({ ...pl, isPodcast: true }))
          );
        }
      }

      const catalog: PodcastCatalog = {
        episodes: dedupeById(interleave(episodeBuckets)).slice(0, 18),
        shows: dedupeById(interleave(showBuckets)).slice(0, 12),
        playlists: dedupeById(interleave(playlistBuckets)).slice(0, 12),
      };

      if (catalog.episodes.length > 0 || catalog.shows.length > 0) {
        podcastCache.data = catalog;
        podcastCache.expiresAt = Date.now() + 10 * 60 * 1000;
      }

      return res.json(catalog);
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to fetch Spotify podcasts',
        episodes: [],
        shows: [],
        playlists: [],
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        return next();
      }
      return res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { SPOTIFY_FALLBACK_COVER_SVG };
