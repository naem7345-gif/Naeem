/**
 * Web Audio API Synth Engine for lush fallback preview playback
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isPlaying: boolean = false;
  private timer: number | null = null;
  private volume: number = 0.7;

  private init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(3600, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(3, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.filter.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    }
  }

  public playTrack(trackId: string) {
    this.init();
    if (!this.ctx || !this.filter) return;
    this.stop();
    this.isPlaying = true;

    let hash = 0;
    for (let i = 0; i < trackId.length; i++) {
      hash = (hash << 5) - hash + trackId.charCodeAt(i);
      hash |= 0;
    }
    const rootNotes = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0];
    const baseFreq = rootNotes[Math.abs(hash) % rootNotes.length];

    let beat = 0;
    const playChordStep = () => {
      if (!this.isPlaying || !this.ctx || !this.filter) return;
      const t = this.ctx.currentTime;

      const chordOffsets = [
        [0, 4, 7, 11],
        [0, 3, 7, 10],
        [0, 5, 7, 12],
        [0, 4, 7, 9],
      ];
      const activeChord = chordOffsets[beat % chordOffsets.length];

      // Warm sub bass pad
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(baseFreq / 2, t);
      bassGain.gain.setValueAtTime(0.001, t);
      bassGain.gain.linearRampToValueAtTime(0.14, t + 0.08);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
      bassOsc.connect(bassGain);
      bassGain.connect(this.filter);
      bassOsc.start(t);
      bassOsc.stop(t + 1.3);

      // Rich detuned chord voices
      activeChord.forEach((semitone, idx) => {
        if (!this.ctx || !this.filter) return;
        const freq = baseFreq * Math.pow(2, (semitone + (idx > 2 ? 12 : 0)) / 12);
        [-5, 5].forEach((detuneCents) => {
          if (!this.ctx || !this.filter) return;
          const osc = this.ctx.createOscillator();
          const noteGain = this.ctx.createGain();
          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          osc.detune.setValueAtTime(detuneCents, t);

          const velocity = 0.045 / (idx + 1);
          noteGain.gain.setValueAtTime(0.001, t);
          noteGain.gain.linearRampToValueAtTime(velocity, t + 0.12);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);

          osc.connect(noteGain);
          noteGain.connect(this.filter);
          osc.start(t);
          osc.stop(t + 1.32);
        });
      });

      if (beat % 2 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(105, t);
        kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.14);
        kickGain.gain.setValueAtTime(0.14, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        kickOsc.connect(kickGain);
        kickGain.connect(this.filter);
        kickOsc.start(t);
        kickOsc.stop(t + 0.2);
      }

      beat++;
    };

    playChordStep();
    this.timer = window.setInterval(playChordStep, 1200);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
