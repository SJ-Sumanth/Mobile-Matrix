# External Data Integration

This document describes the external data integration system for MobileMatrix, which handles fetching, synchronizing, and managing phone data from external sources.

## Overview

The external data integration system provides:

- **Data Fetching**: Retrieve phone specifications from GSMArena and other sources
- **Price Tracking**: Monitor phone prices across Indian retailers
- **Data Synchronization**: Automated and manual sync operations
- **Fallback Mechanisms**: Ensure data availability even when external APIs fail
- **Monitoring & Logging**: Track sync operations and API health
- **Validation & Cleaning**: Ensure data quality and consistency

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                External Data Integration                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   GSMArena      │  │ Price Tracking  │  │ Alternative │ │
│  │   Service       │  │    Service      │  │   Sources   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Data Sync       │  │ Fallback        │  │ Monitoring  │ │
│  │ Service         │  │ Service         │  │ Service     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │    Database     │  │     Cache       │  │   Logging   │ │
│  │   (PostgreSQL)  │  │    (Redis)      │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Services

### 1. GSMArena Service

Handles phone specification data from GSMArena API.

**Features:**
- Search phones by brand and model
- Retrieve detailed specifications
- Convert data to internal format
- Rate limiting and retry logic

**Usage:**
```typescript
import { GSMArenaService } from './services/external/gsmarena.js';

const service = new GSMArenaService({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.gsmarena.com/v1',
  timeout: 30000,
  retryAttempts: 3,
});

const phones = await service.searchPhones('iPhone 15');
const phoneData = service.convertToPhone(phones[0]);
```

### 2. Price Tracking Service

Monitors phone prices across Indian retailers.

**Features:**
- Track prices from major Indian retailers
- Price history and alerts
- Best deals discovery
- Indian market filtering

**Usage:**
```typescript
import { PriceTrackingService } from './services/external/priceTracking.js';

const service = new PriceTrackingService({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.pricetracking.com/v1',
  timeout: 30000,
  retryAttempts: 3,
  enabledRetailers: ['amazon', 'flipkart', 'croma'],
});

const prices = await service.getPhonePrices('Apple', 'iPhone 15');
const indianPrices = service.filterIndianRetailers(prices);
```

### 3. Data Sync Service

Orchestrates data synchronization operations.

**Features:**
- Full sync from all sources
- Individual phone sync
- Batch processing
- Data validation and cleaning

**Usage:**
```typescript
import { DataSyncService } from './services/external/dataSyncService.js';

const service = new DataSyncService(config);

// Full sync
const jobs = await service.startFullSync();

// Individual phone sync
const success = await service.syncPhoneData('phone-id');
```

### 4. Fallback Service

Provides data availability when external APIs fail.

**Features:**
- Cache-based fallbacks
- Static data fallbacks
- Alternative API fallbacks
- Retry mechanisms

**Usage:**
```typescript
import { FallbackService } from './services/external/fallbackService.js';

const service = new FallbackService(config, monitoring);

const result = await service.getPhoneDataWithFallback(
  'Apple',
  'iPhone 15',
  primaryFetcher
);
```

### 5. Monitoring Service

Tracks sync operations and API health.

**Features:**
- Event logging
- Performance metrics
- Health reporting
- Alert notifications

**Usage:**
```typescript
import { SyncMonitoringService } from './services/external/syncMonitoring.js';

const service = new SyncMonitoringService(alertConfig);

service.logSyncStart('gsmarena');
service.logSyncComplete('gsmarena', 5000);

const health = service.generateHealthReport();
```

## Configuration

### Environment Variables

```bash
# GSMArena API
GSMARENA_API_KEY=your_gsmarena_api_key

# Price Tracking API
PRICE_TRACKING_API_KEY=your_price_tracking_api_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mobile_matrix

# Cache
REDIS_URL=redis://localhost:6379
```

### Service Configuration

