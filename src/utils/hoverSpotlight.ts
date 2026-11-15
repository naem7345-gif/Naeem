import type React from 'react';

export interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SpotlightCoords {
  mx: string;
  my: string;
}

const pendingRafMap = new WeakMap<HTMLElement, number>();
const latestCoordsMap = new WeakMap<HTMLElement, SpotlightCoords>();

/**
 * Pure computation of element-relative spotlight coordinates.
 */
export function computeSpotlightCoords(
  clientX: number,
  clientY: number,
  rect: SpotlightRect
): SpotlightCoords | null {
  if (!rect.width || !rect.height) return null;
  const x = Math.round(clientX - rect.left);
  const y = Math.round(clientY - rect.top);
  return {
    mx: `${x}px`,
    my: `${y}px`,
  };
}

/**
 * Updates CSS custom properties (--mx, --my) on the hovered element for a
 * zero-re-render, rAF-coalesced GPU-friendly cursor spotlight glow effect.
 */
export function handleSpotlightMove(e: React.MouseEvent<HTMLElement>): void {
  const el = e.currentTarget;
  const coords = computeSpotlightCoords(e.clientX, e.clientY, el.getBoundingClientRect());
  if (!coords) return;

  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    latestCoordsMap.set(el, coords);
    if (pendingRafMap.has(el)) return;
    const rafId = window.requestAnimationFrame(() => {
      pendingRafMap.delete(el);
      const latest = latestCoordsMap.get(el);
      if (!latest) return;
      el.style.setProperty('--mx', latest.mx);
      el.style.setProperty('--my', latest.my);
    });
    pendingRafMap.set(el, rafId);
    return;
  }

  el.style.setProperty('--mx', coords.mx);
  el.style.setProperty('--my', coords.my);
}
