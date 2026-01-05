import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Quote API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/quote', () => {
    it('should generate a quote for a single product', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-basic',
              selectedOptions: ['ram-8gb'],
              quantity: 1,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const quote = JSON.parse(response.body);
      expect(quote).toHaveProperty('id');
      expect(quote).toHaveProperty('lineItems');
      expect(quote.lineItems).toHaveLength(1);
      expect(quote.lineItems[0].productId).toBe('cloud-server-basic');
      expect(quote.subtotal).toBe(70); // 50 + 20
    });

    it('should generate a quote with volume discount', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'cloud-server-basic',
              selectedOptions: [],
              quantity: 5,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const quote = JSON.parse(response.body);
      expect(quote.subtotal).toBe(250); // 50 * 5
      expect(quote.totalDiscounts).toBeGreaterThan(0);
      expect(quote.total).toBeLessThan(quote.subtotal);
    });

    it('should generate a quote with customer tier discount', async () => {
      const response = await app.inject({
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
          customerTier: 'enterprise',
        },
      });

      expect(response.statusCode).toBe(200);
      const quote = JSON.parse(response.body);
      expect(quote.totalDiscounts).toBeGreaterThan(0);
      expect(quote.metadata.customerTier).toBe('enterprise');
    });

    it('should reject invalid configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/quote',
        payload: {
          configurations: [
            {
              productId: 'invalid-product',
              selectedOptions: [],
              quantity: 1,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should calculate tax when provided', async () => {
      const response = await app.inject({
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
          taxRate: 0.1, // 10% tax
        },
      });

      expect(response.statusCode).toBe(200);
      const quote = JSON.parse(response.body);
      expect(quote.tax).toBeGreaterThan(0);
      expect(quote.total).toBeGreaterThan(quote.subtotal - quote.totalDiscounts);
    });
  });
});