```typescript
const config = {
  gsmarena: {
    apiKey: process.env.GSMARENA_API_KEY,
    baseUrl: 'https://api.gsmarena.com/v1',
    timeout: 30000,
    retryAttempts: 3,
  },
  priceTracking: {
    apiKey: process.env.PRICE_TRACKING_API_KEY,
    baseUrl: 'https://api.pricetracking.com/v1',
    timeout: 30000,
    retryAttempts: 3,
    enabledRetailers: ['amazon', 'flipkart', 'croma', 'reliance'],
  },
  dataSync: {
    syncInterval: 24 * 60 * 60 * 1000, // 24 hours
    batchSize: 10,
    enabledSources: ['gsmarena', 'priceTracking'],
    fallbackEnabled: true,
  },
  fallback: {
    enableCache: true,
    enableStaticData: true,
    enableAlternativeApis: false,
    cacheExpiryHours: 48,
    maxRetries: 3,
    retryDelayMs: 1000,
  },
  monitoring: {
    enabled: true,
    errorThreshold: 10,
    rateLimitThreshold: 5,
    syncFailureThreshold: 3,
    webhookUrl: 'https://your-webhook-url.com',
  },
};
```

## API Endpoints

### Sync Status
```
GET /api/sync
```
Returns current sync status and health information.

**Query Parameters:**
- `events=true` - Include recent events
- `metrics=true` - Include detailed metrics
- `hours=24` - Hours of history to include

**Response:**
```json
{
  "status": "success",
  "data": {
    "health": {
      "status": "healthy",
      "summary": "All systems operating normally"
    },
    "metrics": {
      "totalSyncs": 10,
      "successfulSyncs": 8,
      "failedSyncs": 2
    }
  }
}
```

### Start Sync
```
POST /api/sync
```
Initiates a data synchronization operation.

**Request Body:**
```json
{
  "sources": ["gsmarena", "priceTracking"],
  "force": false
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Data synchronization started",
  "data": {
    "syncStarted": true,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Sync Individual Phone
```
POST /api/sync/phone
```
Syncs data for a specific phone.

**Request Body:**
```json
{
  "phoneId": "phone-123"
}
```

## CLI Commands

The system includes a CLI tool for manual operations:

### Full Sync
```bash
npm run sync:full
# or
node scripts/sync-data.js full --dry-run
```

### Check Status
```bash
npm run sync:status
# or
node scripts/sync-data.js status --detailed
```

### Sync Individual Phone
```bash
npm run sync:phone phone-123
# or
node scripts/sync-data.js phone phone-123
```

### Clear Cache
```bash
npm run sync:clear-cache
# or
node scripts/sync-data.js clear-cache
```

## Data Flow

### 1. Phone Specification Sync

```mermaid
sequenceDiagram
    participant DS as DataSyncService
    participant GSM as GSMArenaService
    participant DB as Database
    participant Cache as Cache

    DS->>GSM: getPhonesByBrand()
    GSM->>GSM: API Request with retry
    GSM->>DS: Phone data
    DS->>DS: Validate & clean data
    DS->>DB: Update/create phone
    DS->>Cache: Clear related cache
```

### 2. Price Data Sync

```mermaid
sequenceDiagram
    participant DS as DataSyncService
    participant PT as PriceTrackingService
    participant DB as Database

    DS->>PT: getPhonePrices()
    PT->>PT: API Request
    PT->>PT: Filter Indian retailers
    PT->>DS: Price data
    DS->>DB: Update phone pricing
```

### 3. Fallback Mechanism

```mermaid
sequenceDiagram
    participant Client as Client
    participant FS as FallbackService
    participant API as External API
    participant Cache as Cache
    participant Static as Static Data

    Client->>FS: getPhoneDataWithFallback()
    FS->>API: Primary fetch
    API-->>FS: Error/Timeout
    FS->>Cache: Try cache
    Cache-->>FS: Cache miss
    FS->>Static: Try static data
    Static->>FS: Static data found
    FS->>Client: Fallback data
