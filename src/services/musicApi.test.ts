import test from 'node:test';
import assert from 'node:assert/strict';
import {
  API_BASE_URL,
  HOME_SEED_QUERIES,
  PODCAST_SEED_QUERIES,
  buildTrackThumbnailUrl,
  buildTrackStreamUrl,
  extractThumbnailUrl,
  normalizeTrack,
  normalizeArtist,
  normalizeAlbum,
  normalizePlaylist,
  findActiveLyricIndex,
  interleaveArrays,
  selectPrimaryArtist,
  selectPrimaryPlaylist,
  dedupeById,
  mergeUniqueTracks,
  scorePodcastEpisode,
  isPodcastShowArtist,
  isPodcastPlaylist,
} from './musicApi';

test('buildTrackThumbnailUrl and buildTrackStreamUrl construct exact v1 endpoints', () => {
  assert.equal(
    buildTrackThumbnailUrl('trk-TcDP-KUl'),
    `${API_BASE_URL}/track/trk-TcDP-KUl/thumbnail`
  );
  assert.equal(
    buildTrackStreamUrl('lossless-154008224859688960'),
    `${API_BASE_URL}/track/lossless-154008224859688960/stream`
  );
});

test('extractThumbnailUrl handles string, endpoint object, and fallback', () => {
  assert.equal(
    extractThumbnailUrl('https://cdn.example.com/art.jpg'),
    'https://cdn.example.com/art.jpg'
  );
  assert.equal(
    extractThumbnailUrl({
      url: 'https://cdn.example.com/art.jpg',
      endpoint: 'https://headphonix2.vercel.app/api/v1/track/abc/thumbnail',
    }),
    'https://headphonix2.vercel.app/api/v1/track/abc/thumbnail'
  );
  assert.equal(
    extractThumbnailUrl(undefined, 'abc'),
    'https://headphonix2.vercel.app/api/v1/track/abc/thumbnail'
  );
});

test('normalizeTrack maps API payload into Track with thumbnail and stream endpoints', () => {
  const track = normalizeTrack({
    id: 'trk-TcDP-KUl',
    title: 'Starboy',
    artist: 'The Weeknd',
    artistId: 'art-615155',
    album: 'The Highlights',
    albumId: 'alb-25118096',
    duration: 230,
    releaseYear: 2021,
    quality: '320 kbps AAC',
    thumbnail: {
      url: 'https://c.saavncdn.com/396/starboy.jpg',
      endpoint: 'https://headphonix2.vercel.app/api/v1/track/trk-TcDP-KUl/thumbnail',
    },
    streamUrl: 'https://aac.saavncdn.com/396/starboy.mp4',
    endpoints: {
      stream: 'https://headphonix2.vercel.app/api/v1/track/trk-TcDP-KUl/stream',
      thumbnail: 'https://headphonix2.vercel.app/api/v1/track/trk-TcDP-KUl/thumbnail',
    },
    lyrics: [
      { timeSec: 5.5, text: 'Line 1' },
      { timeSec: 12.0, text: 'Line 2' },
    ],
  });

  assert.equal(track.id, 'trk-TcDP-KUl');
  assert.equal(track.coverUrl, 'https://headphonix2.vercel.app/api/v1/track/trk-TcDP-KUl/thumbnail');
  assert.equal(track.fallbackCoverUrl, 'https://c.saavncdn.com/396/starboy.jpg');
  assert.equal(track.streamUrl, 'https://headphonix2.vercel.app/api/v1/track/trk-TcDP-KUl/stream');
  assert.equal(track.fallbackStreamUrl, 'https://aac.saavncdn.com/396/starboy.mp4');
  assert.equal(track.syncedLyrics?.length, 2);
  assert.deepEqual(track.lyrics, ['Line 1', 'Line 2']);
});

