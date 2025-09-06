# MobileMatrix Type Definitions

This directory contains all TypeScript type definitions and Zod schemas for the MobileMatrix application. The types are organized into logical modules and provide comprehensive validation and type safety throughout the application.

## Structure

```
types/
├── index.ts          # Main exports and utility types
├── phone.ts          # Phone-related types and schemas
├── chat.ts           # Chat and AI interaction types
├── comparison.ts     # Phone comparison types
├── api.ts            # API response and request types
├── services.ts       # Service interface definitions
├── errors.ts         # Error handling types and classes
├── examples.ts       # Usage examples and mock data
└── __tests__/        # Type validation tests
```

## Key Features

### 1. Zod Schema Validation
All types come with corresponding Zod schemas for runtime validation:

```typescript
import { PhoneSchema, validateData } from './types';

const result = validateData(PhoneSchema, phoneData);
if (result.isValid) {
  // phoneData is now validated and typed
  console.log(result.data.brand);
}
```

### 2. Type Safety
Comprehensive TypeScript interfaces ensure type safety across the application:

```typescript
import { Phone, ChatContext, ComparisonResult } from './types';

function processPhone(phone: Phone): void {
  // TypeScript ensures phone has all required properties
  console.log(`${phone.brand} ${phone.model}`);
}
```

### 3. Service Interfaces
Well-defined interfaces for all services:

```typescript
import { AIService, PhoneService } from './types';

class MyAIService implements AIService {
  async processUserMessage(message: string, context: ChatContext): Promise<AIResponse> {
    // Implementation must match interface
  }
}
```

## Core Types

### Phone Types
- `Phone` - Complete phone object with specifications
- `PhoneSpecifications` - Detailed technical specifications
- `Brand` - Phone brand information
- `PhoneModel` - Phone model metadata
- `PhoneSelection` - User's phone selection data

### Chat Types
- `ChatContext` - Complete chat session state
- `ChatMessage` - Individual chat messages
- `AIResponse` - AI service response format
- `UserPreferences` - User's comparison preferences

### Comparison Types
- `ComparisonResult` - Complete phone comparison data
- `ComparisonCategory` - Specification category comparisons
- `ComparisonInsights` - AI-generated insights
- `SpecComparison` - Individual specification comparison

### API Types
- `APIResponse<T>` - Generic API response wrapper
- `APIError` - Structured error information
- `PaginatedResponse<T>` - Paginated data responses
- `ValidationResult` - Data validation results

## Usage Examples

### Validating Phone Data
```typescript
import { PhoneSchema, validateData } from './types';

const phoneData = {
  id: 'phone-1',
  brand: 'Samsung',
  model: 'Galaxy S24',
  // ... other properties
};

const result = validateData(PhoneSchema, phoneData);
if (result.isValid) {
  // Data is valid and typed as Phone
  const phone = result.data;
} else {
  // Handle validation errors
  console.error(result.errors);
}
```

### Creating API Responses
```typescript
import { createSuccessResponse, createErrorResponse } from './types/examples';

// Success response
const successResponse = createSuccessResponse(phoneData);

// Error response
const errorResponse = createErrorResponse('Phone not found', 'PHONE_NOT_FOUND');
```

### Working with Chat Context
```typescript
import { ChatContext, ChatStep } from './types';

function updateChatStep(context: ChatContext, step: ChatStep): ChatContext {
  return {
    ...context,
    currentStep: step,
    updatedAt: new Date(),
  };
}
```

## Validation Utilities

The `utils/validation.ts` file provides helper functions for data validation:

- `validateData(schema, data)` - Validate data and return structured result
- `safeParseData(schema, data)` - Safely parse data, return null on failure
- `sanitizeSearchQuery(query)` - Sanitize user search input
- `validatePhoneModel(model)` - Validate phone model format
- `validatePrice(price)` - Validate price values

## Error Handling

Comprehensive error types and classes for different scenarios:

```typescript
import { AppError, PhoneNotFoundError, AIServiceError } from './types';

// Throw specific errors
throw new PhoneNotFoundError('Samsung', 'Galaxy S24');
throw new AIServiceError('AI service unavailable');

// Handle errors
try {
  // Some operation
} catch (error) {
  if (error instanceof AppError) {
    console.log(`Error ${error.code}: ${error.message}`);
  }
}
```

## Testing

All schemas include comprehensive tests in the `__tests__` directory. Run tests with:

```bash
npm test
```

## Best Practices

1. **Always use schemas for validation** - Don't trust external data
2. **Use type guards** - Check types at runtime when needed
3. **Handle validation errors** - Provide meaningful error messages
4. **Keep types focused** - Each file handles a specific domain
5. **Document complex types** - Add JSDoc comments for clarity

## Contributing

When adding new types:

1. Add the type definition and schema in the appropriate file
2. Export from `index.ts`
3. Add validation utilities if needed
4. Include tests for the new types
5. Update this README if adding new modules

## Dependencies

- `zod` - Runtime type validation and schema definition
- `typescript` - Static type checking
- `vitest` - Testing framework for type validation tests