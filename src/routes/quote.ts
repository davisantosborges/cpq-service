import { FastifyPluginAsync } from 'fastify';
import { configureRequestSchema } from '../schemas/index.js';
import { quoterService } from '../services/quoter.js';

/**
 * Quote Routes
 *
 * POST /api/quote - Generate a quote
 */

export const quoteRoutes: FastifyPluginAsync = async (fastify) => {
  // Generate a quote
  fastify.post('/quote', {
    schema: {
      description: 'Generate a price quote for configured products',
      tags: ['quote'],
      body: {
        type: 'object',
        properties: {
          configurations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                selectedOptions: {
                  type: 'array',
                  items: { type: 'string' },
                  default: [],
                },
                quantity: { type: 'number', default: 1 },
                customizations: { type: 'object' },
              },
              required: ['productId'],
            },
            minItems: 1,
          },
          customerTier: { type: 'string' },
          region: { type: 'string' },
          taxRate: { type: 'number' },
          customFields: { type: 'object' },
        },
        required: ['configurations'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            createdAt: { type: 'string' },
            lineItems: { type: 'array' },
            subtotal: { type: 'number' },
            totalDiscounts: { type: 'number' },
            tax: { type: 'number' },
            total: { type: 'number' },
            metadata: { type: 'object', additionalProperties: true },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const validatedData = configureRequestSchema.parse(request.body);

        const taxRate = (request.body as any).taxRate;

        const quote = quoterService.generateQuote(
          validatedData.configurations,
          validatedData.customerTier,
          validatedData.region,
          validatedData.customFields,
          taxRate
        );

        return reply.send(quote);
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Failed to generate quote',
          details: error instanceof Error ? { stack: error.stack } : undefined,
        });
      }
    },
  });
};
