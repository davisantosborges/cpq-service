import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

describe('Health API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const health = JSON.parse(response.body);
      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeDefined();
      expect(health.uptime).toBeDefined();
      expect(typeof health.uptime).toBe('number');
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health/ready',
      });

      expect(response.statusCode).toBe(200);
      const ready = JSON.parse(response.body);
      expect(ready.ready).toBe(true);
      expect(ready.timestamp).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('should return service info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      const info = JSON.parse(response.body);
      expect(info.name).toBe('CPQ Service');
      expect(info.version).toBe('1.0.0');
      expect(info.documentation).toBe('/documentation');
      expect(info.health).toBe('/api/health');
    });
  });
});
