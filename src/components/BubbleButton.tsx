import React, { useState } from 'react';
import {
  advanceBubbleBurst,
  getWaterPhaseDelayMs,
  WATER_DROPLETS,
} from '../utils/bubbleAnimation';

interface BubbleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bubbleVariant?: 'glass' | 'primary' | 'pill';
  waterPhase?: number;
  children: React.ReactNode;
}

export const BubbleButton: React.FC<BubbleButtonProps> = ({
  bubbleVariant = 'glass',
  waterPhase = 0,
  className = '',
  onClick,
  disabled,
  children,
  ...rest
}) => {
  const [burstKey, setBurstKey] = useState(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = advanceBubbleBurst(burstKey, disabled);
    setBurstKey(next.burstKey);
    onClick?.(e);
  };

  const variantClass =
    bubbleVariant === 'primary'
      ? 'player-bubble-primary'
      : bubbleVariant === 'pill'
      ? 'player-bubble-pill'
      : 'player-bubble-glass';

  const phaseDelay = `${getWaterPhaseDelayMs(waterPhase)}ms`;

  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={handleClick}
      data-bubble-burst={burstKey}
      data-water-bubble="true"
      className={`player-bubble-btn ${variantClass} relative isolate ${className}`}
    >
      {/* 3D Water Bubble Membrane: refractive aqua dome, caustic rim & specular water glints */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
      >
        <span
          className="water-bubble-caustic absolute -inset-[35%] rounded-full"
          style={{ animationDelay: phaseDelay }}
        />
        <span className="player-bubble-dome absolute inset-0 rounded-[inherit]" />
        <span className="water-bubble-glint absolute top-[14%] left-[20%] w-[30%] h-[22%] rounded-full" />
        <span className="water-bubble-glint-secondary absolute bottom-[16%] right-[18%] w-[14%] h-[10%] rounded-full" />
      </span>

      {/* Click-triggered double water ripple shockwaves & 4 hollow rising water micro-bubbles */}
      {burstKey > 0 && (
        <span
          key={`burst-${burstKey}`}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
        >
          <span className="absolute inset-0 rounded-[inherit] border-[1.5px] border-cyan-300/85 animate-water-ripple-1" />
          <span className="absolute inset-0 rounded-[inherit] border border-[#1ed760]/75 animate-water-ripple-2" />
          {WATER_DROPLETS.map((droplet) => (
            <span
              key={droplet.id}
              className={`water-micro-bubble absolute rounded-full ${droplet.positionClass} ${droplet.sizeClass} ${droplet.animationClass}`}
            />
          ))}
        </span>
      )}

      {/* Liquid surface-tension jelly wobble content wrapper */}
      <span
        key={`wobble-${burstKey}`}
        style={{ animationDelay: burstKey === 0 ? phaseDelay : undefined }}
        className={`relative z-10 inline-flex items-center justify-center gap-1.5 ${
          burstKey > 0 ? 'animate-water-jelly' : 'animate-water-float'
        }`}
      >
        {children}
      </span>
    </button>
  );
};
