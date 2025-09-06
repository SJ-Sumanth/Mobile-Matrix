# Services Documentation

This directory contains the service layer implementations for the MobileMatrix application.

## PhoneService

The `PhoneService` class provides comprehensive phone database operations with built-in caching and error handling.

### Features

- **CRUD Operations**: Complete Create, Read, Update, Delete operations for phone data
- **Search Functionality**: Advanced search across brands, models, and variants
- **Caching Layer**: Redis-based caching for improved performance
- **Data Validation**: Zod schema validation for data integrity
- **Error Handling**: Graceful error handling with retry mechanisms
- **Type Safety**: Full TypeScript support with proper type definitions

### Key Methods

#### Search Operations
- `searchPhones(query: string)`: Search phones by brand, model, or variant
- `getPhoneByModel(brand: string, model: string)`: Get specific phone by brand and model
- `getPhoneById(id: string)`: Get phone by unique ID
- `getSimilarPhones(phone: Phone, limit?: number)`: Find similar phones based on specifications

#### Brand and Model Operations
- `getAllBrands()`: Get all active phone brands
- `getModelsByBrand(brandId: string)`: Get all models for a specific brand
- `getPhonesByBrand(brandName: string)`: Get all phones from a specific brand

#### Data Management
- `updatePhoneData()`: Update phone data from external sources (placeholder for future implementation)

### Caching Strategy

The service implements a multi-level caching strategy:

- **Search Results**: Cached for 30 minutes (medium TTL)
- **Individual Phones**: Cached for 1 hour (long TTL)
- **Brand Data**: Cached for 24 hours (very long TTL)
- **Similar Phones**: Cached for 30 minutes (medium TTL)

### Error Handling

- **Database Errors**: Automatic retry with exponential backoff
- **Cache Failures**: Graceful degradation (continues without cache)
- **Validation Errors**: Clear error messages with field-level details
- **Network Issues**: Retry mechanisms for transient failures

### Usage Example

```typescript
import { phoneService } from '../services/phone.js';

// Search for phones
const iphones = await phoneService.searchPhones('iPhone');

// Get specific phone
const phone = await phoneService.getPhoneByModel('Apple', 'iPhone 15');

// Get all brands
const brands = await phoneService.getAllBrands();

// Get similar phones
if (phone) {
  const similar = await phoneService.getSimilarPhones(phone, 5);
}
```

### Testing

The service includes comprehensive test coverage:

- **Unit Tests**: Mock-based tests for all methods (`phone.test.ts`)
- **Integration Tests**: Database integration tests (`phone.integration.test.ts`)
- **Example Usage**: Practical usage examples (`phone.example.ts`)

Run tests with:
```bash
npm run test src/services/__tests__/phone.test.ts
```

### Performance Considerations

- **Connection Pooling**: Database connections are pooled for efficiency
- **Query Optimization**: Indexed queries with proper WHERE clauses
- **Result Limiting**: Search results are limited to prevent memory issues
- **Caching**: Frequently accessed data is cached to reduce database load

### Data Validation

All phone data is validated using Zod schemas:

- **Phone Schema**: Validates complete phone objects
- **Brand Schema**: Validates brand information
- **Specifications Schema**: Validates technical specifications
- **Pricing Schema**: Validates pricing information

### Future Enhancements

- **External API Integration**: Fetch data from GSMArena, PriceTracker APIs
- **Real-time Updates**: WebSocket-based real-time price updates
- **Advanced Search**: Elasticsearch integration for complex queries
- **Machine Learning**: AI-powered phone recommendations
- **Bulk Operations**: Batch insert/update operations for data sync

## Other Services

### AIService (Placeholder)
- Handles AI-powered phone comparisons
- Manages conversation context
- Processes natural language queries

### ComparisonService (Placeholder)
- Generates detailed phone comparisons
- Calculates phone scores
- Provides comparison insights

---

For more information about the overall architecture, see the [Design Document](../../.kiro/specs/mobile-matrix-phone-comparison/design.md).