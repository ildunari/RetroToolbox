import { useCallback, useEffect, useRef, useState } from 'react';

export interface GamepadState {
  connected: boolean;
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  buttons: boolean[];
}

export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'hold';
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  deltaPos: { x: number; y: number };
  startTime: number;
  duration: number;
  distance: number;
}

export interface InputBuffer {
  key: string;
  timestamp: number;
  consumed: boolean;
}

export interface KeyboardHookOptions {
  bufferTime?: number;
  preventDefault?: boolean;
}

export interface TouchHookOptions {
  gestureThreshold?: number;
  holdThreshold?: number;
}

export class InputManager {
  private keys: Record<string, boolean> = {};
  private previousKeys: Record<string, boolean> = {};
  private inputBuffer: InputBuffer[] = [];
  private maxBufferSize: number = 50;
  private bufferTimeout: number = 500; // ms
  
  private touches: Touch[] = [];
  private touchStartTime: number = 0;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private currentGesture: TouchGesture | null = null;
  
  private mousePos: { x: number; y: number } = { x: 0, y: 0 };
  private mouseButtons: boolean[] = [false, false, false];
  
  private gamepadConnected: boolean = false;
  private gamepadDeadzone: number = 0.1;
  
  private listeners: Map<string, Set<(event: any) => void>> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.previousKeys[e.key] = this.keys[e.key] || false;
      this.keys[e.key] = true;
      
      // Add to input buffer
      this.addToBuffer(e.key);
      
      this.emit('keydown', { key: e.key, event: e });
    });

    window.addEventListener('keyup', (e) => {
      this.previousKeys[e.key] = this.keys[e.key] || false;
      this.keys[e.key] = false;
      
      this.emit('keyup', { key: e.key, event: e });
    });

    // Mouse events
    window.addEventListener('mousemove', (e) => {
      this.mousePos = { x: e.clientX, y: e.clientY };
      this.emit('mousemove', { x: e.clientX, y: e.clientY, event: e });
    });

    window.addEventListener('mousedown', (e) => {
      this.mouseButtons[e.button] = true;
      this.emit('mousedown', { button: e.button, x: e.clientX, y: e.clientY, event: e });
    });

    window.addEventListener('mouseup', (e) => {
      this.mouseButtons[e.button] = false;
      this.emit('mouseup', { button: e.button, x: e.clientX, y: e.clientY, event: e });
    });

    // Touch events with gesture recognition
    window.addEventListener('touchstart', (e) => {
      this.touches = Array.from(e.touches);
      this.touchStartTime = Date.now();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchStartPos = { x: touch.clientX, y: touch.clientY };
      }
      
      this.emit('touchstart', { touches: this.touches, event: e });
    });

    window.addEventListener('touchmove', (e) => {
      this.touches = Array.from(e.touches);
      this.updateGesture();
      this.emit('touchmove', { touches: this.touches, gesture: this.currentGesture, event: e });
    });

    window.addEventListener('touchend', (e) => {
      this.finalizeGesture();
      this.touches = Array.from(e.touches);
      
      if (this.currentGesture) {
        this.emit('gesture', { gesture: this.currentGesture, event: e });
      }
      
      this.emit('touchend', { touches: this.touches, event: e });
      this.currentGesture = null;
    });

    // Gamepad events
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadConnected = true;
      this.emit('gamepadconnected', { gamepad: e.gamepad });
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      this.gamepadConnected = false;
      this.emit('gamepaddisconnected', { gamepad: e.gamepad });
    });

    // Clean up buffer periodically
    setInterval(() => this.cleanupBuffer(), 1000);
  }

  private addToBuffer(key: string): void {
    this.inputBuffer.push({
      key,
      timestamp: Date.now(),
      consumed: false
    });

    // Keep buffer size manageable
    if (this.inputBuffer.length > this.maxBufferSize) {
      this.inputBuffer.shift();
    }
  }

  private cleanupBuffer(): void {
    const now = Date.now();
    this.inputBuffer = this.inputBuffer.filter(
      input => now - input.timestamp < this.bufferTimeout
    );
  }

  private updateGesture(): void {
    if (this.touches.length === 1) {
      const touch = this.touches[0];
      const currentPos = { x: touch.clientX, y: touch.clientY };
      const deltaPos = {
        x: currentPos.x - this.touchStartPos.x,
        y: currentPos.y - this.touchStartPos.y
      };
      const distance = Math.sqrt(deltaPos.x ** 2 + deltaPos.y ** 2);
      const duration = Date.now() - this.touchStartTime;

      this.currentGesture = {
        type: distance > 20 ? 'swipe' : duration > 500 ? 'hold' : 'tap',
        startPos: this.touchStartPos,
        currentPos,
        deltaPos,
        startTime: this.touchStartTime,
        duration,
        distance
      };
    }
  }

  private finalizeGesture(): void {
    if (this.currentGesture) {
      const duration = Date.now() - this.touchStartTime;
      
      if (this.currentGesture.distance < 10 && duration < 300) {
        this.currentGesture.type = 'tap';
      } else if (this.currentGesture.distance > 20) {
        this.currentGesture.type = 'swipe';
      } else if (duration > 500) {
        this.currentGesture.type = 'hold';
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  // Public API methods
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return cleanup function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  isKeyPressed(key: string): boolean {
    return this.keys[key] || false;
  }

  isKeyJustPressed(key: string): boolean {
    return this.keys[key] && !this.previousKeys[key];
  }

  isKeyJustReleased(key: string): boolean {
    return !this.keys[key] && this.previousKeys[key];
  }

  consumeBufferedInput(key: string): boolean {
    const input = this.inputBuffer.find(input => input.key === key && !input.consumed);
    if (input) {
      input.consumed = true;
      return true;
    }
    return false;
  }

  getBufferedInputs(): InputBuffer[] {
    return this.inputBuffer.filter(input => !input.consumed);
  }

  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePos };
  }

  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons[button] || false;
  }

  getTouches(): Touch[] {
    return [...this.touches];
  }

  getCurrentGesture(): TouchGesture | null {
    return this.currentGesture;
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

    // Apply deadzone to stick inputs
    const applyDeadzone = (value: number) => {
      return Math.abs(value) < this.gamepadDeadzone ? 0 : value;
    };

    return {
      connected: true,
      leftStick: {
        x: applyDeadzone(gamepad.axes[0] || 0),
        y: applyDeadzone(gamepad.axes[1] || 0)
      },
      rightStick: {
        x: applyDeadzone(gamepad.axes[2] || 0),
        y: applyDeadzone(gamepad.axes[3] || 0)
      },
      buttons: gamepad.buttons.map(button => button.pressed)
    };
  }

  setGamepadDeadzone(deadzone: number): void {
    this.gamepadDeadzone = Math.max(0, Math.min(1, deadzone));
  }

  update(): void {
    // Update previous key states for just pressed/released detection
    this.previousKeys = { ...this.keys };
  }

  cleanup(): void {
    this.keys = {};
    this.previousKeys = {};
    this.inputBuffer = [];
    this.touches = [];
    this.currentGesture = null;
    this.listeners.clear();
  }
}

