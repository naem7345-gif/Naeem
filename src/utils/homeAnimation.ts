import { ViewState } from '../types/spotify';

export interface HomeButtonVisualState {
  isHomeActive: boolean;
  isAmbientRingVisible: boolean;
  isPulseActive: boolean;
}

/**
 * Pure state helper for the Home button's GPU-composited animations.
 */
export function getHomeButtonVisualState(
  viewType: ViewState['type'],
  pulseKey: number
): HomeButtonVisualState {
  const isHomeActive = viewType === 'home';
  return {
    isHomeActive,
    isAmbientRingVisible: isHomeActive,
    isPulseActive: pulseKey > 0,
  };
}

/**
 * Advances the monotonic click pulse counter so every tap replays the GPU pop/ripple.
 */
export function getNextHomePulseKey(currentKey: number): number {
  if (!Number.isFinite(currentKey) || currentKey < 0) {
    return 1;
  }
  return Math.floor(currentKey) + 1;
}
