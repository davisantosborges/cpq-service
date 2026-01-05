import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Configure API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/configure/validate', () => {
    it('should validate a valid configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/configure/validate',
        payload: {
          productId: 'cloud-server-basic',
          selectedOptions: ['ram-8gb', 'storage-ssd-100gb'],
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect conflicting options', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/configure/validate',
        payload: {
          productId: 'cloud-server-basic',
          selectedOptions: ['ram-8gb', 'ram-16gb'], // These conflict
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('cannot be selected together');
    });

    it('should detect invalid options', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/configure/validate',
        payload: {
          productId: 'cloud-server-basic',
          selectedOptions: ['invalid-option'],
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: any) => e.message.includes('Invalid option'))).toBe(true);
    });

    it('should detect missing dependencies', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/configure/validate',
        payload: {
          productId: 'professional-services',
          selectedOptions: ['training-advanced'], // Requires training-basic
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: any) => e.message.includes('requires'))).toBe(true);
    });

    it('should return error for invalid product', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/configure/validate',
        payload: {
          productId: 'invalid-product',
          selectedOptions: [],
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('not found');
    });

    it('should include warnings when applicable', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/configure/validate',
        payload: {
          productId: 'cloud-server-basic',
          selectedOptions: ['ram-8gb'], // No backup
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      if (result.warnings) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should reject request with missing productId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/configure/validate',
        payload: {
          selectedOptions: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
