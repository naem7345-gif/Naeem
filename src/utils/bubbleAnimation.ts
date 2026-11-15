export interface BubbleBurstState {
  burstKey: number;
  hasBurst: boolean;
}

export interface WaterDropletSpec {
  id: number;
  positionClass: string;
  sizeClass: string;
  animationClass: string;
}

export const WATER_DROPLETS: readonly WaterDropletSpec[] = [
  {
    id: 1,
    positionClass: '-top-1 left-[18%]',
    sizeClass: 'w-2 h-2',
    animationClass: 'animate-water-droplet-1',
  },
  {
    id: 2,
    positionClass: '-top-0.5 right-[18%]',
    sizeClass: 'w-1.5 h-1.5',
    animationClass: 'animate-water-droplet-2',
  },
  {
    id: 3,
    positionClass: 'top-1 -left-1',
    sizeClass: 'w-1.5 h-1.5',
    animationClass: 'animate-water-droplet-3',
  },
  {
    id: 4,
    positionClass: 'top-0.5 -right-1',
    sizeClass: 'w-2.5 h-2.5',
    animationClass: 'animate-water-droplet-4',
  },
];

/**
 * Pure state transition for player water-bubble button click bursts.
 * Disabled buttons never trigger a burst animation.
 */
export function advanceBubbleBurst(
  currentKey: number,
  disabled?: boolean
): BubbleBurstState {
  if (disabled) {
    const safeKey = Number.isFinite(currentKey) && currentKey > 0 ? Math.floor(currentKey) : 0;
    return {
      burstKey: safeKey,
      hasBurst: safeKey > 0,
    };
  }
  const nextKey = Number.isFinite(currentKey) && currentKey >= 0 ? Math.floor(currentKey) + 1 : 1;
  return {
    burstKey: nextKey,
    hasBurst: true,
  };
}

/**
 * Computes deterministic organic phase delay (in ms) for water membrane shimmer
 * so neighboring buttons breathe smoothly out of sync without layout thrash.
 */
export function getWaterPhaseDelayMs(seed: number): number {
  if (!Number.isFinite(seed)) return 0;
  const normalized = Math.abs(Math.floor(seed)) % 6;
  return normalized * 420;
}
