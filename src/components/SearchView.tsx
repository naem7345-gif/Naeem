import React, { useEffect, useState } from 'react';
import { Play, Pause, Loader2, Clock3, Podcast } from 'lucide-react';
import { Track, Artist, Album, Playlist, ViewState } from '../types/spotify';
import { CATEGORIES } from '../data/spotifyData';
import {
  searchMusic,
  getRelatedTracks,
  mergeUniqueTracks,
  scorePodcastEpisode,
  isPodcastShowArtist,
  isPodcastPlaylist,
  SearchResponse,
} from '../services/musicApi';
import { CoverArt } from './CoverArt';
import { formatTime } from '../utils/audioUtils';

interface SearchViewProps {
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, collection?: Track[]) => void;
  onPlayArtist: (artist: Artist) => void;
  onPlayAlbum: (album: Album) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
}

type SearchTab = 'all' | 'songs' | 'podcasts' | 'artists' | 'albums' | 'playlists';

export const SearchView: React.FC<SearchViewProps> = ({
  viewState,
  setViewState,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayArtist,
  onPlayAlbum,
  onPlayPlaylist,
}) => {
  const query = (viewState.searchQuery || '').trim();
  const [results, setResults] = useState<SearchResponse>({
    tracks: [],
    artists: [],
    albums: [],
    playlists: [],
  });
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('all');
  }, [query]);

  useEffect(() => {
    if (!query) {
      setResults({ tracks: [], artists: [], albums: [], playlists: [] });
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    const timer = window.setTimeout(async () => {
      try {
        const data = await searchMusic(query, controller.signal);
        if (controller.signal.aborted) return;
        setResults(data);

        // Expand short song lists with related tracks for richer, longer results
        if (data.tracks.length > 0 && data.tracks.length < 22) {
          const related = await getRelatedTracks(data.tracks[0].id);
          if (!controller.signal.aborted && related.length > 0) {
            setResults((prev) => ({
              ...prev,
              tracks: mergeUniqueTracks(prev.tracks, related),
            }));
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchError('Failed to fetch search results. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const topResult = results.tracks[0] || null;
  const hasAnyResults =
    results.tracks.length > 0 ||
    results.artists.length > 0 ||
    results.albums.length > 0 ||
    results.playlists.length > 0;

  const podcastTracks = results.tracks.filter((t) => scorePodcastEpisode(t) >= 250);
  const podcastArtists = results.artists.filter(isPodcastShowArtist);
  const podcastSeries = results.playlists.filter(isPodcastPlaylist);
  const podcastTotalCount = podcastTracks.length + podcastArtists.length + podcastSeries.length;

  const showTopSummary = activeTab === 'all';
  const showPodcastsSection = activeTab === 'podcasts';
  const showSongsSection = activeTab === 'all' || activeTab === 'songs';
  const showArtistsSection = activeTab === 'all' || activeTab === 'artists';
  const showAlbumsSection = activeTab === 'all' || activeTab === 'albums';
  const showPlaylistsSection = activeTab === 'all' || activeTab === 'playlists';

  const quickTracks = showTopSummary ? results.tracks.slice(0, 5) : [];
  const fullSongList = results.tracks;

  return (
    <div className="flex-1 overflow-y-auto bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 space-y-8 no-scrollbar shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      {!query ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {CATEGORIES.map((category) => (
              <div
                key={category.id}
                onClick={() =>
                  setViewState({
                    type: 'search',
                    searchQuery: category.title,
                  })
                }
                style={{ backgroundColor: category.color }}
                className="relative aspect-square rounded-2xl p-4 overflow-hidden shadow-lg border border-white/15 hover:scale-102 transition-transform cursor-pointer select-none group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20 pointer-events-none" />
                <h3 className="relative z-10 font-bold text-xl sm:text-2xl text-white tracking-tight break-words max-w-[80%]">
                  {category.title}
                </h3>
                <CoverArt
                  src={category.coverUrl}
                  alt={category.title}
                  className="absolute -right-3 -bottom-2 w-20 h-20 sm:w-24 sm:h-24 object-cover rotate-[25deg] shadow-2xl rounded-xl ring-1 ring-white/20 group-hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      ) : isSearching && !hasAnyResults ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#b3b3b3] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1ed760]" />
          <p className="text-sm font-medium">Searching catalog for "{query}"...</p>
        </div>
      ) : searchError ? (
        <div className="py-16 text-center space-y-2">
          <p className="text-white font-bold text-lg">{searchError}</p>
        </div>
      ) : !hasAnyResults && !isSearching ? (
        <div className="py-20 text-center space-y-2">
          <h3 className="text-xl font-bold text-white">No results found for "{query}"</h3>
          <p className="text-sm text-[#a7a7a7]">
            Please make sure your words are spelled correctly, or use fewer or different keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-8 pb-6">
          {/* Category Filter Chips + Total Result Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'songs', label: `Songs (${results.tracks.length})` },
                  { id: 'podcasts', label: `Podcasts (${podcastTotalCount})` },
                  { id: 'artists', label: `Artists (${results.artists.length})` },
                  { id: 'albums', label: `Albums (${results.albums.length})` },
                  { id: 'playlists', label: `Playlists (${results.playlists.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                    activeTab === tab.id
                      ? 'bg-white text-black border-white'
                      : 'bg-white/[0.07] border-white/10 text-white hover:bg-white/[0.15]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {/\b(podcast|episode|story|stories|speech|gita|geeta|huberman|sadhguru)\b/i.test(query) && (
                <button
                  onClick={() => setViewState({ type: 'home', filterTab: 'podcasts' })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1ed760]/15 border border-[#1ed760]/40 text-[#1ed760] hover:bg-[#1ed760]/25 transition-colors cursor-pointer"
                >
                  <Podcast className="w-3.5 h-3.5" />
                  <span>Open Podcasts Hub</span>
                </button>
              )}
            </div>

            {isSearching && (
              <div className="flex items-center gap-2 text-xs text-[#a7a7a7]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1ed760]" />
                <span>Updating results...</span>
              </div>
            )}
          </div>

          {/* Dedicated Podcasts Search Tab */}
          {showPodcastsSection && (
            <div className="space-y-6">
              {podcastTotalCount === 0 ? (
                <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-8 text-center space-y-3">
                  <p className="text-white font-bold text-base">
                    No podcast-specific matches found for "{query}"
                  </p>
                  <button
                    onClick={() => setViewState({ type: 'home', filterTab: 'podcasts' })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1ed760] text-black text-xs font-bold hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Podcast className="w-4 h-4" />
                    <span>Explore All Podcasts</span>
                  </button>
                </div>
              ) : (
                <>
                  {podcastTracks.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Podcast Episodes ({podcastTracks.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {podcastTracks.map((ep) => {
                          const isEpPlaying = isPlaying && currentTrack?.id === ep.id;
                          return (
                            <div
                              key={`srch-ep-${ep.id}`}
                              onClick={() => onPlayTrack(ep, podcastTracks)}
                              className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all cursor-pointer relative pr-14"
                            >
                              <div className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-white/15 shrink-0">
                                <CoverArt
                                  src={ep.coverUrl}
                                  fallbackSrc={ep.fallbackCoverUrl}
                                  alt={ep.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-bold text-sm truncate ${isEpPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
                                  {ep.title}
                                </p>
                                <p className="text-xs text-[#a7a7a7] truncate mt-0.5">
                                  {ep.artist} • {formatTime(ep.duration)}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayTrack(ep, podcastTracks);
                                }}
                                aria-label={`Play ${ep.title}`}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                              >
                                {isEpPlaying ? (
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
                  )}

                  {podcastArtists.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Podcast Shows ({podcastArtists.length})
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {podcastArtists.map((show) => (
                          <div
                            key={`srch-show-${show.id}`}
                            onClick={() => setViewState({ type: 'artist', id: show.id })}
                            className="group bg-white/[0.05] hover:bg-white/[0.11] border border-white/[0.08] p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col"
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
                                className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all cursor-pointer"
                              >
                                <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                              </button>
                            </div>
                            <h3 className="font-bold text-sm truncate text-white">{show.name}</h3>
                            <p className="text-xs text-[#a7a7a7] mt-1">Podcast Show</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {podcastSeries.length > 0 && (
                    <section className="space-y-3">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Podcast Series & Playlists ({podcastSeries.length})
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {podcastSeries.map((pl) => (
                          <div
                            key={`srch-podpl-${pl.id}`}
                            onClick={() => setViewState({ type: 'playlist', id: pl.id })}
                            className="group bg-white/[0.05] hover:bg-white/[0.11] border border-white/[0.08] p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col"
                          >
                            <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg">
                              <CoverArt
                                src={pl.coverUrl}
                                fallbackSrc={pl.fallbackCoverUrl}
                                alt={pl.title}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayPlaylist(pl);
                                }}
                                aria-label={`Play ${pl.title}`}
                                className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all cursor-pointer"
                              >
                                <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                              </button>
                            </div>
                            <h3 className="font-bold text-sm truncate text-white">{pl.title}</h3>
                            <p className="text-xs text-[#a7a7a7] truncate mt-1">By {pl.owner}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}

          {/* Top Result & Quick Highlights */}
          {showTopSummary && (topResult || quickTracks.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Result Card */}
              {topResult && (
                <div className="lg:col-span-5 space-y-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Top result</h2>
                  <div
                    onClick={() => onPlayTrack(topResult, results.tracks)}
                    className="group relative bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-xl border border-white/10 hover:border-white/20 p-5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between h-60 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  >
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg">
                      <CoverArt
                        src={topResult.coverUrl}
                        fallbackSrc={topResult.fallbackCoverUrl}
                        alt={topResult.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white truncate">
                        {topResult.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#a7a7a7] mt-1">
                        <span>Song •</span>
                        <span className="text-white hover:underline truncate">
                          {topResult.artist}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(topResult, results.tracks);
                      }}
                      aria-label={`Play ${topResult.title}`}
                      className={`absolute right-5 bottom-5 w-12 h-12 rounded-full bg-[#1ed760] text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer ${
                        isPlaying && currentTrack?.id === topResult.id
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}
                    >
                      {isPlaying && currentTrack?.id === topResult.id ? (
                        <Pause className="w-5 h-5 fill-current stroke-none" />
                      ) : (
                        <Play className="w-5 h-5 fill-current stroke-none translate-x-[0.5px]" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Top Songs Column */}
              <div className={`space-y-3 ${topResult ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Top songs</h2>
                  {results.tracks.length > 5 && (
                    <button
                      onClick={() => setActiveTab('songs')}
                      className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline cursor-pointer"
                    >
                      View all {results.tracks.length} songs
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {quickTracks.map((track) => {
                    const isTrackPlaying = isPlaying && currentTrack?.id === track.id;

                    return (
                      <div
                        key={`quick-${track.id}`}
                        onClick={() => onPlayTrack(track, results.tracks)}
                        className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-white/10 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/15 shadow">
                            <CoverArt
                              src={track.coverUrl}
                              fallbackSrc={track.fallbackCoverUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayTrack(track, results.tracks);
                              }}
                              aria-label={`Play ${track.title}`}
                              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              {isTrackPlaying ? (
                                <Pause className="w-4 h-4 fill-current stroke-none" />
                              ) : (
                                <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                              )}
                            </button>
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`font-medium text-sm truncate ${
                                isTrackPlaying ? 'text-[#1ed760]' : 'text-white'
                              }`}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs text-[#a7a7a7] truncate group-hover:text-white">
                              {track.artist}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-[#a7a7a7] tabular-nums shrink-0">
                          {formatTime(track.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Full Long Songs List */}
          {showSongsSection && fullSongList.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  All matching songs ({fullSongList.length})
                </h2>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[28px_1fr_70px] md:grid-cols-[32px_4fr_3fr_80px] gap-4 px-4 py-2.5 border-b border-white/10 text-xs font-medium text-[#a7a7a7] uppercase tracking-wider">
                  <span className="text-center">#</span>
                  <span>Title</span>
                  <span className="hidden md:inline">Album</span>
                  <span className="flex justify-end">
                    <Clock3 className="w-4 h-4" />
                  </span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {fullSongList.map((track, idx) => {
                    const isTrackPlaying = isPlaying && currentTrack?.id === track.id;
                    const isTrackCurrent = currentTrack?.id === track.id;

                    return (
                      <div
                        key={track.id}
                        onClick={() => onPlayTrack(track, fullSongList)}
                        className={`group grid grid-cols-[28px_1fr_70px] md:grid-cols-[32px_4fr_3fr_80px] gap-4 px-4 py-2.5 items-center hover:bg-white/[0.08] transition-colors cursor-pointer ${
                          isTrackCurrent ? 'bg-white/[0.1]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center text-xs text-[#a7a7a7] tabular-nums">
                          <span className="group-hover:hidden">
                            {isTrackPlaying ? (
                              <span className="text-[#1ed760] font-bold">▶</span>
                            ) : (
                              idx + 1
                            )}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(track, fullSongList);
                            }}
                            aria-label={`Play ${track.title}`}
                            className="hidden group-hover:flex items-center justify-center text-white cursor-pointer"
                          >
                            {isTrackPlaying ? (
                              <Pause className="w-3.5 h-3.5 fill-current stroke-none" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current stroke-none" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/15 shrink-0">
                            <CoverArt
                              src={track.coverUrl}
                              fallbackSrc={track.fallbackCoverUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isTrackCurrent ? 'text-[#1ed760]' : 'text-white'
                              }`}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs text-[#a7a7a7] truncate group-hover:text-white/80">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <span className="hidden md:inline text-xs text-[#a7a7a7] truncate">
                          {track.album}
                        </span>

                        <span className="text-xs text-[#a7a7a7] tabular-nums text-right">
                          {formatTime(track.duration)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Matching Artists */}
          {showArtistsSection && results.artists.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Artists ({results.artists.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => setViewState({ type: 'artist', id: artist.id })}
                    className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col"
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
                        className="absolute right-1 bottom-1 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                      </button>
                    </div>
                    <h3 className="font-bold text-sm truncate text-white">{artist.name}</h3>
                    <p className="text-xs text-[#a7a7a7] mt-1">Artist</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching Albums */}
          {showAlbumsSection && results.albums.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Albums ({results.albums.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => setViewState({ type: 'album', id: album.id })}
                    className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg">
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
                        className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                      </button>
                    </div>
                    <h3 className="font-bold text-sm truncate text-white">{album.title}</h3>
                    <p className="text-xs text-[#a7a7a7] truncate mt-1">{album.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching Playlists */}
          {showPlaylistsSection && results.playlists.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Playlists ({results.playlists.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => setViewState({ type: 'playlist', id: playlist.id })}
                    className="group bg-white/[0.05] hover:bg-white/[0.11] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg">
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
                        className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current stroke-none translate-x-[0.5px]" />
                      </button>
                    </div>
                    <h3 className="font-bold text-sm truncate text-white">{playlist.title}</h3>
                    <p className="text-xs text-[#a7a7a7] truncate mt-1">By {playlist.owner}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
