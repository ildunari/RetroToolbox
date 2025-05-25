#!/bin/bash

# RetroToolbox Unified Deployment Script
# Handles local, codex, and production environments with automatic detection
#
# Usage:
#   ./deploy.sh                    # Auto-detect environment
#   ./deploy.sh dev                # Quick development (no service)
#   ./deploy.sh codex              # Codex deployment
#   ./deploy.sh prod               # Production deployment
#   ./deploy.sh service <command>  # Service management
#   ./deploy.sh --help             # Show help

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Environment detection
detect_environment() {
    if [ -d "/workspace" ]; then
        echo "codex"
    elif [ "$NODE_ENV" = "production" ]; then
        echo "production"
    else
        echo "local"
    fi
}

# Show help
show_help() {
    echo "RetroToolbox Deployment Script"
    echo ""
    echo "Usage:"
    echo "  ./deploy.sh                    # Auto-detect environment"
    echo "  ./deploy.sh dev                # Quick development (no service)"
    echo "  ./deploy.sh codex              # Codex deployment"
    echo "  ./deploy.sh prod               # Production deployment"
    echo "  ./deploy.sh service <command>  # Service management"
    echo ""
    echo "Service commands:"
    echo "  service start                  # Start the service"
    echo "  service stop                   # Stop the service"
    echo "  service restart                # Restart the service"
    echo "  service status                 # Check service status"
    echo "  service logs                   # View service logs"
    echo "  service url                    # Get the service URL"
    echo ""
    echo "Options:"
    echo "  --env <environment>            # Force specific environment"
    echo "  --skip-deps                    # Skip dependency installation"
    echo "  --skip-build                   # Skip build process"
    echo "  --no-service                   # Don't start service (local only)"
    echo "  --help, -h                     # Show this help"
}

# Handle service commands
handle_service_command() {
    local SERVICE_NAME="com.retro.game-toolbox"
    local PLIST_PATH="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"
    local LOG_PATH="$HOME/Library/Logs/RetroGameToolbox"
    
    case "$1" in
        start)
            log_info "Starting RetroToolbox service..."
            launchctl load "$PLIST_PATH" 2>/dev/null || log_warning "Service already running"
            sleep 2
            if launchctl list | grep -q "$SERVICE_NAME"; then
                log_success "Service started successfully"
                PORT=$(launchctl list | grep "$SERVICE_NAME" | awk '{print $3}')
                log_info "Service URL: http://localhost:${PORT:-3004}"
            else
                log_error "Failed to start service"
            fi
            ;;
        stop)
            log_info "Stopping RetroToolbox service..."
            launchctl unload "$PLIST_PATH" 2>/dev/null || log_warning "Service not running"
            log_success "Service stopped"
            ;;
        restart)
            handle_service_command stop
            sleep 1
            handle_service_command start
            ;;
        status)
            if launchctl list | grep -q "$SERVICE_NAME"; then
                log_success "Service is running"
                PORT=$(cat "$LOG_PATH/port.txt" 2>/dev/null || echo "3004")
                log_info "Service URL: http://localhost:$PORT"
            else
                log_warning "Service is not running"
            fi
            ;;
        logs)
            log_info "Showing service logs..."
            tail -f "$LOG_PATH/service.log"
            ;;
        url)
            if [ -f "$LOG_PATH/port.txt" ]; then
                PORT=$(cat "$LOG_PATH/port.txt")
                echo "http://localhost:$PORT"
            else
                echo "Service not running or port file not found"
            fi
            ;;
        *)
            log_error "Unknown service command: $1"
            echo "Valid commands: start, stop, restart, status, logs, url"
            exit 1
            ;;
    esac
}

# Project directory detection
detect_project_dir() {
    if [ -d "/workspace/RetroToolbox" ]; then
        echo "/workspace/RetroToolbox"
    elif [ -d "/Users/kostamilovanovic/Documents/ProjectsCode/RetroToolbox" ]; then
        echo "/Users/kostamilovanovic/Documents/ProjectsCode/RetroToolbox"
    else
        echo "$(pwd)"
    fi
}

