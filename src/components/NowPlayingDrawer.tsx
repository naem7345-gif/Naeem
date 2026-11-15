import React, { useEffect, useState } from 'react';
import { X, Heart, MoreHorizontal, Play } from 'lucide-react';
import { Track, Artist } from '../types/spotify';
import { getArtistDetails, getRelatedTracks } from '../services/musicApi';
import { CoverArt } from './CoverArt';
import { handleSpotlightMove } from '../utils/hoverSpotlight';

interface NowPlayingDrawerProps {
  currentTrack: Track | null;
  onClose: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  nextTrack: Track | null;
  onPlayNext: () => void;
  onPlayTrack: (track: Track) => void;
  onOpenLyrics: () => void;
}

export const NowPlayingDrawer: React.FC<NowPlayingDrawerProps> = ({
  currentTrack,
  onClose,
  isLiked,
  onToggleLike,
  nextTrack,
  onPlayNext,
  onPlayTrack,
  onOpenLyrics,
}) => {
  const [artistDetails, setArtistDetails] = useState<Artist | null>(null);
  const [relatedNext, setRelatedNext] = useState<Track | null>(null);

  useEffect(() => {
    let active = true;
    if (!currentTrack) return;

    setArtistDetails(null);
    setRelatedNext(null);

    if (currentTrack.artistId) {
      getArtistDetails(currentTrack.artistId).then((art) => {
        if (active && art) setArtistDetails(art);
      });
    }

    getRelatedTracks(currentTrack.id).then((tracks) => {
      if (active && tracks.length > 0) {
        setRelatedNext(tracks[0]);
      }
    });

    return () => {
      active = false;
    };
  }, [currentTrack?.id, currentTrack?.artistId]);

  if (!currentTrack) return null;

  const artistName = artistDetails?.name || currentTrack.artist;
  const artistAvatar = artistDetails?.avatarUrl || currentTrack.coverUrl;
  const artistFallbackAvatar = artistDetails?.fallbackAvatarUrl || currentTrack.fallbackCoverUrl;
  const artistListeners = artistDetails?.monthlyListeners || 'Verified Artist';
  const artistBio =
    artistDetails?.bio ||
    currentTrack.dnaSummary ||
    'Streaming lossless and high-definition tracks via Headphonix API.';

  const queueTrack = nextTrack || relatedNext;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex justify-end p-2 lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:backdrop-blur-none lg:p-0"
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-right w-full max-w-[360px] lg:w-80 h-full bg-[#10141c]/95 lg:bg-white/[0.05] backdrop-blur-2xl border border-white/15 lg:border-white/10 rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto no-scrollbar select-none shrink-0 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_20px_50px_rgba(0,0,0,0.65)]"
      >
      {/* Header */}
      <div className="flex items-center justify-between text-white">
        <h2 className="font-bold text-base hover:underline cursor-pointer truncate pr-2">
          {currentTrack.album}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close now playing view"
          className="p-1.5 hover:bg-white/10 rounded-full text-[#b3b3b3] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Large Cover Art */}
      <div className="group relative rounded-2xl overflow-hidden ring-1 ring-white/15 shadow-2xl aspect-square w-full">
        <CoverArt
          src={currentTrack.coverUrl}
          fallbackSrc={currentTrack.fallbackCoverUrl}
          alt={currentTrack.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
      </div>

      {/* Song Details + Action */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <h3 className="font-bold text-xl text-white truncate hover:underline cursor-pointer">
            {currentTrack.title}
          </h3>
          <p className="text-sm text-[#b3b3b3] hover:text-white hover:underline cursor-pointer mt-0.5 truncate">
            {currentTrack.artist}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleLike}
            aria-label="Like"
            className="p-1.5 text-[#b3b3b3] hover:text-white hover:scale-110 transition-transform cursor-pointer"
          >
            <Heart
              className={`w-5 h-5 ${
                isLiked ? 'text-[#1ed760] fill-[#1ed760]' : ''
              }`}
            />
          </button>
          <button
            aria-label="More"
            className="p-1.5 text-[#b3b3b3] hover:text-white hover:scale-110 transition-transform cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* About the artist card */}
      <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative group shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="h-44 relative">
          <CoverArt
            src={artistAvatar}
            fallbackSrc={artistFallbackAvatar}
            alt={artistName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
          <span className="absolute top-3 left-3 text-xs font-bold text-white bg-black/50 backdrop-blur-md border border-white/15 px-2.5 py-0.5 rounded-full">
            About the artist
          </span>
        </div>

        <div className="p-4 space-y-3">
          <h4 className="font-bold text-base text-white hover:underline cursor-pointer">
            {artistName}
          </h4>
          <div className="flex items-center justify-between text-xs text-[#b3b3b3]">
            <span>{artistListeners}</span>
            <button className="border border-white/25 hover:border-white bg-white/[0.06] text-white font-bold px-3 py-1 rounded-full hover:scale-105 transition-all cursor-pointer">
              Follow
            </button>
          </div>
          <p className="text-xs text-[#a7a7a7] line-clamp-3 leading-relaxed">
            {artistBio}
          </p>
        </div>
      </div>

      {/* Next In Queue Card */}
      {queueTrack && (
        <div
          onMouseMove={handleSpotlightMove}
          className="hover-spotlight bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-white/20 p-3 rounded-2xl space-y-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors duration-200"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#b3b3b3]">
            <span>Next in queue</span>
            <button
              onClick={() => (nextTrack ? onPlayNext() : onPlayTrack(queueTrack))}
              className="hover:text-white hover:underline cursor-pointer"
            >
              Play next
            </button>
          </div>
          <div
            onClick={() => (nextTrack ? onPlayNext() : onPlayTrack(queueTrack))}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/[0.08] transition-all duration-200 hover:translate-x-0.5 cursor-pointer group"
          >
            <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/20">
              <CoverArt
                src={queueTrack.coverUrl}
                fallbackSrc={queueTrack.fallbackCoverUrl}
                alt={queueTrack.title}
                className="w-full h-full object-cover shadow transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{queueTrack.title}</p>
              <p className="text-xs text-[#a7a7a7] truncate">{queueTrack.artist}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Snippet Card */}
      {currentTrack.lyrics && currentTrack.lyrics.length > 0 && (
        <div
          onMouseMove={handleSpotlightMove}
          onClick={onOpenLyrics}
          className="hover-spotlight bg-gradient-to-br from-[#1e4a38]/80 to-white/[0.05] backdrop-blur-xl border border-white/15 hover:border-[#1ed760]/40 p-4 rounded-2xl cursor-pointer hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-md hover:shadow-xl"
        >
          <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
            <span>Lyrics</span>
            <span className="text-[#1ed760] hover:underline">Show full</span>
          </div>
          <p className="text-lg font-bold text-white/90 leading-snug">
            "{currentTrack.lyrics[0]}"
          </p>
          {currentTrack.lyrics[1] && (
            <p className="text-sm text-[#b3b3b3] mt-1">{currentTrack.lyrics[1]}</p>
          )}
        </div>
      )}
      </aside>
    </div>
  );
};
