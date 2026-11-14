import React, { useEffect } from 'react';
import { Play, Pause, Heart, Instagram, Twitter, Facebook, RefreshCw, Mic, Podcast } from 'lucide-react';
import { Track, Artist, Album, Playlist, ViewState } from '../types/spotify';
import { CoverArt } from './CoverArt';
import { formatTime } from '../utils/audioUtils';

interface HomeFeedProps {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  likedPlaylist: Playlist;
  podcastEpisodes: Track[];
  podcastShows: Artist[];
  podcastPlaylists: Playlist[];
  isLoading: boolean;
  isPodcastsLoading: boolean;
  error: string | null;
  podcastsError: string | null;
  onRetry: () => void;
  onRetryPodcasts: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, collection?: Track[]) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onPlayAlbum: (album: Album) => void;
  onPlayArtist: (artist: Artist) => void;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  viewFilterTab?: 'all' | 'music' | 'podcasts';
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  tracks,
  artists,
  albums,
  playlists,
  likedPlaylist,
  podcastEpisodes,
  podcastShows,
  podcastPlaylists,
  isLoading,
  isPodcastsLoading,
  error,
  podcastsError,
  onRetry,
  onRetryPodcasts,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayPlaylist,
  onPlayAlbum,
  onPlayArtist,
  setViewState,
  viewFilterTab,
}) => {
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'music' | 'podcasts'>(
    viewFilterTab || 'all'
  );

  useEffect(() => {
    if (viewFilterTab) {
      setActiveFilter(viewFilterTab);
    }
  }, [viewFilterTab]);

  const handleSelectFilter = (tab: 'all' | 'music' | 'podcasts') => {
    setActiveFilter(tab);
    setViewState((prev) => ({ ...prev, filterTab: tab }));
  };

  const quickItems: Array<{
    id: string;
    title: string;
    type: 'playlist' | 'album' | 'artist';
    coverUrl?: string;
    fallbackCoverUrl?: string;
    isLikedSongs?: boolean;
    data: Playlist | Album | Artist;
  }> = [
    {
      id: likedPlaylist.id,
      title: 'Liked Songs',
      type: 'playlist' as const,
      isLikedSongs: true,
      data: likedPlaylist,
    },
    ...playlists.slice(0, 3).map((pl) => ({
      id: pl.id,
      title: pl.title,
      type: 'playlist' as const,
      coverUrl: pl.coverUrl,
      fallbackCoverUrl: pl.fallbackCoverUrl,
      data: pl,
    })),
    ...albums.slice(0, 1).map((alb) => ({
      id: alb.id,
      title: alb.title,
      type: 'album' as const,
      coverUrl: alb.coverUrl,
      fallbackCoverUrl: alb.fallbackCoverUrl,
      data: alb,
    })),
    ...artists.slice(0, 1).map((art) => ({
      id: art.id,
      title: art.name,
      type: 'artist' as const,
      coverUrl: art.avatarUrl,
      fallbackCoverUrl: art.fallbackAvatarUrl,
      data: art,
    })),
  ].slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl relative no-scrollbar shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      {/* Dynamic Ambient Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#1e3a2f]/40 via-[#121824]/30 to-transparent pointer-events-none -z-0" />

      <div className="relative z-10 p-6 space-y-8">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleSelectFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer border ${
              activeFilter === 'all'
                ? 'bg-white text-black border-white'
                : 'bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.15]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleSelectFilter('music')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer border ${
              activeFilter === 'music'
                ? 'bg-white text-black border-white'
                : 'bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.15]'
            }`}
          >
            Music
          </button>
          <button
            onClick={() => handleSelectFilter('podcasts')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer border ${
              activeFilter === 'podcasts'
                ? 'bg-white text-black border-white'
                : 'bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.15]'
            }`}
          >
            Podcasts
          </button>
        </div>

        {/* Error state if catalog failed to load */}
        {error && tracks.length === 0 && (
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-bold text-base">Unable to load music catalog</h2>
              <p className="text-xs text-[#a7a7a7] mt-1">{error}</p>
            </div>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 bg-white text-black font-bold text-xs px-4 py-2 rounded-full hover:scale-105 transition-transform cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Quick Access 6-Grid */}
        {activeFilter !== 'podcasts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoading && quickItems.length <= 1
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center bg-white/[0.06] border border-white/10 rounded-2xl overflow-hidden h-16 animate-pulse"
                  >
                    <div className="w-16 h-16 bg-white/10 shrink-0" />
                    <div className="h-4 bg-white/10 rounded w-32 ml-3" />
                  </div>
                ))
              : quickItems.map((item) => {
                  const isItemPlaying =
                    isPlaying &&
                    ((item.type === 'playlist' &&
                      (item.data as Playlist).tracks.some((t) => t.id === currentTrack?.id)) ||
                      (item.type === 'album' &&
                        (item.data as Album).tracks.some((t) => t.id === currentTrack?.id)) ||
                      (item.type === 'artist' && currentTrack?.artistId === item.id));

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        if (item.type === 'playlist') {
                          setViewState({ type: 'playlist', id: item.id });
                        } else if (item.type === 'album') {
                          setViewState({ type: 'album', id: item.id });
                        } else if (item.type === 'artist') {
                          setViewState({ type: 'artist', id: item.id });
                        }
                      }}
                      className="group flex items-center bg-white/[0.07] hover:bg-white/[0.14] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.3)] transition-all cursor-pointer relative pr-4 p-1.5 gap-3"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-md">
                        {item.isLikedSongs ? (
                          <div className="w-full h-full bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center">
                            <Heart className="w-6 h-6 text-white fill-white" />
                          </div>
                        ) : (
                          <CoverArt
                            src={item.coverUrl}
                            fallbackSrc={item.fallbackCoverUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="font-bold text-sm text-white flex-1 truncate pr-1 group-hover:pr-11 transition-all">
                        {item.title}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.type === 'playlist') onPlayPlaylist(item.data as Playlist);
                          else if (item.type === 'album') onPlayAlbum(item.data as Album);
                          else if (item.type === 'artist') onPlayArtist(item.data as Artist);
                        }}
                        aria-label={`Play ${item.title}`}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer ${
                          isItemPlaying
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                        }`}
                      >
                        {isItemPlaying ? (
                          <Pause className="w-4 h-4 fill-current stroke-none" />
                        ) : (
                          <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                        )}
                      </button>
                    </div>
                  );
                })}
          </div>
        )}

        {/* Podcasts Dedicated View (when Podcasts filter pill is selected) */}
        {activeFilter === 'podcasts' && (
          <div className="space-y-8">
            {podcastsError &&
              podcastEpisodes.length === 0 &&
              podcastShows.length === 0 &&
              podcastPlaylists.length === 0 && (
                <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-white font-bold text-base">Unable to load podcasts</h2>
                    <p className="text-xs text-[#a7a7a7] mt-1">{podcastsError}</p>
                  </div>
                  <button
                    onClick={onRetryPodcasts}
                    className="flex items-center gap-2 bg-white text-black font-bold text-xs px-4 py-2 rounded-full hover:scale-105 transition-transform cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}

            {/* Podcast Episodes */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-5 h-5 text-[#1ed760]" />
                  <h2 className="text-2xl font-bold text-white">
                    Podcast Episodes & Audio Stories
                  </h2>
                </div>
                <button
                  onClick={() => setViewState({ type: 'search', searchQuery: 'podcast' })}
                  className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
                >
                  Search more
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {isPodcastsLoading && podcastEpisodes.length === 0
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.05] border border-white/10 animate-pulse"
                      >
                        <div className="w-16 h-16 rounded-xl bg-white/10 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-white/10 rounded w-3/4" />
                          <div className="h-3 bg-white/10 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                  : podcastEpisodes.map((episode) => {
                      const isThisPlaying = isPlaying && currentTrack?.id === episode.id;
                      return (
                        <div
                          key={episode.id}
                          onClick={() => onPlayTrack(episode, podcastEpisodes)}
                          className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] relative pr-14"
                        >
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-md">
                            <CoverArt
                              src={episode.coverUrl}
                              fallbackSrc={episode.fallbackCoverUrl}
                              alt={episode.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-1.5 py-0.5 rounded bg-[#1ed760]/15 border border-[#1ed760]/30 text-[10px] font-bold uppercase tracking-wider text-[#1ed760]">
                                Episode
                              </span>
                              <span className="text-[11px] text-[#a7a7a7] tabular-nums">
                                {formatTime(episode.duration)}
                              </span>
                            </div>
                            <h3
                              className={`font-bold text-sm truncate ${
                                isThisPlaying ? 'text-[#1ed760]' : 'text-white'
                              }`}
                            >
                              {episode.title}
                            </h3>
                            <p className="text-xs text-[#a7a7a7] truncate mt-0.5">
                              {episode.artist}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(episode, podcastEpisodes);
                            }}
                            aria-label={`Play ${episode.title}`}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer ${
                              isThisPlaying
                                ? 'opacity-100 scale-100'
                                : 'opacity-90 group-hover:opacity-100'
                            }`}
                          >
                            {isThisPlaying ? (
                              <Pause className="w-4 h-4 fill-current stroke-none" />
                            ) : (
                              <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                            )}
                          </button>
                        </div>
                      );
                    })}
              </div>
            </section>

            {/* Podcast Shows & Hosts */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Podcast className="w-5 h-5 text-[#1ed760]" />
                  <h2 className="text-2xl font-bold text-white">Podcast Shows & Creators</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {isPodcastsLoading && podcastShows.length === 0
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3"
                      >
                        <div className="aspect-square w-full bg-white/10 rounded-xl" />
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                      </div>
                    ))
                  : podcastShows.map((show) => {
                      const isShowPlaying = isPlaying && currentTrack?.artistId === show.id;
                      return (
                        <div
                          key={show.id}
                          onClick={() => setViewState({ type: 'artist', id: show.id })}
                          className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                        >
                          <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg">
                            <CoverArt
                              src={show.avatarUrl}
                              fallbackSrc={show.fallbackAvatarUrl}
                              alt={show.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayArtist(show);
                              }}
                              aria-label={`Play ${show.name}`}
                              className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer ${
                                isShowPlaying
                                  ? 'opacity-100 scale-100 translate-y-0'
                                  : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                              }`}
                            >
                              {isShowPlaying ? (
                                <Pause className="w-4 h-4 fill-current stroke-none" />
                              ) : (
                                <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                              )}
                            </button>
                          </div>
                          <h3 className="font-bold text-sm truncate text-white">{show.name}</h3>
                          <p className="text-xs text-[#a7a7a7] truncate mt-1">
                            Podcast Show • {show.monthlyListeners}
                          </p>
                        </div>
                      );
                    })}
              </div>
            </section>

            {/* Curated Podcast & Story Series */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Curated Podcast & Story Series
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {isPodcastsLoading && podcastPlaylists.length === 0
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3"
                      >
                        <div className="aspect-square w-full bg-white/10 rounded-xl" />
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                      </div>
                    ))
                  : podcastPlaylists.map((playlist) => {
                      const isPlPlaying =
                        isPlaying && playlist.tracks.some((t) => t.id === currentTrack?.id);
                      return (
                        <div
                          key={playlist.id}
                          onClick={() => setViewState({ type: 'playlist', id: playlist.id })}
                          className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                        >
                          <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-md">
                            <CoverArt
                              src={playlist.coverUrl}
                              fallbackSrc={playlist.fallbackCoverUrl}
                              alt={playlist.title}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayPlaylist(playlist);
                              }}
                              aria-label={`Play ${playlist.title}`}
                              className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer ${
                                isPlPlaying
                                  ? 'opacity-100 scale-100 translate-y-0'
                                  : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                              }`}
                            >
                              {isPlPlaying ? (
                                <Pause className="w-4 h-4 fill-current stroke-none" />
                              ) : (
                                <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                              )}
                            </button>
                          </div>
                          <h3 className="font-bold text-sm truncate text-white">
                            {playlist.title}
                          </h3>
                          <p className="text-xs text-[#a7a7a7] truncate mt-1">
                            Series • {playlist.owner}
                          </p>
                        </div>
                      );
                    })}
              </div>
            </section>
          </div>
        )}

        {/* Section 1: Trending songs */}
        {activeFilter !== 'podcasts' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              onClick={() => setViewState({ type: 'search', searchQuery: 'bollywood hits' })}
              className="text-2xl font-bold text-white hover:underline cursor-pointer"
            >
              Trending songs
            </h2>
            <button
              onClick={() => setViewState({ type: 'search', searchQuery: 'bollywood hits' })}
              className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
            >
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {isLoading && tracks.length === 0
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3">
                    <div className="aspect-square w-full bg-white/10 rounded-xl" />
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                ))
              : tracks.slice(0, 12).map((track) => {
                  const isThisPlaying = isPlaying && currentTrack?.id === track.id;

                  return (
                    <div
                      key={track.id}
                      onClick={() => onPlayTrack(track)}
                      className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                    >
                      <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
                        <CoverArt
                          src={track.coverUrl}
                          fallbackSrc={track.fallbackCoverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayTrack(track);
                          }}
                          aria-label={`Play ${track.title}`}
                          className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer ${
                            isThisPlaying
                              ? 'opacity-100 scale-100 translate-y-0'
                              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                          }`}
                        >
                          {isThisPlaying ? (
                            <Pause className="w-4 h-4 fill-current stroke-none" />
                          ) : (
                            <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                          )}
                        </button>
                      </div>
                      <h3
                        className={`font-bold text-sm truncate ${
                          isThisPlaying ? 'text-[#1ed760]' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </h3>
                      <p className="text-xs text-[#a7a7a7] truncate mt-1">{track.artist}</p>
                    </div>
                  );
                })}
          </div>
        </section>
        )}

        {/* Section 1B: Podcasts & Audio Shows Preview (visible on All tab) */}
        {activeFilter === 'all' && (isPodcastsLoading || podcastEpisodes.length > 0 || podcastShows.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Podcast className="w-5 h-5 text-[#1ed760]" />
                <h2
                  onClick={() => handleSelectFilter('podcasts')}
                  className="text-2xl font-bold text-white hover:underline cursor-pointer"
                >
                  Podcasts & Audio Shows
                </h2>
              </div>
              <button
                onClick={() => handleSelectFilter('podcasts')}
                className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
              >
                Show all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {isPodcastsLoading && podcastEpisodes.length === 0
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3"
                    >
                      <div className="aspect-square w-full bg-white/10 rounded-xl" />
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  ))
                : podcastEpisodes.slice(0, 6).map((episode) => {
                    const isThisPlaying = isPlaying && currentTrack?.id === episode.id;
                    return (
                      <div
                        key={`home-pod-${episode.id}`}
                        onClick={() => onPlayTrack(episode, podcastEpisodes)}
                        className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                      >
                        <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
                          <CoverArt
                            src={episode.coverUrl}
                            fallbackSrc={episode.fallbackCoverUrl}
                            alt={episode.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute left-2 top-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold text-[#1ed760]">
                            {formatTime(episode.duration)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(episode, podcastEpisodes);
                            }}
                            aria-label={`Play ${episode.title}`}
                            className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer ${
                              isThisPlaying
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                            }`}
                          >
                            {isThisPlaying ? (
                              <Pause className="w-4 h-4 fill-current stroke-none" />
                            ) : (
                              <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                            )}
                          </button>
                        </div>
                        <h3
                          className={`font-bold text-sm truncate ${
                            isThisPlaying ? 'text-[#1ed760]' : 'text-white'
                          }`}
                        >
                          {episode.title}
                        </h3>
                        <p className="text-xs text-[#a7a7a7] truncate mt-1">
                          Podcast • {episode.artist}
                        </p>
                      </div>
                    );
                  })}
            </div>
          </section>
        )}

        {/* Section 2: Popular artists */}
        {activeFilter !== 'podcasts' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              onClick={() => setViewState({ type: 'search', searchQuery: 'indian singers' })}
              className="text-2xl font-bold text-white hover:underline cursor-pointer"
            >
              Popular artists
            </h2>
            <button
              onClick={() => setViewState({ type: 'search', searchQuery: 'indian singers' })}
              className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
            >
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {isLoading && artists.length === 0
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3">
                    <div className="aspect-square w-full bg-white/10 rounded-full" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                  </div>
                ))
              : artists.slice(0, 6).map((artist) => {
                  const isArtistPlaying =
                    isPlaying && currentTrack?.artistId === artist.id;

                  return (
                    <div
                      key={artist.id}
                      onClick={() => setViewState({ type: 'artist', id: artist.id })}
                      className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                    >
                      <div className="relative aspect-square w-full mb-3">
                        <div className="w-full h-full rounded-full overflow-hidden ring-1 ring-white/15 shadow-lg">
                          <CoverArt
                            src={artist.avatarUrl}
                            fallbackSrc={artist.fallbackAvatarUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayArtist(artist);
                          }}
                          aria-label={`Play ${artist.name}`}
                          className={`absolute right-1 bottom-1 w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer ${
                            isArtistPlaying
                              ? 'opacity-100 scale-100 translate-y-0'
                              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                          }`}
                        >
                          {isArtistPlaying ? (
                            <Pause className="w-4 h-4 fill-current stroke-none" />
                          ) : (
                            <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                          )}
                        </button>
                      </div>
                      <h3 className="font-bold text-sm truncate text-white">{artist.name}</h3>
                      <p className="text-xs text-[#a7a7a7] mt-1">Artist</p>
                    </div>
                  );
                })}
          </div>
        </section>
        )}

        {/* Section 3: Popular albums and singles */}
        {activeFilter !== 'podcasts' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              onClick={() => setViewState({ type: 'search', searchQuery: 'hindi albums' })}
              className="text-2xl font-bold text-white hover:underline cursor-pointer"
            >
              Popular albums and singles
            </h2>
            <button
              onClick={() => setViewState({ type: 'search', searchQuery: 'hindi albums' })}
              className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
            >
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {isLoading && albums.length === 0
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3">
                    <div className="aspect-square w-full bg-white/10 rounded-xl" />
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                ))
              : albums.slice(0, 6).map((album) => {
                  const isAlbumPlaying =
                    isPlaying &&
                    (album.tracks.some((t) => t.id === currentTrack?.id) ||
                      currentTrack?.albumId === album.id);

                  return (
                    <div
                      key={album.id}
                      onClick={() => setViewState({ type: 'album', id: album.id })}
                      className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                    >
                      <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-md">
                        <CoverArt
                          src={album.coverUrl}
                          fallbackSrc={album.fallbackCoverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayAlbum(album);
                          }}
                          aria-label={`Play ${album.title}`}
                          className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer ${
                            isAlbumPlaying
                              ? 'opacity-100 scale-100 translate-y-0'
                              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                          }`}
                        >
                          {isAlbumPlaying ? (
                            <Pause className="w-4 h-4 fill-current stroke-none" />
                          ) : (
                            <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                          )}
                        </button>
                      </div>
                      <h3 className="font-bold text-sm truncate text-white">{album.title}</h3>
                      <p className="text-xs text-[#a7a7a7] truncate mt-1">{album.artist}</p>
                    </div>
                  );
                })}
          </div>
        </section>
        )}

        {/* Section 4: Featured Playlists */}
        {activeFilter !== 'podcasts' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              onClick={() => setViewState({ type: 'search', searchQuery: 'indian hits' })}
              className="text-2xl font-bold text-white hover:underline cursor-pointer"
            >
              Featured Charts & Playlists
            </h2>
            <button
              onClick={() => setViewState({ type: 'search', searchQuery: 'indian hits' })}
              className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
            >
              Show all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {isLoading && playlists.length === 0
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3">
                    <div className="aspect-square w-full bg-white/10 rounded-xl" />
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                ))
              : playlists.slice(0, 6).map((playlist) => {
                  const isPlPlaying =
                    isPlaying && playlist.tracks.some((t) => t.id === currentTrack?.id);

                  return (
                    <div
                      key={playlist.id}
                      onClick={() => setViewState({ type: 'playlist', id: playlist.id })}
                      className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                    >
                      <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-md">
                        <CoverArt
                          src={playlist.coverUrl}
                          fallbackSrc={playlist.fallbackCoverUrl}
                          alt={playlist.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayPlaylist(playlist);
                          }}
                          aria-label={`Play ${playlist.title}`}
                          className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer ${
                            isPlPlaying
                              ? 'opacity-100 scale-100 translate-y-0'
                              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                          }`}
                        >
                          {isPlPlaying ? (
                            <Pause className="w-4 h-4 fill-current stroke-none" />
                          ) : (
                            <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                          )}
                        </button>
                      </div>
                      <h3 className="font-bold text-sm truncate text-white">{playlist.title}</h3>
                      <p className="text-xs text-[#a7a7a7] line-clamp-2 mt-1">
                        {playlist.description}
                      </p>
                    </div>
                  );
                })}
          </div>
        </section>
        )}

        {/* Complete Spotify Desktop Footer */}
        <footer className="pt-16 pb-12 border-t border-[#282828] mt-12 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-sm">
            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">Company</h4>
              <ul className="space-y-2 text-[#a7a7a7]">
                <li><a href="#" className="hover:text-white hover:underline">About</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Jobs</a></li>
                <li><a href="#" className="hover:text-white hover:underline">For the Record</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">Communities</h4>
              <ul className="space-y-2 text-[#a7a7a7]">
                <li><a href="#" className="hover:text-white hover:underline">For Artists</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Developers</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Advertising</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Investors</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Vendors</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">Useful links</h4>
              <ul className="space-y-2 text-[#a7a7a7]">
                <li><a href="#" className="hover:text-white hover:underline">Support</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Free Mobile App</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Popular by Country</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">Spotify Plans</h4>
              <ul className="space-y-2 text-[#a7a7a7]">
                <li><a href="#" className="hover:text-white hover:underline">Premium Individual</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Premium Duo</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Premium Family</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Premium Student</a></li>
                <li><a href="#" className="hover:text-white hover:underline">Spotify Free</a></li>
              </ul>
            </div>

            <div className="flex gap-3">
              <a
                href="https://instagram.com/spotify"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-[#292929] hover:bg-[#3e3e3e] flex items-center justify-center text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/spotify"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-10 h-10 rounded-full bg-[#292929] hover:bg-[#3e3e3e] flex items-center justify-center text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/spotify"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-[#292929] hover:bg-[#3e3e3e] flex items-center justify-center text-white transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-[#282828] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#a7a7a7]">
            <div className="flex flex-wrap gap-4">
              <a href="#" className="hover:text-white hover:underline">Legal</a>
              <a href="#" className="hover:text-white hover:underline">Safety & Privacy Center</a>
              <a href="#" className="hover:text-white hover:underline">Privacy Policy</a>
              <a href="#" className="hover:text-white hover:underline">Cookies</a>
              <a href="#" className="hover:text-white hover:underline">About Ads</a>
              <a href="#" className="hover:text-white hover:underline">Accessibility</a>
            </div>
            <div>© 2026 Spotify AB</div>
          </div>
        </footer>
      </div>
    </div>
  );
};
