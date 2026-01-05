import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { productsRoutes } from './routes/products.js';
import { configureRoutes } from './routes/configure.js';
import { quoteRoutes } from './routes/quote.js';
import { healthRoutes } from './routes/health.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
  });

  // Register Swagger for API documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'CPQ Service API',
        description: 'Stateless RESTful CPQ (Configure, Price, Quote) service with data-as-code',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'products', description: 'Product catalog endpoints' },
        { name: 'configure', description: 'Configuration validation endpoints' },
        { name: 'quote', description: 'Quote generation endpoints' },
        { name: 'health', description: 'Health check endpoints' },
      ],
    },
  });

  // Register Swagger UI
  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(productsRoutes, { prefix: '/api' });
  await fastify.register(configureRoutes, { prefix: '/api' });
  await fastify.register(quoteRoutes, { prefix: '/api' });

  // Root endpoint
  fastify.get('/', async (_request, reply) => {
    return reply.send({
      name: 'CPQ Service',
      version: '1.0.0',
      description: 'Stateless RESTful CPQ (Configure, Price, Quote) service',
      documentation: '/documentation',
      health: '/api/health',
    });
  });

  return fastify;
}
