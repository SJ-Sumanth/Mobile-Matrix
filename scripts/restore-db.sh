#!/bin/bash

# Database Restore Script for Mobile Matrix
# This script restores the PostgreSQL database from a backup

set -e

# Configuration
BACKUP_DIR="/backups"
DB_NAME="mobile_matrix"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/restore_log_${TIMESTAMP}.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] <backup_file>"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -f, --force             Force restore without confirmation"
    echo "  -d, --database NAME     Target database name (default: mobile_matrix)"
    echo "  -u, --user USER         Database user (default: postgres)"
    echo "  --host HOST             Database host (default: db)"
    echo "  --port PORT             Database port (default: 5432)"
    echo ""
    echo "Examples:"
    echo "  $0 /backups/mobile_matrix_backup_20240101_120000.sql.gz"
    echo "  $0 -f -d mobile_matrix_test backup.sql.gz"
}

# Function to validate backup file
validate_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log "ERROR: Backup file does not exist: $backup_file"
        return 1
    fi
    
    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file"; then
            log "ERROR: Backup file is corrupted: $backup_file"
            return 1
        fi
    fi
    
    log "Backup file validation successful: $backup_file"
    return 0
}

# Function to create database backup before restore
create_pre_restore_backup() {
    log "Creating pre-restore backup..."
    
    local pre_backup_file="${BACKUP_DIR}/pre_restore_backup_${TIMESTAMP}.sql"
    
    if pg_dump -h "${DB_HOST:-db}" -U "$DB_USER" -d "$DB_NAME" > "$pre_backup_file"; then
        gzip "$pre_backup_file"
        log "Pre-restore backup created: ${pre_backup_file}.gz"
        return 0
    else
        log "WARNING: Failed to create pre-restore backup"
        return 1
    fi
}

# Function to restore database
restore_database() {
    local backup_file=$1
    
    log "Starting database restore from: $backup_file"
    
    # Drop existing connections
    log "Terminating existing database connections..."
    psql -h "${DB_HOST:-db}" -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
    " || true
    
    # Drop and recreate database
    log "Dropping and recreating database: $DB_NAME"
    psql -h "${DB_HOST:-db}" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
    psql -h "${DB_HOST:-db}" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    
    # Restore from backup
    if [[ "$backup_file" == *.gz ]]; then
        log "Restoring from compressed backup..."
        if gunzip -c "$backup_file" | psql -h "${DB_HOST:-db}" -U "$DB_USER" -d "$DB_NAME"; then
            log "Database restore completed successfully"
            return 0
        else
            log "ERROR: Database restore failed"
            return 1
        fi
    else
        log "Restoring from uncompressed backup..."
        if psql -h "${DB_HOST:-db}" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"; then
            log "Database restore completed successfully"
            return 0
        else
            log "ERROR: Database restore failed"
            return 1
        fi
    fi
}

# Function to verify restore
verify_restore() {
    log "Verifying database restore..."
    
    # Check if database exists and is accessible
    if psql -h "${DB_HOST:-db}" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log "Database is accessible after restore"
    else
        log "ERROR: Database is not accessible after restore"
        return 1
    fi
    
    # Check table count
    local table_count=$(psql -h "${DB_HOST:-db}" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    " | tr -d ' ')
    
    log "Number of tables after restore: $table_count"
    
    if [ "$table_count" -gt 0 ]; then
        log "Database restore verification successful"
        return 0
    else
        log "WARNING: No tables found after restore"
        return 1
    fi
}

# Function to run post-restore tasks
post_restore_tasks() {
    log "Running post-restore tasks..."
    
    # Update database statistics
    log "Updating database statistics..."
    psql -h "${DB_HOST:-db}" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" || true
    
    # Regenerate Prisma client (if in application context)
    if command -v npx > /dev/null 2>&1; then
        log "Regenerating Prisma client..."
        npx prisma generate || log "WARNING: Failed to regenerate Prisma client"
    fi
    
    log "Post-restore tasks completed"
}

# Main restore function
main() {
    local backup_file=""
    local force_restore=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -f|--force)
                force_restore=true
                shift
                ;;
            -d|--database)
                DB_NAME="$2"
                shift 2
                ;;
            -u|--user)
                DB_USER="$2"
                shift 2
                ;;
            --host)
                DB_HOST="$2"
                shift 2
                ;;
            --port)
                DB_PORT="$2"
                shift 2
                ;;
            -*)
                log "ERROR: Unknown option $1"
                show_usage
                exit 1
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    # Check if backup file is provided
    if [ -z "$backup_file" ]; then
        log "ERROR: Backup file not specified"
        show_usage
        exit 1
    fi
    
    log "=== Starting Mobile Matrix Database Restore ==="
    log "Timestamp: $TIMESTAMP"
    log "Database: $DB_NAME"
    log "Backup file: $backup_file"
    log "Force restore: $force_restore"
    
    # Validate backup file
    if ! validate_backup "$backup_file"; then
        exit 1
    fi
    
    # Check if database is accessible
    if ! pg_isready -h "${DB_HOST:-db}" -U "$DB_USER"; then
        log "ERROR: Database server is not accessible"
        exit 1
    fi
    
    # Confirmation prompt (unless force flag is used)
    if [ "$force_restore" = false ]; then
        echo ""
        echo "WARNING: This will completely replace the current database!"
        echo "Database: $DB_NAME"
        echo "Backup file: $backup_file"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Restore cancelled by user"
            exit 0
        fi
    fi
    
    # Create pre-restore backup
    create_pre_restore_backup || log "WARNING: Could not create pre-restore backup"
    
    # Perform restore
    if restore_database "$backup_file" && verify_restore; then
        post_restore_tasks
        log "=== Database restore completed successfully ==="
    else
        log "=== Database restore failed ==="
        exit 1
    fi
}

# Set up error handling
trap 'log "ERROR: Restore script interrupted"; exit 1' INT TERM

# Run main function
main "$@"