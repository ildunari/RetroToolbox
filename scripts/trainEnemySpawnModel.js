// Offline training script for enemy spawn rate model
// Usage: node scripts/trainEnemySpawnModel.js

const tf = require('@tensorflow/tfjs');
const fs = require('fs');

// Example dataset of run statistics
// Each entry: [level, scorePerMinute] => spawn rate adjustment
const data = [
  { level: 1, scorePerMinute: 100, spawnRate: 1 },
  { level: 2, scorePerMinute: 150, spawnRate: 1.2 },
  { level: 3, scorePerMinute: 200, spawnRate: 1.5 },
  { level: 4, scorePerMinute: 250, spawnRate: 1.8 },
  { level: 5, scorePerMinute: 300, spawnRate: 2 }
];

const xs = tf.tensor2d(data.map(d => [d.level, d.scorePerMinute]));
const ys = tf.tensor2d(data.map(d => [d.spawnRate]));

const model = tf.sequential();
model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [2] }));
model.add(tf.layers.dense({ units: 1 }));

model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

async function run() {
  await model.fit(xs, ys, { epochs: 50 });
  await model.save('file://public/models/enemySpawnModel');
  console.log('Model saved to public/models/enemySpawnModel');
}

run();
