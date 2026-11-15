import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSpotifyId,
  decodeHtmlEntities,
  pickBestImageUrl,
  formatSpotifyNumber,
  normalizeSpotifyPathfinderTrack,
  normalizeSpotifyPathfinderArtist,
  normalizeSpotifyPathfinderAlbum,
  normalizeSpotifyPathfinderPlaylist,
  normalizeSpotifyEmbedEntity,
} from './spotifyNormalizer';
import { deriveTotpKey, generateTotp } from './spotifyTotp';

test('extractSpotifyId and decodeHtmlEntities handle URIs and encoded HTML entities', () => {
  assert.equal(extractSpotifyId('spotify:artist:4YRxDV8wJFPHPTeXepOstw'), '4YRxDV8wJFPHPTeXepOstw');
  assert.equal(extractSpotifyId('5MCbGWnNLLjoHpbDO3BOgi'), '5MCbGWnNLLjoHpbDO3BOgi');
  assert.equal(
    decodeHtmlEntities('Latest &amp; Greatest &#64; Spotify &#61; 100%'),
    'Latest & Greatest @ Spotify = 100%'
  );
});

test('pickBestImageUrl selects highest resolution primary and medium fallback', () => {
  const picked = pickBestImageUrl([
    { width: 64, height: 64, url: 'https://i.scdn.co/image/small' },
    { width: 300, height: 300, url: 'https://i.scdn.co/image/medium' },
    { width: 640, height: 640, url: 'https://i.scdn.co/image/large' },
  ]);
  assert.equal(picked.primary, 'https://i.scdn.co/image/large');
  assert.equal(picked.fallback, 'https://i.scdn.co/image/medium');
});

test('normalizeSpotifyPathfinderTrack extracts Spotify artwork, artist, duration, and stream endpoint', () => {
  const track = normalizeSpotifyPathfinderTrack({
    item: {
      data: {
        uri: 'spotify:track:56zZ48jdyY2oDXHVnwg5Di',
        id: '56zZ48jdyY2oDXHVnwg5Di',
        name: 'Tum Hi Ho',
        duration: { totalMilliseconds: 261974 },
        artists: {
          items: [
            { profile: { name: 'Arijit Singh' }, uri: 'spotify:artist:4YRxDV8wJFPHPTeXepOstw' },
            { profile: { name: 'Mithoon' }, uri: 'spotify:artist:09UmIX92EUH9hAK4bxvHx6' },
          ],
        },
        albumOfTrack: {
          uri: 'spotify:album:0Rkv5iqjF2uenfL0OVB8hg',
          name: 'Aashiqui 2',
          date: { year: 2013 },
          coverArt: {
            sources: [
              { width: 300, url: 'https://i.scdn.co/image/ab67616d00001e026404721c1943d5069f0805f3' },
              { width: 640, url: 'https://i.scdn.co/image/ab67616d0000b2736404721c1943d5069f0805f3' },
            ],
          },
        },
      },
    },
  });

  assert.ok(track);
  assert.equal(track.id, '56zZ48jdyY2oDXHVnwg5Di');
  assert.equal(track.title, 'Tum Hi Ho');
  assert.equal(track.artist, 'Arijit Singh, Mithoon');
  assert.equal(track.artistId, '4YRxDV8wJFPHPTeXepOstw');
  assert.equal(track.album, 'Aashiqui 2');
  assert.equal(track.duration, 262);
  assert.equal(track.releaseYear, 2013);
  assert.equal(track.coverUrl, 'https://i.scdn.co/image/ab67616d0000b2736404721c1943d5069f0805f3');
  assert.ok(track.streamUrl?.startsWith('/api/spotify/stream?'));
});

test('normalizeSpotifyPathfinderArtist extracts avatar photo, monthly listeners, topTracks, and albums', () => {
  const artist = normalizeSpotifyPathfinderArtist({
    uri: 'spotify:artist:4YRxDV8wJFPHPTeXepOstw',
    profile: {
      name: 'Arijit Singh',
      verified: true,
      biography: { text: 'Indian playback singer &amp; composer.' },
    },
    stats: {
      followers: 197524200,
      monthlyListeners: 53822396,
    },
    visuals: {
      avatarImage: {
        sources: [
          { width: 640, url: 'https://i.scdn.co/image/ab6761610000e5ebadfb0b2df04b77e43b5f7375' },
          { width: 320, url: 'https://i.scdn.co/image/ab67616100005174adfb0b2df04b77e43b5f7375' },
        ],
      },
    },
    discography: {
      topTracks: {
        items: [
          {
            track: {
              uri: 'spotify:track:5MCbGWnNLLjoHpbDO3BOgi',
              name: 'Gehra Hua',
              duration: { totalMilliseconds: 362400 },
              artists: { items: [{ profile: { name: 'Arijit Singh' }, uri: 'spotify:artist:4YRxDV8wJFPHPTeXepOstw' }] },
              albumOfTrack: {
                uri: 'spotify:album:2e7HNQJ0BcMoqwsVDwDhK8',
                coverArt: { sources: [{ width: 640, url: 'https://i.scdn.co/image/gehra.jpg' }] },
              },
            },
          },
        ],
      },
      albums: {
        items: [
          {
            releases: {
              items: [
                {
                  id: '5Er818ARb7me75pPmqlhMK',
                  name: 'Happy Vibes',
                  date: { year: 2026 },
                  coverArt: { sources: [{ width: 640, url: 'https://i.scdn.co/image/happy.jpg' }] },
                },
              ],
            },
          },
        ],
      },
    },
  });

  assert.ok(artist);
  assert.equal(artist.id, '4YRxDV8wJFPHPTeXepOstw');
  assert.equal(artist.avatarUrl, 'https://i.scdn.co/image/ab6761610000e5ebadfb0b2df04b77e43b5f7375');
  assert.equal(artist.monthlyListeners, '53.8M monthly listeners');
  assert.equal(artist.bio, 'Indian playback singer & composer.');
  assert.equal(artist.topTracks.length, 1);
  assert.equal(artist.albums.length, 1);
  assert.equal(formatSpotifyNumber(845200), '845.2K monthly listeners');
});

