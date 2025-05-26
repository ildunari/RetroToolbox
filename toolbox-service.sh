#!/bin/bash

# Retro Game Toolbox Service Manager
SERVICE="com.retro.game-toolbox"
PLIST_PATH="$HOME/Library/LaunchAgents/$SERVICE.plist"

case "$1" in
    start)
        echo "🎮 Starting Retro Game Toolbox..."
        launchctl load "$PLIST_PATH"
        echo "✅ Service started! Check status with: $0 status"
        ;;
    stop)
        echo "🛑 Stopping Retro Game Toolbox..."
        launchctl unload "$PLIST_PATH"
        echo "✅ Service stopped!"
        ;;
    restart)
        echo "🔄 Restarting Retro Game Toolbox..."
        launchctl unload "$PLIST_PATH" 2>/dev/null
        launchctl load "$PLIST_PATH"
        echo "✅ Service restarted!"
        ;;
    status)
        echo "📊 Retro Game Toolbox Status:"
        launchctl list | grep retro
        echo ""
        echo "📋 Recent logs:"
        tail -10 "$HOME/Documents/ProjectsCode/RetroToolbox/logs/output.log"
        ;;
    logs)
        echo "📄 Live logs (Ctrl+C to exit):"
        tail -f "$HOME/Documents/ProjectsCode/RetroToolbox/logs/output.log"
        ;;
    url)
        echo "🌐 Finding current Tailscale URL..."
        PORT=$(ps aux | grep "node server/server.js" | grep -v grep | awk '{for(i=1;i<=NF;i++) if($i~/port/) print $(i+1)}' | head -1)
        if [ -z "$PORT" ]; then
            # Extract port from logs if ps doesn't work
            PORT=$(grep "localhost:" "$HOME/Documents/ProjectsCode/RetroToolbox/logs/output.log" | tail -1 | sed 's/.*localhost:\([0-9]*\).*/\1/')
        fi
        if [ ! -z "$PORT" ]; then
            TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "100.x.x.x")
            echo "📱 Tailscale URL: http://$TAILSCALE_IP:$PORT"
        else
            echo "❌ Service not running or port not found"
        fi
        ;;
    *)
        echo "🎮 Retro Game Toolbox Service Manager"
        echo "Usage: $0 {start|stop|restart|status|logs|url}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the service"
        echo "  stop    - Stop the service"
        echo "  restart - Restart the service"
        echo "  status  - Show service status and recent logs"
        echo "  logs    - Show live logs"
        echo "  url     - Show current Tailscale URL"
        ;;
esac