# Cleanup function for rollback
cleanup_on_error() {
    log_error "Deployment failed. Starting rollback..."
    
    if [ -d "dist.backup" ]; then
        log_info "Restoring previous build..."
        rm -rf dist
        mv dist.backup dist
        log_success "Previous build restored"
    fi
    
    if [ "$ENVIRONMENT" = "local" ] && [ -f "$PLIST_PATH" ]; then
        log_info "Restarting service with previous version..."
        launchctl unload "$PLIST_PATH" 2>/dev/null || true
        launchctl load "$PLIST_PATH" 2>/dev/null || true
    fi
    
    exit 1
}

# Trap errors for rollback
trap cleanup_on_error ERR

# Main deployment function
main() {
    local ENVIRONMENT=$(detect_environment)
    local PROJECT_DIR=$(detect_project_dir)
    local SERVICE_NAME="com.retro.game-toolbox"
    local PLIST_PATH="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"
    local SKIP_DEPS=false
    local SKIP_BUILD=false
    local START_SERVICE=true
    
    # Handle shortcut commands
    case "$1" in
        dev)
            ENVIRONMENT="local"
            START_SERVICE=false
            shift
            ;;
        codex)
            ENVIRONMENT="codex"
            shift
            ;;
        prod|production)
            ENVIRONMENT="production"
            shift
            ;;
        service)
            shift
            handle_service_command "$@"
            exit 0
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
    esac
    
    # Parse remaining command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --no-service)
                START_SERVICE=false
                shift
                ;;
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "🎮 RetroToolbox Unified Deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Project Dir: $PROJECT_DIR"
    echo "================================"
    
    cd "$PROJECT_DIR"
    
    # Step 1: Environment verification
    log_info "Verifying environment..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    log_success "Node.js version: $NODE_VERSION"
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found in $PROJECT_DIR"
        exit 1
    fi
    
    # Step 2: Dependency installation
    if [ "$SKIP_DEPS" = false ]; then
        log_info "Installing dependencies..."
        
        if [ "$ENVIRONMENT" = "production" ]; then
            npm ci --production
        else
            npm ci
        fi
        
        log_success "Dependencies installed"
    else
        log_warning "Skipping dependency installation"
    fi
    
    # Step 3: Build process
    if [ "$SKIP_BUILD" = false ]; then
        log_info "Building project..."
        
        # Backup existing build
        if [ -d "dist" ]; then
            log_info "Backing up existing build..."
            rm -rf dist.backup 2>/dev/null || true
            mv dist dist.backup
        fi
        
        # Set environment variables for build
        export NODE_ENV="${ENVIRONMENT}"
        
        # Build with error handling
        if ! npm run build; then
            log_error "Build failed"
            cleanup_on_error
        fi
        
        # Verify build output
        if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
            log_error "Build output verification failed"
            cleanup_on_error
        fi
        
        log_success "Build completed successfully"
        
        # Clean up backup on successful build
        rm -rf dist.backup 2>/dev/null || true
    else
        log_warning "Skipping build process"
    fi
    
    # Step 4: Environment-specific deployment
    case $ENVIRONMENT in
        "codex")
            deploy_codex
            ;;
        "production")
            deploy_production
            ;;
        "local")
            if [ "$START_SERVICE" = true ]; then
                deploy_local "$SERVICE_NAME" "$PLIST_PATH" "$PROJECT_DIR"
            else
                log_info "Skipping service start (--no-service flag)"
            fi
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    # Step 5: Post-deployment verification
    verify_deployment "$ENVIRONMENT"
    
    log_success "🎉 Deployment completed successfully!"
}

