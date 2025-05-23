#!/bin/bash

echo "🎮 Deploying Retro Game Toolbox..."
echo "=================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Start the server
echo "🚀 Starting server..."
npm run start