import { FastifyPluginAsync } from 'fastify';

/**
 * Health Check Routes
 *
 * GET /health - Health check endpoint
 * GET /health/ready - Readiness check
 */

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // Health check
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      return reply.send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    },
  });

  // Readiness check
  fastify.get('/health/ready', {
    schema: {
      description: 'Readiness check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      return reply.send({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    },
  });
};
