import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Mic2,
  ListMusic,
  Disc3,
  AudioLines,
} from 'lucide-react';
import { Track } from '../types/spotify';
import { formatTime, calculateProgressPercentage } from '../utils/audioUtils';
import { findActiveLyricIndex } from '../services/musicApi';
import {
  SoundPresetId,
  SOUND_PRESET_ORDER,
  SOUND_PRESETS,
} from '../services/audioEnhancer';
import { CoverArt } from './CoverArt';
import { BubbleButton } from './BubbleButton';

interface FullPlayerCardProps {
  isOpen: boolean;
  currentTrack: Track | null;
  trackList: Track[];
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSelectTrack: (track: Track) => void;
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
  soundPreset: SoundPresetId;
  onSelectSoundPreset: (preset: SoundPresetId) => void;
  onArtistClick?: () => void;
  onAlbumClick?: () => void;
  onClose: () => void;
}

export const FullPlayerCard: React.FC<FullPlayerCardProps> = ({
  isOpen,
  currentTrack,
  trackList,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onSelectTrack,
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
  soundPreset,
  onSelectSoundPreset,
  onArtistClick,
  onAlbumClick,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'lyrics'>('queue');
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!currentTrack) return null;

  const duration = currentTrack.duration || 0;
  const progressPct = calculateProgressPercentage(currentTime, duration);
  const syncedLines = currentTrack.syncedLyrics;
  const plainLines = currentTrack.lyrics;
  const hasLyrics =
    (syncedLines && syncedLines.length > 0) ||
    (plainLines && plainLines.length > 0);
  const activeLyricIndex = findActiveLyricIndex(currentTrack, currentTime);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm transition-opacity duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        role="dialog"
        aria-label="Medium Player Card"
        aria-hidden={!isOpen}
        style={{ transformOrigin: 'bottom center' }}
        className={`fixed bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100vw-16px)] sm:w-[min(94vw,700px)] max-h-[calc(100dvh-16px)] overflow-y-auto no-scrollbar rounded-3xl bg-[#10141c]/95 backdrop-blur-3xl border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_28px_80px_rgba(0,0,0,0.85)] select-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen
            ? 'translate-y-0 scale-y-100 scale-x-100 opacity-100 pointer-events-auto'
            : 'translate-y-[115%] scale-y-50 scale-x-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Subtle Blurred Artwork Ambient Glow Inside Card */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-35">
          <CoverArt
            src={currentTrack.coverUrl}
            fallbackSrc={currentTrack.fallbackCoverUrl}
            alt=""
            className="w-full h-full object-cover scale-125 blur-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/60 to-black/85" />
        </div>

        <div className="relative z-10 flex flex-col">
          {/* Top Fold-Down Handle Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Disc3 className={`w-3.5 h-3.5 text-[#1ed760] ${isPlaying ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <p
                onClick={() => {
                  onAlbumClick?.();
                  onClose();
                }}
                className="text-xs font-bold text-white truncate hover:underline cursor-pointer"
              >
                {currentTrack.album}
              </p>
            </div>
          </div>

          {/* Center Fold Pill */}
          <button
            onClick={onClose}
            aria-label="Fold player down"
            title="Fold player down"
            className="hidden sm:flex items-center justify-center w-12 h-1.5 rounded-full bg-white/25 hover:bg-white/45 transition-colors cursor-pointer"
          />

          <div className="flex items-center gap-2 shrink-0">
            {currentTrack.quality && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-white/80">
                {currentTrack.quality}
              </span>
            )}
            <BubbleButton
              onClick={onClose}
              aria-label="Fold player card"
              title="Fold down"
              className="w-8 h-8 rounded-full text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </BubbleButton>
          </div>
        </div>

        {/* Medium Player Body: Compact 2-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 p-4 sm:p-5 items-center">
          {/* Left Stage: Medium Cover + Track Info + Controls */}
          <div className="md:col-span-6 flex flex-col items-center gap-3.5">
            <div className="flex items-center gap-4 w-full">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-2xl shrink-0">
                <CoverArt
                  src={currentTrack.coverUrl}
                  fallbackSrc={currentTrack.fallbackCoverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                  {currentTrack.title}
                </h2>
                <p
                  onClick={() => {
                    onArtistClick?.();
                    onClose();
                  }}
                  className="text-xs sm:text-sm text-white/70 hover:text-white hover:underline cursor-pointer truncate mt-0.5"
                >
                  {currentTrack.artist}
                </p>

                <BubbleButton
                  bubbleVariant="pill"
                  onClick={onToggleLike}
                  aria-label={isLiked ? 'Remove from Your Library' : 'Save to Your Library'}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs font-semibold text-white cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors ${
                      isLiked ? 'text-[#1ed760] fill-[#1ed760]' : 'text-white/80'
                    }`}
                  />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </BubbleButton>
              </div>
            </div>

            {/* Scrubber */}
            <div
              className="w-full space-y-1"
              onMouseEnter={() => setIsHoveringScrubber(true)}
              onMouseLeave={() => setIsHoveringScrubber(false)}
            >
              <div className="relative flex items-center h-4 cursor-pointer">
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-colors ${
                      isHoveringScrubber ? 'bg-[#1ed760]' : 'bg-white'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md pointer-events-none"
                  style={{ left: `calc(${progressPct}% - 6px)` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  aria-label="Medium player progress"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-white/60 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Transport Controls — 3D Water Bubble Buttons */}
            <div className="flex items-center justify-center gap-3.5">
              <BubbleButton
                waterPhase={0}
                onClick={onToggleShuffle}
                aria-label="Toggle shuffle"
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isShuffle ? 'text-[#1ed760]' : 'text-white/75 hover:text-white'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </BubbleButton>

              <BubbleButton
                waterPhase={1}
                onClick={onPrevious}
                aria-label="Previous track"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/85 hover:text-white cursor-pointer"
              >
                <SkipBack className="w-5 h-5 fill-current stroke-none" />
              </BubbleButton>

              <BubbleButton
                bubbleVariant="primary"
                waterPhase={2}
                onClick={onPlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center cursor-pointer"
              >
                {isPlaying ? (
                  <svg viewBox="0 0 16 16" className="w-4.5 h-4.5 fill-current" aria-hidden="true">
                    <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="w-4.5 h-4.5 fill-current translate-x-[0.5px]" aria-hidden="true">
                    <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z" />
                  </svg>
                )}
              </BubbleButton>

              <BubbleButton
                waterPhase={3}
                onClick={onNext}
                aria-label="Next track"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/85 hover:text-white cursor-pointer"
              >
                <SkipForward className="w-5 h-5 fill-current stroke-none" />
              </BubbleButton>

              <BubbleButton
                waterPhase={4}
                onClick={onCycleRepeat}
                aria-label="Cycle repeat"
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  repeatMode !== 'off' ? 'text-[#1ed760]' : 'text-white/75 hover:text-white'
                }`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </BubbleButton>
            </div>

            {/* Volume & Sound Preset Selector */}
            <div className="w-full space-y-2.5 flex flex-col items-center">
              <div className="w-full max-w-[230px] flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10">
                <BubbleButton
                  onClick={() => onVolumeChange(volume === 0 ? 0.7 : 0)}
                  aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/75 hover:text-white cursor-pointer shrink-0"
                >
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </BubbleButton>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  aria-label="Medium player volume"
                  className="flex-1 h-1 accent-[#1ed760] cursor-pointer"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <AudioLines className="w-3.5 h-3.5 text-[#1ed760] mr-0.5 shrink-0" />
                {SOUND_PRESET_ORDER.map((id, idx) => {
                  const cfg = SOUND_PRESETS[id];
                  const active = soundPreset === id;
                  return (
                    <BubbleButton
                      bubbleVariant="pill"
                      waterPhase={idx}
                      key={id}
                      onClick={() => onSelectSoundPreset(id)}
                      title={cfg.description}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer ${
                        active
                          ? 'bg-[#1ed760] text-black border-[#1ed760]'
                          : 'bg-white/[0.06] text-white/70 border-white/10 hover:bg-white/[0.12] hover:text-white'
                      }`}
                    >
                      {cfg.shortLabel}
                    </BubbleButton>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Compact Queue & Lyrics Panel */}
          <div className="md:col-span-6 flex flex-col rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl overflow-hidden h-[200px] sm:h-[250px]">
            <div className="flex items-center gap-2 p-2.5 border-b border-white/10 bg-white/[0.03]">
              <BubbleButton
                bubbleVariant="pill"
                onClick={() => setActiveTab('queue')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-white text-black shadow'
                    : 'bg-white/[0.06] text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Up Next</span>
              </BubbleButton>
              <BubbleButton
                bubbleVariant="pill"
                onClick={() => setActiveTab('lyrics')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                  activeTab === 'lyrics'
                    ? 'bg-white text-black shadow'
                    : 'bg-white/[0.06] text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5" />
                <span>Lyrics</span>
              </BubbleButton>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1 no-scrollbar">
              {activeTab === 'queue' ? (
                trackList.length === 0 ? (
                  <p className="text-xs text-white/50 text-center py-10">Queue is empty.</p>
                ) : (
                  trackList.map((track, idx) => {
                    const isCurrent = track.id === currentTrack.id;
                    return (
                      <div
                        key={`${track.id}-${idx}`}
                        onClick={() => onSelectTrack(track)}
                        className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-all cursor-pointer border ${
                          isCurrent
                            ? 'bg-white/[0.14] border-white/20'
                            : 'bg-transparent border-transparent hover:bg-white/[0.08] hover:border-white/10'
                        }`}
                      >
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-white/15 shrink-0">
                          <CoverArt
                            src={track.coverUrl}
                            fallbackSrc={track.fallbackCoverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isCurrent ? 'text-[#1ed760]' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </p>
                          <p className="text-[11px] text-white/60 truncate">{track.artist}</p>
                        </div>
                        <span className="text-[11px] text-white/50 tabular-nums shrink-0 pr-1">
                          {formatTime(track.duration)}
                        </span>
                      </div>
                    );
                  })
                )
              ) : !hasLyrics ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-3">
                  <p className="text-sm font-bold text-white/80">
                    Lyrics unavailable for this track
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">
                    Try another track or enjoy the stream.
                  </p>
                </div>
              ) : syncedLines && syncedLines.length > 0 ? (
                <div className="space-y-2 p-1.5">
                  {syncedLines.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <p
                        key={`${line.timeSec}-${idx}`}
                        onClick={() => onSeek(line.timeSec)}
                        className={`text-sm font-bold transition-all cursor-pointer rounded-xl px-2 py-1 ${
                          isActive
                            ? 'text-white bg-white/10'
                            : idx < activeLyricIndex
                            ? 'text-white/55 hover:text-white/80'
                            : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 p-1.5">
                  {plainLines!.map((line, idx) => (
                    <p
                      key={idx}
                      className={`text-sm font-bold ${
                        idx === activeLyricIndex ? 'text-white' : 'text-white/50'
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
