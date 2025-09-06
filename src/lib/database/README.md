# Database Setup and Configuration

This directory contains the database configuration, connection utilities, and service classes for the MobileMatrix application.

## Overview

The database layer is built using:
- **PostgreSQL** as the primary database
- **Prisma ORM** for database operations and migrations
- **Connection pooling** for optimal performance
- **Retry logic** for handling transient failures
- **Metrics tracking** for monitoring database performance

## Files Structure

```
src/lib/
├── database.ts              # Main database connection and utilities
├── services/                # Database service classes
│   ├── base.service.ts      # Base service with common functionality
│   ├── brand.service.ts     # Brand-related operations
│   ├── phone.service.ts     # Phone-related operations
│   ├── chat.service.ts      # Chat session operations
│   ├── comparison.service.ts # Phone comparison operations
│   └── index.ts             # Service exports
└── __tests__/               # Unit tests
    ├── setup.ts             # Test setup and utilities
    ├── database-connection.test.ts # Database utility tests
    ├── brand.service.test.ts       # Brand service tests
    ├── phone.service.test.ts       # Phone service tests
    └── chat.service.test.ts        # Chat service tests
```

## Database Schema

The database includes the following main entities:

### Brands
- Stores phone manufacturer information
- Includes name, slug, logo, and description

### Phones
- Main phone entity with model, variant, pricing
- Links to brand and specifications
- Supports availability status and images

### Phone Specifications
- Detailed technical specifications
- Display, camera, performance, battery, connectivity
- Build quality and software information

### Chat Sessions
- AI conversation tracking
- User preferences and selection state
- Message history

### Chat Messages
- Individual messages in conversations
- Role-based (user, assistant, system)
- Metadata support

### Phone Comparisons
- Comparison results between phones
- Insights and recommendations
- Shareable comparison tokens

## Usage

### Basic Database Connection

```typescript
import { prisma } from '@/lib/database'

// Simple query
const brands = await prisma.brand.findMany()

// With error handling
import { checkDatabaseConnection } from '@/lib/database'

if (await checkDatabaseConnection()) {
  // Database is available
}
```

### Using Service Classes

```typescript
import { BrandService, PhoneService } from '@/lib/services'

const brandService = new BrandService()
const phoneService = new PhoneService()

// Get all brands
const brands = await brandService.getAllBrands()

// Search phones
const phones = await phoneService.searchPhones('iPhone')

// Create new phone
const phone = await phoneService.createPhone({
  brandId: 'brand-id',
  model: 'iPhone 15',
  slug: 'apple-iphone-15',
  // ... other fields
})
```

### Transaction Support

```typescript
import { withTransaction } from '@/lib/database'

const result = await withTransaction(async (tx) => {
  const brand = await tx.brand.create({ data: brandData })
  const phone = await tx.phone.create({ 
    data: { ...phoneData, brandId: brand.id } 
  })
  return { brand, phone }
})
```

### Retry Logic

```typescript
import { withRetry } from '@/lib/database'

const result = await withRetry(async () => {
  return await someUnreliableOperation()
}, 3) // Retry up to 3 times
```

### Metrics Tracking

```typescript
import { DatabaseMetrics, withMetrics } from '@/lib/database'

// Track operation metrics
const result = await withMetrics(async () => {
  return await someOperation()
})

// Get metrics
const metrics = DatabaseMetrics.getMetrics()
console.log(`Query count: ${metrics.queryCount}`)
console.log(`Error rate: ${metrics.errorRate}`)
console.log(`Average query time: ${metrics.averageQueryTime}ms`)
```

## Environment Variables

Required environment variables:

```env
# Primary database connection
DATABASE_URL="postgresql://username:password@localhost:5432/mobile_matrix"

# Direct connection for migrations (optional)
DIRECT_URL="postgresql://username:password@localhost:5432/mobile_matrix"

# Test database (for running tests)
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/mobile_matrix_test"
```

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Reset database (development only)
npm run db:reset
```

## Testing

The database layer includes comprehensive unit tests:

```bash
# Run all database tests
npm run test src/lib/__tests__/

# Run specific service tests
npm run test src/lib/__tests__/brand.service.test.ts

# Run database utility tests
npm run test src/lib/__tests__/database-connection.test.ts
```

## Error Handling

The service classes provide structured error handling:

- `NotFoundError` - When requested resource doesn't exist
- `ConflictError` - When trying to create duplicate resources
- `ValidationError` - When data validation fails
- `DatabaseError` - General database operation errors

```typescript
import { NotFoundError, ConflictError } from '@/lib/services'

try {
  const phone = await phoneService.getPhoneById('invalid-id')
} catch (error) {
  if (error instanceof NotFoundError) {
    // Handle not found case
  } else if (error instanceof ConflictError) {
    // Handle conflict case
  }
}
```

## Performance Considerations

- Connection pooling is configured automatically
- Queries include appropriate indexes
- Soft deletes are used instead of hard deletes
- Caching layer can be added for frequently accessed data
- Metrics tracking helps identify performance bottlenecks

## Security

- All queries use parameterized statements (via Prisma)
- Input validation is performed at the service layer
- Sensitive data is properly handled
- Connection strings should be kept secure