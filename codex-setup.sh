#!/bin/bash

# Codex Setup Script - Wrapper for unified deployment script
# Optimized for OpenAI Codex cloud environment

echo "🎮 RetroToolbox Codex Setup"
echo "================================"
echo "Using unified deployment script for Codex environment..."
echo ""

# Get script directory for relative path to deploy.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Call unified deploy script with Codex environment settings
exec "./deploy.sh" --env codex