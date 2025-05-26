// Canvas size calculation interface
export interface CanvasSize {
  width: number;
  height: number;
  scale: number;
}

// Canvas calculation parameters
export interface CanvasCalculationParams {
  aspectRatio: number;
  minWidth: number;
  minHeight: number;
  maxScale?: number;
}

// Mobile/device configuration
export interface MobileConfig {
  isMobile: boolean;
  isTablet: boolean;
  touchEnabled: boolean;
  viewport: {
    width: number;
    height: number;
  };
}

// Constants for layout calculations
const HEADER_HEIGHT = 80;
const CONTAINER_PADDING = 32; // 16px on each side

/**
 * Calculate optimal canvas size maintaining aspect ratio
 * Accounts for header and padding constraints
 */
export function calculateGameCanvas({
  aspectRatio,
  minWidth,
  minHeight,
  maxScale = 2
}: CanvasCalculationParams): CanvasSize {
  // Get available space (accounting for header and padding)
  const availableWidth = window.innerWidth - CONTAINER_PADDING;
  const availableHeight = window.innerHeight - HEADER_HEIGHT - CONTAINER_PADDING;

  // Calculate dimensions that fit within available space
  let width = availableWidth;
  let height = width / aspectRatio;

  // If height exceeds available space, calculate from height instead
  if (height > availableHeight) {
    height = availableHeight;
    width = height * aspectRatio;
  }

  // Enforce minimum sizes
  if (width < minWidth) {
    width = minWidth;
    height = width / aspectRatio;
  }

  if (height < minHeight) {
    height = minHeight;
    width = height * aspectRatio;
  }

  // Calculate scale factor (for high DPI displays)
  const scale = Math.min(
    window.devicePixelRatio || 1,
    maxScale
  );

  // Return final dimensions
  return {
    width: Math.floor(width),
    height: Math.floor(height),
    scale
  };
}

/**
 * Detect mobile device configuration and capabilities
 */
export function getMobileConfig(): MobileConfig {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detect mobile devices
  const isMobile = /iphone|ipod|android|webos|blackberry|windows phone/i.test(userAgent);
  
  // Detect tablets (iPads and large Android devices)
  const isIPad = /ipad/i.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroidTablet = /android/i.test(userAgent) && 
    Math.min(window.innerWidth, window.innerHeight) >= 600;
  const isTablet = isIPad || isAndroidTablet;
  
  // Detect touch capability
  const touchEnabled = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 ||
    'msMaxTouchPoints' in navigator;

  // Get viewport dimensions (prefer visualViewport API if available)
  const viewport = {
    width: window.visualViewport?.width || window.innerWidth,
    height: window.visualViewport?.height || window.innerHeight
  };

  return {
    isMobile,
    isTablet,
    touchEnabled,
    viewport
  };
}

/**
 * Get optimal canvas configuration for a specific game
 * Combines device detection with canvas calculations
 */
export function getOptimalCanvasConfig(
  baseConfig: CanvasCalculationParams
): CanvasSize & { deviceConfig: MobileConfig } {
  const deviceConfig = getMobileConfig();
  
  // Adjust parameters based on device type
  let adjustedConfig = { ...baseConfig };
  
  if (deviceConfig.isMobile && !deviceConfig.isTablet) {
    // For phones, reduce minimum sizes
    adjustedConfig.minWidth = Math.min(adjustedConfig.minWidth, 320);
    adjustedConfig.minHeight = Math.min(adjustedConfig.minHeight, 240);
  }
  
  const canvasSize = calculateGameCanvas(adjustedConfig);
  
  return {
    ...canvasSize,
    deviceConfig
  };
}

/**
 * Helper to clamp canvas size within bounds
 */
export function clampCanvasSize(
  size: CanvasSize,
  minWidth: number,
  minHeight: number,
  maxWidth: number,
  maxHeight: number
): CanvasSize {
  return {
    width: Math.max(minWidth, Math.min(maxWidth, size.width)),
    height: Math.max(minHeight, Math.min(maxHeight, size.height)),
    scale: size.scale
  };
}

/**
 * Calculate touch-friendly button/control sizes based on device
 */
export function getTouchControlSize(baseSize: number): number {
  const { isMobile, isTablet } = getMobileConfig();
  
  if (isMobile && !isTablet) {
    // Phones need larger touch targets
    return Math.max(baseSize * 1.5, 44); // iOS minimum touch target
  } else if (isTablet) {
    // Tablets can use slightly smaller than phones but larger than desktop
    return Math.max(baseSize * 1.25, 40);
  }
  
  // Desktop can use base size
  return baseSize;
}