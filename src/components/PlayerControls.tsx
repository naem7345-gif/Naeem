import React, { useState, useRef, useEffect } from 'react';
import {
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Maximize2,
  Mic2,
  ListMusic,
  PictureInPicture2,
  ChevronUp,
  AudioLines,
} from 'lucide-react';
import { Track } from '../types/spotify';
import { formatTime, calculateProgressPercentage } from '../utils/audioUtils';
import { SoundPresetId, getPresetConfig } from '../services/audioEnhancer';
import { CoverArt } from './CoverArt';

interface PlayerControlsProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentTime: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onCycleRepeat: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  isRightDrawerOpen: boolean;
  onToggleRightDrawer: () => void;
  isLyricsOpen: boolean;
  onToggleLyrics: () => void;
  onOpenFullPlayer: () => void;
  soundPreset: SoundPresetId;
  onCycleSoundPreset: () => void;
  onTrackTitleClick?: () => void;
  onArtistClick?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  currentTime,
  onSeek,
  volume,
  onVolumeChange,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
  isLiked,
  onToggleLike,
  isRightDrawerOpen,
  onToggleRightDrawer,
  isLyricsOpen,
  onToggleLyrics,
  onOpenFullPlayer,
  soundPreset,
  onCycleSoundPreset,
  onTrackTitleClick,
  onArtistClick,
}) => {
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  const duration = currentTrack?.duration || 0;
  const progressPct = calculateProgressPercentage(currentTime, duration);

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume > 0 ? prevVolume : 0.7);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const handleVolumeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setIsMuted(val === 0);
    onVolumeChange(val);
  };

  return (
    <footer className="relative h-[86px] lg:h-[94px] px-4 bg-white/[0.05] backdrop-blur-2xl border-t border-white/10 rounded-t-3xl flex items-center justify-between select-none z-40 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      {/* Subtle Top Fold-Up Tab */}
      {currentTrack && (
        <button
          onClick={onOpenFullPlayer}
          aria-label="Unfold medium player card"
          title="Unfold player card"
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-xl text-white/75 hover:text-white flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-md"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Left: Track Details */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[200px]">
        {currentTrack ? (
          <>
            <div
              onClick={onOpenFullPlayer}
              className="relative group shrink-0 w-15 h-15 rounded-xl overflow-hidden ring-1 ring-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.5)] cursor-pointer"
              title="Open medium player"
            >
              <CoverArt
                src={currentTrack.coverUrl}
                fallbackSrc={currentTrack.fallbackCoverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFullPlayer();
                }}
                aria-label="Open full player"
                className="absolute inset-0 bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col min-w-0 pr-2">
              <span
                onClick={onTrackTitleClick}
                className="text-white text-sm font-medium truncate hover:underline cursor-pointer"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </span>
              <span
                onClick={onArtistClick}
                className="text-[#b3b3b3] text-xs truncate hover:underline hover:text-white cursor-pointer mt-0.5"
              >
                {currentTrack.artist}
              </span>
            </div>

            <button
              onClick={onToggleLike}
              aria-label={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
              className="text-[#b3b3b3] hover:text-white p-1 hover:scale-110 transition-transform cursor-pointer shrink-0"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked ? 'text-[#1ed760] fill-[#1ed760]' : ''
                }`}
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded bg-[#282828] animate-pulse" />
            <div>
              <p className="text-sm text-white font-medium">Select a song to play</p>
              <p className="text-xs text-[#a7a7a7]">Ready to stream</p>
            </div>
          </div>
        )}
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex flex-col items-center max-w-xl w-2/4">
        {/* Buttons Row */}
        <div className="flex items-center gap-4 lg:gap-6 mb-1">
          {/* Shuffle */}
          <button
            onClick={onToggleShuffle}
            aria-label="Enable shuffle"
            className={`relative p-1.5 transition-all cursor-pointer ${
              isShuffle ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1ed760]" />
            )}
          </button>

          {/* Previous */}
          <button
            onClick={onPrevious}
            aria-label="Previous"
            className="text-[#b3b3b3] hover:text-white transition-transform hover:scale-105 cursor-pointer p-1"
          >
            <SkipBack className="w-4 h-4 fill-current stroke-none" />
          </button>

          {/* Play / Pause Circular Main Button */}
          <button
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
          >
            {isPlaying ? (
              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current" aria-hidden="true">
                <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current translate-x-[0.5px]" aria-hidden="true">
                <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            aria-label="Next"
            className="text-[#b3b3b3] hover:text-white transition-transform hover:scale-105 cursor-pointer p-1"
          >
            <SkipForward className="w-4 h-4 fill-current stroke-none" />
          </button>

          {/* Repeat */}
          <button
            onClick={onCycleRepeat}
            aria-label="Repeat mode"
            className={`relative p-1.5 transition-all cursor-pointer ${
              repeatMode !== 'off' ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
            {repeatMode !== 'off' && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1ed760]" />
            )}
          </button>
        </div>

        {/* Scrubber Bar */}
        <div
          className="w-full flex items-center gap-2 text-[11px] font-medium text-[#a7a7a7]"
          onMouseEnter={() => setIsHoveringScrubber(true)}
          onMouseLeave={() => setIsHoveringScrubber(false)}
        >
          <span className="w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center h-4 cursor-pointer group">
            {/* Background track */}
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-colors ${
                  isHoveringScrubber ? 'bg-[#1ed760]' : 'bg-white'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {/* Scrubber knob */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md transition-opacity pointer-events-none ${
                isHoveringScrubber ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
            {/* Transparent native range slider on top */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              aria-label="Change progress"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="w-9 text-left tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Auxiliary Controls */}
      <div className="flex items-center gap-2.5 w-1/4 justify-end min-w-[220px]">
        {/* Sound Enhancer Preset Cycle */}
        <button
          onClick={onCycleSoundPreset}
          aria-label={`Sound Enhancer: ${getPresetConfig(soundPreset).label}`}
          title={`Sound Enhancer (${getPresetConfig(soundPreset).label}) — Click to switch`}
          className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
            soundPreset !== 'flat'
              ? 'bg-[#1ed760]/15 border-[#1ed760]/40 text-[#1ed760] hover:bg-[#1ed760]/25'
              : 'bg-white/[0.06] border-white/10 text-[#b3b3b3] hover:text-white'
          }`}
        >
          <AudioLines className="w-3.5 h-3.5 shrink-0" />
          <span>{getPresetConfig(soundPreset).shortLabel}</span>
        </button>

        {/* Now Playing View */}
        <button
          onClick={onToggleRightDrawer}
          aria-label="Now Playing View"
          title="Now playing view"
          className={`p-1.5 transition-all cursor-pointer ${
            isRightDrawerOpen ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <PictureInPicture2 className="w-4 h-4" />
        </button>

        {/* Lyrics */}
        <button
          onClick={onToggleLyrics}
          aria-label="Lyrics"
          title="Lyrics"
          className={`p-1.5 transition-all cursor-pointer ${
            isLyricsOpen ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Queue */}
        <button
          onClick={onToggleRightDrawer}
          aria-label="Queue"
          title="Queue"
          className="text-[#b3b3b3] hover:text-white p-1.5 cursor-pointer"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        {/* Volume */}
        <div
          className="flex items-center gap-2 w-28 group"
          onMouseEnter={() => setIsHoveringVolume(true)}
          onMouseLeave={() => setIsHoveringVolume(false)}
        >
          <button
            onClick={handleToggleMute}
            aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
            className="text-[#b3b3b3] hover:text-white cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <div className="relative flex-1 flex items-center h-4 cursor-pointer">
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-colors ${
                  isHoveringVolume ? 'bg-[#1ed760]' : 'bg-white'
                }`}
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md transition-opacity pointer-events-none ${
                isHoveringVolume ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeInput}
              aria-label="Change volume"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Full Player Card Toggle */}
        <button
          onClick={onOpenFullPlayer}
          aria-label="Open full player card"
          title="Open full player"
          className="text-[#b3b3b3] hover:text-white p-1.5 cursor-pointer hidden sm:block hover:scale-105 transition-transform"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
