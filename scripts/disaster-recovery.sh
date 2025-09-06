#!/bin/bash

# Disaster Recovery Script for Mobile Matrix
# This script handles complete system recovery procedures

set -e

# Configuration
RECOVERY_DIR="/recovery"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${RECOVERY_DIR}/disaster_recovery_${TIMESTAMP}.log"

# Create recovery directory
mkdir -p "$RECOVERY_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  full-recovery           Complete system recovery"
    echo "  database-recovery       Database-only recovery"
    echo "  application-recovery    Application-only recovery"
    echo "  health-check           System health check"
    echo "  backup-status          Check backup status"
    echo ""
    echo "Options:"
    echo "  -h, --help             Show this help message"
    echo "  -f, --force            Force recovery without confirmation"
    echo "  --backup-date DATE     Use backup from specific date (YYYYMMDD)"
    echo "  --dry-run              Show what would be done without executing"
}

# Function to check system health
check_system_health() {
    log "=== System Health Check ==="
    
    local health_status=0
    
    # Check Docker services
    log "Checking Docker services..."
    if docker-compose ps | grep -q "Up"; then
        log "✅ Docker services are running"
    else
        log "❌ Docker services are not running properly"
        health_status=1
    fi
    
    # Check database connectivity
    log "Checking database connectivity..."
    if pg_isready -h "${DB_HOST:-db}" -U "${DB_USER:-postgres}"; then
        log "✅ Database is accessible"
    else
        log "❌ Database is not accessible"
        health_status=1
    fi
    
    # Check Redis connectivity
    log "Checking Redis connectivity..."
    if redis-cli -h "${REDIS_HOST:-redis}" ping > /dev/null 2>&1; then
        log "✅ Redis is accessible"
    else
        log "❌ Redis is not accessible"
        health_status=1
    fi
    
    # Check application health
    log "Checking application health..."
    if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
        log "✅ Application is responding"
    else
        log "❌ Application is not responding"
        health_status=1
    fi
    
    # Check disk space
    log "Checking disk space..."
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        log "✅ Disk space is adequate ($disk_usage% used)"
    else
        log "⚠️  Disk space is running low ($disk_usage% used)"
        health_status=1
    fi
    
    # Check memory usage
    log "Checking memory usage..."
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$mem_usage" -lt 90 ]; then
        log "✅ Memory usage is normal ($mem_usage% used)"
    else
        log "⚠️  Memory usage is high ($mem_usage% used)"
    fi
    
    return $health_status
}

# Function to check backup status
check_backup_status() {
    log "=== Backup Status Check ==="
    
    # Find latest database backup
    local latest_db_backup=$(find "$BACKUP_DIR" -name "mobile_matrix_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$latest_db_backup" ]; then
        local backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_db_backup")) / 86400 ))
        log "Latest database backup: $latest_db_backup"
        log "Backup age: $backup_age days"
        
        if [ "$backup_age" -le 1 ]; then
            log "✅ Database backup is recent"
        else
            log "⚠️  Database backup is $backup_age days old"
        fi
    else
        log "❌ No database backups found"
    fi
    
    # Check backup integrity
    if [ -n "$latest_db_backup" ]; then
        log "Checking backup integrity..."
        if gzip -t "$latest_db_backup"; then
            log "✅ Latest backup is valid"
        else
            log "❌ Latest backup is corrupted"
        fi
    fi
}

# Function to stop all services
stop_services() {
    log "Stopping all services..."
    
    docker-compose down || log "WARNING: Failed to stop some services"
    
    # Wait for services to stop
    sleep 10
    
    log "Services stopped"
}

# Function to start all services
start_services() {
    log "Starting all services..."
    
    # Start infrastructure services first
    docker-compose up -d db redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    for i in {1..30}; do
        if pg_isready -h "${DB_HOST:-db}" -U "${DB_USER:-postgres}"; then
            log "Database is ready"
            break
        fi
        sleep 2
    done
    
    # Start application services
    docker-compose up -d
    
    # Wait for application to be ready
    log "Waiting for application to be ready..."
    for i in {1..60}; do
        if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
            log "Application is ready"
            break
        fi
        sleep 5
    done
    
    log "Services started"
}

