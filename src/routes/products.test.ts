import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Products API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products',
      });

      expect(response.statusCode).toBe(200);
      const products = JSON.parse(response.body);
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
      expect(products[0]).toHaveProperty('basePrice');
      expect(products[0]).toHaveProperty('category');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a specific product', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/cloud-server-basic',
      });

      expect(response.statusCode).toBe(200);
      const product = JSON.parse(response.body);
      expect(product.id).toBe('cloud-server-basic');
      expect(product.name).toBe('Cloud Server - Basic');
      expect(product.basePrice).toBe(50);
      expect(product.options).toBeDefined();
      expect(Array.isArray(product.options)).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/non-existent-product',
      });

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.body);
      expect(error.error).toBe('Product not found');
    });
  });

  describe('GET /api/products/category/:category', () => {
    it('should return products in a category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/category/compute',
      });

      expect(response.statusCode).toBe(200);
      const products = JSON.parse(response.body);
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      products.forEach((product: any) => {
        expect(product.category).toBe('compute');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/category/non-existent',
      });

      expect(response.statusCode).toBe(200);
      const products = JSON.parse(response.body);
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/categories',
      });

      expect(response.statusCode).toBe(200);
      const categories = JSON.parse(response.body);
      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain('compute');
      expect(categories).toContain('database');
      expect(categories).toContain('services');
    });
  });
});
