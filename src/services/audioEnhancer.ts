export type SoundPresetId = 'studio' | 'bass' | 'vocal' | 'spatial' | 'flat';

export interface SoundPresetConfig {
  id: SoundPresetId;
  label: string;
  shortLabel: string;
  description: string;
  lowGainDb: number;     // 85 Hz lowshelf
  midGainDb: number;     // 2.6 kHz peaking (vocal presence)
  highGainDb: number;    // 10.5 kHz highshelf (air & sparkle)
  spatialMix: number;    // 0 to 0.35 subtle stereo Haas depth
  compressorEnabled: boolean;
}

export const SOUND_PRESETS: Record<SoundPresetId, SoundPresetConfig> = {
  studio: {
    id: 'studio',
    label: 'Studio HD',
    shortLabel: 'Studio HD',
    description: 'Balanced punchy bass, vocal clarity, and mastering compression',
    lowGainDb: 4.5,
    midGainDb: 2.2,
    highGainDb: 3.5,
    spatialMix: 0.14,
    compressorEnabled: true,
  },
  bass: {
    id: 'bass',
    label: 'Deep Bass',
    shortLabel: 'Bass+',
    description: 'Rich sub-bass warmth with clean highs',
    lowGainDb: 7.5,
    midGainDb: 1.2,
    highGainDb: 2.5,
    spatialMix: 0.12,
    compressorEnabled: true,
  },
  vocal: {
    id: 'vocal',
    label: 'Vocal Clear',
    shortLabel: 'Vocal',
    description: 'Forward acoustic & vocal presence for lyrics',
    lowGainDb: 1.5,
    midGainDb: 5.0,
    highGainDb: 3.2,
    spatialMix: 0.1,
    compressorEnabled: true,
  },
  spatial: {
    id: 'spatial',
    label: '3D Spatial',
    shortLabel: '3D Spatial',
    description: 'Wide stereo soundstage with airy shimmer',
    lowGainDb: 4.0,
    midGainDb: 1.8,
    highGainDb: 4.5,
    spatialMix: 0.32,
    compressorEnabled: true,
  },
  flat: {
    id: 'flat',
    label: 'Original',
    shortLabel: 'Original',
    description: 'Unprocessed flat audio signal',
    lowGainDb: 0,
    midGainDb: 0,
    highGainDb: 0,
    spatialMix: 0,
    compressorEnabled: false,
  },
};

export const SOUND_PRESET_ORDER: SoundPresetId[] = [
  'studio',
  'bass',
  'vocal',
  'spatial',
  'flat',
];

export function getPresetConfig(presetId: SoundPresetId): SoundPresetConfig {
  return SOUND_PRESETS[presetId] ?? SOUND_PRESETS.studio;
}

export function getNextSoundPreset(current: SoundPresetId): SoundPresetId {
  const idx = SOUND_PRESET_ORDER.indexOf(current);
  if (idx === -1) return 'studio';
  return SOUND_PRESET_ORDER[(idx + 1) % SOUND_PRESET_ORDER.length];
}

class AudioEnhancer {
  private ctx: AudioContext | null = null;
  private sourceMap = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
  private lowFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private dryGain: GainNode | null = null;
  private spatialDelay: DelayNode | null = null;
  private spatialGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private presetId: SoundPresetId = 'studio';

  private ensureGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.setValueAtTime(85, ctx.currentTime);

      const midFilter = ctx.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.setValueAtTime(2600, ctx.currentTime);
      midFilter.Q.setValueAtTime(1.1, ctx.currentTime);

      const highFilter = ctx.createBiquadFilter();
      highFilter.type = 'highshelf';
      highFilter.frequency.setValueAtTime(10500, ctx.currentTime);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, ctx.currentTime);
      compressor.knee.setValueAtTime(18, ctx.currentTime);
      compressor.ratio.setValueAtTime(3.2, ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, ctx.currentTime);
      compressor.release.setValueAtTime(0.18, ctx.currentTime);

      const dryGain = ctx.createGain();
      const spatialDelay = ctx.createDelay(0.05);
      spatialDelay.delayTime.setValueAtTime(0.011, ctx.currentTime);
      const spatialGain = ctx.createGain();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.06, ctx.currentTime);

      lowFilter.connect(midFilter);
      midFilter.connect(highFilter);
      highFilter.connect(compressor);

      // Parallel dry + subtle Haas spatial widening path into masterGain
      compressor.connect(dryGain);
      dryGain.connect(masterGain);

      compressor.connect(spatialDelay);
      spatialDelay.connect(spatialGain);
      spatialGain.connect(masterGain);

      masterGain.connect(ctx.destination);

      this.lowFilter = lowFilter;
      this.midFilter = midFilter;
      this.highFilter = highFilter;
      this.compressor = compressor;
      this.dryGain = dryGain;
      this.spatialDelay = spatialDelay;
      this.spatialGain = spatialGain;
      this.masterGain = masterGain;

      this.applyPresetToNodes(this.presetId);
    }

    return this.ctx;
  }

  public attachAudioElement(audio: HTMLMediaElement): boolean {
    try {
      const ctx = this.ensureGraph();
      if (!ctx || !this.lowFilter) return false;

      if (!this.sourceMap.has(audio)) {
        const source = ctx.createMediaElementSource(audio);
        source.connect(this.lowFilter);
        this.sourceMap.set(audio, source);
      }

      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  public setPreset(presetId: SoundPresetId) {
    this.presetId = presetId;
    this.applyPresetToNodes(presetId);
  }

  public getPreset(): SoundPresetId {
    return this.presetId;
  }

  private applyPresetToNodes(presetId: SoundPresetId) {
    if (!this.ctx || !this.lowFilter || !this.midFilter || !this.highFilter || !this.compressor || !this.dryGain || !this.spatialGain || !this.masterGain) {
      return;
    }
    const cfg = getPresetConfig(presetId);
    const t = this.ctx.currentTime;

    this.lowFilter.gain.setTargetAtTime(cfg.lowGainDb, t, 0.04);
    this.midFilter.gain.setTargetAtTime(cfg.midGainDb, t, 0.04);
    this.highFilter.gain.setTargetAtTime(cfg.highGainDb, t, 0.04);

    // Smooth compressor engagement vs transparent bypass
    this.compressor.ratio.setTargetAtTime(cfg.compressorEnabled ? 3.2 : 1, t, 0.04);
    this.compressor.threshold.setTargetAtTime(cfg.compressorEnabled ? -18 : 0, t, 0.04);

    this.dryGain.gain.setTargetAtTime(1 - cfg.spatialMix * 0.35, t, 0.04);
    this.spatialGain.gain.setTargetAtTime(cfg.spatialMix, t, 0.04);
    this.masterGain.gain.setTargetAtTime(cfg.compressorEnabled ? 1.08 : 1.0, t, 0.04);
  }
}

export const audioEnhancer = new AudioEnhancer();
