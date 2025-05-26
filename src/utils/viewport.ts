export function detectMobileBrowser(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
}

export function getAvailableViewport() {
  const vw = window.visualViewport?.width || window.innerWidth;
  const vh = window.visualViewport?.height || window.innerHeight;
  
  // Account for mobile browser UI (address bar, navigation buttons)
  const mobileUIHeight = detectMobileBrowser() ? 100 : 0;
  
  return { 
    width: vw, 
    height: vh - mobileUIHeight,
    isMobile: detectMobileBrowser()
  };
}

export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

export function normalizeCoordinates(
  x: number, 
  y: number, 
  element: HTMLElement
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: (x - rect.left) / rect.width,
    y: (y - rect.top) / rect.height
  };
}

export function denormalizeCoordinates(
  normalizedX: number,
  normalizedY: number,
  element: HTMLElement
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: normalizedX * rect.width + rect.left,
    y: normalizedY * rect.height + rect.top
  };
}export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight;
}

export function addViewportMeta(): void {
  let viewport = document.querySelector('meta[name="viewport"]');
  
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  
  viewport.setAttribute('content', 
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
  );
}

export function lockOrientation(orientation: 'portrait' | 'landscape' | 'any' = 'any'): void {
  if ('orientation' in screen && 'lock' in screen.orientation) {
    try {
      if (orientation === 'any') {
        screen.orientation.unlock();
      } else {
        screen.orientation.lock(orientation).catch(() => {
          // Orientation lock not supported or failed
        });
      }
    } catch {
      // Orientation API not supported
    }
  }
}

export function preventBodyScroll(prevent: boolean = true): void {
  if (prevent) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';
  } else {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.touchAction = '';
  }
}