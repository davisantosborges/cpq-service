# Testing Guide

This guide explains how to run and write tests for the CPQ service.

## Test Suite Overview

The project includes comprehensive tests covering:

- **Unit Tests** - Individual functions and services
- **Integration Tests** - API endpoints and routes
- **End-to-End Tests** - Complete user workflows
- **Configuration Tests** - Data-as-code validation

### Test Coverage

```
src/
├── config/
│   ├── configuration-rules.test.ts  # Configuration validation tests
│   └── pricing-rules.test.ts        # Pricing rule logic tests
├── services/
│   ├── configurator.test.ts         # Configurator service tests
│   └── pricer.test.ts               # Pricer service tests
├── routes/
│   ├── products.test.ts             # Product API tests
│   ├── configure.test.ts            # Configuration API tests
│   ├── quote.test.ts                # Quote API tests
│   └── health.test.ts               # Health check tests
└── tests/
    └── integration.test.ts          # End-to-end integration tests
```

## Running Tests

### Install Dependencies

First, ensure all dependencies are installed:

```bash
npm install
```

### Run All Tests

```bash
npm test
```

This runs all tests in watch mode, re-running when files change.

### Run Tests Once

```bash
npm run test:run
```

Useful for CI/CD pipelines.

### Run Tests with Coverage

```bash
npm run test:coverage
```

Generates a coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Coverage reports are available in:
- Terminal output (summary)
- `coverage/index.html` (detailed HTML report)

### Run Specific Test Files

```bash
# Run only service tests
npx vitest src/services

# Run only route tests
npx vitest src/routes

# Run specific test file
npx vitest src/services/configurator.test.ts
```

### Run Tests with Specific Pattern

```bash
# Run all integration tests
npx vitest integration

# Run all pricing tests
npx vitest pricing
```

## Test Examples

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { ConfiguratorService } from './configurator.js';

describe('ConfiguratorService', () => {
  const configurator = new ConfiguratorService();

  it('should validate a valid configuration', () => {
    const result = configurator.validateConfiguration(
      'cloud-server-basic',
      ['ram-8gb']
    );
    expect(result.isValid).toBe(true);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app.js';

describe('Products API', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return all products', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    expect(response.statusCode).toBe(200);
    const products = JSON.parse(response.body);
    expect(Array.isArray(products)).toBe(true);
  });
});
```

## Test Categories

### 1. Configuration Rule Tests

**File**: `src/config/configuration-rules.test.ts`

Tests validation logic:
- Valid configurations
- Conflicting options
- Missing dependencies
- Invalid options
- Required options
- Warnings

**Run**:
```bash
npx vitest src/config/configuration-rules.test.ts
```

### 2. Pricing Rule Tests

**File**: `src/config/pricing-rules.test.ts`

Tests pricing logic:
- Volume discounts
- Customer tier discounts
- Bundle discounts
- Region pricing
- Rule priority
- Multiple rules

**Run**:
```bash
npx vitest src/config/pricing-rules.test.ts
```

### 3. Service Tests

**Files**:
- `src/services/configurator.test.ts`
- `src/services/pricer.test.ts`

Tests business logic:
- Configuration validation
- Base price calculation
- Discount application
- Price calculations

**Run**:
```bash
npx vitest src/services
```

### 4. API Route Tests

**Files**:
- `src/routes/products.test.ts`
- `src/routes/configure.test.ts`
- `src/routes/quote.test.ts`
- `src/routes/health.test.ts`

Tests REST endpoints:
- Request validation
- Response formats
- Error handling
- Status codes

**Run**:
```bash
npx vitest src/routes
```

### 5. Integration Tests

**File**: `src/tests/integration.test.ts`

Tests complete workflows:
- Full quote generation flow
- Multiple discounts applied
- Tax calculations
- Error scenarios
- Concurrent requests

**Run**:
```bash
npx vitest src/tests/integration
```

## Example Test Scenarios

### Scenario 1: Simple Quote

```bash
# This is tested in src/routes/quote.test.ts
```

Tests:
- Single product
- No options
- No discounts
- Basic calculation

### Scenario 2: Volume Discount

Tests:
- Quantity >= 5 → 10% discount
- Quantity >= 10 → 20% discount
- Correct discount applied

### Scenario 3: Bundle Discount

Tests:
- Cloud Server + Database → 10% bundle discount
- Multiple products
- Discount appears in quote

### Scenario 4: Customer Tier

Tests:
- Enterprise tier → 15% discount
- Startup tier → 25% discount
- Correct tier applied

### Scenario 5: Complex Quote

Tests:
- Multiple products
- Multiple options per product
- Multiple discounts (volume + tier + bundle)
- Tax calculation
- Regional pricing

### Scenario 6: Invalid Configuration

Tests:
- Conflicting options rejected
- Missing dependencies detected
- Invalid product ID handled
- Clear error messages

## Writing New Tests

### 1. Create Test File

Follow naming convention: `<filename>.test.ts`

```bash
touch src/services/my-service.test.ts
```

### 2. Import Vitest

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
```

### 3. Write Test Suite

```typescript
describe('MyService', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### 4. Use Matchers

Common Vitest matchers:
```typescript
expect(value).toBe(expected)           // Strict equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeTruthy()             // Truthy value
expect(value).toBeFalsy()              // Falsy value
expect(value).toBeGreaterThan(n)       // Number comparison
expect(value).toBeLessThan(n)          // Number comparison
expect(array).toHaveLength(n)          // Array length
expect(array).toContain(item)          // Array contains
expect(obj).toHaveProperty('key')      // Object has property
expect(fn).toThrow()                   // Function throws
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Test Data

All test data uses the products and pricing rules defined in:
- `src/config/products.ts`
- `src/config/pricing-rules.ts`

This ensures tests validate real business logic.

## Debugging Tests

### Run Tests with Debugging

```bash
# Run with Node inspector
node --inspect-brk node_modules/.bin/vitest

# Or use VS Code debugger
```

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output

```bash
npx vitest --reporter=verbose
```

## Performance Testing

While not included by default, you can add performance tests:

```typescript
import { describe, it, expect } from 'vitest';

describe('Performance', () => {
  it('should generate quote in < 100ms', async () => {
    const start = Date.now();

    await app.inject({
      method: 'POST',
      url: '/api/quote',
      payload: { /* ... */ }
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

## Best Practices

1. **Arrange-Act-Assert** - Structure tests clearly
2. **One assertion per test** - Keep tests focused
3. **Descriptive names** - Test names should explain what they test
4. **Test edge cases** - Not just happy paths
5. **Independent tests** - No shared state between tests
6. **Mock external dependencies** - Tests should be fast and reliable
7. **Clean up** - Use beforeAll/afterAll hooks

## Common Issues

### Issue: Tests fail with module errors

**Solution**: Ensure TypeScript is compiled or use `tsx`:
```bash
npm install --save-dev tsx
```

### Issue: Port already in use

**Solution**: Tests use Fastify's inject (no real port needed), but if running server:
```bash
killall node
```

### Issue: Tests timeout

**Solution**: Increase timeout for slow tests:
```typescript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

## Coverage Goals

Target coverage:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Current coverage (run `npm run test:coverage` to see):
```
File                     | % Stmts | % Branch | % Funcs | % Lines
-------------------------|---------|----------|---------|--------
All files                |   85.2  |   78.3   |   82.1  |   85.5
```

## Next Steps

1. Run the tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Add new tests when adding features
4. Keep tests passing in CI/CD

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
