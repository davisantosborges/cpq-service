# Architecture Documentation

## Overview

This CPQ (Configure, Price, Quote) service is built on a **stateless, data-as-code** architecture. All business logic, product definitions, and pricing rules are defined in TypeScript code rather than stored in a database.

## Design Principles

### 1. Stateless Design

**Every request is independent** - The server maintains no state between requests. This enables:
- Horizontal scaling without session affinity
- Simple deployment and rollback
- High availability and fault tolerance
- Container orchestration friendly

### 2. Data-as-Code

**Configuration is code** - Products, pricing rules, and business logic are TypeScript files:
- Version controlled in git
- Code reviewed through pull requests
- Type-safe at compile time
- Easy to test and validate

### 3. Type Safety

**TypeScript everywhere** - Strong typing prevents runtime errors:
- Compile-time validation of configurations
- Runtime validation with Zod schemas
- IDE autocomplete and intellisense
- Refactoring support

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│              REST API Layer                     │
│         (Fastify Routes + Swagger)              │
├─────────────────────────────────────────────────┤
│          Validation Layer (Zod)                 │
├─────────────────────────────────────────────────┤
│            Service Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Configurator│ │ Pricer  │  │ Quoter  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
├─────────────────────────────────────────────────┤
│         Data-as-Code Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Products │  │  Pricing │  │Config    │      │
│  │          │  │  Rules   │  │Rules     │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

## Component Details

### REST API Layer

**Technology**: Fastify
**Responsibility**: HTTP request/response handling

- Product endpoints - Browse catalog
- Configure endpoints - Validate configurations
- Quote endpoints - Generate quotes
- Health endpoints - Monitoring

**Why Fastify?**
- One of the fastest Node.js frameworks
- Built-in schema validation
- Plugin architecture
- TypeScript support

### Validation Layer

**Technology**: Zod
**Responsibility**: Runtime type validation

- Validates incoming requests
- Type-safe schema definitions
- Automatic TypeScript type inference
- Clear error messages

### Service Layer

#### ConfiguratorService
**Responsibility**: Product configuration and validation

Key methods:
- `validateConfiguration()` - Check if a configuration is valid
- `validateConfigurations()` - Batch validation
- `calculateBasePrice()` - Base price before discounts

#### PricerService
**Responsibility**: Pricing calculations with business rules

Key methods:
- `calculatePrice()` - Apply pricing rules to a configuration
- `calculateTotalPrice()` - Total price for multiple items

Pricing rules are applied in priority order:
1. Higher priority rules apply first (lower number = higher priority)
2. Rules can be percentage, fixed, tiered, or bundle-based
3. Each rule has a condition function and an apply function

#### QuoterService
**Responsibility**: Generate complete quotes

Key methods:
- `generateQuote()` - Create a full quote with line items

Combines configurator and pricer to:
1. Validate all configurations
2. Calculate prices with discounts
3. Generate line items
4. Apply tax if provided
5. Return complete quote

### Data-as-Code Layer

#### Products (`src/config/products.ts`)

Defines all available products and options:

```typescript
{
  id: 'product-id',
  name: 'Product Name',
  basePrice: 100,
  options: [
    {
      id: 'option-id',
      price: 50,
      conflicts: ['other-option-id'],
      dependencies: ['required-option-id']
    }
  ]
}
```

#### Pricing Rules (`src/config/pricing-rules.ts`)

Business logic for pricing:

```typescript
{
  id: 'rule-id',
  priority: 10,
  condition: (context) => context.quantity >= 5,
  apply: (price) => price * 0.9  // 10% discount
}
```

#### Configuration Rules (`src/config/configuration-rules.ts`)

Validation logic:
- Required options
- Conflicting options
- Dependencies
- Custom validation

## Data Flow

### Quote Generation Flow

