import { describe, it, expect } from 'vitest';
import { validateConfiguration, getAllDependencies } from './configuration-rules.js';
import { getProductById } from './products.js';

describe('Configuration Rules', () => {
  describe('validateConfiguration', () => {
    it('should validate configuration with no options', () => {
      const result = validateConfiguration('cloud-server-basic', []);
      expect(result.isValid).toBe(true);
    });

    it('should validate configuration with valid options', () => {
      const result = validateConfiguration('cloud-server-basic', [
        'ram-8gb',
        'storage-ssd-100gb',
        'backup-daily',
      ]);
      expect(result.isValid).toBe(true);
    });

    it('should reject configuration with conflicting options', () => {
      const result = validateConfiguration('cloud-server-basic', ['ram-8gb', 'ram-16gb']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('cannot be selected together'))).toBe(
        true
      );
    });

    it('should reject configuration with conflicting storage options', () => {
      const result = validateConfiguration('cloud-server-basic', [
        'storage-ssd-100gb',
        'storage-ssd-500gb',
      ]);
      expect(result.isValid).toBe(false);
    });

    it('should reject configuration with invalid options', () => {
      const result = validateConfiguration('cloud-server-basic', ['invalid-option']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Invalid option'))).toBe(true);
    });

    it('should reject configuration with missing dependencies', () => {
      const result = validateConfiguration('professional-services', ['training-advanced']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('requires'))).toBe(true);
    });

    it('should accept configuration when dependencies are satisfied', () => {
      const result = validateConfiguration('professional-services', [
        'training-basic',
        'training-advanced',
      ]);
      expect(result.isValid).toBe(true);
    });

    it('should return warning for cloud server without backups', () => {
      const result = validateConfiguration('cloud-server-basic', ['ram-8gb']);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });

    it('should reject invalid product ID', () => {
      const result = validateConfiguration('invalid-product', []);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('not found');
    });
  });

  describe('getAllDependencies', () => {
    it('should return empty array for option with no dependencies', () => {
      const product = getProductById('cloud-server-basic')!;
      const deps = getAllDependencies(product, 'ram-8gb');
      expect(deps).toHaveLength(0);
    });

    it('should return direct dependencies', () => {
      const product = getProductById('professional-services')!;
      const deps = getAllDependencies(product, 'training-advanced');
      expect(deps).toContain('training-basic');
    });

    it('should return empty array for non-existent option', () => {
      const product = getProductById('cloud-server-basic')!;
      const deps = getAllDependencies(product, 'non-existent');
      expect(deps).toHaveLength(0);
    });
  });
});
