export interface RunStats {
  score: number;
  level: number;
  duration: number;
  timestamp: number;
}

class AnalyticsManager {
  private storageKey = 'neonJump_runStats';
  private stats: RunStats[] = [];

  constructor() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          this.stats = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to load run stats:', e);
        this.stats = [];
      }
    }
  }

  recordRun(data: Omit<RunStats, 'timestamp'>): void {
    const entry: RunStats = { ...data, timestamp: Date.now() };
    this.stats.push(entry);
    this.save();
  }

  getStats(): RunStats[] {
    return [...this.stats];
  }

  clear(): void {
    this.stats = [];
    this.save();
  }

  private save(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Failed to save run stats:', e);
    }
  }
}

export const analyticsManager = new AnalyticsManager();
