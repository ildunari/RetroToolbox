// Audio Context for sound effects
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const audioContext = new AudioContext();

export class SoundManager {
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    this.enabled = true;
    this.volume = 0.5;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  playTone(frequency: number, duration: number = 100): void {
    if (!this.enabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.value = this.volume * 0.1;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }

  playCollect(): void {
    this.playTone(880, 100);
  }

  playHit(): void {
    this.playTone(220, 150);
  }

  playGameOver(): void {
    this.playTone(110, 500);
  }

  playPowerUp(): void {
    this.playTone(1320, 200);
  }

  // Play a warning beep used for expiring timers
  playWarning(): void {
    this.playTone(1000, 150);
  }

  // Play a short "waka waka" sound for eating pellets
  playEatPellet(): void {
    if (!this.enabled) return;
    // Alternate between two tones for classic waka waka effect
    const tone = Math.random() > 0.5 ? 440 : 880;
    this.playTone(tone, 50);
  }

  // Play level complete jingle
  playLevelComplete(): void {
    if (!this.enabled) return;
    
    const notes = [523, 587, 659, 784, 880, 1047]; // C, D, E, G, A, C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 150);
      }, i * 100);
    });
  }

  // Play ghost siren (continuous, can be started/stopped)
  private sirenInterval: number | null = null;
  private sirenMode: 'normal' | 'frightened' | 'returning' = 'normal';
  
  startGhostSiren(mode: 'normal' | 'frightened' | 'returning' = 'normal'): void {
    if (!this.enabled) return;
    
    this.sirenMode = mode;
    this.stopGhostSiren(); // Stop any existing siren
    
    const playPattern = () => {
      if (!this.enabled) return;
      
      let freq1, freq2, duration;
      switch (this.sirenMode) {
        case 'frightened':
          freq1 = 200;
          freq2 = 250;
          duration = 200;
          break;
        case 'returning':
          freq1 = 800;
          freq2 = 600;
          duration = 100;
          break;
        default: // normal
          freq1 = 400;
          freq2 = 300;
          duration = 300;
      }
      
      this.playTone(freq1, duration / 2);
      setTimeout(() => {
        if (this.enabled) this.playTone(freq2, duration / 2);
      }, duration / 2);
    };
    
    playPattern();
    this.sirenInterval = window.setInterval(playPattern, this.sirenMode === 'returning' ? 250 : 500);
  }
  
  stopGhostSiren(): void {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }

  // Play fruit collection sound
  playFruitCollect(): void {
    if (!this.enabled) return;
    
    // Play a pleasant ascending arpeggio
    const notes = [523, 659, 784, 1047]; // C, E, G, C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 100);
      }, i * 50);
    });
  }

  // Play death sequence sound
  playDeath(): void {
    if (!this.enabled) return;
    
    // Descending tones for death
    const notes = [440, 330, 220, 110];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 200);
      }, i * 150);
    });
  }

  // Play power pellet collection
  playPowerPellet(): void {
    if (!this.enabled) return;
    
    // Deep bass tone
    this.playTone(110, 300);
  }
}

// Export a singleton instance
export const soundManager = new SoundManager();