#!/bin/bash

# RetroToolbox Quick Startup Script
# Wrapper for deploy.sh with quick development settings

echo "🎮 RetroToolbox Quick Startup"
echo "=============================="
echo "Using unified deployment script with development settings..."
echo ""

# Get script directory for relative path to deploy.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Call unified deploy script with quick development flags
exec "./deploy.sh" --env local --no-service