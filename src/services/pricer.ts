import { ConfigurationItem, PricingContext } from '../types/index.js';
import { getProductById } from '../config/products.js';
import { applyPricingRules } from '../config/pricing-rules.js';
import { ConfiguratorService } from './configurator.js';

/**
 * Pricer Service
 *
 * Handles pricing calculations with business rules.
 */

export class PricerService {
  private configurator: ConfiguratorService;

  constructor(configurator: ConfiguratorService) {
    this.configurator = configurator;
  }

  /**
   * Calculate price for a single configuration with all applicable discounts
   */
  calculatePrice(
    configuration: ConfigurationItem,
    allConfigurations: ConfigurationItem[],
    customerTier?: string,
    region?: string,
    customFields?: Record<string, unknown>
  ): {
    basePrice: number;
    finalPrice: number;
    appliedRules: Array<{ ruleId: string; ruleName: string; discountAmount: number }>;
  } {
    const product = getProductById(configuration.productId);
    if (!product) {
      throw new Error(`Product '${configuration.productId}' not found`);
    }

    // Calculate base price
    const basePrice = this.configurator.calculateBasePrice(configuration);

    // Build pricing context
    const context: PricingContext = {
      product,
      configuration,
      allConfigurations,
      customerTier,
      region,
      customFields,
    };

    // Apply pricing rules
    const { finalPrice, appliedRules } = applyPricingRules(basePrice, context);

    return {
      basePrice,
      finalPrice,
      appliedRules,
    };
  }

  /**
   * Calculate total price for multiple configurations
   */
  calculateTotalPrice(
    configurations: ConfigurationItem[],
    customerTier?: string,
    region?: string,
    customFields?: Record<string, unknown>
  ): {
    items: Array<{
      productId: string;
      basePrice: number;
      finalPrice: number;
      appliedRules: Array<{ ruleId: string; ruleName: string; discountAmount: number }>;
    }>;
    totalBasePrice: number;
    totalFinalPrice: number;
    totalDiscount: number;
  } {
    const items = configurations.map((config) => {
      const pricing = this.calculatePrice(
        config,
        configurations,
        customerTier,
        region,
        customFields
      );
      return {
        productId: config.productId,
        basePrice: pricing.basePrice,
        finalPrice: pricing.finalPrice,
        appliedRules: pricing.appliedRules,
      };
    });

    const totalBasePrice = items.reduce((sum, item) => sum + item.basePrice, 0);
    const totalFinalPrice = items.reduce((sum, item) => sum + item.finalPrice, 0);
    const totalDiscount = totalBasePrice - totalFinalPrice;

    return {
      items,
      totalBasePrice,
      totalFinalPrice,
      totalDiscount,
    };
  }
}

export const pricerService = new PricerService(new ConfiguratorService());