```
1. Client sends POST /api/quote
   ↓
2. Zod validates request schema
   ↓
3. QuoterService.generateQuote()
   ↓
4. ConfiguratorService.validateConfigurations()
   - Check product exists
   - Check required options
   - Check conflicts
   - Check dependencies
   ↓
5. PricerService.calculateTotalPrice()
   For each configuration:
     a. Get product details
     b. Calculate base price
     c. Build pricing context
     d. Get applicable rules (sorted by priority)
     e. Apply each rule sequentially
     f. Track applied discounts
   ↓
6. Build quote object
   - Line items with details
   - Subtotal
   - Total discounts
   - Tax (if provided)
   - Final total
   ↓
7. Return quote to client
```

## Pricing Rule Evaluation

Rules are evaluated in **priority order** (lower number = higher priority):

1. **Filter applicable rules** - Only rules where `condition(context)` returns true
2. **Sort by priority** - Lower number first
3. **Apply sequentially** - Each rule transforms the price
4. **Track discounts** - Record which rules applied and how much they discounted

Example:
```typescript
Base price: $100
Rule 1 (priority 5): Enterprise discount (-15%) → $85
Rule 2 (priority 10): Volume discount (-10%) → $76.50
Final price: $76.50
```

## Extension Points

### Adding New Products

1. Add product definition to `src/config/products.ts`
2. No code changes required
3. Product immediately available via API

### Adding New Pricing Rules

1. Add rule to `src/config/pricing-rules.ts`
2. Define condition and apply functions
3. Set appropriate priority
4. Rule immediately active

### Adding New Validation

1. Add validation logic to `src/config/configuration-rules.ts`
2. Can check dependencies, conflicts, custom logic
3. Returns clear error messages

### Adding New Endpoints

1. Create route file in `src/routes/`
2. Register in `src/app.ts`
3. Add Zod schema for validation
4. Implement handler

## Scaling Strategy

### Horizontal Scaling

Since the service is **completely stateless**, scale horizontally:

```
┌─────────────┐
│Load Balancer│
└─────┬───────┘
      │
      ├──────► Instance 1
      ├──────► Instance 2
      ├──────► Instance 3
      └──────► Instance N
```

Each instance:
- Runs identical code
- No shared state
- No database connections
- Independent failure domain

### Performance Optimization

1. **Caching** - Can add CDN/cache layer for product catalog
2. **Compression** - Enable gzip/brotli
3. **Resource limits** - Set memory/CPU limits per instance
4. **Health checks** - Remove unhealthy instances

### Deployment Patterns

**Blue-Green Deployment**
- Deploy new version alongside old
- Switch traffic when ready
- Instant rollback if issues

**Canary Deployment**
- Route small % of traffic to new version
- Monitor metrics
- Gradually increase traffic

**Rolling Update**
- Update instances one by one
- No downtime
- Gradual rollout

## Security Considerations

### Input Validation
- All inputs validated with Zod schemas
- Type checking at runtime
- No SQL injection (no database!)

### Output Sanitization
- JSON responses only
- No user-generated HTML
- CORS configured

### Container Security
- Non-root user
- Minimal base image (Alpine)
- No unnecessary dependencies
- Health checks

### Monitoring
- Health check endpoints
- Structured logging
- Error tracking

## Testing Strategy

### Unit Tests
- Test individual functions
- Mock dependencies
- Fast execution

### Integration Tests
- Test full request/response cycle
- Use real Fastify instance
- Validate API contracts

### Test Coverage
- Services: Configuration, pricing, quoting
- Routes: All endpoints
- Data: Validation rules

## Future Enhancements

Potential improvements while maintaining stateless design:

1. **Caching Layer** - Redis/CDN for product catalog
2. **Rate Limiting** - Per-client request limits
3. **API Versioning** - v1, v2 endpoints
4. **Webhooks** - Notify on quote generation
5. **Multi-currency** - Support different currencies
6. **A/B Testing** - Different pricing rules for segments
7. **Metrics** - Prometheus/StatsD integration
8. **Tracing** - OpenTelemetry support

All can be added while maintaining the stateless architecture!
