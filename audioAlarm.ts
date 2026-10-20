/**
 * Audio Alarm & Haptic Engine for CashFix POS (iOS, Android & Web)
 * Uses standard Web Audio API for zero-dependency, guaranteed cross-platform audio synthesis
 * Unlocks iOS Safari audio context on initial touch and triggers Android vibration haptics.
 */

class AudioAlarmService {
  private audioCtx: AudioContext | null = null;
  private intervalTimer: number | null = null;
  private isAlarmActive = false;
  private isEscalated = false;
  private isUnlocked = false;

  constructor() {
    this.setupIosAudioUnlock();
  }

  /**
   * Automatically unlocks iOS Safari and Android Chrome audio context on first screen tap/touch
   */
  private setupIosAudioUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      try {
        const ctx = this.getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        } else if (ctx) {
          this.isUnlocked = true;
        }
      } catch {}

      // Remove listeners once unlocked
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  /**
   * Triggers Android tactile haptic feedback vibration
   */
  public triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'double' | 'alarm' = 'light'): void {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(25);
          break;
        case 'medium':
          navigator.vibrate(45);
          break;
        case 'heavy':
          navigator.vibrate(80);
          break;
        case 'double':
          navigator.vibrate([35, 40, 35]);
          break;
        case 'alarm':
          navigator.vibrate([150, 100, 150, 100, 250]);
          break;
      }
    } catch {}
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Plays a loud, distinctive commercial POS alert chime
   * Dual-tone pulsing alert specifically tuned to cut through kitchen / cashier noise
   */
  public playAlertBeep(isHighUrgency = false): void {
    try {
      this.triggerHaptic(isHighUrgency ? 'alarm' : 'double');
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const primaryFreq = isHighUrgency ? 1200 : 960;
      const secondaryFreq = isHighUrgency ? 1500 : 1250;

      // Pulse 1
      this.synthesizeChirp(ctx, now, primaryFreq, 0.18, 0.45);
      // Pulse 2
      this.synthesizeChirp(ctx, now + 0.22, secondaryFreq, 0.2, 0.5);
      // Pulse 3
      this.synthesizeChirp(ctx, now + 0.46, primaryFreq, 0.18, 0.45);
      // Pulse 4
      this.synthesizeChirp(ctx, now + 0.68, secondaryFreq, 0.26, 0.55);

      if (isHighUrgency) {
        // High urgency extra persistent rapid warning burst
        this.synthesizeChirp(ctx, now + 1.0, 1600, 0.2, 0.6);
        this.synthesizeChirp(ctx, now + 1.25, 1750, 0.25, 0.65);
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  private synthesizeChirp(ctx: AudioContext, startTime: number, freq: number, duration: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth'; // piercing buzzer timbre typical of commercial POS chimes
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + duration);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Starts the CONTINUOUS 15-second mandatory alarm protocol.
   * This sound WILL NOT STOP until explicitly stopped via stopContinuousAlarm().
   * Repeats every 15 seconds.
   */
  public startContinuousAlarm(isUrgent = false): void {
    this.isAlarmActive = true;
    this.isEscalated = isUrgent;

    // Immediately play the first chime
    this.playAlertBeep(this.isEscalated);

    // Clear existing timer if any
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }

    // Mandatory 15-second interval loop (15000 ms)
    this.intervalTimer = window.setInterval(() => {
      if (this.isAlarmActive) {
        this.playAlertBeep(this.isEscalated);
      }
    }, 15000);
  }

  /**
   * Escalates the alarm tone (e.g. when order is unaccepted for > 30 seconds)
   */
  public setEscalated(escalated: boolean): void {
    this.isEscalated = escalated;
    if (this.isAlarmActive) {
      this.playAlertBeep(true);
    }
  }

  /**
   * Manually stops the continuous alarm
   * Called only when the Cashier taps "Accept & Move to Hold Orders"
   */
  public stopContinuousAlarm(): void {
    this.isAlarmActive = false;
    this.isEscalated = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Simulates physical cash drawer mechanical solenoid punch
   */
  public playCashDrawerKickSound(): void {
    try {
      this.triggerHaptic('heavy');
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Low frequency mechanical thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);

      // Spring latch metallic click
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(2400, now + 0.04);
      clickGain.gain.setValueAtTime(0.3, now + 0.04);
      clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);

      clickOsc.start(now + 0.04);
      clickOsc.stop(now + 0.1);
    } catch {
      // Audio fallback silent
    }
  }

  /**
   * Quick scan / add item soft beep
   */
  public playScanBeep(): void {
    try {
      this.triggerHaptic('light');
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }
}

export const audioAlarm = new AudioAlarmService();
