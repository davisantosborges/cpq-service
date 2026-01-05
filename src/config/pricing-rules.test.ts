import { describe, it, expect } from 'vitest';
import { getApplicableRules, applyPricingRules } from './pricing-rules.js';
import { PricingContext } from '../types/index.js';
import { getProductById } from './products.js';

describe('Pricing Rules', () => {
  describe('getApplicableRules', () => {
    it('should return volume discount rules for quantity >= 5', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 5,
        },
        allConfigurations: [],
      };

      const rules = getApplicableRules(context);
      expect(rules.some((r) => r.id === 'volume-discount-10-percent')).toBe(true);
    });

    it('should return higher volume discount for quantity >= 10', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 10,
        },
        allConfigurations: [],
      };

      const rules = getApplicableRules(context);
      expect(rules.some((r) => r.id === 'volume-discount-20-percent')).toBe(true);
      // Should not include 10% discount when 20% applies
      expect(rules.some((r) => r.id === 'volume-discount-10-percent')).toBe(false);
    });

    it('should return enterprise tier discount', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        allConfigurations: [],
        customerTier: 'enterprise',
      };

      const rules = getApplicableRules(context);
      expect(rules.some((r) => r.id === 'enterprise-tier-discount')).toBe(true);
    });

    it('should return startup tier discount', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        allConfigurations: [],
        customerTier: 'startup',
      };

      const rules = getApplicableRules(context);
      expect(rules.some((r) => r.id === 'startup-tier-discount')).toBe(true);
    });

    it('should return bundle discount when compute + database', () => {
      const product = getProductById('cloud-server-basic')!;
      const allConfigurations = [
        {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        {
          productId: 'database-managed-mysql',
          selectedOptions: [],
          quantity: 1,
        },
      ];

      const context: PricingContext = {
        product,
        configuration: allConfigurations[0],
        allConfigurations,
      };

      const rules = getApplicableRules(context);
      expect(rules.some((r) => r.id === 'bundle-discount-compute-database')).toBe(true);
    });

    it('should return region pricing for EU', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        allConfigurations: [],
        region: 'eu-central',
      };

      const rules = getApplicableRules(context);
      expect(rules.some((r) => r.id === 'region-pricing-eu')).toBe(true);
    });
  });

  describe('applyPricingRules', () => {
    it('should apply no rules when none are applicable', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        allConfigurations: [],
      };

      const result = applyPricingRules(100, context);
      expect(result.finalPrice).toBe(100);
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should apply volume discount (10%)', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 5,
        },
        allConfigurations: [],
      };

      const result = applyPricingRules(100, context);
      expect(result.finalPrice).toBe(90); // 10% off
      expect(result.appliedRules.length).toBeGreaterThan(0);
    });

    it('should apply volume discount (20%)', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 10,
        },
        allConfigurations: [],
      };

      const result = applyPricingRules(100, context);
      expect(result.finalPrice).toBe(80); // 20% off
    });

    it('should apply enterprise tier discount', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        allConfigurations: [],
        customerTier: 'enterprise',
      };

      const result = applyPricingRules(100, context);
      expect(result.finalPrice).toBe(85); // 15% off
    });

    it('should apply EU region premium', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        allConfigurations: [],
        region: 'eu-central',
      };

      const result = applyPricingRules(100, context);
      expect(result.finalPrice).toBe(108); // 8% premium
    });

    it('should never return negative price', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        allConfigurations: [],
      };

      const result = applyPricingRules(5, context);
      expect(result.finalPrice).toBeGreaterThanOrEqual(0);
    });

    it('should apply multiple rules in priority order', () => {
      const product = getProductById('cloud-server-basic')!;
      const context: PricingContext = {
        product,
        configuration: {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 10,
        },
        allConfigurations: [],
        customerTier: 'enterprise',
      };

      const result = applyPricingRules(100, context);
      // Should apply both enterprise discount and volume discount
      expect(result.appliedRules.length).toBeGreaterThan(1);
      expect(result.finalPrice).toBeLessThan(100);
    });
  });
});
