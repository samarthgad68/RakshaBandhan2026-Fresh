// Audio synthesizer helper using Web Audio API for Maharashtrian festive music

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTrack: string = 'shehnai';
  private timerId: number | null = null;
  private destinationStream: MediaStreamAudioDestinationNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioDestination(): MediaStreamAudioDestinationNode | null {
    this.initContext();
    if (this.ctx && !this.destinationStream) {
      this.destinationStream = this.ctx.createMediaStreamDestination();
    }
    return this.destinationStream;
  }

  public playTrack(track: string = 'shehnai') {
    this.initContext();
    if (!this.ctx) return;
    this.stop();

    this.isPlaying = true;
    this.currentTrack = track;

    const tempo = track === 'dhol-tasha' ? 140 : track === 'fusion-beats' ? 128 : 100;
    const intervalMs = (60 / tempo) * 1000;

    let step = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx) return;

      const now = this.ctx.currentTime;

      // Play notes according to track style
      if (track === 'shehnai') {
        this.playShehnaiNote(step, now);
      } else if (track === 'dhol-tasha') {
        this.playDholTashaBeat(step, now);
      } else if (track === 'flute') {
        this.playFluteNote(step, now);
      } else if (track === 'royal-sitar') {
        this.playSitarNote(step, now);
      } else if (track === 'fusion-beats') {
        this.playFusionBeat(step, now);
      }

      step = (step + 1) % 32;
      this.timerId = window.setTimeout(playStep, intervalMs / 2);
    };

    playStep();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  // Shehnai frequency melody scale (Indian rag Bhairavi / Bilawal notes in Hz)
  private playShehnaiNote(step: number, time: number) {
    if (!this.ctx) return;

    // Raga Bilawal / Pahadi style scale notes
    const notes = [
      329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25,
      587.33, 523.25, 493.88, 440.00, 392.00, 369.99, 329.63, 293.66
    ];

    if (step % 2 === 0) {
      const noteIdx = (step / 2) % notes.length;
      const freq = notes[noteIdx];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth'; // Shehnai double-reed tone
      osc.frequency.setValueAtTime(freq, time);

      // Portamento / vibrato bend
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, time + 0.15);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.destinationStream) gain.connect(this.destinationStream);

      osc.start(time);
      osc.stop(time + 0.45);
    }

    // Background Drone (Tanpura)
    if (step % 16 === 0) {
      const drone = this.ctx.createOscillator();
      const dGain = this.ctx.createGain();
      drone.type = 'sine';
      drone.frequency.setValueAtTime(220.0, time); // A3
      dGain.gain.setValueAtTime(0.04, time);
      dGain.gain.exponentialRampToValueAtTime(0.001, time + 2.0);
      drone.connect(dGain);
      dGain.connect(this.ctx.destination);
      if (this.destinationStream) dGain.connect(this.destinationStream);
      drone.start(time);
      drone.stop(time + 2.0);
    }
  }

  private playDholTashaBeat(step: number, time: number) {
    if (!this.ctx) return;

    // Heavy Dhol Bass
    if (step % 4 === 0 || step % 16 === 10) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);

      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.destinationStream) gain.connect(this.destinationStream);
      osc.start(time);
      osc.stop(time + 0.3);
    }

    // High Tasha Snare
    if (step % 2 === 1 || step % 8 === 6) {
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1500, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.destinationStream) gain.connect(this.destinationStream);

      noise.start(time);
    }
  }

  private playFluteNote(step: number, time: number) {
    if (!this.ctx) return;

    const scale = [440, 493.88, 554.37, 587.33, 659.25, 739.99, 830.61, 880];
    if (step % 2 === 0) {
      const freq = scale[(step / 2) % scale.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.destinationStream) gain.connect(this.destinationStream);

      osc.start(time);
      osc.stop(time + 0.55);
    }
  }

  private playSitarNote(step: number, time: number) {
    if (!this.ctx) return;

    const notes = [293.66, 329.63, 369.99, 440, 493.88, 587.33];
    if (step % 2 === 0) {
      const freq = notes[(step / 2) % notes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, time + 0.08);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.destinationStream) gain.connect(this.destinationStream);

      osc.start(time);
      osc.stop(time + 0.65);
    }
  }

  private playFusionBeat(step: number, time: number) {
    if (!this.ctx) return;

    // Modern Kick & Synth Pluck
    if (step % 4 === 0) {
      const kick = this.ctx.createOscillator();
      const kGain = this.ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(150, time);
      kick.frequency.exponentialRampToValueAtTime(30, time + 0.12);
      kGain.gain.setValueAtTime(0.35, time);
      kGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      kick.connect(kGain);
      kGain.connect(this.ctx.destination);
      if (this.destinationStream) kGain.connect(this.destinationStream);
      kick.start(time);
      kick.stop(time + 0.2);
    }

    if (step % 2 === 0) {
      const pluck = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      pluck.type = 'sawtooth';
      const freqs = [392, 440, 523.25, 587.33, 659.25];
      pluck.frequency.setValueAtTime(freqs[(step / 2) % freqs.length], time);

      pGain.gain.setValueAtTime(0.12, time);
      pGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      pluck.connect(pGain);
      pGain.connect(this.ctx.destination);
      if (this.destinationStream) pGain.connect(this.destinationStream);

      pluck.start(time);
      pluck.stop(time + 0.25);
    }
  }
}

export const audioSynth = new AudioSynthEngine();
