# Mobile Matrix Deployment Guide

This document provides comprehensive instructions for deploying Mobile Matrix in production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Database Setup](#database-setup)
6. [Monitoring Setup](#monitoring-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Backup Configuration](#backup-configuration)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: Minimum 4 cores, Recommended 8+ cores
- **Memory**: Minimum 8GB RAM, Recommended 16GB+ RAM
- **Storage**: Minimum 100GB SSD, Recommended 500GB+ SSD
- **Network**: Stable internet connection with sufficient bandwidth

### Software Requirements

- Docker 24.0+
- Docker Compose 2.0+
- Node.js 20+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)
- Nginx (for reverse proxy)

### Domain and SSL

- Registered domain name
- SSL certificate (Let's Encrypt recommended)
- DNS configuration pointing to your server

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/mobile-matrix.git
cd mobile-matrix
```

### 2. Environment Variables

Copy the production environment template:

```bash
cp .env.production .env
```

Edit `.env` with your production values:

```bash
# Database Configuration
DATABASE_URL="postgresql://prod_user:SECURE_PASSWORD@db:5432/mobile_matrix_prod"
REDIS_URL="redis://:REDIS_PASSWORD@redis:6379"

# AI Service Configuration
GEMINI_API_KEY="your_actual_gemini_api_key"

# Application Configuration
NEXTAUTH_SECRET="your_32_character_secret_key_here"
NEXTAUTH_URL="https://your-domain.com"

# CDN Configuration (optional)
CDN_URL="https://your-cdn.com"

# Monitoring
SENTRY_DSN="your_sentry_dsn"
DATADOG_API_KEY="your_datadog_api_key"
```

### 3. Secrets Management

For Kubernetes deployment, create secrets:

```bash
kubectl create namespace mobile-matrix
kubectl apply -f secrets.example.yaml
```

For Docker deployment, use environment files or Docker secrets.

## Docker Deployment

### 1. Production Docker Compose

Use the production Docker Compose configuration:

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### 2. Build Custom Image

If you need to build a custom image:

```bash
# Build the application image
docker build -t mobile-matrix:latest .

# Tag for registry
docker tag mobile-matrix:latest your-registry.com/mobile-matrix:latest

# Push to registry
docker push your-registry.com/mobile-matrix:latest
```

### 3. Database Migration

Run database migrations:

```bash
# Using the deployment script
./scripts/deploy-db.sh

# Or manually
docker-compose exec app npx prisma migrate deploy
```

## Kubernetes Deployment

### 1. Apply Kubernetes Manifests

```bash
# Create namespace
kubectl create namespace mobile-matrix

# Apply secrets
kubectl apply -f secrets.example.yaml

# Apply deployments
kubectl apply -f k8s/deployment.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml
```

### 2. Verify Deployment

```bash
# Check pods
kubectl get pods -n mobile-matrix

# Check services
kubectl get services -n mobile-matrix

# Check ingress
kubectl get ingress -n mobile-matrix

# View logs
kubectl logs -f deployment/mobile-matrix-app -n mobile-matrix
```

### 3. Auto-scaling Configuration

The HPA (Horizontal Pod Autoscaler) is configured to scale based on CPU and memory usage:

- **Min replicas**: 3
- **Max replicas**: 10
- **CPU threshold**: 70%
- **Memory threshold**: 80%

## Database Setup

### 1. PostgreSQL Configuration

For production PostgreSQL setup:

```sql
-- Create database and user
CREATE DATABASE mobile_matrix_prod;
CREATE USER mobile_matrix_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mobile_matrix_prod TO mobile_matrix_user;

-- Configure connection limits
ALTER USER mobile_matrix_user CONNECTION LIMIT 50;
```

### 2. Database Optimization

Add these settings to `postgresql.conf`:

```conf
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connection settings
max_connections = 200
shared_preload_libraries = 'pg_stat_statements'

# Performance settings
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 3. Database Migrations

```bash
# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Seed database (optional)
npm run db:seed
```

## Monitoring Setup

### 1. Start Monitoring Stack

```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Monitoring Dashboards

- **Grafana**: http://your-domain:3001 (admin/admin)
- **Prometheus**: http://your-domain:9090
- **AlertManager**: http://your-domain:9093

### 3. Configure Alerts

Edit `monitoring/alertmanager.yml` with your notification settings:

```yaml
receivers:
- name: 'critical-alerts'
  email_configs:
  - to: 'admin@your-domain.com'
    subject: 'CRITICAL: Mobile Matrix Alert'
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK_URL'
    channel: '#alerts'
```

## SSL/TLS Configuration

### 1. Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Manual SSL Certificate

Place your SSL certificates in `nginx/ssl/`:

```bash
nginx/ssl/
├── cert.pem
└── key.pem
```

Update `nginx/nginx.prod.conf` with correct certificate paths.

## Backup Configuration

### 1. Automated Database Backups

Set up automated backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/mobile-matrix/scripts/backup-db.sh

# Add weekly full backup
0 3 * * 0 /path/to/mobile-matrix/scripts/backup-db.sh
```

### 2. Cloud Storage Backup

Configure cloud storage in backup script:

```bash
# AWS S3
export AWS_S3_BUCKET="your-backup-bucket"

# Google Cloud Storage
export GOOGLE_CLOUD_BUCKET="your-backup-bucket"
```

### 3. Backup Verification

Regularly test backup restoration:

```bash
# Test restore (dry run)
./scripts/restore-db.sh --dry-run /backups/latest_backup.sql.gz

# Full restore test on staging
./scripts/restore-db.sh -f /backups/latest_backup.sql.gz
```

## Health Checks

### 1. Application Health Endpoint

The application provides a health check endpoint:

```bash
curl -f http://localhost:3000/api/health
```

Response format:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ai_service": "healthy"
  }
}
```

### 2. Monitoring Health Checks

Configure external monitoring services to check:

- Application health endpoint
- Database connectivity
- Redis connectivity
- SSL certificate expiry

## Performance Optimization

### 1. Application Performance

- Enable Redis caching
- Configure CDN for static assets
- Optimize database queries
- Use connection pooling

### 2. Infrastructure Performance

- Use SSD storage
- Configure proper resource limits
- Enable gzip compression
- Implement rate limiting

## Security Considerations

### 1. Network Security

- Use firewall rules
- Implement VPN access for admin
- Regular security updates
- Monitor access logs

### 2. Application Security

- Regular dependency updates
- Security headers configuration
- Input validation
- Rate limiting

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep -E "(DATABASE|REDIS|GEMINI)"

# Test database connection
docker-compose exec app npx prisma db pull
```

#### Database Connection Issues

```bash
# Check database status
docker-compose exec db pg_isready

# Check connection from app
docker-compose exec app psql $DATABASE_URL -c "SELECT 1;"

# Check network connectivity
docker-compose exec app ping db
```

#### High Memory Usage

```bash
# Check container stats
docker stats

# Check application metrics
curl http://localhost:3000/api/metrics

# Restart services if needed
docker-compose restart app
```

### Log Locations

- **Application logs**: `/app/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **Database logs**: `/var/log/postgresql/`
- **Docker logs**: `docker-compose logs`

### Support Contacts

- **Technical Issues**: tech-support@your-domain.com
- **Emergency**: emergency@your-domain.com
- **Documentation**: docs@your-domain.com

## Maintenance Schedule

### Daily Tasks

- Check application health
- Monitor error rates
- Review backup status

### Weekly Tasks

- Update dependencies
- Review performance metrics
- Test backup restoration

### Monthly Tasks

- Security updates
- SSL certificate renewal check
- Capacity planning review

---

For additional support, please refer to the [Operations Runbook](OPERATIONS.md) or contact the development team.