// React hooks for easy integration
export function useKeyboard(options: KeyboardHookOptions = {}): {
  isPressed: (key: string) => boolean;
  isJustPressed: (key: string) => boolean;
  isJustReleased: (key: string) => boolean;
  consumeInput: (key: string) => boolean;
} {
  const inputManagerRef = useRef<InputManager>();
  
  if (!inputManagerRef.current) {
    inputManagerRef.current = inputManager;
  }

  return {
    isPressed: useCallback((key: string) => inputManagerRef.current!.isKeyPressed(key), []),
    isJustPressed: useCallback((key: string) => inputManagerRef.current!.isKeyJustPressed(key), []),
    isJustReleased: useCallback((key: string) => inputManagerRef.current!.isKeyJustReleased(key), []),
    consumeInput: useCallback((key: string) => inputManagerRef.current!.consumeBufferedInput(key), [])
  };
}

export function useTouch(options: TouchHookOptions = {}): {
  touches: Touch[];
  gesture: TouchGesture | null;
  onGesture: (callback: (gesture: TouchGesture) => void) => () => void;
} {
  const [touches, setTouches] = useState<Touch[]>([]);
  const [gesture, setGesture] = useState<TouchGesture | null>(null);
  const inputManagerRef = useRef<InputManager>();
  
  if (!inputManagerRef.current) {
    inputManagerRef.current = inputManager;
  }

  useEffect(() => {
    const manager = inputManagerRef.current!;
    
    const unsubscribeTouch = manager.on('touchmove', ({ touches, gesture }) => {
      setTouches(touches);
      setGesture(gesture);
    });
    
    const unsubscribeGesture = manager.on('gesture', ({ gesture }) => {
      setGesture(gesture);
    });

    return () => {
      unsubscribeTouch();
      unsubscribeGesture();
    };
  }, []);

  const onGesture = useCallback((callback: (gesture: TouchGesture) => void) => {
    return inputManagerRef.current!.on('gesture', ({ gesture }) => callback(gesture));
  }, []);

  return { touches, gesture, onGesture };
}

export function useGamepad(): GamepadState {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    buttons: []
  });
  
  const inputManagerRef = useRef<InputManager>();
  
  if (!inputManagerRef.current) {
    inputManagerRef.current = inputManager;
  }

  useEffect(() => {
    const updateGamepad = () => {
      setGamepadState(inputManagerRef.current!.getGamepadState());
    };

    const interval = setInterval(updateGamepad, 16); // ~60fps
    
    const unsubscribeConnect = inputManagerRef.current!.on('gamepadconnected', updateGamepad);
    const unsubscribeDisconnect = inputManagerRef.current!.on('gamepaddisconnected', updateGamepad);

    return () => {
      clearInterval(interval);
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, []);

  return gamepadState;
}

// Export singleton instance
export const inputManager = new InputManager();