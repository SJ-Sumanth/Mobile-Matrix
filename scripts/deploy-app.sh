#!/bin/bash

# Application Deployment Script
# This script handles the complete application deployment process

set -e

echo "🚀 Starting application deployment..."

# Configuration
BUILD_DIR="./build"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment-$(date +%Y%m%d-%H%M%S).log"

# Create necessary directories
mkdir -p logs backups

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "🔍 Checking deployment prerequisites..."
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    log "Node.js version: $NODE_VERSION"
    
    # Check npm version
    NPM_VERSION=$(npm --version)
    log "npm version: $NPM_VERSION"
    
    # Check if required environment variables are set
    required_vars=("DATABASE_URL" "REDIS_URL" "GEMINI_API_KEY" "NEXTAUTH_SECRET")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log "❌ ERROR: Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log "✅ Prerequisites check completed"
}

# Function to backup current deployment
backup_current() {
    if [ -d "$BUILD_DIR" ]; then
        log "📦 Creating backup of current deployment..."
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        cp -r "$BUILD_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        log "✅ Backup created: $BACKUP_DIR/$BACKUP_NAME"
    else
        log "⏭️  No existing deployment to backup"
    fi
}

# Function to install dependencies
install_dependencies() {
    log "📦 Installing production dependencies..."
    npm ci --only=production --silent
    
    if [ $? -eq 0 ]; then
        log "✅ Dependencies installed successfully"
    else
        log "❌ Dependency installation failed"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" != "true" ]; then
        log "🧪 Running tests..."
        npm run test:unit
        
        if [ $? -eq 0 ]; then
            log "✅ Tests passed successfully"
        else
            log "❌ Tests failed"
            exit 1
        fi
    else
        log "⏭️  Skipping tests"
    fi
}

# Function to build application
build_application() {
    log "🔨 Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        log "✅ Application built successfully"
    else
        log "❌ Application build failed"
        exit 1
    fi
}

# Function to deploy database
deploy_database() {
    log "🗄️  Deploying database..."
    ./scripts/deploy-db.sh
    
    if [ $? -eq 0 ]; then
        log "✅ Database deployed successfully"
    else
        log "❌ Database deployment failed"
        exit 1
    fi
}

# Function to start application
start_application() {
    log "🚀 Starting application..."
    
    # Stop existing process if running
    if [ -f "app.pid" ]; then
        OLD_PID=$(cat app.pid)
        if kill -0 "$OLD_PID" 2>/dev/null; then
            log "🛑 Stopping existing application (PID: $OLD_PID)"
            kill "$OLD_PID"
            sleep 5
        fi
        rm -f app.pid
    fi
    
    # Start new process
    nohup npm start > ./logs/app.log 2>&1 &
    APP_PID=$!
    echo $APP_PID > app.pid
    
    log "✅ Application started (PID: $APP_PID)"
    
    # Wait a moment and check if process is still running
    sleep 3
    if kill -0 "$APP_PID" 2>/dev/null; then
        log "✅ Application is running successfully"
    else
        log "❌ Application failed to start"
        exit 1
    fi
}

# Function to run health check
health_check() {
    log "🏥 Running health check..."
    
    # Wait for application to be ready
    sleep 10
    
    # Check if application responds
    HEALTH_URL="${APP_URL:-http://localhost:3000}/api/health"
    
    for i in {1..5}; do
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log "✅ Health check passed"
            return 0
        else
            log "⏳ Health check attempt $i/5 failed, retrying..."
            sleep 10
        fi
    done
    
    log "❌ Health check failed after 5 attempts"
    exit 1
}

# Function to cleanup
cleanup() {
    log "🧹 Cleaning up temporary files..."
    # Add cleanup logic here if needed
    log "✅ Cleanup completed"
}

# Main deployment function
main() {
    log "🚀 Starting deployment process..."
    log "Environment: ${NODE_ENV:-production}"
    
    check_prerequisites
    backup_current
    install_dependencies
    run_tests
    build_application
    deploy_database
    start_application
    health_check
    cleanup
    
    log "🎉 Deployment completed successfully!"
    log "Application is running at: ${APP_URL:-http://localhost:3000}"
}

# Trap to handle script interruption
trap 'log "❌ Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"