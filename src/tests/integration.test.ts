import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('End-to-End Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Quote Flow', () => {
    it('should handle complete quote generation flow', async () => {
      // 1. Get available products
      const productsResponse = await app.inject({
        method: 'GET',
        url: '/api/products',
      });
      expect(productsResponse.statusCode).toBe(200);
      const products = JSON.parse(productsResponse.body);
      expect(products.length).toBeGreaterThan(0);

      // 2. Get specific product details
      const productResponse = await app.inject({
        method: 'GET',
        url: '/api/products/cloud-server-basic',
      });
      expect(productResponse.statusCode).toBe(200);
      const product = JSON.parse(productResponse.body);

      // 3. Validate configuration before quoting
      const validateResponse = await app.inject({
        method: 'POST',
        url: '/api/configure/validate',
        payload: {
          productId: 'cloud-server-basic',
          selectedOptions: ['ram-8gb', 'backup-daily'],
        },
      });
      expect(validateResponse.statusCode).toBe(200);
      const validation = JSON.parse(validateResponse.body);
      expect(validation.isValid).toBe(true);

      // 4. Generate quote
      const quoteResponse = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-basic',
              selectedOptions: ['ram-8gb', 'backup-daily'],
              quantity: 1,
            },
          ],
        },
      });
      expect(quoteResponse.statusCode).toBe(200);
      const quote = JSON.parse(quoteResponse.body);
      expect(quote).toHaveProperty('id');
      expect(quote).toHaveProperty('lineItems');
      expect(quote.lineItems).toHaveLength(1);
      expect(quote.lineItems[0].selectedOptions).toHaveLength(2);
    });

    it('should apply volume discount in quote', async () => {
      const quoteResponse = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-basic',
              selectedOptions: [],
              quantity: 10, // Should trigger 20% volume discount
            },
          ],
        },
      });

      expect(quoteResponse.statusCode).toBe(200);
      const quote = JSON.parse(quoteResponse.body);
      expect(quote.totalDiscounts).toBeGreaterThan(0);
      expect(quote.lineItems[0].discounts.length).toBeGreaterThan(0);
    });

    it('should apply customer tier discount', async () => {
      const quoteResponse = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-pro',
              selectedOptions: [],
              quantity: 1,
            },
          ],
          customerTier: 'startup', // Should trigger 25% startup discount
        },
      });

      expect(quoteResponse.statusCode).toBe(200);
      const quote = JSON.parse(quoteResponse.body);
      expect(quote.totalDiscounts).toBeGreaterThan(0);
      expect(quote.metadata.customerTier).toBe('startup');
    });

    it('should apply bundle discount for multiple products', async () => {
      const quoteResponse = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-basic',
              selectedOptions: [],
              quantity: 1,
            },
            {
              productId: 'database-managed-mysql',
              selectedOptions: [],
              quantity: 1,
            },
          ],
        },
      });

      expect(quoteResponse.statusCode).toBe(200);
      const quote = JSON.parse(quoteResponse.body);
      expect(quote.lineItems).toHaveLength(2);
      // Bundle discount should be applied
      const hasBundleDiscount = quote.lineItems.some((item: any) =>
        item.discounts.some((d: any) => d.ruleId === 'bundle-discount-compute-database')
      );
      expect(hasBundleDiscount).toBe(true);
    });

    it('should calculate tax correctly', async () => {
      const quoteResponse = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-basic',
              selectedOptions: [],
              quantity: 1,
            },
          ],
          taxRate: 0.15, // 15% tax
        },
      });

      expect(quoteResponse.statusCode).toBe(200);
      const quote = JSON.parse(quoteResponse.body);
      expect(quote.tax).toBeDefined();
      expect(quote.tax).toBeGreaterThan(0);
      // Total should include tax
      expect(quote.total).toBeGreaterThan(quote.subtotal - quote.totalDiscounts);
    });

    it('should reject quote with invalid configuration', async () => {
      const quoteResponse = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-basic',
              selectedOptions: ['ram-8gb', 'ram-16gb'], // Conflicting options
              quantity: 1,
            },
          ],
        },
      });

      expect(quoteResponse.statusCode).toBe(400);
    });

    it('should handle complex multi-product quote', async () => {
      const quoteResponse = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-pro',
              selectedOptions: ['ram-32gb', 'storage-nvme-1tb', 'support-premium'],
              quantity: 2,
            },
            {
              productId: 'database-managed-mysql',
              selectedOptions: ['db-storage-200gb', 'read-replicas-2'],
              quantity: 1,
            },
            {
              productId: 'professional-services',
              selectedOptions: ['architecture-review', 'migration-support'],
              quantity: 1,
            },
          ],
          customerTier: 'enterprise',
          region: 'us-west',
          taxRate: 0.08,
        },
      });

      expect(quoteResponse.statusCode).toBe(200);
      const quote = JSON.parse(quoteResponse.body);
      expect(quote.lineItems).toHaveLength(3);
      expect(quote.subtotal).toBeGreaterThan(0);
      expect(quote.totalDiscounts).toBeGreaterThan(0);
      expect(quote.tax).toBeGreaterThan(0);
      expect(quote.total).toBeGreaterThan(0);

      // Check premium support bundle discount (3+ products with cloud-server-pro)
      const hasBundle = quote.lineItems.some((item: any) =>
        item.discounts.some((d: any) => d.ruleId === 'premium-support-bundle')
      );
      expect(hasBundle).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: 'invalid json',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          // Missing configurations
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle empty configurations array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Service Reliability', () => {
    it('should be stateless - same input produces same output', async () => {
      const payload = {
        configurations: [
          {
            productId: 'cloud-server-basic',
            selectedOptions: ['ram-8gb'],
            quantity: 5,
          },
        ],
        customerTier: 'enterprise',
      };

      const response1 = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload,
      });

      const response2 = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload,
      });

      const quote1 = JSON.parse(response1.body);
      const quote2 = JSON.parse(response2.body);

      // IDs will be different, but pricing should be identical
      expect(quote1.subtotal).toBe(quote2.subtotal);
      expect(quote1.totalDiscounts).toBe(quote2.totalDiscounts);
      expect(quote1.total).toBe(quote2.total);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        app.inject({
          method: 'POST',
          url: '/api/quote',
          payload: {
            configurations: [
              {
                productId: 'cloud-server-basic',
                selectedOptions: [],
                quantity: i + 1,
              },
            ],
          },
        })
      );

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });
    });
  });
});
