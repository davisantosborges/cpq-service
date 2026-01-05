import { z } from 'zod';

// Configuration Item Schema
export const configurationItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  selectedOptions: z.array(z.string()).default([]),
  quantity: z.number().int().positive('Quantity must be a positive integer').default(1),
  customizations: z.record(z.string()).optional(),
});

// Configure Request Schema
export const configureRequestSchema = z.object({
  configurations: z
    .array(configurationItemSchema)
    .min(1, 'At least one configuration is required'),
  customerTier: z.string().optional(),
  region: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

// Validate Configuration Request Schema
export const validateConfigurationRequestSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  selectedOptions: z.array(z.string()).default([]),
});

// Export types inferred from schemas
export type ConfigurationItemInput = z.infer<typeof configurationItemSchema>;
export type ConfigureRequestInput = z.infer<typeof configureRequestSchema>;
export type ValidateConfigurationRequestInput = z.infer<
  typeof validateConfigurationRequestSchema
>;
