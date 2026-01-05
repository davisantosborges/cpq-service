import { FastifyPluginAsync } from 'fastify';
import { validateConfigurationRequestSchema } from '../schemas/index.js';
import { configuratorService } from '../services/configurator.js';

/**
 * Configuration Routes
 *
 * POST /api/configure/validate - Validate a configuration
 */

export const configureRoutes: FastifyPluginAsync = async (fastify) => {
  // Validate a configuration
  fastify.post('/configure/validate', {
    schema: {
      description: 'Validate a product configuration',
      tags: ['configure'],
      body: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          selectedOptions: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        required: ['productId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
            warnings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const validatedData = validateConfigurationRequestSchema.parse(request.body);
        const result = configuratorService.validateConfiguration(
          validatedData.productId,
          validatedData.selectedOptions
        );
        return reply.send(result);
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Invalid request',
        });
      }
    },
  });
};
