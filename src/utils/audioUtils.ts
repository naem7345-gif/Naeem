/**
 * Formatting and playback utility functions
 */

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function calculateProgressPercentage(current: number, total: number): number {
  if (!total || total <= 0) return 0;
  const pct = (current / total) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

export function getNextTrackIndex(
  currentIndex: number,
  totalTracks: number,
  isShuffle: boolean,
  shuffleQueue: number[] = []
): number {
  if (totalTracks <= 1) return 0;
  if (isShuffle && shuffleQueue.length > 0) {
    const queueIdx = shuffleQueue.indexOf(currentIndex);
    if (queueIdx !== -1 && queueIdx + 1 < shuffleQueue.length) {
      return shuffleQueue[queueIdx + 1];
    }
    return shuffleQueue[0];
  }
  return (currentIndex + 1) % totalTracks;
}

export function getPreviousTrackIndex(
  currentIndex: number,
  totalTracks: number,
  isShuffle: boolean,
  shuffleQueue: number[] = []
): number {
  if (totalTracks <= 1) return 0;
  if (isShuffle && shuffleQueue.length > 0) {
    const queueIdx = shuffleQueue.indexOf(currentIndex);
    if (queueIdx > 0) {
      return shuffleQueue[queueIdx - 1];
    }
    return shuffleQueue[shuffleQueue.length - 1];
  }
  return (currentIndex - 1 + totalTracks) % totalTracks;
}

export function generateShuffleIndices(count: number, currentIdx: number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Ensure currentIdx is at the front if present
  const existingIdx = indices.indexOf(currentIdx);
  if (existingIdx > 0) {
    indices.splice(existingIdx, 1);
    indices.unshift(currentIdx);
  }
  return indices;
}