# Function to recover database
recover_database() {
    local backup_date=$1
    
    log "=== Database Recovery ==="
    
    # Find backup file
    local backup_file=""
    if [ -n "$backup_date" ]; then
        backup_file=$(find "$BACKUP_DIR" -name "mobile_matrix_backup_${backup_date}_*.sql.gz" | head -1)
    else
        backup_file=$(find "$BACKUP_DIR" -name "mobile_matrix_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    fi
    
    if [ -z "$backup_file" ]; then
        log "ERROR: No suitable backup file found"
        return 1
    fi
    
    log "Using backup file: $backup_file"
    
    # Run database restore
    if ./scripts/restore-db.sh -f "$backup_file"; then
        log "Database recovery completed successfully"
        return 0
    else
        log "ERROR: Database recovery failed"
        return 1
    fi
}

# Function to recover application
recover_application() {
    log "=== Application Recovery ==="
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose pull
    
    # Rebuild application if needed
    log "Rebuilding application..."
    docker-compose build --no-cache app
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose run --rm app npx prisma migrate deploy
    
    log "Application recovery completed"
}

# Function to perform full recovery
full_recovery() {
    local backup_date=$1
    local dry_run=$2
    
    log "=== Full System Recovery ==="
    log "Backup date: ${backup_date:-latest}"
    log "Dry run: ${dry_run:-false}"
    
    if [ "$dry_run" = "true" ]; then
        log "DRY RUN: Would perform the following actions:"
        log "1. Stop all services"
        log "2. Recover database from backup"
        log "3. Recover application"
        log "4. Start all services"
        log "5. Verify system health"
        return 0
    fi
    
    # Stop services
    stop_services
    
    # Recover database
    if ! recover_database "$backup_date"; then
        log "ERROR: Database recovery failed, aborting"
        return 1
    fi
    
    # Recover application
    recover_application
    
    # Start services
    start_services
    
    # Verify recovery
    sleep 30
    if check_system_health; then
        log "=== Full recovery completed successfully ==="
        return 0
    else
        log "=== Recovery completed with warnings ==="
        return 1
    fi
}

# Main function
main() {
    local command=""
    local force_recovery=false
    local backup_date=""
    local dry_run=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -f|--force)
                force_recovery=true
                shift
                ;;
            --backup-date)
                backup_date="$2"
                shift 2
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            full-recovery|database-recovery|application-recovery|health-check|backup-status)
                command="$1"
                shift
                ;;
            -*)
                log "ERROR: Unknown option $1"
                show_usage
                exit 1
                ;;
            *)
                log "ERROR: Unknown command $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Default command
    if [ -z "$command" ]; then
        command="health-check"
    fi
    
    log "=== Mobile Matrix Disaster Recovery ==="
    log "Command: $command"
    log "Timestamp: $TIMESTAMP"
    
    # Execute command
    case $command in
        health-check)
            check_system_health
            ;;
        backup-status)
            check_backup_status
            ;;
        database-recovery)
            if [ "$force_recovery" = false ]; then
                echo "WARNING: This will replace the current database!"
                read -p "Are you sure you want to continue? (yes/no): " -r
                if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                    log "Recovery cancelled by user"
                    exit 0
                fi
            fi
            recover_database "$backup_date"
            ;;
        application-recovery)
            if [ "$force_recovery" = false ]; then
                echo "WARNING: This will restart the application!"
                read -p "Are you sure you want to continue? (yes/no): " -r
                if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                    log "Recovery cancelled by user"
                    exit 0
                fi
            fi
            recover_application
            ;;
        full-recovery)
            if [ "$force_recovery" = false ]; then
                echo "WARNING: This will perform a complete system recovery!"
                read -p "Are you sure you want to continue? (yes/no): " -r
                if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
                    log "Recovery cancelled by user"
                    exit 0
                fi
            fi
            full_recovery "$backup_date" "$dry_run"
            ;;
    esac
}

# Set up error handling
trap 'log "ERROR: Disaster recovery script interrupted"; exit 1' INT TERM

# Run main function
main "$@"