# Codex environment deployment
deploy_codex() {
    log_info "Deploying for Codex environment..."
    
    # Create logs directory
    mkdir -p logs
    
    # Start server in background for testing
    log_info "Starting server for verification..."
    PORT=3001 npm start &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Verify server is running
    if kill -0 $SERVER_PID 2>/dev/null; then
        log_success "Server started successfully (PID: $SERVER_PID)"
        # Stop the verification server
        kill $SERVER_PID
    else
        log_error "Server failed to start"
        exit 1
    fi
    
    log_success "Codex deployment ready"
}

# Production environment deployment
deploy_production() {
    log_info "Deploying for production environment..."
    
    # Set production environment variables
    export NODE_ENV=production
    export PORT=${PORT:-3001}
    
    # Create necessary directories
    mkdir -p logs
    
    # Production-specific optimizations
    log_info "Applying production optimizations..."
    
    # Compress static assets if available
    if command -v gzip &> /dev/null; then
        find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -k {} \;
        log_success "Static assets compressed"
    fi
    
    log_success "Production deployment ready"
    log_info "Start server with: npm start"
}

# Local environment deployment with service management
deploy_local() {
    local SERVICE_NAME="$1"
    local PLIST_PATH="$2"
    local PROJECT_DIR="$3"
    
    log_info "Deploying for local environment with service management..."
    
    # Create logs directory
    mkdir -p logs
    
    # Stop existing service
    if launchctl list | grep -q "$SERVICE_NAME"; then
        log_info "Stopping existing service..."
        launchctl unload "$PLIST_PATH" 2>/dev/null || true
    fi
    
    # Create/update service configuration
    create_service_plist "$SERVICE_NAME" "$PLIST_PATH" "$PROJECT_DIR"
    
    # Start service
    log_info "Starting service..."
    launchctl load "$PLIST_PATH"
    
    # Wait for service to start
    sleep 3
    
    # Verify service is running
    if launchctl list | grep -q "$SERVICE_NAME"; then
        log_success "Service started successfully"
        
        # Show access information
        show_access_info
    else
        log_error "Service failed to start"
        log_info "Check logs: tail -f logs/error.log"
        exit 1
    fi
}

# Create service plist for local deployment
create_service_plist() {
    local SERVICE_NAME="$1"
    local PLIST_PATH="$2"
    local PROJECT_DIR="$3"
    
    log_info "Creating service configuration..."
    
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
    <string>$PROJECT_DIR/logs/output.log</string>
    
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/error.log</string>
    
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

    log_success "Service configuration created"
}

# Show access information
show_access_info() {
    sleep 2
    local PORT=$(grep "localhost:" logs/output.log 2>/dev/null | tail -1 | sed 's/.*localhost:\([0-9]*\).*/\1/' | head -1)
    
    if [ ! -z "$PORT" ]; then
        echo ""
        log_success "🌐 Access URLs:"
        echo "   Local:     http://localhost:$PORT"
        echo "   Health:    http://localhost:$PORT/health"
        echo "   Tailscale: http://100.96.99.2:$PORT"
        echo ""
        log_info "📊 Management commands:"
        echo "   ./toolbox-service.sh status   - Check service status"
        echo "   ./toolbox-service.sh logs     - View live logs"
        echo "   ./toolbox-service.sh restart  - Restart service"
    fi
}

# Verify deployment
verify_deployment() {
    local ENVIRONMENT="$1"
    
    log_info "Verifying deployment..."
    
    # Check if dist directory exists and has content
    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
        log_error "Build verification failed - dist directory missing or empty"
        return 1
    fi
    
    # Check if index.html exists
    if [ ! -f "dist/index.html" ]; then
        log_error "Build verification failed - index.html missing"
        return 1
    fi
    
    # Environment-specific verifications
    case $ENVIRONMENT in
        "local")
            if [ -f "logs/output.log" ]; then
                log_success "Service logs found"
            fi
            ;;
        "codex")
            log_success "Codex environment verified"
            ;;
        "production")
            log_success "Production build verified"
            ;;
    esac
    
    log_success "Deployment verification passed"
}



# Run main function with all arguments
main "$@"