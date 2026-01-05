import { describe, it, expect } from 'vitest';
import { ConfiguratorService } from './configurator.js';

describe('ConfiguratorService', () => {
  const configurator = new ConfiguratorService();

  describe('validateConfiguration', () => {
    it('should validate a valid configuration', () => {
      const result = configurator.validateConfiguration('cloud-server-basic', ['ram-8gb', 'storage-ssd-100gb']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid product ID', () => {
      const result = configurator.validateConfiguration('invalid-product', []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('not found');
    });

    it('should detect conflicting options', () => {
      const result = configurator.validateConfiguration('cloud-server-basic', ['ram-8gb', 'ram-16gb']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('cannot be selected together'))).toBe(true);
    });

    it('should detect invalid option IDs', () => {
      const result = configurator.validateConfiguration('cloud-server-basic', ['invalid-option']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid option'))).toBe(true);
    });

    it('should detect missing dependencies', () => {
      const result = configurator.validateConfiguration('professional-services', ['training-advanced']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('requires'))).toBe(true);
    });
  });

  describe('calculateBasePrice', () => {
    it('should calculate base price with no options', () => {
      const price = configurator.calculateBasePrice({
        productId: 'cloud-server-basic',
        selectedOptions: [],
        quantity: 1,
      });
      expect(price).toBe(50); // Base price
    });

    it('should calculate base price with options', () => {
      const price = configurator.calculateBasePrice({
        productId: 'cloud-server-basic',
        selectedOptions: ['ram-8gb', 'storage-ssd-100gb'], // 20 + 15
        quantity: 1,
      });
      expect(price).toBe(85); // 50 + 20 + 15
    });

    it('should multiply by quantity', () => {
      const price = configurator.calculateBasePrice({
        productId: 'cloud-server-basic',
        selectedOptions: ['ram-8gb'], // 20
        quantity: 3,
      });
      expect(price).toBe(210); // (50 + 20) * 3
    });
  });
});
