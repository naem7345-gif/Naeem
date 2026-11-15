/**
 * Spotify Desktop Web Player Replica — Connected to Headphonix v1 Music API
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeFeed } from './components/HomeFeed';
import { DetailView } from './components/DetailView';
import { SearchView } from './components/SearchView';
import { PlayerControls } from './components/PlayerControls';
import { NowPlayingDrawer } from './components/NowPlayingDrawer';
import { LyricsModal } from './components/LyricsModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { FullPlayerCard } from './components/FullPlayerCard';
import { Track, Playlist, Album, Artist, ViewState } from './types/spotify';
import {
  getHomeCatalog,
  getPodcastCatalog,
  getTrackDetails,
  getArtistDetails,
  getAlbumDetails,
  getPlaylistDetails,
  DEFAULT_COVER_SVG,
} from './services/musicApi';
import { soundEngine } from './services/soundEngine';
import {
  audioEnhancer,
  SoundPresetId,
  getNextSoundPreset,
} from './services/audioEnhancer';
import {
  getNextTrackIndex,
  getPreviousTrackIndex,
  generateShuffleIndices,
} from './utils/audioUtils';

export default function App() {
  // Navigation & View State
  const [viewState, setViewState] = useState<ViewState>({
    type: 'home',
    filterTab: 'all',
  });

  // User Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Live API Catalog State
  const [catalogTracks, setCatalogTracks] = useState<Track[]>([]);
  const [freshTracks, setFreshTracks] = useState<Track[]>([]);
  const [catalogArtists, setCatalogArtists] = useState<Artist[]>([]);
  const [catalogAlbums, setCatalogAlbums] = useState<Album[]>([]);
  const [apiPlaylists, setApiPlaylists] = useState<Playlist[]>([]);
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Live Podcast Catalog State
  const [podcastEpisodes, setPodcastEpisodes] = useState<Track[]>([]);
  const [podcastShows, setPodcastShows] = useState<Artist[]>([]);
  const [podcastPlaylists, setPodcastPlaylists] = useState<Playlist[]>([]);
  const [isPodcastsLoading, setIsPodcastsLoading] = useState<boolean>(true);
  const [podcastsError, setPodcastsError] = useState<string | null>(null);

  // Liked Tracks State
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [likedTrackMap, setLikedTrackMap] = useState<Record<string, Track>>({});

  // Active Playback State
  const [currentTrackList, setCurrentTrackList] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [shuffleQueue, setShuffleQueue] = useState<number[]>([]);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [usingSynthFallback, setUsingSynthFallback] = useState<boolean>(false);

  // UI Panels
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [soundPreset, setSoundPreset] = useState<SoundPresetId>('studio');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triedFallbackRef = useRef<boolean>(false);

  const currentTrack = currentTrackList[currentTrackIndex] || catalogTracks[0] || null;

  // Load initial catalog from Headphonix API
  const loadCatalog = useCallback(async () => {
    setIsCatalogLoading(true);
    setCatalogError(null);
    try {
      const data = await getHomeCatalog();
      setCatalogTracks(data.tracks);
      setFreshTracks(data.freshTracks || []);
      setCatalogArtists(data.artists);
      setCatalogAlbums(data.albums);
      setApiPlaylists(data.playlists);

      if (data.tracks.length > 0) {
        setCurrentTrackList((prev) => (prev.length === 0 ? data.tracks : prev));
        setLikedTrackIds((prev) => {
          if (prev.size > 0) return prev;
          const initialIds = data.tracks.slice(0, 4).map((t) => t.id);
          return new Set(initialIds);
        });
        setLikedTrackMap((prev) => {
          if (Object.keys(prev).length > 0) return prev;
          const map: Record<string, Track> = {};
          for (const t of data.tracks.slice(0, 4)) {
            map[t.id] = t;
          }
          return map;
        });
      }
    } catch (err) {
      setCatalogError(
        err instanceof Error ? err.message : 'Unable to connect to Headphonix API.'
      );
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  const loadPodcasts = useCallback(async () => {
    setIsPodcastsLoading(true);
    setPodcastsError(null);
    try {
      const data = await getPodcastCatalog();
      setPodcastEpisodes(data.episodes);
      setPodcastShows(data.shows);
      setPodcastPlaylists(data.playlists);
    } catch (err) {
      setPodcastsError(
        err instanceof Error ? err.message : 'Unable to fetch podcasts from Headphonix API.'
      );
    } finally {
      setIsPodcastsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
    loadPodcasts();
  }, [loadCatalog, loadPodcasts]);

  // Build Liked Songs playlist dynamically
  const likedPlaylist: Playlist = useMemo(() => {
    const tracks = Array.from(likedTrackIds)
      .map(
        (id) =>
          likedTrackMap[id] ||
          catalogTracks.find((t) => t.id === id) ||
          freshTracks.find((t) => t.id === id) ||
          podcastEpisodes.find((t) => t.id === id)
      )
      .filter((t): t is Track => Boolean(t));

    return {
      id: 'playlist-liked',
      title: 'Liked Songs',
      description: 'Your personal collection of saved favorite tracks.',
      coverUrl: tracks[0]?.coverUrl || DEFAULT_COVER_SVG,
      fallbackCoverUrl: tracks[0]?.fallbackCoverUrl,
      owner: 'Alex',
      followers: `${tracks.length} tracks`,
      tracks,
      isPinned: true,
      gradient: 'from-[#450af5] to-[#8e8ee5]',
    };
  }, [likedTrackIds, likedTrackMap, catalogTracks, freshTracks, podcastEpisodes]);

  const allPlaylists = useMemo(
    () => [likedPlaylist, ...customPlaylists, ...apiPlaylists, ...podcastPlaylists],
    [likedPlaylist, customPlaylists, apiPlaylists, podcastPlaylists]
  );

  const allArtists = useMemo(
    () => [...catalogArtists, ...podcastShows],
    [catalogArtists, podcastShows]
  );

  // Enrich active track with synced lyrics & DNA details from /track/:id
  useEffect(() => {
    let active = true;
    if (!currentTrack?.id || currentTrack.syncedLyrics) return;

    getTrackDetails(currentTrack.id).then((details) => {
      if (!active || !details) return;
      setCurrentTrackList((prev) =>
        prev.map((t) =>
          t.id === details.id
            ? {
                ...t,
                syncedLyrics: details.syncedLyrics,
                lyrics: details.lyrics || t.lyrics,
                dnaSummary: details.dnaSummary || t.dnaSummary,
                streamUrl: details.streamUrl || t.streamUrl,
                fallbackStreamUrl: details.fallbackStreamUrl || t.fallbackStreamUrl,
                duration: details.duration || t.duration,
              }
            : t
        )
      );
    });

    return () => {
      active = false;
    };
  }, [currentTrack?.id]);

  // Manage real HTML5 <audio> element lifecycle + CORS for Web Audio DSP
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      soundEngine.stop();
    };
  }, []);

  // Load new track source when track ID changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    triedFallbackRef.current = false;
    setUsingSynthFallback(false);
    soundEngine.stop();

    const src = currentTrack.streamUrl || currentTrack.fallbackStreamUrl || '';
    if (src) {
      audio.src = src;
      audio.volume = volume;
      if (isPlaying) {
        audioEnhancer.attachAudioElement(audio);
        audioEnhancer.setPreset(soundPreset);
        audio.play().catch(() => {
          // If blocked or failed, try fallback or synth
          if (!triedFallbackRef.current && currentTrack.fallbackStreamUrl && src !== currentTrack.fallbackStreamUrl) {
            triedFallbackRef.current = true;
            audio.src = currentTrack.fallbackStreamUrl;
            audio.play().catch(() => setUsingSynthFallback(true));
          } else {
            setUsingSynthFallback(true);
          }
        });
      }
    } else {
      setUsingSynthFallback(true);
    }
  }, [currentTrack?.id]);

  // Sync play/pause state with audio element or synth fallback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (usingSynthFallback) {
      if (isPlaying) {
        soundEngine.playTrack(currentTrack.id);
      } else {
        soundEngine.stop();
      }
      return;
    }

    if (isPlaying) {
      audioEnhancer.attachAudioElement(audio);
      audioEnhancer.setPreset(soundPreset);
      if (audio.paused && audio.src) {
        audio.play().catch(() => {
          setUsingSynthFallback(true);
        });
      }
    } else {
      audio.pause();
      soundEngine.stop();
    }
  }, [isPlaying, usingSynthFallback, currentTrack?.id]);

  // Sync audio enhancer preset in real time
  useEffect(() => {
    audioEnhancer.setPreset(soundPreset);
  }, [soundPreset]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    soundEngine.setVolume(volume);
  }, [volume]);

  const handleNext = useCallback(() => {
    if (currentTrackList.length === 0) return;
    const nextIdx = getNextTrackIndex(
      currentTrackIndex,
      currentTrackList.length,
      isShuffle,
      shuffleQueue
    );
    setCurrentTrackIndex(nextIdx);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [currentTrackIndex, currentTrackList.length, isShuffle, shuffleQueue]);

  const handlePrevious = useCallback(() => {
    if (currentTrackList.length === 0) return;
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      setCurrentTime(0);
      return;
    }
    const prevIdx = getPreviousTrackIndex(
      currentTrackIndex,
      currentTrackList.length,
      isShuffle,
      shuffleQueue
    );
    setCurrentTrackIndex(prevIdx);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [currentTime, currentTrackIndex, currentTrackList.length, isShuffle, shuffleQueue]);

  // Attach HTMLAudio events (timeupdate, ended, error)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!usingSynthFallback) {
        setCurrentTime(Math.floor(audio.currentTime));
      }
    };

    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        setCurrentTime(0);
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    const onError = () => {
      if (!triedFallbackRef.current && currentTrack?.fallbackStreamUrl && audio.src !== currentTrack.fallbackStreamUrl) {
        triedFallbackRef.current = true;
        audio.src = currentTrack.fallbackStreamUrl;
        if (isPlaying) {
          audio.play().catch(() => setUsingSynthFallback(true));
        }
      } else {
        setUsingSynthFallback(true);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [repeatMode, handleNext, currentTrack?.fallbackStreamUrl, isPlaying, usingSynthFallback]);

  // Timer fallback only if synth fallback is active
  useEffect(() => {
    if (!usingSynthFallback || !isPlaying || !currentTrack) return;
    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= currentTrack.duration) {
          if (repeatMode === 'one') return 0;
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [usingSynthFallback, isPlaying, currentTrack, repeatMode, handleNext]);

  const handlePlayTrack = (track: Track, newCollection?: Track[]) => {
    const listToUse = newCollection && newCollection.length > 0 ? newCollection : currentTrackList;
    const index = listToUse.findIndex((t) => t.id === track.id);
    if (index !== -1) {
      setCurrentTrackList(listToUse);
      setCurrentTrackIndex(index);
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setCurrentTrackList([track, ...listToUse]);
      setCurrentTrackIndex(0);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const handlePlayCollection = (collectionTracks: Track[]) => {
    if (collectionTracks.length === 0) return;
    const isAlreadyPlayingCollection =
      isPlaying && collectionTracks.some((t) => t.id === currentTrack?.id);
    if (isAlreadyPlayingCollection) {
      setIsPlaying(false);
      return;
    }
    setCurrentTrackList(collectionTracks);
    setCurrentTrackIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      handlePlayCollection(playlist.tracks);
      return;
    }
    const details = await getPlaylistDetails(playlist.id);
    if (details && details.tracks.length > 0) {
      handlePlayCollection(details.tracks);
    }
  };

  const handlePlayAlbum = async (album: Album) => {
    if (album.tracks.length > 0) {
      handlePlayCollection(album.tracks);
      return;
    }
    const details = await getAlbumDetails(album.id);
    if (details && details.tracks.length > 0) {
      handlePlayCollection(details.tracks);
    }
  };

  const handlePlayArtist = async (artist: Artist) => {
    if (artist.topTracks.length > 0) {
      handlePlayCollection(artist.topTracks);
      return;
    }
    const details = await getArtistDetails(artist.id);
    if (details && details.topTracks.length > 0) {
      handlePlayCollection(details.topTracks);
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack) return;
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (audioRef.current && !usingSynthFallback) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleToggleShuffle = () => {
    const nextState = !isShuffle;
    setIsShuffle(nextState);
    if (nextState) {
      setShuffleQueue(
        generateShuffleIndices(currentTrackList.length, currentTrackIndex)
      );
    }
  };

  const handleCycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const handleToggleLike = (trackId: string) => {
    const trackObj =
      currentTrackList.find((t) => t.id === trackId) ||
      catalogTracks.find((t) => t.id === trackId) ||
      freshTracks.find((t) => t.id === trackId) ||
      podcastEpisodes.find((t) => t.id === trackId) ||
      currentTrack;

    setLikedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });

    if (trackObj && trackObj.id === trackId) {
      setLikedTrackMap((prev) => ({
        ...prev,
        [trackId]: trackObj,
      }));
    }
  };

  const handleCreatePlaylist = (title: string, description: string) => {
    const seedTracks = catalogTracks.slice(0, 3);
    const newPlaylist: Playlist = {
      id: `playlist-custom-${Date.now()}`,
      title,
      description: description || 'Playlist created by you',
      coverUrl: seedTracks[0]?.coverUrl || DEFAULT_COVER_SVG,
      fallbackCoverUrl: seedTracks[0]?.fallbackCoverUrl,
      owner: 'Alex',
      tracks: seedTracks,
      isCustom: true,
      gradient: 'from-[#3a2038] to-[#121212]',
    };
    setCustomPlaylists((prev) => [newPlaylist, ...prev]);
    setViewState({ type: 'playlist', id: newPlaylist.id });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        handleNext();
      } else if (e.code === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        handlePrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]);

  const nextTrackIndex =
    currentTrackList.length > 0
      ? (currentTrackIndex + 1) % currentTrackList.length
      : 0;
  const nextTrack = currentTrackList[nextTrackIndex] || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#05070a] text-white font-sans relative">
      {/* Subtle Ambient Glows for Glassmorphism Refraction */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full bg-[#1ed760]/12 blur-[140px]" />
        <div className="absolute top-1/3 right-[-120px] w-[520px] h-[520px] rounded-full bg-[#450af5]/16 blur-[150px]" />
        <div className="absolute -bottom-36 left-1/3 w-[480px] h-[480px] rounded-full bg-[#0d4f8b]/14 blur-[140px]" />
      </div>

      {/* Top Header */}
      <Header
        viewState={viewState}
        setViewState={setViewState}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex gap-2.5 px-2.5 pb-2.5 overflow-hidden relative z-10">
        {/* Left Sidebar */}
        <Sidebar
          playlists={allPlaylists}
          artists={allArtists}
          podcastPlaylists={podcastPlaylists}
          podcastShows={podcastShows}
          likedCount={likedTrackIds.size}
          viewState={viewState}
          setViewState={setViewState}
          onCreatePlaylist={() => setIsCreateModalOpen(true)}
          isLoggedIn={isLoggedIn}
        />

        {/* Center Content View Area */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden rounded-3xl">
          {viewState.type === 'home' && (
            <HomeFeed
              tracks={catalogTracks}
              freshTracks={freshTracks}
              artists={catalogArtists}
              albums={catalogAlbums}
              playlists={apiPlaylists}
              likedPlaylist={likedPlaylist}
              podcastEpisodes={podcastEpisodes}
              podcastShows={podcastShows}
              podcastPlaylists={podcastPlaylists}
              isLoading={isCatalogLoading}
              isPodcastsLoading={isPodcastsLoading}
              error={catalogError}
              podcastsError={podcastsError}
              onRetry={loadCatalog}
              onRetryPodcasts={loadPodcasts}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={(track, collection) =>
                handlePlayTrack(track, collection || catalogTracks)
              }
              onPlayPlaylist={handlePlayPlaylist}
              onPlayAlbum={handlePlayAlbum}
              onPlayArtist={handlePlayArtist}
              setViewState={setViewState}
              viewFilterTab={viewState.filterTab}
            />
          )}

          {['playlist', 'album', 'artist'].includes(viewState.type) && (
            <DetailView
              viewState={viewState}
              playlists={allPlaylists}
              albums={catalogAlbums}
              artists={allArtists}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={(track, collection) => handlePlayTrack(track, collection)}
              onPlayCollection={handlePlayCollection}
              likedTrackIds={likedTrackIds}
              onToggleTrackLike={handleToggleLike}
              setViewState={setViewState}
            />
          )}

          {viewState.type === 'search' && (
            <SearchView
              viewState={viewState}
              setViewState={setViewState}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onPlayTrack={(track, collection) => handlePlayTrack(track, collection)}
              onPlayArtist={handlePlayArtist}
              onPlayAlbum={handlePlayAlbum}
              onPlayPlaylist={handlePlayPlaylist}
            />
          )}

          {/* Synchronized Lyrics Overlay */}
          {isLyricsOpen && (
            <LyricsModal
              currentTrack={currentTrack}
              currentTime={currentTime}
              onSeek={handleSeek}
              onClose={() => setIsLyricsOpen(false)}
            />
          )}
        </main>

        {/* Right Now Playing / Queue Drawer */}
        {isRightDrawerOpen && currentTrack && (
          <NowPlayingDrawer
            currentTrack={currentTrack}
            onClose={() => setIsRightDrawerOpen(false)}
            isLiked={likedTrackIds.has(currentTrack.id)}
            onToggleLike={() => handleToggleLike(currentTrack.id)}
            nextTrack={nextTrack}
            onPlayNext={handleNext}
            onPlayTrack={(track) => handlePlayTrack(track)}
            onOpenLyrics={() => setIsLyricsOpen(true)}
          />
        )}
      </div>

      {/* Persistent Bottom Playback Controls Bar */}
      <PlayerControls
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentTime={currentTime}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={setVolume}
        isShuffle={isShuffle}
        onToggleShuffle={handleToggleShuffle}
        repeatMode={repeatMode}
        onCycleRepeat={handleCycleRepeat}
        isLiked={currentTrack ? likedTrackIds.has(currentTrack.id) : false}
        onToggleLike={() => currentTrack && handleToggleLike(currentTrack.id)}
        isRightDrawerOpen={isRightDrawerOpen}
        onToggleRightDrawer={() => setIsRightDrawerOpen((prev) => !prev)}
        isLyricsOpen={isLyricsOpen}
        onToggleLyrics={() => setIsLyricsOpen((prev) => !prev)}
        onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
        soundPreset={soundPreset}
        onCycleSoundPreset={() => setSoundPreset((prev) => getNextSoundPreset(prev))}
        onTrackTitleClick={() => {
          if (currentTrack?.albumId) {
            setViewState({ type: 'album', id: currentTrack.albumId });
          }
        }}
        onArtistClick={() => {
          if (currentTrack?.artistId) {
            setViewState({ type: 'artist', id: currentTrack.artistId });
          }
        }}
      />

      {/* Medium Bottom-Folded Player Card */}
      {currentTrack && (
        <FullPlayerCard
          isOpen={isFullPlayerOpen}
          currentTrack={currentTrack}
          trackList={currentTrackList}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSelectTrack={(track) => handlePlayTrack(track, currentTrackList)}
          currentTime={currentTime}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={setVolume}
          isShuffle={isShuffle}
          onToggleShuffle={handleToggleShuffle}
          repeatMode={repeatMode}
          onCycleRepeat={handleCycleRepeat}
          isLiked={likedTrackIds.has(currentTrack.id)}
          onToggleLike={() => handleToggleLike(currentTrack.id)}
          soundPreset={soundPreset}
          onSelectSoundPreset={setSoundPreset}
          onArtistClick={() => {
            if (currentTrack.artistId) {
              setViewState({ type: 'artist', id: currentTrack.artistId });
            }
          }}
          onAlbumClick={() => {
            if (currentTrack.albumId) {
              setViewState({ type: 'album', id: currentTrack.albumId });
            }
          }}
          onClose={() => setIsFullPlayerOpen(false)}
        />
      )}

      {/* Modal Dialog for Creating Playlist */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePlaylist}
      />
    </div>
  );
}
