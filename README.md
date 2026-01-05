# CPQ Service - Configure, Price, Quote

A **stateless RESTful CPQ (Configure, Price, Quote) service** with **data-as-code**. All product configurations, pricing rules, and business logic are defined in TypeScript code, with no database backend required.

## 🎯 Key Features

- **100% Stateless** - No database, no sessions, fully stateless REST API
- **Data-as-Code** - Products, pricing rules, and configurations defined in TypeScript
- **Type-Safe** - Full TypeScript type safety with Zod validation
- **Fast & Lightweight** - Built on Fastify for high performance
- **Production-Ready** - Includes Docker, tests, health checks, and API documentation
- **Easy to Scale** - Horizontal scaling with no shared state

## 🏗️ Architecture

```
┌─────────────────┐
│   REST API      │  Fastify HTTP Server
│   (Stateless)   │
├─────────────────┤
│  Service Layer  │  Business Logic
│  - Configurator │  (Validation, Pricing, Quoting)
│  - Pricer       │
│  - Quoter       │
├─────────────────┤
│  Data-as-Code   │  TypeScript Configuration Files
│  - Products     │  (Version controlled, code reviewed)
│  - Pricing Rules│
│  - Config Rules │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The service will be available at:
- API: http://localhost:3000
- Documentation: http://localhost:3000/documentation
- Health Check: http://localhost:3000/api/health

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t cpq-service .
docker run -p 3000:3000 cpq-service
```

## 📚 API Documentation

### Endpoints

#### Products

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Get products by category
- `GET /api/categories` - Get all categories

#### Configuration

- `POST /api/configure/validate` - Validate a product configuration

#### Quotes

- `POST /api/quote` - Generate a price quote

#### Health

- `GET /api/health` - Health check
- `GET /api/health/ready` - Readiness check

### Example: Generate a Quote

```bash
curl -X POST http://localhost:3000/api/quote \
  -H "Content-Type: application/json" \
  -d '{
    "configurations": [
      {
        "productId": "cloud-server-basic",
        "selectedOptions": ["ram-8gb", "storage-ssd-100gb"],
        "quantity": 2
      }
    ],
    "customerTier": "enterprise",
    "region": "us-west"
  }'
```

Response:
```json
{
  "id": "uuid-here",
  "createdAt": "2026-01-05T12:00:00.000Z",
  "lineItems": [
    {
      "productId": "cloud-server-basic",
      "productName": "Cloud Server - Basic",
      "quantity": 2,
      "basePrice": 50,
      "selectedOptions": [
        { "id": "ram-8gb", "name": "8GB RAM Upgrade", "price": 20 },
        { "id": "storage-ssd-100gb", "name": "100GB SSD Storage", "price": 15 }
      ],
      "subtotal": 170,
      "discounts": [
        { "ruleId": "enterprise-tier-discount", "ruleName": "Enterprise Tier Discount", "amount": 25.5 }
      ],
      "total": 144.5
    }
  ],
  "subtotal": 170,
  "totalDiscounts": 25.5,
  "total": 144.5
}
```

## 📂 Project Structure

```
cpq-service/
├── src/
│   ├── config/                    # Data-as-Code
│   │   ├── products.ts            # Product catalog
│   │   ├── pricing-rules.ts       # Pricing logic
│   │   └── configuration-rules.ts # Validation rules
│   ├── routes/                    # API endpoints
│   │   ├── products.ts
│   │   ├── configure.ts
│   │   ├── quote.ts
│   │   └── health.ts
│   ├── services/                  # Business logic
│   │   ├── configurator.ts        # Configuration validation
│   │   ├── pricer.ts              # Pricing calculations
│   │   └── quoter.ts              # Quote generation
│   ├── types/                     # TypeScript types
│   │   └── index.ts
│   ├── schemas/                   # Zod validation schemas
│   │   └── index.ts
│   ├── app.ts                     # Fastify app setup
│   └── index.ts                   # Server entry point
├── tests/                         # Test files
├── Dockerfile                     # Container configuration
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## 🔧 Configuration

All configuration is done through code:

### Adding a New Product

Edit `src/config/products.ts`:

```typescript
export const products: Product[] = [
  {
    id: 'my-new-product',
    name: 'My New Product',
    description: 'Product description',
    basePrice: 100,
    category: 'compute',
    options: [
      {
        id: 'option-1',
        name: 'Option 1',
        description: 'Option description',
        price: 50,
        isRequired: false,
        category: 'upgrades',
      }
    ],
  },
  // ... existing products
];
```

### Adding a Pricing Rule

Edit `src/config/pricing-rules.ts`:

```typescript
export const pricingRules: PricingRule[] = [
  {
    id: 'my-custom-rule',
    name: 'My Custom Discount',
    description: '20% off for special customers',
    type: 'percentage',
    priority: 10,
    condition: (context: PricingContext) => {
      return context.customFields?.specialCustomer === true;
    },
    apply: (price: number) => {
      return price * 0.8; // 20% discount
    },
  },
  // ... existing rules
];
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run dev
```

## 🎯 Why This Stack?

### TypeScript + Node.js + Fastify

1. **Data-as-Code Excellence**
   - Products and pricing rules are TypeScript files
   - Changes are version controlled and code reviewed
   - Type safety prevents configuration errors

2. **Stateless by Design**
   - No database to manage or scale
   - Each request is independent
   - Perfect for containerization and horizontal scaling

3. **Fast Development**
   - Hot reload during development
   - Strong typing catches errors early
   - Rich ecosystem and tooling

4. **Production Ready**
   - Fastify is one of the fastest Node.js frameworks
   - Built-in request validation with Zod
   - Comprehensive error handling

## 🔐 Security

- Input validation using Zod schemas
- No SQL injection (no database!)
- CORS enabled with configuration
- Docker runs as non-root user
- Health checks for monitoring

## 📊 Scalability

This service is designed to scale horizontally:

- **No Shared State** - Each instance is independent
- **Stateless** - No sessions or in-memory state
- **Fast** - Handles thousands of quotes per second
- **Containerized** - Deploy to Kubernetes, ECS, or any container platform

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpq-service
spec:
  replicas: 5  # Scale to 5 instances
  selector:
    matchLabels:
      app: cpq-service
  template:
    metadata:
      labels:
        app: cpq-service
    spec:
      containers:
      - name: cpq-service
        image: cpq-service:latest
        ports:
        - containerPort: 3000
```

## 🔄 CI/CD

The data-as-code approach enables powerful CI/CD workflows:

1. **Code Review** - All pricing changes are reviewed via PRs
2. **Automated Tests** - Tests run on every commit
3. **Version Control** - Full audit trail of all changes
4. **Rollback** - Easy to revert pricing changes via git

## 📈 Monitoring

Built-in health checks for monitoring:

```bash
# Liveness check
curl http://localhost:3000/api/health

# Readiness check
curl http://localhost:3000/api/health/ready
```

Integrate with:
- Kubernetes liveness/readiness probes
- AWS ECS health checks
- Monitoring tools (Datadog, New Relic, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT

## 🙋 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ using TypeScript, Node.js, and Fastify**
