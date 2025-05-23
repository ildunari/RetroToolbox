#!/bin/bash

# Codex Setup Script - Optimized for cloud environment
# This script runs in the Codex workspace (/workspace/RetroToolbox)

echo "🎮 RetroToolbox Codex Setup"
echo "Working directory: $(pwd)"
echo "Node.js version: $(node -v)"
echo "================================"

# Verify we're in the right place
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $(pwd)"
    echo "Directory contents:"
    ls -la
    exit 1
fi

echo "✅ Found package.json"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

if [ $? -ne 0 ]; then
    echo "❌ npm ci failed, trying npm install..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Dependencies installed"

# Build the project
echo "🏗️  Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Create logs directory for compatibility
mkdir -p logs

# Show project structure for debugging
echo "📁 Project structure:"
find . -maxdepth 2 -type f -name "*.json" -o -name "*.js" -o -name "*.ts" -o -name "*.md" | head -10

echo "🎉 Setup complete! Ready for Codex tasks."