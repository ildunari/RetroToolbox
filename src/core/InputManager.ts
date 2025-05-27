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
  private eventListeners: Array<{ target: EventTarget; type: string; listener: EventListener }> = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Store bound references to event handlers for cleanup
    const handlers = {
      keydown: (e: KeyboardEvent) => {
        this.keys[e.key] = true;
      },
      keyup: (e: KeyboardEvent) => {
        this.keys[e.key] = false;
      },
      mousemove: (e: MouseEvent) => {
        this.mousePos = { x: e.clientX, y: e.clientY };
      },
      touchstart: (e: TouchEvent) => {
        this.touches = Array.from(e.touches);
      },
      touchmove: (e: TouchEvent) => {
        this.touches = Array.from(e.touches);
      },
      touchend: (e: TouchEvent) => {
        this.touches = Array.from(e.touches);
      },
      gamepadconnected: () => {
        this.gamepadConnected = true;
      },
      gamepaddisconnected: () => {
        this.gamepadConnected = false;
      }
    };

    // Add event listeners and track them for cleanup
    Object.entries(handlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler as EventListener);
      this.eventListeners.push({
        target: window,
        type: event,
        listener: handler as EventListener
      });
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
    // Remove all event listeners
    this.eventListeners.forEach(({ target, type, listener }) => {
      target.removeEventListener(type, listener);
    });
    
    // Clear the listeners array
    this.eventListeners = [];
    
    // Reset internal state
    this.keys = {};
    this.touches = [];
    this.mousePos = { x: 0, y: 0 };
    this.gamepadConnected = false;
  }
}

// Export singleton instance
export const inputManager = new InputManager();

// Export cleanup function for external use
export const cleanupInputManager = () => inputManager.cleanup();