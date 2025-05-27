// Test script to verify localStorage validation

// Test 1: Corrupted JSON
console.log('Test 1: Corrupted JSON');
localStorage.setItem('retroGameSettings', '{invalid json}');
localStorage.setItem('retroGameStats', '{broken: json, missing quotes}');

// Test 2: Wrong data types
console.log('\nTest 2: Wrong data types');
localStorage.setItem('retroGameSettings', JSON.stringify({
  soundEnabled: 'yes', // Should be boolean
  volume: '0.5', // Should be number
  difficulty: 'extreme', // Invalid enum value
  theme: 123 // Should be string
}));

// Test 3: Missing required fields
console.log('\nTest 3: Missing fields');
localStorage.setItem('retroGameStats', JSON.stringify({
  highScores: { snake: 100 }, // Missing other games
  // Missing gamesPlayed and totalScore
}));

// Test 4: Overflow values
console.log('\nTest 4: Overflow values');
localStorage.setItem('retroGameStats', JSON.stringify({
  highScores: {
    snake: Number.MAX_VALUE,
    pong: Infinity,
    breakout: -100, // Negative score
    tetris: NaN,
    spaceInvaders: 'not a number',
    pacman: 0
  },
  gamesPlayed: Number.MAX_VALUE,
  totalScore: Infinity,
  achievements: []
}));

// Test 5: Huge data (exceeding size limits)
console.log('\nTest 5: Large data');
const hugeAchievements = [];
for (let i = 0; i < 10000; i++) {
  hugeAchievements.push({
    id: `achievement-${i}`,
    name: `Achievement ${i}`,
    description: 'This is a very long achievement description that contains lots of text to make the data larger. '.repeat(10),
    unlockedAt: new Date(),
    gameType: 'snake'
  });
}
localStorage.setItem('retroGameStats', JSON.stringify({
  highScores: { snake: 0, pong: 0, breakout: 0, tetris: 0, spaceInvaders: 0, pacman: 0 },
  gamesPlayed: 0,
  totalScore: 0,
  achievements: hugeAchievements
}));

console.log('\nTest data set up. Now run the app and check console for validation messages.');
console.log('The app should handle all these cases gracefully without crashing.');