```

## Error Handling

### API Errors
- **Rate Limiting**: Automatic retry with exponential backoff
- **Timeouts**: Configurable timeout with fallback
- **Authentication**: Clear error messages for invalid API keys
- **Data Validation**: Schema validation with detailed error reporting

### Sync Failures
- **Partial Failures**: Continue processing other items
- **Retry Logic**: Configurable retry attempts
- **Fallback Data**: Use cached or static data when available
- **Monitoring**: Log all failures for analysis

### Data Quality
- **Validation**: Zod schemas for all external data
- **Sanitization**: Clean and normalize data before storage
- **Consistency**: Ensure data consistency across sources
- **Deduplication**: Prevent duplicate entries

## Monitoring & Alerts

### Health Checks
- **API Connectivity**: Regular health checks for external APIs
- **Database Health**: Monitor database connection and performance
- **Cache Health**: Check Redis connectivity and memory usage
- **Sync Status**: Track sync success rates and timing

### Metrics
- **Sync Performance**: Duration, success rate, error rate
- **API Performance**: Response times, error rates, rate limits
- **Data Quality**: Validation errors, data completeness
- **System Health**: Memory usage, CPU usage, disk space

### Alerts
- **Consecutive Failures**: Alert after N consecutive sync failures
- **High Error Rate**: Alert when error rate exceeds threshold
- **API Issues**: Alert on API connectivity problems
- **Data Quality**: Alert on validation failures

## Testing

### Unit Tests
```bash
npm test -- src/services/external
```

### Integration Tests
```bash
npm test -- src/services/external/__tests__/integration.test.ts
```

### API Tests
```bash
npm test -- src/app/api/sync
```

## Performance Optimization

### Caching Strategy
- **Phone Data**: Cache for 24-48 hours
- **Price Data**: Cache for 1-6 hours (more volatile)
- **Search Results**: Cache for 1 hour
- **Static Data**: Cache indefinitely with manual invalidation

### Rate Limiting
- **GSMArena**: 1 request per second
- **Price Tracking**: 1 request per 2 seconds
- **Batch Processing**: Process in small batches with delays

### Database Optimization
- **Indexing**: Proper indexes on search fields
- **Connection Pooling**: Efficient database connections
- **Batch Operations**: Bulk inserts/updates where possible

## Security

### API Keys
- Store in environment variables
- Rotate regularly
- Monitor usage and quotas

### Data Validation
- Validate all external data
- Sanitize user inputs
- Prevent injection attacks

### Rate Limiting
- Implement API rate limiting
- Monitor for abuse patterns
- Block suspicious requests

## Deployment

### Environment Setup
1. Configure environment variables
2. Set up external API accounts
3. Configure monitoring and alerting
4. Test connectivity

### Production Considerations
- **Monitoring**: Set up comprehensive monitoring
- **Logging**: Centralized logging with proper levels
- **Backup**: Regular database backups
- **Scaling**: Consider horizontal scaling for high load

## Troubleshooting

### Common Issues

**Sync Failures**
- Check API keys and quotas
- Verify network connectivity
- Review error logs for specific issues

**Data Quality Issues**
- Check validation schemas
- Review data cleaning logic
- Verify source data format

**Performance Issues**
- Monitor API response times
- Check database query performance
- Review caching effectiveness

### Debug Commands
```bash
# Check sync status
npm run sync:status --detailed

# Test API connectivity
node scripts/sync-data.js test-connections

# Clear cache and retry
npm run sync:clear-cache
npm run sync:full
```

## Future Enhancements

### Additional Data Sources
- More phone specification APIs
- Additional price tracking sources
- User review aggregation
- Market trend analysis

### Advanced Features
- Machine learning for price prediction
- Automated data quality scoring
- Real-time price alerts
- Competitive analysis

### Performance Improvements
- GraphQL API for efficient data fetching
- CDN integration for static data
- Advanced caching strategies
- Microservice architecture