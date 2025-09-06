# MobileMatrix API

This directory contains the API routes and middleware for the MobileMatrix phone comparison platform.

## Overview

The API is built using Next.js 14 App Router with TypeScript and provides endpoints for:
- Phone search and retrieval
- AI-powered chat interactions
- Phone comparisons
- Brand and model management
- Health monitoring
- API documentation

## Architecture

### Middleware Stack

The API uses a layered middleware approach:

1. **CORS & Security Headers** - Cross-origin resource sharing and security headers
2. **Error Handling** - Global error catching and standardized error responses
3. **Rate Limiting** - Request rate limiting with Redis caching
4. **Validation** - Request/response validation using Zod schemas

### API Routes

#### Core Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/docs` - OpenAPI/Swagger documentation
- `GET /api/phones/search` - Search phones by query
- `GET /api/phones/{id}` - Get phone details by ID
- `GET /api/phones/brands` - Get all available brands
- `GET /api/phones/brands/{brandId}/models` - Get models by brand
- `POST /api/comparison` - Compare two phones
- `POST /api/chat` - Process AI chat messages
- `POST /api/chat/extract-phone` - Extract phone selection from text
- `WS /api/chat/ws` - WebSocket endpoint for real-time chat

#### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456789_abc123"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... },
    "severity": "medium",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123456789_abc123"
  }
}
```

## Middleware

### Rate Limiting

Different endpoints have different rate limits:
- **Search**: 30 requests per minute
- **Chat**: 20 requests per minute  
- **Comparison**: 10 requests per 5 minutes
- **Default**: 100 requests per 15 minutes

Rate limiting uses Redis for distributed caching and includes proper headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### Validation

Request validation uses Zod schemas with automatic error handling:
- Query parameter validation for GET requests
- JSON body validation for POST/PUT requests
- Path parameter validation for dynamic routes

### Error Handling

Comprehensive error handling with:
- Automatic error classification
- Structured error responses
- Development vs production error details
- Error logging and monitoring

### Security

Security middleware includes:
- CORS configuration
- Security headers (CSP, XSS protection, etc.)
- Request sanitization
- Rate limiting

## WebSocket Support

Real-time chat functionality via WebSocket:
- Connection management
- Message broadcasting
- Session persistence
- Automatic cleanup

## Testing

### Unit Tests
- API route structure validation
- Middleware functionality
- Response format consistency
- OpenAPI specification validation

### Integration Tests
- End-to-end API workflows
- Database integration
- External service integration
- Error scenario handling

Run tests:
```bash
npm test src/app/api/__tests__/unit.test.ts
npm test src/app/api/__tests__/integration.test.ts
```

## Configuration

### Environment Variables

Required environment variables:
- `GEMINI_API_KEY` - Google Gemini AI API key
- `DATABASE_URL` - PostgreSQL database connection string
- `REDIS_URL` - Redis cache connection string

Optional environment variables:
- `OPENAI_API_KEY` - OpenAI API key (alternative AI provider)
- `CLAUDE_API_KEY` - Claude API key (alternative AI provider)
- `NODE_ENV` - Environment (development/production)

### Rate Limiting Configuration

Rate limits can be configured in `src/middleware/rateLimit.ts`:

```typescript
export const RateLimitConfigs = {
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  chat: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 20,
  },
  // ... other configurations
};
```

## API Documentation

Interactive API documentation is available at `/api/docs` and follows OpenAPI 3.0.3 specification.

The documentation includes:
- Complete endpoint descriptions
- Request/response schemas
- Authentication requirements
- Rate limiting information
- Example requests and responses

## Error Codes

Common error codes:
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `INTERNAL_SERVER_ERROR` - Server error
- `SERVICE_UNAVAILABLE` - External service unavailable

## Performance

### Caching Strategy

- Phone data cached with Redis
- Different TTL for different data types
- Cache invalidation on data updates
- Fallback to database on cache miss

### Database Optimization

- Connection pooling
- Query optimization
- Retry logic with exponential backoff
- Metrics collection

### Monitoring

- Health check endpoint
- Service dependency monitoring
- Performance metrics
- Error tracking

## Deployment

### Production Considerations

1. **Environment Setup**
   - Set production environment variables
   - Configure Redis cluster
   - Set up database replicas

2. **Security**
   - Enable HTTPS
   - Configure proper CORS origins
   - Set up API key authentication
   - Enable security headers

3. **Monitoring**
   - Set up health check monitoring
   - Configure error alerting
   - Enable performance monitoring
   - Set up log aggregation

4. **Scaling**
   - Configure load balancing
   - Set up auto-scaling
   - Optimize database connections
   - Configure CDN for static assets

## Development

### Adding New Endpoints

1. Create route file in appropriate directory
2. Implement handler with proper middleware
3. Add validation schemas
4. Update OpenAPI documentation
5. Add tests
6. Update this README

### Middleware Development

1. Create middleware function in `src/middleware/`
2. Follow existing patterns
3. Add proper error handling
4. Include tests
5. Document usage

### Testing

Always include both unit and integration tests for new functionality:
- Unit tests for isolated functionality
- Integration tests for complete workflows
- Mock external dependencies appropriately
- Test error scenarios

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL configuration
   - Verify database is running
   - Check connection limits

2. **Redis Connection Errors**
   - Check REDIS_URL configuration
   - Verify Redis is running
   - Check connection limits

3. **Rate Limiting Issues**
   - Check Redis connectivity
   - Verify rate limit configuration
   - Check client IP detection

4. **AI Service Errors**
   - Verify API keys are set
   - Check API quotas and limits
   - Verify network connectivity

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=mobile-matrix:*
```

This will provide detailed logging for troubleshooting.