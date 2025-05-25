#!/bin/bash

# DEPRECATED: This script is deprecated and will be removed in a future version
echo "⚠️  DEPRECATED: Use './deploy.sh codex' instead"
echo "   This wrapper will be removed in a future version"
echo ""

# Call the new command for backwards compatibility
exec "./deploy.sh" codex "$@"