export interface Theme {
  name: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  glow: string;
}

export const themes: Record<string, Theme> = {
  classic: {
    name: 'Classic Arcade',
    background: '#000000',
    primary: '#00ff00',
    secondary: '#ff0000',
    accent: '#ffff00',
    text: '#ffffff',
    glow: '#00ff00'
  },
  neon: {
    name: 'Neon Dreams',
    background: '#0a0a0a',
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ffff00',
    text: '#ffffff',
    glow: '#ff00ff'
  },
  retro: {
    name: 'Retro Wave',
    background: '#1a0033',
    primary: '#ff6ec7',
    secondary: '#00d4ff',
    accent: '#ffd319',
    text: '#ffffff',
    glow: '#ff6ec7'
  },
  space: {
    name: 'Deep Space',
    background: '#000033',
    primary: '#0099ff',
    secondary: '#ff6600',
    accent: '#ffcc00',
    text: '#ffffff',
    glow: '#0099ff'
  },
  matrix: {
    name: 'Matrix',
    background: '#001100',
    primary: '#00ff00',
    secondary: '#008800',
    accent: '#00ff00',
    text: '#00ff00',
    glow: '#00ff00'
  },
  sunset: {
    name: 'Sunset',
    background: '#1a0f1f',
    primary: '#ff6b6b',
    secondary: '#f9ca24',
    accent: '#f0932b',
    text: '#ffffff',
    glow: '#ff6b6b'
  },
  ocean: {
    name: 'Ocean Deep',
    background: '#001f3f',
    primary: '#00a8ff',
    secondary: '#004080',
    accent: '#00ffcc',
    text: '#ffffff',
    glow: '#00a8ff'
  },
  fire: {
    name: 'Fire Storm',
    background: '#220000',
    primary: '#ff4444',
    secondary: '#ff8800',
    accent: '#ffaa00',
    text: '#ffffff',
    glow: '#ff4444'
  }
};

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = themes.classic;
  private themeChangeCallbacks: ((theme: Theme) => void)[] = [];

  private constructor() {
    // Load saved theme
    const savedThemeName = localStorage.getItem('retro-theme');
    if (savedThemeName && themes[savedThemeName]) {
      this.currentTheme = themes[savedThemeName];
    }
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  setTheme(themeName: string): boolean {
    if (themes[themeName]) {
      this.currentTheme = themes[themeName];
      localStorage.setItem('retro-theme', themeName);
      this.notifyThemeChange();
      return true;
    }
    return false;
  }

  getThemeForLevel(level: number): Theme {
    const themeNames = Object.keys(themes);
    const themeName = themeNames[level % themeNames.length];
    return themes[themeName];
  }

  getAllThemes(): Record<string, Theme> {
    return themes;
  }

  onThemeChange(callback: (theme: Theme) => void): () => void {
    this.themeChangeCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.themeChangeCallbacks = this.themeChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyThemeChange(): void {
    this.themeChangeCallbacks.forEach(callback => callback(this.currentTheme));
  }

  // Apply theme to canvas context
  applyToCanvas(ctx: CanvasRenderingContext2D): void {
    const canvas = ctx.canvas;
    // This could be extended to apply gradients or patterns
    ctx.fillStyle = this.currentTheme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Get CSS variables for theme
  getCSSVariables(): string {
    return `
      --theme-background: ${this.currentTheme.background};
      --theme-primary: ${this.currentTheme.primary};
      --theme-secondary: ${this.currentTheme.secondary};
      --theme-accent: ${this.currentTheme.accent};
      --theme-text: ${this.currentTheme.text};
      --theme-glow: ${this.currentTheme.glow};
    `;
  }
}