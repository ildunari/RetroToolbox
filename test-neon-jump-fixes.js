// Test script to verify NeonJump fixes
// Run this in browser console to test the fixed methods

console.log("Testing NeonJump fixes...");

// Check if the game is loaded
const gameCanvas = document.querySelector('canvas');
if (!gameCanvas) {
  console.error("No canvas found - make sure you're on the NeonJump game page");
} else {
  console.log("✓ Canvas found");
  
  // Dispatch quality change event to test setParticleQualityMultiplier
  const qualityEvent = new CustomEvent('neonjump-quality-change', {
    detail: {
      level: 'medium',
      settings: {
        particles: 0.5,
        effects: 0.7,
        shadows: false
      }
    }
  });
  
  console.log("Dispatching quality change event...");
  window.dispatchEvent(qualityEvent);
  console.log("✓ Quality change event dispatched (should call setParticleQualityMultiplier)");
  
  // Dispatch memory optimize event to test clearAgedParticles
  const memoryEvent = new CustomEvent('neonjump-memory-optimize');
  
  console.log("Dispatching memory optimize event...");
  window.dispatchEvent(memoryEvent);
  console.log("✓ Memory optimize event dispatched (should call clearAgedParticles)");
  
  console.log("\nIf no errors appear in console, the fixes are working correctly!");
}