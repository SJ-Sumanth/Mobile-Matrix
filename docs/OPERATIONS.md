# Mobile Matrix Operations Runbook

This runbook provides step-by-step procedures for common operational tasks and incident response for Mobile Matrix.

## Table of Contents

1. [Emergency Procedures](#emergency-procedures)
2. [Routine Operations](#routine-operations)
3. [Incident Response](#incident-response)
4. [Monitoring and Alerting](#monitoring-and-alerting)
5. [Backup and Recovery](#backup-and-recovery)
6. [Performance Tuning](#performance-tuning)
7. [Security Operations](#security-operations)
8. [Maintenance Procedures](#maintenance-procedures)

## Emergency Procedures

### 🚨 Application Down (Critical)

**Symptoms**: Application not responding, health checks failing

**Immediate Actions**:

1. **Check application status**:
   ```bash
   curl -f http://your-domain.com/api/health
   docker-compose ps
   kubectl get pods -n mobile-matrix
   ```

2. **Check recent deployments**:
   ```bash
   docker-compose logs --tail=100 app
   kubectl logs -f deployment/mobile-matrix-app -n mobile-matrix
   ```

3. **Quick restart** (if safe):
   ```bash
   # Docker
   docker-compose restart app
   
   # Kubernetes
   kubectl rollout restart deployment/mobile-matrix-app -n mobile-matrix
   ```

4. **If restart doesn't work, rollback**:
   ```bash
   # Docker
   docker-compose down && docker-compose up -d
   
   # Kubernetes
   kubectl rollout undo deployment/mobile-matrix-app -n mobile-matrix
   ```

5. **Escalate** if issue persists after 10 minutes

### 🚨 Database Down (Critical)

**Symptoms**: Database connection errors, data not loading

**Immediate Actions**:

1. **Check database status**:
   ```bash
   pg_isready -h db-host -U postgres
   docker-compose exec db pg_isready
   ```

2. **Check database logs**:
   ```bash
   docker-compose logs db
   tail -f /var/log/postgresql/postgresql.log
   ```

3. **Restart database** (if safe):
   ```bash
   docker-compose restart db
   ```

4. **Check disk space**:
   ```bash
   df -h
   docker system df
   ```

5. **If corruption suspected, restore from backup**:
   ```bash
   ./scripts/disaster-recovery.sh database-recovery --force
   ```

### 🚨 High Error Rate (Warning)

**Symptoms**: Error rate > 5%, increased 5xx responses

**Investigation Steps**:

1. **Check error logs**:
   ```bash
   docker-compose logs app | grep -i error
   tail -f /app/logs/error.log
   ```

2. **Check external service status**:
   ```bash
   # Test AI service
   curl -X POST https://api.gemini.com/health
   
   # Test database
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Check resource usage**:
   ```bash
   docker stats
   free -h
   df -h
   ```

4. **Scale up if needed**:
   ```bash
   # Docker
   docker-compose up -d --scale app=3
   
   # Kubernetes (auto-scaling should handle this)
   kubectl scale deployment mobile-matrix-app --replicas=5 -n mobile-matrix
   ```

## Routine Operations

### Daily Health Checks

**Morning Checklist** (Run at 9 AM):

1. **Application Health**:
   ```bash
   curl -f https://your-domain.com/api/health
   ```

2. **Check overnight logs**:
   ```bash
   docker-compose logs --since="24h" | grep -i error
   ```

3. **Verify backups**:
   ```bash
   ls -la /backups/ | head -5
   ./scripts/disaster-recovery.sh backup-status
   ```

4. **Check disk space**:
   ```bash
   df -h | grep -E "(/$|/var|/tmp)"
   ```

5. **Review monitoring dashboards**:
   - Grafana: http://your-domain:3001
   - Check for any alerts in last 24h

### Weekly Maintenance

**Every Sunday at 2 AM**:

1. **Update system packages**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Clean up Docker resources**:
   ```bash
   docker system prune -f
   docker volume prune -f
   ```

3. **Rotate logs**:
   ```bash
   logrotate /etc/logrotate.d/mobile-matrix
   ```

4. **Test backup restoration**:
   ```bash
   ./scripts/restore-db.sh --dry-run /backups/latest_backup.sql.gz
   ```

5. **Security scan**:
   ```bash
   docker scan mobile-matrix:latest
   npm audit
   ```

### Monthly Tasks

**First Sunday of each month**:

1. **SSL certificate check**:
   ```bash
   openssl x509 -in /etc/ssl/certs/your-domain.crt -text -noout | grep "Not After"
   ```

2. **Performance review**:
   - Review Grafana dashboards
   - Check response times
   - Analyze resource usage trends

3. **Capacity planning**:
   - Review growth metrics
   - Plan for scaling needs
   - Update resource allocations

## Incident Response

### Incident Classification

- **P0 (Critical)**: Complete service outage
- **P1 (High)**: Major functionality impaired
- **P2 (Medium)**: Minor functionality impaired
- **P3 (Low)**: Cosmetic issues

### Incident Response Process

1. **Detection** (0-5 minutes):
   - Alert received or issue reported
   - Acknowledge alert
   - Initial assessment

2. **Response** (5-15 minutes):
   - Assign incident commander
   - Create incident channel
   - Begin investigation

3. **Mitigation** (15-60 minutes):
   - Implement temporary fix
   - Restore service if possible
   - Communicate status

4. **Resolution** (1-4 hours):
   - Implement permanent fix
   - Verify resolution
   - Close incident

5. **Post-mortem** (24-48 hours):
   - Document incident
   - Identify root cause
   - Create action items

### Communication Templates

**Initial Alert**:
```
🚨 INCIDENT: [P0/P1/P2/P3] - [Brief Description]
Status: Investigating
Impact: [Description of user impact]
ETA: [Estimated time to resolution]
Updates: Will provide updates every 15 minutes
```

**Status Update**:
```
📊 UPDATE: [Incident Title]
Status: [Investigating/Mitigating/Resolved]
Progress: [What has been done]
Next Steps: [What will be done next]
ETA: [Updated ETA]
```

**Resolution**:
```
✅ RESOLVED: [Incident Title]
Duration: [Total incident duration]
Root Cause: [Brief explanation]
Resolution: [What was done to fix]
Prevention: [Steps to prevent recurrence]
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Application Metrics**:
   - Response time (95th percentile < 2s)
   - Error rate (< 1%)
   - Throughput (requests/second)
   - Uptime (> 99.9%)

2. **Infrastructure Metrics**:
   - CPU usage (< 80%)
   - Memory usage (< 85%)
   - Disk usage (< 90%)
   - Network I/O

3. **Business Metrics**:
   - Phone comparisons per hour
   - AI service response time
   - User engagement metrics

### Alert Thresholds

```yaml
# Critical Alerts (P0)
- Application down for > 1 minute
- Database down for > 1 minute
- Error rate > 10% for > 2 minutes

# Warning Alerts (P1)
- Response time > 5s for > 5 minutes
- Error rate > 5% for > 5 minutes
- CPU usage > 90% for > 10 minutes
- Memory usage > 95% for > 5 minutes

# Info Alerts (P2)
- Disk usage > 85%
- SSL certificate expires in < 30 days
- Backup failed
```

### Grafana Dashboard URLs

- **Main Dashboard**: http://your-domain:3001/d/mobile-matrix
- **Infrastructure**: http://your-domain:3001/d/infrastructure
- **Application**: http://your-domain:3001/d/application
- **Database**: http://your-domain:3001/d/database

## Backup and Recovery

### Backup Schedule

- **Hourly**: Application logs rotation
- **Daily**: Database backup (2 AM)
- **Weekly**: Full system backup (Sunday 3 AM)
- **Monthly**: Archive old backups

### Recovery Procedures

#### Database Recovery

1. **Identify backup to restore**:
   ```bash
   ls -la /backups/ | grep mobile_matrix_backup
   ```

2. **Stop application**:
   ```bash
   docker-compose stop app
   ```

3. **Restore database**:
   ```bash
   ./scripts/restore-db.sh -f /backups/mobile_matrix_backup_YYYYMMDD_HHMMSS.sql.gz
   ```

4. **Verify restoration**:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM phones;"
   ```

5. **Start application**:
   ```bash
   docker-compose start app
   ```

#### Full System Recovery

```bash
# Complete disaster recovery
./scripts/disaster-recovery.sh full-recovery --force

# Check system health after recovery
./scripts/disaster-recovery.sh health-check
```

### Backup Verification

**Weekly backup verification**:
```bash
# Test latest backup
LATEST_BACKUP=$(ls -t /backups/mobile_matrix_backup_*.sql.gz | head -1)
./scripts/restore-db.sh --dry-run "$LATEST_BACKUP"

# Verify backup integrity
gzip -t "$LATEST_BACKUP" && echo "Backup is valid" || echo "Backup is corrupted"
```

## Performance Tuning

### Database Performance

1. **Check slow queries**:
   ```sql
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

2. **Analyze table statistics**:
   ```sql
   ANALYZE;
   SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
   FROM pg_stat_user_tables;
   ```

3. **Check index usage**:
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
   FROM pg_stat_user_indexes;
   ```

### Application Performance

1. **Check memory usage**:
   ```bash
   docker stats --no-stream
   ```

2. **Profile application**:
   ```bash
   # Enable profiling
   curl -X POST http://localhost:3000/api/debug/profile/start
   
   # Generate load
   # ... run tests ...
   
   # Get profile
   curl http://localhost:3000/api/debug/profile/stop
   ```

3. **Cache hit rates**:
   ```bash
   redis-cli info stats | grep keyspace
   ```

### Infrastructure Optimization

1. **Optimize Docker images**:
   ```bash
   docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
   ```

2. **Check resource limits**:
   ```bash
   docker-compose config | grep -A 5 -B 5 resources
   ```

## Security Operations

### Security Monitoring

1. **Check failed login attempts**:
   ```bash
   grep "authentication failed" /var/log/auth.log | tail -20
   ```

2. **Monitor suspicious activity**:
   ```bash
   tail -f /app/logs/access.log | grep -E "(404|403|500)"
   ```

3. **SSL certificate monitoring**:
   ```bash
   echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
   ```

### Security Updates

1. **Update dependencies**:
   ```bash
   npm audit fix
   docker pull node:20-alpine
   ```

2. **System updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo reboot # if kernel updates
   ```

3. **Security scanning**:
   ```bash
   docker scan mobile-matrix:latest
   nmap -sV your-domain.com
   ```

## Maintenance Procedures

### Planned Maintenance

**Maintenance Window**: Sundays 2-4 AM

1. **Pre-maintenance checklist**:
   - [ ] Notify users of maintenance window
   - [ ] Create backup before changes
   - [ ] Prepare rollback plan
   - [ ] Test changes in staging

2. **During maintenance**:
   - [ ] Enable maintenance mode
   - [ ] Apply updates/changes
   - [ ] Run tests
   - [ ] Verify functionality

3. **Post-maintenance**:
   - [ ] Disable maintenance mode
   - [ ] Monitor for issues
   - [ ] Update documentation
   - [ ] Send completion notification

### Emergency Maintenance

For critical security updates or urgent fixes:

1. **Assess urgency and impact**
2. **Notify stakeholders immediately**
3. **Create emergency backup**
4. **Apply fix with minimal downtime**
5. **Monitor closely for 2 hours**
6. **Document changes**

## Contact Information

### Escalation Matrix

- **Level 1**: On-call engineer
- **Level 2**: Senior engineer
- **Level 3**: Engineering manager
- **Level 4**: CTO

### Emergency Contacts

- **Primary On-call**: +1-XXX-XXX-XXXX
- **Secondary On-call**: +1-XXX-XXX-XXXX
- **Engineering Manager**: +1-XXX-XXX-XXXX
- **Emergency Hotline**: +1-XXX-XXX-XXXX

### Communication Channels

- **Slack**: #mobile-matrix-alerts
- **Email**: ops@your-domain.com
- **Status Page**: https://status.your-domain.com

---

**Last Updated**: [Current Date]
**Next Review**: [Next Review Date]
**Document Owner**: Operations Team