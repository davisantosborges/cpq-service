import { FastifyPluginAsync } from 'fastify';
import { products, getProductById, getProductsByCategory, getCategories } from '../config/products.js';

/**
 * Product Routes
 *
 * GET /api/products - List all products
 * GET /api/products/:id - Get product by ID
 * GET /api/products/category/:category - Get products by category
 * GET /api/products/categories - Get all categories
 */

export const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // List all products
  fastify.get('/products', {
    schema: {
      description: 'Get all available products',
      tags: ['products'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              basePrice: { type: 'number' },
              category: { type: 'string' },
              options: { type: 'array' },
              metadata: { type: 'object' },
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      return reply.send(products);
    },
  });

  // Get product by ID
  fastify.get<{ Params: { id: string } }>('/products/:id', {
    schema: {
      description: 'Get a product by ID',
      tags: ['products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            basePrice: { type: 'number' },
            category: { type: 'string' },
            options: { type: 'array' },
            metadata: { type: 'object', additionalProperties: true },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const product = getProductById(request.params.id);
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      return reply.send(product);
    },
  });

  // Get products by category
  fastify.get<{ Params: { category: string } }>('/products/category/:category', {
    schema: {
      description: 'Get all products in a category',
      tags: ['products'],
      params: {
        type: 'object',
        properties: {
          category: { type: 'string' },
        },
        required: ['category'],
      },
      response: {
        200: {
          type: 'array',
        },
      },
    },
    handler: async (request, reply) => {
      const categoryProducts = getProductsByCategory(request.params.category);
      return reply.send(categoryProducts);
    },
  });

  // Get all categories
  fastify.get('/categories', {
    schema: {
      description: 'Get all product categories',
      tags: ['products'],
      response: {
        200: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    handler: async (_request, reply) => {
      const categories = getCategories();
      return reply.send(categories);
    },
  });
};
