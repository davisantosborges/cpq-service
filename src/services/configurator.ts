import { ConfigurationItem, ValidationResult } from '../types/index.js';
import { getProductById } from '../config/products.js';
import { validateConfiguration } from '../config/configuration-rules.js';

/**
 * Configurator Service
 *
 * Handles product configuration validation and logic.
 */

export class ConfiguratorService {
  /**
   * Validate a single configuration
   */
  validateConfiguration(productId: string, selectedOptions: string[]): ValidationResult {
    return validateConfiguration(productId, selectedOptions);
  }

  /**
   * Validate multiple configurations
   */
  validateConfigurations(configurations: ConfigurationItem[]): {
    isValid: boolean;
    results: Array<{
      productId: string;
      validation: ValidationResult;
    }>;
  } {
    const results = configurations.map((config) => ({
      productId: config.productId,
      validation: this.validateConfiguration(config.productId, config.selectedOptions),
    }));

    const isValid = results.every((result) => result.validation.isValid);

    return { isValid, results };
  }

  /**
   * Get product details
   */
  getProduct(productId: string) {
    return getProductById(productId);
  }

  /**
   * Calculate base price for a configuration (without discounts)
   */
  calculateBasePrice(configuration: ConfigurationItem): number {
    const product = this.getProduct(configuration.productId);
    if (!product) {
      throw new Error(`Product '${configuration.productId}' not found`);
    }

    let total = product.basePrice;

    // Add selected options prices
    for (const optionId of configuration.selectedOptions) {
      const option = product.options.find((opt) => opt.id === optionId);
      if (option) {
        total += option.price;
      }
    }

    // Multiply by quantity
    return total * configuration.quantity;
  }
}

export const configuratorService = new ConfiguratorService();
