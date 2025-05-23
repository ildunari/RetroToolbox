export interface GamepadState {
  connected: boolean;
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  buttons: boolean[];
}

export class InputManager {
  private keys: Record<string, boolean> = {};
  private touches: Touch[] = [];
  private mousePos: { x: number; y: number } = { x: 0, y: 0 };
  private gamepadConnected: boolean = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('touchstart', (e) => {
      this.touches = Array.from(e.touches);
    });

    window.addEventListener('touchmove', (e) => {
      this.touches = Array.from(e.touches);
    });

    window.addEventListener('touchend', (e) => {
      this.touches = Array.from(e.touches);
    });

    window.addEventListener('gamepadconnected', () => {
      this.gamepadConnected = true;
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
    });
  }

  isKeyPressed(key: string): boolean {
    return this.keys[key] || false;
  }

  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePos };
  }

  getTouches(): Touch[] {
    return [...this.touches];
  }

  isGamepadConnected(): boolean {
    return this.gamepadConnected;
  }

  getGamepad(): Gamepad | null {
    const gamepads = navigator.getGamepads();
    return gamepads[0] || null;
  }

  getGamepadState(): GamepadState {
    const gamepad = this.getGamepad();
    
    if (!gamepad) {
      return {
        connected: false,
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        buttons: []
      };
    }

    return {
      connected: true,
      leftStick: {
        x: gamepad.axes[0] || 0,
        y: gamepad.axes[1] || 0
      },
      rightStick: {
        x: gamepad.axes[2] || 0,
        y: gamepad.axes[3] || 0
      },
      buttons: gamepad.buttons.map(button => button.pressed)
    };
  }

  cleanup(): void {
    // Remove event listeners if needed for cleanup
    this.keys = {};
    this.touches = [];
  }
}

// Export singleton instance
export const inputManager = new InputManager();