#!/bin/bash

# RetroToolbox Startup Script
# This script sets up and starts the RetroToolbox service for OpenAI Codex integration

PROJECT_DIR="/Users/kostamilovanovic/Documents/ProjectsCode/RetroToolbox"
SERVICE_NAME="com.retro.game-toolbox"
PLIST_PATH="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"
LOG_DIR="$PROJECT_DIR/logs"

echo "🎮 RetroToolbox Startup Script"
echo "================================"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to check if Node.js is available
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed or not in PATH"
        echo "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//')
    echo "✅ Node.js version: $NODE_VERSION"
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    cd "$PROJECT_DIR"
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
}

# Function to build the project
build_project() {
    echo "🏗️  Building project..."
    cd "$PROJECT_DIR"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Project built successfully"
    else
        echo "❌ Build failed"
        exit 1
    fi
}

# Function to create LaunchAgent plist
create_service() {
    echo "⚙️  Creating service configuration..."
    
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$SERVICE_NAME</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$PROJECT_DIR/server/server.js</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    
    <key>StandardOutPath</key>
    <string>$LOG_DIR/output.log</string>
    
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/error.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3001</string>
        <key>PROJECT_ROOT</key>
        <string>$PROJECT_DIR</string>
    </dict>
    
    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>
EOF

    echo "✅ Service configuration created at $PLIST_PATH"
}

# Function to start the service
start_service() {
    echo "🚀 Starting RetroToolbox service..."
    
    # Unload if already loaded
    launchctl unload "$PLIST_PATH" 2>/dev/null
    
    # Load the service
    launchctl load "$PLIST_PATH"
    
    if [ $? -eq 0 ]; then
        echo "✅ Service started successfully"
        
        # Wait a moment for service to start
        sleep 3
        
        # Check if service is running
        if launchctl list | grep -q "$SERVICE_NAME"; then
            echo "✅ Service is running"
            
            # Try to get the port and show access information
            sleep 2
            PORT=$(grep "localhost:" "$LOG_DIR/output.log" 2>/dev/null | tail -1 | sed 's/.*localhost:\([0-9]*\).*/\1/' | head -1)
            
            if [ ! -z "$PORT" ]; then
                echo ""
                echo "🌐 Access URLs:"
                echo "   Local:     http://localhost:$PORT"
                echo "   Tailscale: http://100.96.99.2:$PORT"
                echo ""
                echo "📊 Use './toolbox-service.sh status' to check service status"
                echo "📄 Use './toolbox-service.sh logs' to view live logs"
            fi
        else
            echo "❌ Service failed to start. Check logs:"
            tail -10 "$LOG_DIR/error.log"
        fi
    else
        echo "❌ Failed to start service"
        exit 1
    fi
}

# Function to show service information
show_info() {
    echo ""
    echo "📋 Service Information:"
    echo "   Name: $SERVICE_NAME"
    echo "   Plist: $PLIST_PATH"
    echo "   Logs: $LOG_DIR/"
    echo "   Project: $PROJECT_DIR"
    echo ""
    echo "🔧 Management Commands:"
    echo "   ./toolbox-service.sh start    - Start service"
    echo "   ./toolbox-service.sh stop     - Stop service"
    echo "   ./toolbox-service.sh restart  - Restart service"
    echo "   ./toolbox-service.sh status   - Show status"
    echo "   ./toolbox-service.sh logs     - View live logs"
    echo "   ./toolbox-service.sh url      - Show access URLs"
    echo ""
    echo "🤖 OpenAI Codex Integration:"
    echo "   The AGENTS.md file provides Codex with project context"
    echo "   Service runs automatically and can be accessed via Tailscale"
    echo "   All development tools are configured for optimal AI assistance"
}

# Main execution
main() {
    echo "Starting setup process..."
    echo ""
    
    # Check prerequisites
    check_node
    
    # Install dependencies
    install_deps
    
    # Build project
    build_project
    
    # Create service configuration
    create_service
    
    # Start the service
    start_service
    
    # Show information
    show_info
    
    echo ""
    echo "🎉 RetroToolbox setup complete!"
    echo "   Your retro game collection is now running and ready for development."
}

# Handle command line arguments
case "$1" in
    --skip-deps)
        echo "⏭️  Skipping dependency installation..."
        check_node
        build_project
        create_service
        start_service
        show_info
        ;;
    --info-only)
        show_info
        ;;
    *)
        main
        ;;
esac