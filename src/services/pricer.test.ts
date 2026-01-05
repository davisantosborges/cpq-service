import { describe, it, expect } from 'vitest';
import { PricerService } from './pricer.js';
import { ConfiguratorService } from './configurator.js';

describe('PricerService', () => {
  const pricer = new PricerService(new ConfiguratorService());

  describe('calculatePrice', () => {
    it('should calculate price without discounts', () => {
      const result = pricer.calculatePrice(
        {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        []
      );
      expect(result.basePrice).toBe(50);
      expect(result.finalPrice).toBe(50);
      expect(result.appliedRules).toHaveLength(0);
    });

    it('should apply volume discount (10%)', () => {
      const result = pricer.calculatePrice(
        {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 5,
        },
        []
      );
      expect(result.basePrice).toBe(250); // 50 * 5
      expect(result.finalPrice).toBe(225); // 250 * 0.9
      expect(result.appliedRules.some(r => r.ruleId === 'volume-discount-10-percent')).toBe(true);
    });

    it('should apply volume discount (20%)', () => {
      const result = pricer.calculatePrice(
        {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 10,
        },
        []
      );
      expect(result.basePrice).toBe(500); // 50 * 10
      expect(result.finalPrice).toBe(400); // 500 * 0.8
      expect(result.appliedRules.some(r => r.ruleId === 'volume-discount-20-percent')).toBe(true);
    });

    it('should apply customer tier discount', () => {
      const result = pricer.calculatePrice(
        {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        [],
        'enterprise'
      );
      expect(result.basePrice).toBe(50);
      expect(result.finalPrice).toBe(42.5); // 50 * 0.85
      expect(result.appliedRules.some(r => r.ruleId === 'enterprise-tier-discount')).toBe(true);
    });

    it('should apply bundle discount', () => {
      const configurations = [
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

      const result = pricer.calculatePrice(configurations[0], configurations);
      expect(result.appliedRules.some(r => r.ruleId === 'bundle-discount-compute-database')).toBe(true);
    });

    it('should apply region pricing', () => {
      const result = pricer.calculatePrice(
        {
          productId: 'cloud-server-basic',
          selectedOptions: [],
          quantity: 1,
        },
        [],
        undefined,
        'eu-central'
      );
      expect(result.finalPrice).toBe(54); // 50 * 1.08
      expect(result.appliedRules.some(r => r.ruleId === 'region-pricing-eu')).toBe(true);
    });
  });

  describe('calculateTotalPrice', () => {
    it('should calculate total for multiple configurations', () => {
      const configurations = [
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

      const result = pricer.calculateTotalPrice(configurations);
      expect(result.totalBasePrice).toBe(130); // 50 + 80
      expect(result.totalDiscount).toBeGreaterThan(0); // Bundle discount applied
    });
  });
});