test('normalizeSpotifyPathfinderAlbum and normalizeSpotifyPathfinderPlaylist extract tracks and covers', () => {
  const album = normalizeSpotifyPathfinderAlbum({
    uri: 'spotify:album:4yP0hdKOZPNshxUOjY0cZj',
    name: 'After Hours',
    date: { isoString: '2020-03-20T00:00:00Z' },
    artists: { items: [{ profile: { name: 'The Weeknd' }, uri: 'spotify:artist:1Xyo4u8uXC1ZmMpatF05PJ' }] },
    coverArt: { sources: [{ width: 640, url: 'https://i.scdn.co/image/afterhours.jpg' }] },
    tracksV2: {
      items: [
        {
          track: {
            uri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
            name: 'Blinding Lights',
            duration: { totalMilliseconds: 200040 },
            artists: { items: [{ profile: { name: 'The Weeknd' } }] },
          },
        },
      ],
    },
  });

  assert.ok(album);
  assert.equal(album.year, 2020);
  assert.equal(album.tracks[0].coverUrl, 'https://i.scdn.co/image/afterhours.jpg');

  const playlist = normalizeSpotifyPathfinderPlaylist({
    uri: 'spotify:playlist:37i9dQZF1DX0XUfTFmNBRM',
    name: 'Hot Hits Hindi',
    description: 'Hottest Hindi music &amp; more',
    ownerV2: { data: { name: 'Spotify' } },
    images: { items: [{ sources: [{ url: 'https://i.scdn.co/image/hothits.jpg' }] }] },
    content: {
      items: [
        {
          itemV2: {
            data: {
              uri: 'spotify:track:tr1',
              name: 'Song A',
              duration: { totalMilliseconds: 180000 },
              artists: { items: [{ profile: { name: 'Artist A' } }] },
              albumOfTrack: { coverArt: { sources: [{ width: 300, url: 'https://i.scdn.co/image/tr1.jpg' }] } },
            },
          },
        },
      ],
    },
  });

  assert.ok(playlist);
  assert.equal(playlist.owner, 'Spotify');
  assert.equal(playlist.description, 'Hottest Hindi music & more');
  assert.equal(playlist.tracks.length, 1);
});

test('normalizeSpotifyEmbedEntity parses __NEXT_DATA__ entity with preview audio and visualIdentity images', () => {
  const embed = normalizeSpotifyEmbedEntity({
    type: 'artist',
    id: '4YRxDV8wJFPHPTeXepOstw',
    name: 'Arijit Singh',
    visualIdentity: {
      image: [
        { maxWidth: 640, url: 'https://image-cdn-ak.spotifycdn.com/image/arijit640.jpg' },
      ],
    },
    trackList: [
      {
        uri: 'spotify:track:5MCbGWnNLLjoHpbDO3BOgi',
        title: 'Gehra Hua',
        subtitle: 'Shashwat Sachdev, Arijit Singh',
        duration: 362400,
        audioPreview: { url: 'https://p.scdn.co/mp3-preview/9c8000' },
      },
    ],
  });

  assert.ok(embed);
  assert.equal(embed.coverUrl, 'https://image-cdn-ak.spotifycdn.com/image/arijit640.jpg');
  assert.equal(embed.tracks.length, 1);
  assert.equal(embed.tracks[0].fallbackStreamUrl, 'https://p.scdn.co/mp3-preview/9c8000');
});

test('deriveTotpKey and generateTotp produce deterministic 6-digit OTP', () => {
  const key = deriveTotpKey(',7/*F("rLJ2oxaKL^f+E1xvP@N');
  const code1 = generateTotp(key, 1700000000000);
  const code2 = generateTotp(key, 1700000000000);
  assert.equal(code1.length, 6);
  assert.match(code1, /^\d{6}$/);
  assert.equal(code1, code2);
});
