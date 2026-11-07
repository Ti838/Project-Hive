// ─── ProjectHive — Procedural Web Audio Sound Engine ────────────────────────
// Zero external asset dependencies (No 404s, 0ms latency, works offline).
// Procedurally synthesizes Discord, Facebook, and signature Cyber Hive notification chimes.

export type SoundType = 'notification' | 'message' | 'mention' | 'reaction' | 'friend' | 'call';
export type SoundPack = 'hive' | 'discord' | 'minimal';

class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private lastPlayedAt: Record<string, number> = {};
  private volume: number = 0.75;
  private enabled: boolean = true;
  private pack: SoundPack = 'hive';

  constructor() {
    // Sync with saved settings on client
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('ph-ui-store');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.state) {
            if (typeof parsed.state.soundEnabled === 'boolean') this.enabled = parsed.state.soundEnabled;
            if (typeof parsed.state.soundVolume === 'number') this.volume = parsed.state.soundVolume;
            if (parsed.state.soundPack) this.pack = parsed.state.soundPack;
          }
        }
      } catch {
        // Fallback to defaults
      }

      // Attach one-time unlock listener for browser autoplay policy
      const unlock = () => {
        this.unlock();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('click', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
      window.addEventListener('click', unlock, { passive: true });
    }
  }

  /**
   * Unlock AudioContext safely following browser autoplay requirements
   */
  public unlock(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else if (this.ctx) {
        this.isUnlocked = true;
      }
    } catch {
      // AudioContext unavailable
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public getEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setPack(pack: SoundPack): void {
    this.pack = pack;
  }

  public getPack(): SoundPack {
    return this.pack;
  }

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      this.unlock();
    }
    return this.ctx;
  }

  /**
   * Play a sound type with debounce protection against event bursts
   */
  public play(type: SoundType, customPack?: SoundPack): void {
    if (!this.enabled || this.volume <= 0) return;

    // 150ms debounce per type to prevent ear distortion on rapid bursts
    const now = Date.now();
    if (this.lastPlayedAt[type] && now - this.lastPlayedAt[type] < 150) {
      return;
    }
    this.lastPlayedAt[type] = now;

    this.renderSound(type, customPack || this.pack, this.volume);
  }

  /**
   * Test/Preview a sound (ignores mute state for user preview in settings)
   */
  public test(type: SoundType, customPack?: SoundPack, customVolume?: number): void {
    const vol = typeof customVolume === 'number' ? customVolume : Math.max(0.5, this.volume);
    this.renderSound(type, customPack || this.pack, vol);
  }

  private renderSound(type: SoundType, pack: SoundPack, masterGainValue: number): void {
    try {
      this.unlock();
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'suspended') return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterGainValue * 0.45, now);
      masterGain.connect(ctx.destination);

      switch (pack) {
        case 'discord':
          this.renderDiscordTone(ctx, masterGain, type, now);
          break;
        case 'minimal':
          this.renderMinimalTone(ctx, masterGain, type, now);
          break;
        case 'hive':
        default:
          this.renderHiveTone(ctx, masterGain, type, now);
          break;
      }
    } catch {
      // Audio playback failed gracefully
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SIGNATURE "CYBER HIVE" SOUND PACK (Warm organic harmonic chime)
  // ═══════════════════════════════════════════════════════════════════════════
  private renderHiveTone(ctx: AudioContext, dest: GainNode, type: SoundType, now: number): void {
    if (type === 'notification' || type === 'mention') {
      // Celestial honeycomb chime: F#5 (739.99Hz) -> C#6 (1108.73Hz)
      const notes = [
        { freq: 739.99, start: 0, dur: 0.18 },
        { freq: 1108.73, start: 0.08, dur: 0.45 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.8, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    } else if (type === 'message') {
      // Rounded organic honeycomb pop (480Hz -> 780Hz quick bubble sweep)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.9, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'reaction') {
      // Shimmering triple harmonic sparkle
      [880, 1174.66, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.035);

        gain.gain.setValueAtTime(0.0001, now + i * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.4, now + i * 0.035 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.035 + 0.12);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + i * 0.035);
        osc.stop(now + i * 0.035 + 0.14);
      });
    } else if (type === 'friend') {
      // Triumphant ascending honeycomb triad: E5 -> G#5 -> B5 -> E6
      [659.25, 830.61, 987.77, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.0001, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.6, now + i * 0.06 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.28);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.3);
      });
    } else if (type === 'call') {
      // Pulsing ambient synth ring (vibraphone tone)
      const freqs = [523.25, 659.25];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.7, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.65);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. "DISCORD NEO" SOUND PACK (Crisp resonant crystal chime)
  // ═══════════════════════════════════════════════════════════════════════════
  private renderDiscordTone(ctx: AudioContext, dest: GainNode, type: SoundType, now: number): void {
    if (type === 'notification' || type === 'mention') {
      // Discord-style double chime: D5 (587.33Hz) -> A5 (880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.7, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(dest);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.09);
      gain2.gain.setValueAtTime(0.001, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.85, now + 0.105);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(dest);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.45);
    } else if (type === 'message') {
      // Discord-style incoming message 'knocking' bloop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.8, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.14);
    } else {
      // Generic pleasant crystal tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. "FACEBOOK MINIMAL" SOUND PACK (Soft subtle marimba / bubble pop)
  // ═══════════════════════════════════════════════════════════════════════════
  private renderMinimalTone(ctx: AudioContext, dest: GainNode, type: SoundType, now: number): void {
    if (type === 'notification' || type === 'mention') {
      // Facebook-style soft bell ding (C6 1046.5Hz quick decay)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.7, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      // Soft gentle bubble pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }
}

// Global singleton instance for high-performance audio synthesis
export const soundEngine = typeof window !== 'undefined'
  ? new ProceduralSoundEngine()
  : (null as unknown as ProceduralSoundEngine);

