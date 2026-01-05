import { Quote, QuoteLineItem, ConfigurationItem } from '../types/index.js';
import { getProductById } from '../config/products.js';
import { ConfiguratorService } from './configurator.js';
import { PricerService } from './pricer.js';
import { randomUUID } from 'crypto';

/**
 * Quoter Service
 *
 * Generates complete quotes with line items.
 */

export class QuoterService {
  private configurator: ConfiguratorService;
  private pricer: PricerService;

  constructor(configurator: ConfiguratorService, pricer: PricerService) {
    this.configurator = configurator;
    this.pricer = pricer;
  }

  /**
   * Generate a complete quote
   */
  generateQuote(
    configurations: ConfigurationItem[],
    customerTier?: string,
    region?: string,
    customFields?: Record<string, unknown>,
    taxRate?: number
  ): Quote {
    // Validate all configurations first
    const validationResults = this.configurator.validateConfigurations(configurations);
    if (!validationResults.isValid) {
      const errors = validationResults.results
        .filter((r) => !r.validation.isValid)
        .map((r) => `${r.productId}: ${r.validation.errors.map((e) => e.message).join(', ')}`)
        .join('; ');
      throw new Error(`Configuration validation failed: ${errors}`);
    }

    // Calculate pricing for all items
    const pricingResults = this.pricer.calculateTotalPrice(
      configurations,
      customerTier,
      region,
      customFields
    );

    // Build line items
    const lineItems: QuoteLineItem[] = configurations.map((config, index) => {
      const product = getProductById(config.productId);
      if (!product) {
        throw new Error(`Product '${config.productId}' not found`);
      }

      const pricingResult = pricingResults.items[index];
      const basePrice = product.basePrice;

      // Get selected options details
      const selectedOptionsDetails = config.selectedOptions.map((optionId) => {
        const option = product.options.find((opt) => opt.id === optionId);
        return {
          id: optionId,
          name: option?.name || optionId,
          price: option?.price || 0,
        };
      });

      // Calculate subtotal (base + options) * quantity
      const optionsTotal = selectedOptionsDetails.reduce((sum, opt) => sum + opt.price, 0);
      const subtotal = (basePrice + optionsTotal) * config.quantity;

      // Map applied rules to discounts
      const discounts = pricingResult.appliedRules.map((rule) => ({
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        amount: rule.discountAmount,
      }));

      return {
        productId: config.productId,
        productName: product.name,
        quantity: config.quantity,
        basePrice,
        selectedOptions: selectedOptionsDetails,
        subtotal,
        discounts,
        total: pricingResult.finalPrice,
      };
    });

    // Calculate totals
    const subtotal = pricingResults.totalBasePrice;
    const totalDiscounts = pricingResults.totalDiscount;
    const preTaxTotal = pricingResults.totalFinalPrice;
    const tax = taxRate ? preTaxTotal * taxRate : undefined;
    const total = tax ? preTaxTotal + tax : preTaxTotal;

    return {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      lineItems,
      subtotal,
      totalDiscounts,
      tax,
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
      metadata: {
        customerTier,
        region,
        taxRate,
        ...customFields,
      },
    };
  }
}

export const quoterService = new QuoterService(
  new ConfiguratorService(),
  new PricerService(new ConfiguratorService())
);
