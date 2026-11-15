import React, { useEffect, useState } from 'react';
import { Play, Pause, Heart, Clock3, MoreHorizontal, ArrowDownCircle, Check, Loader2 } from 'lucide-react';
import { Track, Playlist, Album, Artist, ViewState } from '../types/spotify';
import { formatTime } from '../utils/audioUtils';
import {
  getPlaylistDetails,
  getAlbumDetails,
  getArtistDetails,
  DEFAULT_COVER_SVG,
} from '../services/musicApi';
import { CoverArt } from './CoverArt';
import { handleSpotlightMove } from '../utils/hoverSpotlight';

interface DetailViewProps {
  viewState: ViewState;
  playlists: Playlist[];
  albums: Album[];
  artists: Artist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, collection?: Track[]) => void;
  onPlayCollection: (tracks: Track[]) => void;
  likedTrackIds: Set<string>;
  onToggleTrackLike: (trackId: string) => void;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
}

export const DetailView: React.FC<DetailViewProps> = ({
  viewState,
  playlists,
  albums,
  artists,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayCollection,
  likedTrackIds,
  onToggleTrackLike,
  setViewState,
}) => {
  const [fetchedPlaylist, setFetchedPlaylist] = useState<Playlist | null>(null);
  const [fetchedAlbum, setFetchedAlbum] = useState<Album | null>(null);
  const [fetchedArtist, setFetchedArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const id = viewState.id;
    if (!id) return;

    setFetchedPlaylist(null);
    setFetchedAlbum(null);
    setFetchedArtist(null);

    if (viewState.type === 'playlist') {
      if (id === 'playlist-liked' || id.startsWith('playlist-custom-')) {
        return;
      }
      setIsLoading(true);
      getPlaylistDetails(id)
        .then((res) => {
          if (active && res) setFetchedPlaylist(res);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else if (viewState.type === 'album') {
      setIsLoading(true);
      getAlbumDetails(id)
        .then((res) => {
          if (active && res) setFetchedAlbum(res);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else if (viewState.type === 'artist') {
      setIsLoading(true);
      getArtistDetails(id)
        .then((res) => {
          if (active && res) setFetchedArtist(res);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [viewState.type, viewState.id]);

  let title = '';
  let subtitle = '';
  let typeLabel = '';
  let coverUrl = DEFAULT_COVER_SVG;
  let fallbackCoverUrl: string | undefined;
  let tracks: Track[] = [];
  let ambientGradient = 'from-[#3a2020] to-[#121212]';
  let isVerified = false;
  let followersOrLikes = '';

  if (viewState.type === 'playlist') {
    const localPl = playlists.find((p) => p.id === viewState.id);
    const pl = fetchedPlaylist || localPl || playlists[0];
    if (pl) {
      title = pl.title;
      typeLabel = pl.id === 'playlist-liked' ? 'Playlist' : 'Public Playlist';
      subtitle = pl.description;
      coverUrl = pl.coverUrl;
      fallbackCoverUrl = pl.fallbackCoverUrl;
      tracks = pl.tracks.length > 0 ? pl.tracks : localPl?.tracks || [];
      followersOrLikes = pl.followers || `${tracks.length} tracks`;
      ambientGradient = pl.gradient ? pl.gradient : 'from-[#33254e] to-[#121212]';
    }
  } else if (viewState.type === 'album') {
    const localAlb = albums.find((a) => a.id === viewState.id);
    const alb = fetchedAlbum || localAlb || albums[0];
    if (alb) {
      title = alb.title;
      typeLabel = 'Album';
      tracks = alb.tracks.length > 0 ? alb.tracks : localAlb?.tracks || [];
      subtitle = `${alb.artist} • ${alb.year} • ${tracks.length} songs`;
      coverUrl = alb.coverUrl;
      fallbackCoverUrl = alb.fallbackCoverUrl;
      ambientGradient = 'from-[#3a3520] to-[#121212]';
    }
  } else if (viewState.type === 'artist') {
    const localArt = artists.find((a) => a.id === viewState.id);
    const art = fetchedArtist || localArt || artists[0];
    if (art) {
      title = art.name;
      typeLabel = 'Artist';
      subtitle = `${art.monthlyListeners}`;
      coverUrl = art.avatarUrl;
      fallbackCoverUrl = art.fallbackAvatarUrl;
      tracks = art.topTracks.length > 0 ? art.topTracks : localArt?.topTracks || [];
      isVerified = art.verified;
      ambientGradient = 'from-[#2b3a4a] to-[#121212]';
    }
  }

  const isCollectionPlaying =
    isPlaying && tracks.some((t) => t.id === currentTrack?.id);

  const totalDurationSeconds = tracks.reduce((acc, t) => acc + t.duration, 0);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl md:rounded-3xl relative no-scrollbar flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      {/* Header Banner with Ambient Gradient */}
      <div
        className={`p-4 pt-6 pb-6 sm:p-6 sm:pt-12 sm:pb-8 flex flex-col md:flex-row items-center md:items-end text-center md:text-left gap-4 sm:gap-6 bg-gradient-to-b ${ambientGradient} via-black/30 to-transparent transition-colors`}
      >
        <div className="relative shrink-0 shadow-2xl group">
          {viewState.type === 'playlist' && viewState.id === 'playlist-liked' ? (
            <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-2xl bg-gradient-to-br from-[#450af5]/90 to-[#8e8ee5]/90 ring-1 ring-white/25 flex items-center justify-center shadow-2xl relative overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />
              <Heart className="w-16 h-16 sm:w-20 sm:h-20 text-white fill-white relative z-10 transition-transform duration-300 group-hover:scale-110" />
            </div>
          ) : (
            <div
              className={`relative w-36 h-36 sm:w-52 sm:h-52 overflow-hidden ring-1 ring-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] ${
                viewState.type === 'artist' ? 'rounded-full' : 'rounded-2xl'
              }`}
            >
              <CoverArt
                src={coverUrl}
                fallbackSrc={fallbackCoverUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center md:items-start gap-2 z-10 w-full min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {typeLabel}
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none break-words">
            {title || 'Loading...'}
          </h1>
          <p className="text-sm text-[#b3b3b3] mt-2 line-clamp-2 max-w-2xl">{subtitle}</p>

          <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium mt-1">
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-[#1ed760] font-semibold mr-2">
                <Check className="w-4 h-4 bg-white text-black rounded-full p-0.5" />
                Verified Artist
              </span>
            )}
            {followersOrLikes && <span>{followersOrLikes} • </span>}
            <span>{tracks.length} songs, </span>
            <span className="text-[#a7a7a7]">about {Math.ceil(totalDurationSeconds / 60)} min</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-4 sm:gap-6 bg-[#121212]/40 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => onPlayCollection(tracks)}
          disabled={tracks.length === 0}
          aria-label={isCollectionPlaying ? 'Pause' : 'Play'}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {isCollectionPlaying ? (
            <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
          ) : (
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
          )}
        </button>

        <button
          aria-label="Save to Your Library"
          className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer p-1"
        >
          <Heart className="w-7 h-7 sm:w-8 sm:h-8 hover:scale-105 transition-transform" />
        </button>

        <button
          aria-label="Download"
          className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer p-1"
        >
          <ArrowDownCircle className="w-7 h-7 sm:w-8 sm:h-8 hover:scale-105 transition-transform" />
        </button>

        <button
          aria-label="More options"
          className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer p-1"
        >
          <MoreHorizontal className="w-6 h-6 sm:w-7 sm:h-7 hover:scale-105 transition-transform" />
        </button>
      </div>

      {/* Song Table */}
      <div className="px-3 sm:px-6 pb-10 flex-1">
        <div className="grid grid-cols-[20px_1fr_auto] md:grid-cols-[16px_4fr_3fr_2fr_80px] gap-3 sm:gap-4 px-2.5 sm:px-4 py-2 border-b border-[#282828] text-xs font-medium text-[#a7a7a7] uppercase tracking-wider mb-2">
          <span>#</span>
          <span>Title</span>
          <span className="hidden md:inline">Album</span>
          <span className="hidden md:inline">Year</span>
          <span className="text-right flex justify-end">
            <Clock3 className="w-4 h-4" />
          </span>
        </div>

        {isLoading && tracks.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[#b3b3b3] gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#1ed760]" />
            <span className="text-sm">Loading tracks from Headphonix API...</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#a7a7a7]">
            No tracks available in this collection yet.
          </div>
        ) : (
          <div className="space-y-0.5">
            {tracks.map((track, idx) => {
              const isThisTrackPlaying = isPlaying && currentTrack?.id === track.id;
              const isThisTrackCurrent = currentTrack?.id === track.id;
              const isTrackLiked = likedTrackIds.has(track.id);

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onMouseMove={handleSpotlightMove}
                  onClick={() => onPlayTrack(track, tracks)}
                  className={`group hover-spotlight grid grid-cols-[20px_1fr_auto] md:grid-cols-[16px_4fr_3fr_2fr_80px] gap-3 sm:gap-4 px-2.5 sm:px-4 py-2.5 rounded-xl border border-transparent hover:bg-white/[0.09] hover:border-white/15 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0.5 items-center cursor-pointer ${
                    isThisTrackCurrent ? 'bg-white/[0.1] border-white/15' : ''
                  }`}
                >
                  <div className="flex items-center justify-center text-sm font-medium text-[#a7a7a7]">
                    <span className="group-hover:hidden">
                      {isThisTrackPlaying ? (
                        <span className="text-[#1ed760] font-bold">▶</span>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track, tracks);
                      }}
                      aria-label={`Play ${track.title}`}
                      className="hidden group-hover:block text-white hover:text-[#1ed760] hover:scale-110 transition-all duration-150 cursor-pointer"
                    >
                      {isThisTrackPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/20 shadow">
                      <CoverArt
                        src={track.coverUrl}
                        fallbackSrc={track.fallbackCoverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`font-medium text-sm truncate ${
                          isThisTrackCurrent ? 'text-[#1ed760]' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </span>
                      <span
                        onClick={(e) => {
                          if (track.artistId) {
                            e.stopPropagation();
                            setViewState({ type: 'artist', id: track.artistId });
                          }
                        }}
                        className="text-xs text-[#a7a7a7] truncate group-hover:text-white hover:underline"
                      >
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  <span
                    onClick={(e) => {
                      if (track.albumId) {
                        e.stopPropagation();
                        setViewState({ type: 'album', id: track.albumId });
                      }
                    }}
                    className="hidden md:inline text-xs text-[#a7a7a7] truncate hover:underline hover:text-white"
                  >
                    {track.album}
                  </span>

                  <span className="hidden md:inline text-xs text-[#a7a7a7]">
                    {track.releaseYear || '2024'}
                  </span>

                  <div className="flex items-center justify-end gap-3 text-xs text-[#a7a7a7]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTrackLike(track.id);
                      }}
                      aria-label={isTrackLiked ? 'Liked' : 'Like'}
                      className={`transition-opacity p-1 hover:scale-110 ${
                        isTrackLiked
                          ? 'opacity-100 text-[#1ed760]'
                          : 'opacity-0 group-hover:opacity-100 hover:text-white'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isTrackLiked ? 'fill-[#1ed760]' : ''
                        }`}
                      />
                    </button>
                    <span className="tabular-nums">{formatTime(track.duration)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
