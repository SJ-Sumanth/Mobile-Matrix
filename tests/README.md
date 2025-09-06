# MobileMatrix Test Suite

This directory contains the comprehensive test suite for the MobileMatrix application, covering unit tests, integration tests, end-to-end tests, performance tests, accessibility tests, and visual regression tests.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests using Playwright
├── performance/            # Performance and load tests
├── accessibility/          # Accessibility (a11y) tests
├── visual/                # Visual regression tests
├── utils/                 # Test utilities and helpers
├── global-setup.ts        # Global test setup
├── global-teardown.ts     # Global test cleanup
└── README.md              # This file

src/
├── components/__tests__/   # Component unit tests
├── services/__tests__/     # Service unit tests
├── hooks/__tests__/        # Hook unit tests
├── lib/__tests__/         # Library unit tests
├── utils/__tests__/       # Utility unit tests
└── types/__tests__/       # Type validation tests
```

## Test Types

### 1. Unit Tests
- **Location**: `src/**/__tests__/`
- **Framework**: Vitest + React Testing Library
- **Purpose**: Test individual components, functions, and modules in isolation
- **Run**: `npm run test:unit`

### 2. Integration Tests
- **Location**: `src/**/__tests__/*.integration.test.ts`
- **Framework**: Vitest
- **Purpose**: Test interactions between different modules and services
- **Run**: `npm run test:integration`

### 3. End-to-End Tests
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Purpose**: Test complete user workflows and application behavior
- **Run**: `npm run test:e2e`

### 4. Performance Tests
- **Location**: `tests/performance/`
- **Framework**: Vitest + Performance API
- **Purpose**: Test API response times, memory usage, and performance metrics
- **Run**: `npm run test:performance`

### 5. Accessibility Tests
- **Location**: `tests/accessibility/`
- **Framework**: Vitest + jest-axe
- **Purpose**: Test WCAG compliance and accessibility features
- **Run**: `npm run test:accessibility`

### 6. Visual Regression Tests
- **Location**: `tests/visual/`
- **Framework**: Playwright
- **Purpose**: Test UI consistency and detect visual changes
- **Run**: `npm run test:visual`

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:accessibility

# Visual regression tests
npm run test:visual
```

### Development Mode
```bash
# Watch mode for unit tests
npm run test:watch

# Interactive UI for tests
npm run test:ui

# Playwright UI mode
npm run test:e2e:ui
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

## Test Configuration

### Vitest Configuration
- **File**: `vitest.config.ts`
- **Environment**: jsdom for DOM testing
- **Setup**: `src/test-setup.ts`
- **Coverage**: v8 provider with 80% threshold

### Playwright Configuration
- **File**: `playwright.config.ts`
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Reports**: HTML, JSON, JUnit

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { POST } from '../api/chat/route';

describe('Chat API Integration', () => {
  it('should process chat messages', async () => {
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.message).toBeDefined();
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('should complete phone comparison flow', async ({ page }) => {
  await page.goto('/');
  
  await page.fill('[placeholder*="Ask me about phones"]', 'Compare iPhone and Samsung');
  await page.click('button[type="submit"]');
  
  await expect(page.getByText('iPhone')).toBeVisible();
  await expect(page.getByText('Samsung')).toBeVisible();
});
```

## Test Data and Mocks

### Mock Data Factories
Use the test helpers in `tests/utils/test-helpers.ts`:

```typescript
import { createMockPhone, createMockComparison } from '../utils/test-helpers';

const mockPhone = createMockPhone({
  brand: 'Apple',
  model: 'iPhone 15',
});

const mockComparison = createMockComparison();
```

### Service Mocks
```typescript
import { mockAIService, mockPhoneService } from '../utils/test-helpers';

vi.mock('../../src/services/ai', () => ({
  createAIService: vi.fn(() => mockAIService()),
}));
```

## Continuous Integration

Tests run automatically on:
- **Push** to main/develop branches
- **Pull requests** to main/develop branches

### CI Pipeline
1. **Unit Tests** - Fast feedback on code changes
2. **Integration Tests** - Test service interactions
3. **Build Test** - Ensure application builds successfully
4. **E2E Tests** - Test complete user workflows
5. **Accessibility Tests** - Ensure WCAG compliance
6. **Performance Tests** - Monitor performance metrics
7. **Visual Regression** - Detect UI changes
8. **Security Scan** - Check for vulnerabilities

## Test Environment

### Environment Variables
```bash
# Test database
TEST_DATABASE_URL=postgresql://localhost:5432/mobile_matrix_test

# Test Redis
TEST_REDIS_URL=redis://localhost:6379/1

# API keys for testing
GEMINI_API_KEY=test-api-key
```

### Database Setup
```bash
# Set up test database
npx prisma migrate deploy --schema=./prisma/schema.prisma
npx prisma db seed
```

## Best Practices

### 1. Test Naming
- Use descriptive test names that explain the expected behavior
- Follow the pattern: "should [expected behavior] when [condition]"

### 2. Test Structure
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code being tested
- **Assert**: Verify the expected outcome

### 3. Mocking
- Mock external dependencies (APIs, databases, services)
- Use factory functions for consistent test data
- Reset mocks between tests

### 4. Assertions
- Use specific assertions that clearly indicate what's being tested
- Prefer semantic queries (getByRole, getByLabelText) over generic ones

### 5. Test Independence
- Each test should be independent and not rely on other tests
- Clean up after tests to prevent side effects

### 6. Performance
- Keep unit tests fast (< 100ms each)
- Use integration tests for slower operations
- Mock expensive operations in unit tests

## Debugging Tests

### Debug Unit Tests
```bash
# Run specific test file
npm run test -- MyComponent.test.tsx

# Run tests in watch mode with debugging
npm run test:watch -- --reporter=verbose

# Debug with VS Code
# Set breakpoints and use "Debug Test" in VS Code
```

### Debug E2E Tests
```bash
# Run in headed mode
npx playwright test --headed

# Debug mode with browser dev tools
npx playwright test --debug

# Run specific test
npx playwright test tests/e2e/homepage.spec.ts
```

### Debug Visual Tests
```bash
# Update visual baselines
npx playwright test tests/visual/ --update-snapshots

# Compare visual differences
npx playwright show-report
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in test configuration
   - Check for unresolved promises
   - Ensure proper cleanup of async operations

2. **Flaky tests**
   - Add proper wait conditions
   - Mock time-dependent operations
   - Use deterministic test data

3. **Memory leaks in tests**
   - Clean up event listeners
   - Reset global state between tests
   - Use proper mocking and cleanup

4. **Visual test failures**
   - Check for dynamic content (timestamps, animations)
   - Ensure consistent test environment
   - Update baselines when UI changes are intentional

### Getting Help

- Check test logs and error messages
- Review CI pipeline results
- Use debugging tools and breakpoints
- Consult team documentation and standards

## Metrics and Reporting

### Coverage Targets
- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 80% minimum
- **Statements**: 80% minimum

### Performance Targets
- **API Response Time**: < 2 seconds
- **Page Load Time**: < 3 seconds
- **Test Execution**: Unit tests < 100ms each

### Accessibility Targets
- **WCAG Level**: AA compliance
- **Automated Tests**: 100% of components tested
- **Manual Testing**: Critical user flows verified