test('normalizeArtist, normalizeAlbum, and normalizePlaylist normalize nested arrays', () => {
  const artist = normalizeArtist({
    id: 'art-1',
    name: 'The Weeknd',
    verified: true,
    monthlyListeners: '105M',
    thumbnail: { url: 'https://cdn.example.com/weeknd.jpg' },
    topTracks: [{ id: 't1', title: 'Blinding Lights', duration: 200 }],
  });
  assert.equal(artist.topTracks.length, 1);
  assert.equal(artist.avatarUrl, 'https://cdn.example.com/weeknd.jpg');

  const album = normalizeAlbum({
    id: 'alb-1',
    title: 'After Hours',
    artist: 'The Weeknd',
    releaseYear: 2020,
    thumbnail: 'https://cdn.example.com/ah.jpg',
    tracks: [{ id: 't1', title: 'Alone Again', duration: 250 }],
  });
  assert.equal(album.year, 2020);
  assert.equal(album.tracks[0].coverUrl, `${API_BASE_URL}/track/t1/thumbnail`);

  const playlist = normalizePlaylist({
    id: 'pl-1',
    title: 'This Is The Weeknd',
    curator: 'Aura Editorial',
    trackCount: 20,
    thumbnail: { url: 'https://cdn.example.com/pl.jpg' },
  });
  assert.equal(playlist.owner, 'Aura Editorial');
  assert.equal(playlist.followers, '20 tracks');
});

test('findActiveLyricIndex resolves both syncedLyrics and fallback lyrics', () => {
  const syncedTrack = {
    duration: 100,
    syncedLyrics: [
      { timeSec: 5, text: 'First' },
      { timeSec: 15, text: 'Second' },
      { timeSec: 30, text: 'Third' },
    ],
  };
  assert.equal(findActiveLyricIndex(syncedTrack, 2), 0);
  assert.equal(findActiveLyricIndex(syncedTrack, 16), 1);
  assert.equal(findActiveLyricIndex(syncedTrack, 35), 2);

  const plainTrack = {
    duration: 100,
    lyrics: ['A', 'B', 'C', 'D'],
  };
  assert.equal(findActiveLyricIndex(plainTrack, 10), 0);
  assert.equal(findActiveLyricIndex(plainTrack, 55), 2);
});

test('interleaveArrays alternates elements across buckets for feed diversity', () => {
  const interleaved = interleaveArrays([
    ['w1', 'w2', 'w3'],
    ['b1', 'b2'],
    ['t1'],
  ]);
  assert.deepEqual(interleaved, ['w1', 'b1', 't1', 'w2', 'b2', 'w3']);
});

test('selectPrimaryArtist filters out tribute/impostor artists and generic avatars', () => {
  const tribute = normalizeArtist({
    id: 'art-fake',
    name: 'Taylor Swift Piano Covers',
    followers: 500,
    thumbnail: { url: 'https://yt3.googleusercontent.com/fake.jpg' },
  });
  const fanClub = normalizeArtist({
    id: 'art-fan',
    name: 'Arjit Singh Ka Fan',
    followers: 22,
    thumbnail: { url: 'https://yt3.googleusercontent.com/fan.jpg' },
  });
  const silhouette = normalizeArtist({
    id: 'art-sil',
    name: 'Taylor Swift',
    followers: 100,
    thumbnail: { url: 'https://www.gstatic.com/youtube/media/ytm/images/artist_avatar@1200.png' },
  });
  const real = normalizeArtist({
    id: 'art-real',
    name: 'Taylor Swift',
    followers: 408000000,
    thumbnail: { url: 'https://c.saavncdn.com/artists/Taylor_Swift.jpg' },
  });

  const picked = selectPrimaryArtist([tribute, fanClub, silhouette, real], 'Taylor Swift');
  assert.equal(picked?.id, 'art-real');
});

test('HOME_SEED_QUERIES prominently includes Indian creators', () => {
  assert.ok(HOME_SEED_QUERIES.includes('Arijit Singh'));
  assert.ok(HOME_SEED_QUERIES.includes('Diljit Dosanjh'));
  assert.ok(HOME_SEED_QUERIES.includes('Shreya Ghoshal'));
  assert.ok(HOME_SEED_QUERIES.includes('A.R. Rahman'));
});

test('selectPrimaryPlaylist prefers editorial playlists over radio playlists', () => {
  const radio = normalizePlaylist({
    id: 'pl-radio',
    title: 'The Weeknd Radio',
    curator: 'Aura Radio',
    thumbnail: { url: 'https://yt3.googleusercontent.com/radio.jpg' },
  });
  const editorial = normalizePlaylist({
    id: 'pl-editorial',
    title: 'This Is The Weeknd',
    curator: 'Aura Editorial',
    thumbnail: { url: 'https://c.saavncdn.com/artists/Weeknd.jpg' },
  });

  const picked = selectPrimaryPlaylist([radio, editorial]);
  assert.equal(picked?.id, 'pl-editorial');
});

