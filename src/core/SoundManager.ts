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
}

// Export a singleton instance
export const soundManager = new SoundManager();