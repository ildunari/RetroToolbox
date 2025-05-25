// Audio Context for sound effects
const AudioContext = window.AudioContext || window.webkitAudioContext;

interface SoundNode {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  inUse: boolean;
}

export class SoundManager {
  private enabled: boolean = true;
  private volume: number = 0.5;
  private audioContext: AudioContext | null = null;
  private soundPool: SoundNode[] = [];
  private poolSize: number = 20;
  private isInitialized: boolean = false;

  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      
      // Handle suspended audio context (autoplay policy)
      if (this.audioContext.state === 'suspended') {
        // Wait for user interaction to resume
        const resumeAudio = () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
          document.removeEventListener('click', resumeAudio);
          document.removeEventListener('keydown', resumeAudio);
          document.removeEventListener('touchstart', resumeAudio);
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
      }
      
      this.initializeSoundPool();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
      this.enabled = false;
    }
  }

  private initializeSoundPool(): void {
    if (!this.audioContext) return;
    
    for (let i = 0; i < this.poolSize; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      this.soundPool.push({
        oscillator,
        gainNode,
        inUse: false
      });
    }
  }

  private getAvailableSoundNode(): SoundNode | null {
    if (!this.audioContext) return null;
    
    // Find an available node from pool
    let node = this.soundPool.find(node => !node.inUse);
    
    // If no available node, create a new one temporarily
    if (!node) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      node = { oscillator, gainNode, inUse: false };
    }
    
    return node;
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

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  playTone(frequency: number, duration: number = 100): void {
    if (!this.enabled || !this.audioContext || !this.isInitialized) return;
    
    try {
      const node = this.getAvailableSoundNode();
      if (!node) return;
      
      node.inUse = true;
      
      // Create new oscillator since they can only be used once
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      gainNode.gain.value = this.volume * 0.1;
      
      const currentTime = this.audioContext.currentTime;
      const stopTime = currentTime + duration / 1000;
      
      oscillator.start(currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, stopTime);
      oscillator.stop(stopTime);
      
      // Release node back to pool after sound finishes
      setTimeout(() => {
        node.inUse = false;
      }, duration + 50);
      
    } catch (error) {
      console.warn('Error playing tone:', error);
    }
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

  // Additional sound effects with sprite-like behavior
  playJump(): void {
    this.playTone(440, 120);
  }

  playScore(): void {
    this.playTone(660, 80);
  }

  playMenu(): void {
    this.playTone(528, 60);
  }

  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundPool = [];
    this.isInitialized = false;
  }
}

// Export a singleton instance
export const soundManager = new SoundManager();