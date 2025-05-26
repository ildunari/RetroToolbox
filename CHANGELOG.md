# Changelog

All notable changes to the Retro Game Toolbox project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-05-26

### Summary
Merged multiple bug fixes from PR reviews, implemented feature enhancements, and improved code stability with React hooks optimizations.

### Added
- Canvas shake effect animation for visual feedback in BreakoutGame
- CSS animation support for game effects
- Comprehensive project dependencies documentation in AGENTS.md

### Fixed
- **Snake Game**
  - Fixed stale closure issues in event handlers by using refs for mutable state
  - Improved event listener management to prevent memory leaks
  - Fixed difficulty settings not updating properly in callbacks
  
- **Build System**
  - Fixed build paths for production deployment
  - Fixed high score display issues
  - Fixed multiple crash scenarios across games

### Changed
- Updated SnakeGame to use refs pattern for better React performance
- Improved particle system error handling across all games
- Enhanced mobile touch controls reliability

### Technical Improvements
- Removed dependencies from useEffect hooks to prevent re-renders
- Optimized event handler closures for better performance
- Improved TypeScript type safety in game components

## [1.0.1] - 2025-05-25

### Summary
Emergency hotfix release addressing critical issues in multiple games. All games are now fully functional with proper rendering, controls, and performance optimization.

### Fixed
- **Pong Game**
  - Fixed full screen display by properly initializing canvas dimensions
  - Resolved AI paddle initialization to ensure proper gameplay start
  - Corrected paddle positioning for consistent gameplay

- **Breakout Game**
  - Fixed paddle visibility by ensuring correct color rendering
  - Improved brick layout centering for better visual consistency
  - Resolved canvas sizing issues for proper game display

- **Pac-Man Game**
  - Eliminated React hook violations by proper dependency management
  - Improved performance by optimizing render cycles
  - Fixed memory leaks from improper cleanup

- **Stellar Drift Game**
  - Fixed canvas sizing to use actual dimensions instead of CSS values
  - Corrected tunnel width calculations for proper gameplay
  - Resolved initial rendering issues

### Added
- **Canvas Utilities**
  - Added responsive canvas utility functions for consistent game scaling
  - Implemented proper viewport handling across all games
  - Created shared canvas initialization patterns

- **Testing Framework**
  - Added comprehensive game testing utilities
  - Implemented automated checks for common issues
  - Created test patterns for canvas and React hook problems

### Verified
- **Snake Game**: Confirmed all features working correctly without issues

## Emergency Hotfix Guide

### Common Issues and Solutions

#### Canvas Display Problems
**Symptoms**: Game not visible, incorrect sizing, or partial rendering

**Solutions**:
1. Check canvas initialization:
   ```javascript
   const rect = canvasRef.current.getBoundingClientRect();
   const width = rect.width;
   const height = rect.height;
   canvas.width = width;
   canvas.height = height;
   ```

2. Ensure proper cleanup in useEffect:
   ```javascript
   return () => {
     if (animationRef.current) {
       cancelAnimationFrame(animationRef.current);
     }
   };
   ```

3. Verify canvas context:
   ```javascript
   const ctx = canvas.getContext('2d');
   if (!ctx) return;
   ```

#### React Hook Violations
**Symptoms**: Console errors about hook rules, crashes, or inconsistent behavior

**Solutions**:
1. Check hook dependencies:
   ```javascript
   useEffect(() => {
     // Effect code
   }, [/* all dependencies */]);
   ```

2. Avoid conditional hooks:
   ```javascript
   // BAD
   if (condition) {
     useEffect(() => {});
   }
   
   // GOOD
   useEffect(() => {
     if (condition) {
       // Effect code
     }
   }, [condition]);
   ```

3. Use callback refs for dynamic dependencies:
   ```javascript
   const stableCallback = useCallback(() => {
     // Your function
   }, [dependencies]);
   ```

#### Touch Control Issues
**Symptoms**: Touch controls not working on mobile devices

**Solutions**:
1. Verify touch event listeners:
   ```javascript
   canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
   canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
   canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
   ```

2. Prevent default behavior:
   ```javascript
   const handleTouchStart = (e) => {
     e.preventDefault();
     // Handle touch
   };
   ```

3. Check viewport meta tag in index.html:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

### Debugging Steps

1. **Browser Console**: Always check for errors first
2. **React DevTools**: Inspect component state and props
3. **Canvas Inspector**: Use browser tools to verify canvas dimensions
4. **Network Tab**: Ensure all resources load correctly
5. **Mobile Debugging**: Use remote debugging for actual device testing

### Quick Fixes

- **Game not starting**: Check `gameState` initialization
- **Controls not working**: Verify event listener attachment
- **Performance issues**: Look for missing cleanup in useEffect
- **Visual glitches**: Check canvas clear before each frame
- **Sound problems**: Ensure SoundManager is properly imported

## [1.0.0] - 2025-05-22

### Added
- Initial release with 7 fully implemented games
- Modular architecture with individual game components
- Optimized core systems (SoundManager, InputManager, ParticleSystem)
- Full TypeScript support for core modules
- Responsive design for desktop and mobile
- Touch control support for all games
- Gamepad support
- Persistent settings and high scores
- OpenAI Codex integration support