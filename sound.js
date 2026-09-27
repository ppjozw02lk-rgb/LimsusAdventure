// Web Audio API Sound Synthesizer & SFX Player

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sfxVolume = 0.8;
    this.diceAudio = new Audio('./assets/dice_roll.mp3');
    this.diceAudio.volume = 0.6;

    // Limbus Company Authentic Coin Flip SFX
    this.coinFlipAudio = new Audio('./Limbus Company SFX - Coin Flip sound effect.mp3');
    this.coinFlipAudio.volume = 0.8;
    this.coinFlipBuffer = null;
    this.loadCoinFlipBuffer();
  }

  async loadCoinFlipBuffer() {
    try {
      const resp = await fetch('./Limbus Company SFX - Coin Flip sound effect.mp3');
      const arrayBuf = await resp.arrayBuffer();
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      this.ctx.decodeAudioData(arrayBuf, (buffer) => {
        this.coinFlipBuffer = buffer;
      });
    } catch (e) {
      // Will fallback to HTML5 Audio clone
    }
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.coinFlipBuffer) {
      this.loadCoinFlipBuffer();
    }
  }

  toggleMute() {
    this.setMute(!this.muted);
    return this.muted;
  }

  // Coin Flip Sound (Limbus Company SFX - Coin Flip sound effect.mp3)
  playCoinFlip(pitch = 1) {
    if (this.muted) return;
    this.init();
    
    const vol = 0.85 * (this.sfxVolume !== undefined ? this.sfxVolume : 0.8);
    const clampedPitch = Math.min(1.6, Math.max(0.7, pitch));

    // Fast zero-latency Web Audio API buffer playback (supports infinite overlap)
    if (this.ctx && this.coinFlipBuffer) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.coinFlipBuffer;
        src.playbackRate.value = clampedPitch;
        const gain = this.ctx.createGain();
        gain.gain.value = vol;
        src.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(0);
        return;
      } catch (e) {}
    }

    // High performance HTML5 Audio clone fallback
    try {
      const clone = this.coinFlipAudio.cloneNode();
      clone.volume = vol;
      clone.playbackRate = clampedPitch;
      clone.play().catch(() => {});
    } catch (e) {}
  }

  // Coin Heads Sound (bright chime)
  playCoinHeads() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1600, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  // Coin Tails Sound (dull metallic click)
  playCoinTails() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Clash Win Impact (heavy metallic slam)
  playClashWin() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      
      // Low sub bass thump
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(150, now);
      sub.frequency.exponentialRampToValueAtTime(35, now + 0.35);
      subGain.gain.setValueAtTime(0.6, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.35);

      // High impact metallic clang
      const clang = this.ctx.createOscillator();
      const clangGain = this.ctx.createGain();
      clang.type = 'sawtooth';
      clang.frequency.setValueAtTime(950, now);
      clang.frequency.exponentialRampToValueAtTime(200, now + 0.25);
      clangGain.gain.setValueAtTime(0.4, now);
      clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      clang.connect(clangGain);
      clangGain.connect(this.ctx.destination);
      clang.start(now);
      clang.stop(now + 0.25);
    } catch (e) {}
  }

  // Clash Draw (spark deflection)
  playClashDraw() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1100, now + 0.05);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Attack Hits
  playHit(type = 'punch') {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      if (type === 'punch') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'kick') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.28);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'charge') {
        // Laser charge
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'slay') {
        // Slash sword slice
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1600, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {}
  }

  // UI Click
  playClick() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // Shop Buy Cash Chime
  playShopBuy() {
    if (this.muted) return;
    this.init();
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, i) => {
        const now = this.ctx.currentTime + (i * 0.08);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      });
    } catch (e) {}
  }

  // Healing Sound
  playHeal() {
    if (this.muted) return;
    this.init();
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const now = this.ctx.currentTime + (i * 0.09);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch (e) {}
  }

  // Victory Fanfare
  playVictory() {
    if (this.muted) return;
    this.init();
    try {
      const notes = [
        { f: 523.25, d: 0.12 }, // C
        { f: 523.25, d: 0.12 }, // C
        { f: 523.25, d: 0.12 }, // C
        { f: 659.25, d: 0.35 }, // E
        { f: 587.33, d: 0.18 }, // D
        { f: 783.99, d: 0.55 }, // G
      ];
      let t = this.ctx.currentTime;
      notes.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + n.d);
        t += n.d * 0.95;
      });
    } catch (e) {}
  }

  // Defeat / Game Over
  playDefeat() {
    if (this.muted) return;
    this.init();
    try {
      const notes = [440, 415.3, 392, 349.23];
      let t = this.ctx.currentTime;
      notes.forEach((f) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
        t += 0.35;
      });
    } catch (e) {}
  }

  // Battle Start Swirl / Intro
  playBattleIntro() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.7);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  // Retro UI Cursor Hover Sound (tiny crisp bleep)
  playHover() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.04 * (this.sfxVolume || 0.8), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  // Retro UI Select / Click Sound (punchy 8-bit blip)
  playClick() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
      gain.gain.setValueAtTime(0.18 * (this.sfxVolume || 0.8), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  // Retro Cancel / Back Sound (descending tone)
  playBack() {
    if (this.muted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);
      gain.gain.setValueAtTime(0.12 * (this.sfxVolume || 0.8), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Game Start Fanfare / Powerup Chime
  playStartGame() {
    if (this.muted) return;
    this.init();
    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      let t = this.ctx.currentTime;
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i === notes.length - 1 ? 'sine' : 'square';
        osc.frequency.setValueAtTime(f, t);
        const duration = i === notes.length - 1 ? 0.35 : 0.08;
        gain.gain.setValueAtTime(0.15 * (this.sfxVolume || 0.8), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
        t += 0.06;
      });
    } catch (e) {}
  }

  setSFXVolume(v) {
    this.sfxVolume = v;
    if (this.diceAudio) this.diceAudio.volume = 0.6 * v;
  }

  setMute(isMuted) {
    this.muted = isMuted;
    if (this.diceAudio) this.diceAudio.muted = isMuted;
    if (this.coinFlipAudio) this.coinFlipAudio.muted = isMuted;
  }
}

export const sound = new SoundManager();
