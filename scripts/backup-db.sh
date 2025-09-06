#!/bin/bash

# Database Backup Script for Mobile Matrix
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
DB_NAME="mobile_matrix"
DB_USER="postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/mobile_matrix_backup_${TIMESTAMP}.sql"
LOG_FILE="${BACKUP_DIR}/backup_log_${TIMESTAMP}.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send email notification (if configured)
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "Database Backup $status" "$NOTIFICATION_EMAIL"
    fi
    
    # Send Slack notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Database Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Function to create database backup
create_backup() {
    log "Starting database backup..."
    
    # Create the backup
    if pg_dump -h "${DB_HOST:-db}" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
        log "Database backup created successfully: $BACKUP_FILE"
        
        # Compress the backup
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        log "Backup compressed: $BACKUP_FILE"
        
        # Get backup size
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Backup size: $BACKUP_SIZE"
        
        return 0
    else
        log "ERROR: Database backup failed"
        return 1
    fi
}

# Function to verify backup
verify_backup() {
    log "Verifying backup integrity..."
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        # Test if the compressed file is valid
        if gzip -t "$BACKUP_FILE"; then
            log "Backup verification successful"
            return 0
        else
            log "ERROR: Backup file is corrupted"
            return 1
        fi
    else
        log "ERROR: Backup file is missing or empty"
        return 1
    fi
}

# Function to upload backup to cloud storage (optional)
upload_to_cloud() {
    if [ -n "$AWS_S3_BUCKET" ]; then
        log "Uploading backup to AWS S3..."
        if aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/database-backups/"; then
            log "Backup uploaded to S3 successfully"
        else
            log "WARNING: Failed to upload backup to S3"
        fi
    fi
    
    if [ -n "$GOOGLE_CLOUD_BUCKET" ]; then
        log "Uploading backup to Google Cloud Storage..."
        if gsutil cp "$BACKUP_FILE" "gs://$GOOGLE_CLOUD_BUCKET/database-backups/"; then
            log "Backup uploaded to Google Cloud Storage successfully"
        else
            log "WARNING: Failed to upload backup to Google Cloud Storage"
        fi
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -name "mobile_matrix_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Also clean up old log files
    find "$BACKUP_DIR" -name "backup_log_*.log" -mtime +$RETENTION_DAYS -delete
    
    log "Old backups cleaned up"
}

# Function to create schema backup
create_schema_backup() {
    log "Creating schema-only backup..."
    
    SCHEMA_FILE="${BACKUP_DIR}/mobile_matrix_schema_${TIMESTAMP}.sql"
    
    if pg_dump -h "${DB_HOST:-db}" -U "$DB_USER" -d "$DB_NAME" --schema-only > "$SCHEMA_FILE"; then
        gzip "$SCHEMA_FILE"
        log "Schema backup created: ${SCHEMA_FILE}.gz"
    else
        log "WARNING: Schema backup failed"
    fi
}

# Main backup function
main() {
    log "=== Starting Mobile Matrix Database Backup ==="
    log "Timestamp: $TIMESTAMP"
    log "Database: $DB_NAME"
    log "Backup file: $BACKUP_FILE"
    
    # Check if database is accessible
    if ! pg_isready -h "${DB_HOST:-db}" -U "$DB_USER"; then
        log "ERROR: Database is not accessible"
        send_notification "FAILED" "Database is not accessible"
        exit 1
    fi
    
    # Create backups
    if create_backup && verify_backup; then
        create_schema_backup
        upload_to_cloud
        cleanup_old_backups
        
        log "=== Backup completed successfully ==="
        send_notification "SUCCESS" "Database backup completed successfully. Size: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
        log "=== Backup failed ==="
        send_notification "FAILED" "Database backup failed. Check logs for details."
        exit 1
    fi
}

# Set up error handling
trap 'log "ERROR: Backup script interrupted"; send_notification "FAILED" "Backup script was interrupted"; exit 1' INT TERM

# Run main function
main "$@"