test('dedupeById removes duplicate playlist IDs while preserving first entry', () => {
  const pl1 = normalizePlaylist({
    id: 'pl-VLRDCLAK5uy_dup',
    title: 'This Is The Weeknd',
    curator: 'Aura Editorial',
  });
  const pl2 = normalizePlaylist({
    id: 'pl-VLRDCLAK5uy_dup',
    title: 'Presenting The Weeknd',
    curator: 'Aura Music',
  });
  const pl3 = normalizePlaylist({
    id: 'pl-other',
    title: 'Hits of 2016',
    curator: 'Aura Music',
  });

  const deduped = dedupeById([pl1, pl2, pl3]);
  assert.equal(deduped.length, 2);
  assert.equal(deduped[0].title, 'This Is The Weeknd');
  assert.equal(deduped[1].id, 'pl-other');
});

test('mergeUniqueTracks appends extra related tracks without duplicates', () => {
  const t1 = normalizeTrack({ id: 't-1', title: 'Song One' });
  const t2 = normalizeTrack({ id: 't-2', title: 'Song Two' });
  const t3 = normalizeTrack({ id: 't-3', title: 'Song Three' });

  const merged = mergeUniqueTracks([t1, t2], [t2, t3]);
  assert.deepEqual(
    merged.map((t) => t.id),
    ['t-1', 't-2', 't-3']
  );
});

test('scorePodcastEpisode prioritizes real episodes, Hindi stories, and speeches over random songs', () => {
  const realEpisode = normalizeTrack({
    id: 'ep-1',
    title: '10 Minute Non-Sleep Deep Rest (NSDR)',
    artist: 'Dr. Andrew Huberman',
    duration: 638,
    thumbnail: { url: 'https://c.saavncdn.com/nsdr.jpg' },
  });
  const hindiStory = normalizeTrack({
    id: 'ep-2',
    title: '2. सुनसान सड़क और परछाई',
    artist: 'Apurva Krishna',
    duration: 403,
    thumbnail: { url: 'https://c.saavncdn.com/story.jpg' },
  });
  const genericSong = normalizeTrack({
    id: 'trk-song',
    title: 'Podcast',
    artist: 'Bali, Enzo',
    duration: 168,
    thumbnail: { url: 'https://c.saavncdn.com/song.jpg' },
  });

  assert.ok(scorePodcastEpisode(realEpisode) >= 250);
  assert.ok(scorePodcastEpisode(hindiStory) >= 250);
  assert.ok(scorePodcastEpisode(genericSong) < 250);
  assert.ok(PODCAST_SEED_QUERIES.includes('bhagavad gita hindi'));
});

test('isPodcastShowArtist and isPodcastPlaylist filter out radio/music noise', () => {
  const realShow = normalizeArtist({
    id: 'art-pod',
    name: 'The Sacred Life Podcast',
    thumbnail: { url: 'https://c.saavncdn.com/pod.jpg' },
  });
  const excludedShow = normalizeArtist({
    id: 'art-inst',
    name: 'Fearless Motivation Instrumentals',
    thumbnail: { url: 'https://c.saavncdn.com/inst.jpg' },
  });
  assert.equal(isPodcastShowArtist(realShow), true);
  assert.equal(isPodcastShowArtist(excludedShow), false);

  const podPl = normalizePlaylist({
    id: 'pl-VL123',
    title: 'True Crime Podcasts',
    curator: 'Donna Forbes',
    thumbnail: { url: 'https://yt3.googleusercontent.com/tc.jpg' },
  });
  const radioPl = normalizePlaylist({
    id: 'pl-radio-123',
    title: 'True Crime Podcast Radio',
    curator: 'Aura Radio',
    thumbnail: { url: 'https://yt3.googleusercontent.com/tcr.jpg' },
  });
  assert.equal(isPodcastPlaylist(podPl), true);
  assert.equal(isPodcastPlaylist(radioPl), false);
});
