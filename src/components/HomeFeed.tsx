import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  Instagram,
  Twitter,
  Facebook,
  RefreshCw,
  Mic,
  Podcast,
  Flame,
  Disc3,
  Moon,
  Sparkles,
  Zap,
  Dumbbell,
  TrendingUp,
  User,
} from 'lucide-react';
import { Track, Artist, Album, Playlist, ViewState } from '../types/spotify';
import { CoverArt } from './CoverArt';
import { formatTime } from '../utils/audioUtils';
import { handleSpotlightMove } from '../utils/hoverSpotlight';

interface HomeFeedProps {
  tracks: Track[];
  freshTracks: Track[];
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

const EqualizerBars: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-end gap-[2px] h-3.5 ${className}`} aria-hidden="true">
    <span className="w-[3px] h-full rounded-full bg-[#1ed760] animate-eq-1" />
    <span className="w-[3px] h-full rounded-full bg-[#1ed760] animate-eq-2" />
    <span className="w-[3px] h-full rounded-full bg-[#1ed760] animate-eq-3" />
  </span>
);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface VibeTile {
  id: string;
  title: string;
  subtitle: string;
  query: string;
  gradient: string;
  iconBg: string;
  isPodcastTile?: boolean;
  icon: 'heart' | 'flame' | 'disc' | 'moon' | 'sparkles' | 'zap' | 'dumbbell' | 'mic';
}

const VIBE_TILES: VibeTile[] = [
  {
    id: 'bollywood-romance',
    title: 'Bollywood Romance',
    subtitle: 'Soulful Hindi hits',
    query: 'arijit singh romantic hits',
    gradient: 'from-rose-500/25 via-pink-500/10 to-white/[0.04]',
    iconBg: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    icon: 'heart',
  },
  {
    id: 'punjabi-bangers',
    title: 'Punjabi Bangers',
    subtitle: 'High-energy Desi anthems',
    query: 'punjabi hits diljit karan',
    gradient: 'from-amber-500/25 via-orange-500/10 to-white/[0.04]',
    iconBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    icon: 'flame',
  },
  {
    id: '90s-evergreen',
    title: '90s Evergreen',
    subtitle: 'Kumar Sanu, Alka & Udit',
    query: '90s hindi evergreen hits',
    gradient: 'from-violet-500/25 via-purple-500/10 to-white/[0.04]',
    iconBg: 'bg-violet-500/20 text-violet-300 border-violet-400/30',
    icon: 'disc',
  },
  {
    id: 'hindi-lofi',
    title: 'Hindi Lo-Fi & Chill',
    subtitle: 'Late night reverb vibes',
    query: 'hindi lofi chill',
    gradient: 'from-cyan-500/25 via-sky-500/10 to-white/[0.04]',
    iconBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    icon: 'moon',
  },
  {
    id: 'sufi-soul',
    title: 'Sufi & Acoustic',
    subtitle: 'Deep soulful melodies',
    query: 'sufi hindi songs',
    gradient: 'from-emerald-500/25 via-teal-500/10 to-white/[0.04]',
    iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    icon: 'sparkles',
  },
  {
    id: 'party-dance',
    title: 'Party & Dance',
    subtitle: 'Club & wedding floor fillers',
    query: 'bollywood party dance hits',
    gradient: 'from-fuchsia-500/25 via-pink-500/10 to-white/[0.04]',
    iconBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30',
    icon: 'zap',
  },
  {
    id: 'workout-energy',
    title: 'Workout Energy',
    subtitle: 'Beast mode bass & beats',
    query: 'workout motivation phonk hindi',
    gradient: 'from-red-500/25 via-orange-500/10 to-white/[0.04]',
    iconBg: 'bg-red-500/20 text-red-300 border-red-400/30',
    icon: 'dumbbell',
  },
  {
    id: 'podcasts-stories',
    title: 'Podcasts & Stories',
    subtitle: 'Hindi stories, Gita & talks',
    query: 'podcast',
    gradient: 'from-[#1ed760]/25 via-emerald-500/10 to-white/[0.04]',
    iconBg: 'bg-[#1ed760]/20 text-[#1ed760] border-[#1ed760]/30',
    isPodcastTile: true,
    icon: 'mic',
  },
];

function renderVibeIcon(icon: VibeTile['icon']) {
  const cls = 'w-5 h-5';
  switch (icon) {
    case 'heart':
      return <Heart className={cls} />;
    case 'flame':
      return <Flame className={cls} />;
    case 'disc':
      return <Disc3 className={cls} />;
    case 'moon':
      return <Moon className={cls} />;
    case 'sparkles':
      return <Sparkles className={cls} />;
    case 'zap':
      return <Zap className={cls} />;
    case 'dumbbell':
      return <Dumbbell className={cls} />;
    case 'mic':
      return <Mic className={cls} />;
  }
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  tracks,
  freshTracks,
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

  const spotlightTrack = currentTrack || tracks[0] || null;
  const isSpotlightPlaying = Boolean(
    spotlightTrack && isPlaying && currentTrack?.id === spotlightTrack.id
  );
  const greeting = getGreeting();

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
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl md:rounded-3xl relative no-scrollbar shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      {/* Dynamic Ambient Top Gradient & Floating Glow Orbs (zero-blur radial gradients) */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#1e3a2f]/45 via-[#121824]/30 to-transparent pointer-events-none -z-0 overflow-hidden">
        <div className="absolute -top-28 left-4 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(30,215,96,0.14)_0%,transparent_68%)] animate-ambient-drift" />
        <div className="absolute -top-20 right-8 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(69,10,245,0.18)_0%,transparent_70%)] animate-ambient-drift" />
      </div>

      <div className="relative z-10 p-3 sm:p-6 space-y-5 sm:space-y-8">
        {/* Top Greeting & Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 pt-0.5 sm:pt-1 animate-fade-up">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}
            </h1>
            <p className="text-[11px] sm:text-sm text-[#a7a7a7] mt-0.5 truncate">
              Indian &amp; Global Hits, Live Podcasts &amp; Studio Audio
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSelectFilter('all')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.2)]'
                  : 'bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.15]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleSelectFilter('music')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border shrink-0 ${
                activeFilter === 'music'
                  ? 'bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.2)]'
                  : 'bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.15]'
              }`}
            >
              Music
            </button>
            <button
              onClick={() => handleSelectFilter('podcasts')}
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border shrink-0 ${
                activeFilter === 'podcasts'
                  ? 'bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.2)]'
                  : 'bg-white/[0.08] border-white/10 text-white hover:bg-white/[0.15]'
              }`}
            >
              Podcasts
            </button>
          </div>
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

        {/* Featured Spotlight Hero Banner */}
        {activeFilter !== 'podcasts' && (
          <section className="animate-fade-up">
            {isLoading && !spotlightTrack ? (
              <div className="h-52 rounded-3xl bg-white/[0.05] border border-white/10 animate-pulse p-6 flex items-center gap-6">
                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-white/10 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-28 bg-white/10 rounded" />
                  <div className="h-8 w-2/3 bg-white/10 rounded" />
                  <div className="h-4 w-1/3 bg-white/10 rounded" />
                  <div className="h-10 w-36 bg-white/10 rounded-full mt-2" />
                </div>
              </div>
            ) : (
              spotlightTrack && (
                <div
                  onMouseMove={handleSpotlightMove}
                  className="group hover-spotlight relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-white/[0.06] p-3.5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_20px_50px_rgba(0,0,0,0.45)] transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/30 hover:bg-white/[0.08]"
                >
                  {/* Blurred Artwork Atmospheric Backdrop */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <CoverArt
                      src={spotlightTrack.coverUrl}
                      fallbackSrc={spotlightTrack.fallbackCoverUrl}
                      alt=""
                      className="w-full h-full object-cover blur-xl scale-110 opacity-28"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#090d12]/90 via-[#0b1219]/75 to-[#090d12]/85" />
                    <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(30,215,96,0.2)_0%,transparent_70%)] animate-ambient-drift" />
                    <div className="absolute left-1/3 -bottom-24 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,transparent_70%)] animate-ambient-drift" />
                  </div>

                  <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-7 w-full min-w-0">
                    {/* Mobile Compact Row: Artwork + Title/Artist side-by-side */}
                    <div className="flex items-center gap-3.5 sm:contents min-w-0">
                      <div
                        onClick={() => onPlayTrack(spotlightTrack)}
                        className="relative w-20 h-20 sm:w-44 sm:h-44 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 ring-1 ring-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.6)] cursor-pointer"
                      >
                        <CoverArt
                          src={spotlightTrack.coverUrl}
                          fallbackSrc={spotlightTrack.fallbackCoverUrl}
                          alt={spotlightTrack.title}
                          className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                        />
                        {isSpotlightPlaying && (
                          <div className="absolute left-1.5 bottom-1.5 sm:left-2 sm:bottom-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#1ed760]/40 flex items-center gap-1">
                            <EqualizerBars />
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#1ed760]">
                              Live
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Spotlight Metadata (visible right next to cover on mobile, part of right col on desktop) */}
                      <div className="sm:hidden min-w-0 flex-1 space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#1ed760]">
                          {isSpotlightPlaying ? (
                            <EqualizerBars />
                          ) : (
                            <Sparkles className="w-3 h-3 shrink-0" />
                          )}
                          <span>{isSpotlightPlaying ? 'Now Playing' : 'Featured Spotlight'}</span>
                        </div>
                        <h2 className="text-lg font-extrabold tracking-tight text-white truncate">
                          {spotlightTrack.title}
                        </h2>
                        <p className="text-xs text-[#d4d4d4] truncate">
                          <span className="font-semibold text-white">{spotlightTrack.artist}</span>
                          {spotlightTrack.duration ? ` • ${formatTime(spotlightTrack.duration)}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Desktop Metadata + Shared Actions */}
                    <div className="w-full min-w-0 flex-1 space-y-2">
                      <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md">
                        {isSpotlightPlaying ? (
                          <EqualizerBars />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-[#1ed760]" />
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#1ed760]">
                          {isSpotlightPlaying ? 'Now Playing' : 'Featured Spotlight'}
                        </span>
                      </div>

                      <h2 className="hidden sm:block text-3xl lg:text-4xl font-extrabold tracking-tight text-white truncate">
                        {spotlightTrack.title}
                      </h2>

                      <p className="hidden sm:block text-base text-[#d4d4d4] truncate">
                        <span className="font-semibold text-white">{spotlightTrack.artist}</span>
                        {spotlightTrack.album ? ` • ${spotlightTrack.album}` : ''}
                        {spotlightTrack.duration ? ` • ${formatTime(spotlightTrack.duration)}` : ''}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1.5">
                        <button
                          onClick={() => onPlayTrack(spotlightTrack)}
                          className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-xs sm:text-sm shadow-[0_8px_24px_rgba(30,215,96,0.35)] hover:shadow-[0_12px_30px_rgba(30,215,96,0.5)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {isSpotlightPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current stroke-none" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current stroke-none translate-x-[0.5px]" />
                              Play Now
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (spotlightTrack.artistId) {
                              setViewState({ type: 'artist', id: spotlightTrack.artistId });
                            } else {
                              setViewState({
                                type: 'search',
                                searchQuery: spotlightTrack.artist,
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/[0.1] hover:bg-white/[0.18] border border-white/15 hover:border-white/30 text-white font-semibold text-xs sm:text-sm backdrop-blur-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="sm:hidden">Artist</span>
                          <span className="hidden sm:inline">Explore Artist</span>
                        </button>

                        {activeFilter === 'all' && (
                          <button
                            onClick={() => handleSelectFilter('podcasts')}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 hover:border-white/25 text-[#d4d4d4] hover:text-white font-semibold text-xs sm:text-sm backdrop-blur-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Podcast className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1ed760]" />
                            <span>Podcasts</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </section>
        )}

        {/* Quick Access 6-Grid (2-col on mobile like Spotify Mobile, 3-col on desktop) */}
        {activeFilter !== 'podcasts' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 animate-fade-up">
            {isLoading && quickItems.length <= 1
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center bg-white/[0.06] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden h-14 sm:h-16 animate-pulse"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 shrink-0" />
                    <div className="h-3.5 bg-white/10 rounded w-20 sm:w-32 ml-2.5 sm:ml-3" />
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
                      onMouseMove={handleSpotlightMove}
                      onClick={() => {
                        if (item.type === 'playlist') {
                          setViewState({ type: 'playlist', id: item.id });
                        } else if (item.type === 'album') {
                          setViewState({ type: 'album', id: item.id });
                        } else if (item.type === 'artist') {
                          setViewState({ type: 'artist', id: item.id });
                        }
                      }}
                      className={`group hover-spotlight flex items-center bg-white/[0.07] hover:bg-white/[0.14] border rounded-xl sm:rounded-2xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.3)] transition-[transform,background-color,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 active:scale-[0.985] cursor-pointer relative pr-2 sm:pr-4 p-1 sm:p-1.5 gap-2 sm:gap-3 min-w-0 ${
                        isItemPlaying
                          ? 'border-[#1ed760]/45 bg-white/[0.12]'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-md">
                        {item.isLikedSongs ? (
                          <div className="w-full h-full bg-gradient-to-br from-[#450af5] to-[#8e8ee5] flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.06]">
                            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white" />
                          </div>
                        ) : (
                          <CoverArt
                            src={item.coverUrl}
                            fallbackSrc={item.fallbackCoverUrl}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.08]"
                          />
                        )}
                      </div>
                      <span
                        className={`font-bold text-[11px] sm:text-sm leading-tight line-clamp-2 sm:line-clamp-none sm:truncate flex-1 pr-0.5 sm:pr-11 ${
                          isItemPlaying ? 'text-[#1ed760]' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </span>

                      {isItemPlaying && (
                        <EqualizerBars className="hidden sm:inline-flex mr-12 group-hover:opacity-0 transition-opacity" />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.type === 'playlist') onPlayPlaylist(item.data as Playlist);
                          else if (item.type === 'album') onPlayAlbum(item.data as Album);
                          else if (item.type === 'artist') onPlayArtist(item.data as Artist);
                        }}
                        aria-label={`Play ${item.title}`}
                        className={`hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-xl items-center justify-center transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 active:scale-95 cursor-pointer ${
                          isItemPlaying
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
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

        {/* Browse by Mood & Genre Vibes */}
        {activeFilter !== 'podcasts' && (
          <section className="animate-fade-up">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-5 h-5 text-[#1ed760] shrink-0" />
                <h2 className="text-lg sm:text-2xl font-bold text-white truncate">
                  Browse by Mood &amp; Vibes
                </h2>
              </div>
              <span className="hidden sm:inline text-xs font-medium text-[#a7a7a7] shrink-0">
                Tap any mood to explore live
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {VIBE_TILES.map((vibe) => (
                <button
                  key={vibe.id}
                  onMouseMove={handleSpotlightMove}
                  onClick={() => {
                    if (vibe.isPodcastTile) {
                      handleSelectFilter('podcasts');
                    } else {
                      setViewState({ type: 'search', searchQuery: vibe.query });
                    }
                  }}
                  className={`group hover-spotlight card-hover-lift text-left bg-gradient-to-br ${vibe.gradient} border border-white/10 hover:border-white/30 rounded-2xl p-2.5 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.3)] cursor-pointer flex items-center gap-2.5 sm:gap-3 min-w-0`}
                >
                  <div
                    className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:-rotate-3 ${vibe.iconBg}`}
                  >
                    {renderVibeIcon(vibe.icon)}
                  </div>
                  <div className="relative z-10 min-w-0 flex-1">
                    <h3 className="font-bold text-xs sm:text-sm text-white truncate transition-colors group-hover:text-white">{vibe.title}</h3>
                    <p className="text-[10px] sm:text-[11px] text-[#b3b3b3] truncate mt-0.5 transition-colors group-hover:text-white/80">{vibe.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Top Charts Right Now (Numbered Leaderboard) */}
        {activeFilter !== 'podcasts' && (isLoading || tracks.length > 0) && (
          <section className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-[#1ed760]" />
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Top Charts Right Now
                </h2>
              </div>
              <button
                onClick={() => setViewState({ type: 'search', searchQuery: 'top hindi songs' })}
                className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
              >
                Explore charts
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {isLoading && tracks.length === 0
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.05] border border-white/10 animate-pulse"
                    >
                      <div className="w-6 h-5 bg-white/10 rounded" />
                      <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-1/2" />
                        <div className="h-3 bg-white/10 rounded w-1/3" />
                      </div>
                    </div>
                  ))
                : tracks.slice(0, 6).map((track, idx) => {
                    const isThisPlaying = isPlaying && currentTrack?.id === track.id;
                    const rankLabel = String(idx + 1).padStart(2, '0');

                    return (
                      <div
                        key={`chart-${track.id}`}
                        onMouseMove={handleSpotlightMove}
                        onClick={() => onPlayTrack(track)}
                        className={`group hover-spotlight flex items-center gap-3.5 p-3 rounded-2xl border transition-[transform,background-color,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 active:scale-[0.99] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
                          isThisPlaying
                            ? 'bg-[#1ed760]/12 border-[#1ed760]/40'
                            : 'bg-white/[0.05] hover:bg-white/[0.12] border-white/[0.08] hover:border-white/25'
                        }`}
                      >
                        <span
                          className={`w-7 text-center font-extrabold text-base tabular-nums shrink-0 ${
                            isThisPlaying || idx < 3 ? 'text-[#1ed760]' : 'text-[#8e8e8e]'
                          }`}
                        >
                          {rankLabel}
                        </span>

                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-md">
                          <CoverArt
                            src={track.coverUrl}
                            fallbackSrc={track.fallbackCoverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.08]"
                          />
                          <div
                            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
                              isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isThisPlaying ? (
                              <Pause className="w-4 h-4 text-[#1ed760] fill-current stroke-none" />
                            ) : (
                              <Play className="w-4 h-4 text-white fill-current stroke-none translate-x-[0.5px]" />
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3
                            className={`font-bold text-sm truncate ${
                              isThisPlaying ? 'text-[#1ed760]' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </h3>
                          <p className="text-xs text-[#a7a7a7] truncate mt-0.5">{track.artist}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 pr-1">
                          {isThisPlaying && <EqualizerBars />}
                          <span className="text-xs text-[#a7a7a7] tabular-nums">
                            {formatTime(track.duration)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </section>
        )}

        {/* Podcasts Dedicated View (when Podcasts filter pill is selected) */}
        {activeFilter === 'podcasts' && (
          <div className="space-y-8 animate-fade-up">
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
                    Podcast Episodes &amp; Audio Stories
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
                          onMouseMove={handleSpotlightMove}
                          onClick={() => onPlayTrack(episode, podcastEpisodes)}
                          className={`group hover-spotlight card-hover-lift flex items-center gap-3.5 p-3 rounded-2xl border cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] relative pr-14 ${
                            isThisPlaying
                              ? 'bg-[#1ed760]/12 border-[#1ed760]/40'
                              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 shadow-md">
                            <CoverArt
                              src={episode.coverUrl}
                              fallbackSrc={episode.fallbackCoverUrl}
                              alt={episode.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.07]"
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
                              {isThisPlaying && <EqualizerBars className="ml-1" />}
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
                  <h2 className="text-2xl font-bold text-white">Podcast Shows &amp; Creators</h2>
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
                          onMouseMove={handleSpotlightMove}
                          onClick={() => setViewState({ type: 'artist', id: show.id })}
                          className="group hover-spotlight card-hover-lift bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/25 p-3.5 rounded-2xl cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                        >
                          <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg">
                            <CoverArt
                              src={show.avatarUrl}
                              fallbackSrc={show.fallbackAvatarUrl}
                              alt={show.name}
                              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayArtist(show);
                              }}
                              aria-label={`Play ${show.name}`}
                              className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                                isShowPlaying
                                  ? 'opacity-100 scale-100 translate-y-0'
                                  : 'opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
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
                  Curated Podcast &amp; Story Series
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
                          onMouseMove={handleSpotlightMove}
                          onClick={() => setViewState({ type: 'playlist', id: playlist.id })}
                          className="group hover-spotlight card-hover-lift bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] hover:border-white/25 p-3.5 rounded-2xl cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)]"
                        >
                          <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-md">
                            <CoverArt
                              src={playlist.coverUrl}
                              fallbackSrc={playlist.fallbackCoverUrl}
                              alt={playlist.title}
                              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayPlaylist(playlist);
                              }}
                              aria-label={`Play ${playlist.title}`}
                              className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                                isPlPlaying
                                  ? 'opacity-100 scale-100 translate-y-0'
                                  : 'opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
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
          <section className="animate-fade-up">
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
                    <div
                      key={idx}
                      className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3"
                    >
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
                        onMouseMove={handleSpotlightMove}
                        onClick={() => onPlayTrack(track)}
                        className={`group hover-spotlight card-hover-lift bg-white/[0.05] hover:bg-white/[0.12] border p-3.5 rounded-2xl cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)] ${
                          isThisPlaying
                            ? 'border-[#1ed760]/45 bg-white/[0.09]'
                            : 'border-white/[0.08] hover:border-white/25'
                        }`}
                      >
                        <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
                          <CoverArt
                            src={track.coverUrl}
                            fallbackSrc={track.fallbackCoverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                          />
                          {isThisPlaying && (
                            <div className="absolute left-2 bottom-2 px-2 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#1ed760]/40 flex items-center">
                              <EqualizerBars />
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(track);
                            }}
                            aria-label={`Play ${track.title}`}
                            className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                              isThisPlaying
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
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

        {/* Section 1A: Desi Vibes, 90s Gold & Lo-Fi */}
        {activeFilter !== 'podcasts' && (isLoading || freshTracks.length > 0) && (
          <section className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Disc3 className="w-5 h-5 text-[#1ed760]" />
                <h2
                  onClick={() => setViewState({ type: 'search', searchQuery: '90s hindi hits' })}
                  className="text-2xl font-bold text-white hover:underline cursor-pointer"
                >
                  Desi Vibes, 90s Gold &amp; Lo-Fi
                </h2>
              </div>
              <button
                onClick={() => setViewState({ type: 'search', searchQuery: '90s hindi hits' })}
                className="text-xs font-bold text-[#b3b3b3] hover:underline cursor-pointer"
              >
                Show all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {isLoading && freshTracks.length === 0
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
                : freshTracks.slice(0, 12).map((track) => {
                    const isThisPlaying = isPlaying && currentTrack?.id === track.id;

                    return (
                      <div
                        key={`fresh-${track.id}`}
                        onMouseMove={handleSpotlightMove}
                        onClick={() => onPlayTrack(track, freshTracks)}
                        className={`group hover-spotlight card-hover-lift bg-white/[0.05] hover:bg-white/[0.12] border p-3.5 rounded-2xl cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)] ${
                          isThisPlaying
                            ? 'border-[#1ed760]/45 bg-white/[0.09]'
                            : 'border-white/[0.08] hover:border-white/25'
                        }`}
                      >
                        <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
                          <CoverArt
                            src={track.coverUrl}
                            fallbackSrc={track.fallbackCoverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                          />
                          {isThisPlaying && (
                            <div className="absolute left-2 bottom-2 px-2 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#1ed760]/40 flex items-center">
                              <EqualizerBars />
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(track, freshTracks);
                            }}
                            aria-label={`Play ${track.title}`}
                            className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                              isThisPlaying
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
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
        {activeFilter === 'all' &&
          (isPodcastsLoading || podcastEpisodes.length > 0 || podcastShows.length > 0) && (
            <section className="animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Podcast className="w-5 h-5 text-[#1ed760]" />
                  <h2
                    onClick={() => handleSelectFilter('podcasts')}
                    className="text-2xl font-bold text-white hover:underline cursor-pointer"
                  >
                    Podcasts &amp; Audio Shows
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
                          onMouseMove={handleSpotlightMove}
                          onClick={() => onPlayTrack(episode, podcastEpisodes)}
                          className={`group hover-spotlight card-hover-lift bg-white/[0.05] hover:bg-white/[0.12] border p-3.5 rounded-2xl cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)] ${
                            isThisPlaying
                              ? 'border-[#1ed760]/45 bg-white/[0.09]'
                              : 'border-white/[0.08] hover:border-white/25'
                          }`}
                        >
                          <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
                            <CoverArt
                              src={episode.coverUrl}
                              fallbackSrc={episode.fallbackCoverUrl}
                              alt={episode.title}
                              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                            />
                            <span className="absolute left-2 top-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold text-[#1ed760]">
                              {formatTime(episode.duration)}
                            </span>
                            {isThisPlaying && (
                              <div className="absolute left-2 bottom-2 px-2 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#1ed760]/40 flex items-center">
                                <EqualizerBars />
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayTrack(episode, podcastEpisodes);
                              }}
                              aria-label={`Play ${episode.title}`}
                              className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                                isThisPlaying
                                  ? 'opacity-100 scale-100 translate-y-0'
                                  : 'opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
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
          <section className="animate-fade-up">
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
                    <div
                      key={idx}
                      className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3"
                    >
                      <div className="aspect-square w-full bg-white/10 rounded-full" />
                      <div className="h-4 bg-white/10 rounded w-2/3" />
                      <div className="h-3 bg-white/10 rounded w-1/3" />
                    </div>
                  ))
                : artists.slice(0, 12).map((artist) => {
                    const isArtistPlaying = isPlaying && currentTrack?.artistId === artist.id;

                    return (
                      <div
                        key={artist.id}
                        onMouseMove={handleSpotlightMove}
                        onClick={() => setViewState({ type: 'artist', id: artist.id })}
                        className={`group hover-spotlight card-hover-lift bg-white/[0.05] hover:bg-white/[0.12] border p-3.5 rounded-2xl cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)] ${
                          isArtistPlaying
                            ? 'border-[#1ed760]/45 bg-white/[0.09]'
                            : 'border-white/[0.08] hover:border-white/25'
                        }`}
                      >
                        <div className="relative aspect-square w-full mb-3">
                          <div className="w-full h-full rounded-full overflow-hidden ring-1 ring-white/15 group-hover:ring-[#1ed760]/50 shadow-lg transition-all duration-300">
                            <CoverArt
                              src={artist.avatarUrl}
                              fallbackSrc={artist.fallbackAvatarUrl}
                              alt={artist.name}
                              className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayArtist(artist);
                            }}
                            aria-label={`Play ${artist.name}`}
                            className={`absolute right-1 bottom-1 w-11 h-11 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                              isArtistPlaying
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
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
          <section className="animate-fade-up">
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
                    <div
                      key={idx}
                      className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3"
                    >
                      <div className="aspect-square w-full bg-white/10 rounded-xl" />
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  ))
                : albums.slice(0, 12).map((album) => {
                    const isAlbumPlaying =
                      isPlaying &&
                      (album.tracks.some((t) => t.id === currentTrack?.id) ||
                        currentTrack?.albumId === album.id);

                    return (
                      <div
                        key={album.id}
                        onMouseMove={handleSpotlightMove}
                        onClick={() => setViewState({ type: 'album', id: album.id })}
                        className={`group hover-spotlight card-hover-lift bg-white/[0.05] hover:bg-white/[0.12] border p-3.5 rounded-2xl cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)] ${
                          isAlbumPlaying
                            ? 'border-[#1ed760]/45 bg-white/[0.09]'
                            : 'border-white/[0.08] hover:border-white/25'
                        }`}
                      >
                        <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-md">
                          <CoverArt
                            src={album.coverUrl}
                            fallbackSrc={album.fallbackCoverUrl}
                            alt={album.title}
                            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayAlbum(album);
                            }}
                            aria-label={`Play ${album.title}`}
                            className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                              isAlbumPlaying
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
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
          <section className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2
                onClick={() => setViewState({ type: 'search', searchQuery: 'indian hits' })}
                className="text-2xl font-bold text-white hover:underline cursor-pointer"
              >
                Featured Charts &amp; Playlists
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
                    <div
                      key={idx}
                      className="bg-white/[0.05] border border-white/10 p-3.5 rounded-2xl animate-pulse space-y-3"
                    >
                      <div className="aspect-square w-full bg-white/10 rounded-xl" />
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  ))
                : playlists.slice(0, 12).map((playlist) => {
                    const isPlPlaying =
                      isPlaying && playlist.tracks.some((t) => t.id === currentTrack?.id);

                    return (
                      <div
                        key={playlist.id}
                        onMouseMove={handleSpotlightMove}
                        onClick={() => setViewState({ type: 'playlist', id: playlist.id })}
                        className={`group hover-spotlight card-hover-lift bg-white/[0.05] hover:bg-white/[0.12] border p-3.5 rounded-2xl cursor-pointer flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_28px_rgba(0,0,0,0.3)] ${
                          isPlPlaying
                            ? 'border-[#1ed760]/45 bg-white/[0.09]'
                            : 'border-white/[0.08] hover:border-white/25'
                        }`}
                      >
                        <div className="relative aspect-square w-full mb-3 rounded-xl overflow-hidden ring-1 ring-white/15 shadow-md">
                          <CoverArt
                            src={playlist.coverUrl}
                            fallbackSrc={playlist.fallbackCoverUrl}
                            alt={playlist.title}
                            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayPlaylist(playlist);
                            }}
                            aria-label={`Play ${playlist.title}`}
                            className={`absolute right-2 bottom-2 w-11 h-11 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-[transform,opacity,background-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                              isPlPlaying
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
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
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Jobs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    For the Record
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">Communities</h4>
              <ul className="space-y-2 text-[#a7a7a7]">
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    For Artists
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Developers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Advertising
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Investors
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Vendors
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">Useful links</h4>
              <ul className="space-y-2 text-[#a7a7a7]">
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Free Mobile App
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Popular by Country
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-white text-base">Spotify Plans</h4>
              <ul className="space-y-2 text-[#a7a7a7]">
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Premium Individual
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Premium Duo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Premium Family
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Premium Student
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Spotify Free
                  </a>
                </li>
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
              <a href="#" className="hover:text-white hover:underline">
                Legal
              </a>
              <a href="#" className="hover:text-white hover:underline">
                Safety &amp; Privacy Center
              </a>
              <a href="#" className="hover:text-white hover:underline">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white hover:underline">
                Cookies
              </a>
              <a href="#" className="hover:text-white hover:underline">
                About Ads
              </a>
              <a href="#" className="hover:text-white hover:underline">
                Accessibility
              </a>
            </div>
            <div>© 2026 Spotify AB</div>
          </div>
        </footer>
      </div>
    </div>
  );
};
