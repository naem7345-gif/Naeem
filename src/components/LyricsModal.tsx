import React from 'react';
import { X, Mic2 } from 'lucide-react';
import { Track } from '../types/spotify';
import { findActiveLyricIndex } from '../services/musicApi';

interface LyricsModalProps {
  currentTrack: Track | null;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose: () => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  currentTrack,
  currentTime,
  onSeek,
  onClose,
}) => {
  if (!currentTrack) return null;

  const syncedLines = currentTrack.syncedLyrics;
  const plainLines = currentTrack.lyrics;
  const hasLyrics =
    (syncedLines && syncedLines.length > 0) ||
    (plainLines && plainLines.length > 0);

  const activeLineIndex = findActiveLyricIndex(currentTrack, currentTime);

  return (
    <div className="animate-modal-pop fixed inset-0 md:absolute bg-[#111e18]/96 backdrop-blur-2xl z-[70] md:z-40 flex flex-col p-4 sm:p-8 pb-12 overflow-y-auto select-none transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 sm:pb-6 border-b border-white/10 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Mic2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#1ed760] shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">{currentTrack.title}</h2>
            <p className="text-xs sm:text-sm text-white/60 truncate">{currentTrack.artist}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close lyrics"
          className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Lyrics lines */}
      {!hasLyrics ? (
        <div className="max-w-3xl w-full mx-auto py-24 flex-1 flex flex-col items-center justify-center text-center space-y-2">
          <p className="text-2xl font-bold text-white/80">
            Looks like we don't have the lyrics for this song yet.
          </p>
          <p className="text-sm text-white/50">
            Enjoy the lossless audio stream in the meantime!
          </p>
        </div>
      ) : syncedLines && syncedLines.length > 0 ? (
        <div className="max-w-3xl w-full mx-auto py-12 space-y-5 flex-1">
          {syncedLines.map((line, idx) => {
            const isActive = idx === activeLineIndex;
            const isPassed = idx < activeLineIndex;

            return (
              <p
                key={`${line.timeSec}-${idx}`}
                onClick={() => onSeek(line.timeSec)}
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'text-white scale-102 translate-x-2'
                    : isPassed
                    ? 'text-white/60 hover:text-white/80'
                    : 'text-white/25 hover:text-white/50'
                }`}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      ) : (
        <div className="max-w-3xl w-full mx-auto py-12 space-y-6 flex-1">
          {plainLines!.map((line, idx) => {
            const isActive = idx === activeLineIndex;
            const isPassed = idx < activeLineIndex;

            return (
              <p
                key={idx}
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'text-white scale-102 translate-x-2'
                    : isPassed
                    ? 'text-white/60'
                    : 'text-white/25 hover:text-white/40'
                }`}
              >
                {line}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};
