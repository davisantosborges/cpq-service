import { Product, ProductOption, ValidationResult } from '../types/index.js';
import { getProductById } from './products.js';

/**
 * Configuration Rules - Data as Code
 *
 * Validation logic for product configurations.
 */

/**
 * Validate a product configuration
 */
export function validateConfiguration(
  productId: string,
  selectedOptions: string[]
): ValidationResult {
  const product = getProductById(productId);

  if (!product) {
    return {
      isValid: false,
      errors: [
        {
          field: 'productId',
          message: `Product '${productId}' not found`,
        },
      ],
    };
  }

  const errors: Array<{ field: string; message: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];

  // Check for required options
  const requiredOptions = product.options.filter((opt) => opt.isRequired);
  for (const requiredOption of requiredOptions) {
    if (!selectedOptions.includes(requiredOption.id)) {
      errors.push({
        field: 'selectedOptions',
        message: `Required option '${requiredOption.name}' is not selected`,
      });
    }
  }

  // Check for invalid option IDs
  const validOptionIds = new Set(product.options.map((opt) => opt.id));
  for (const selectedOption of selectedOptions) {
    if (!validOptionIds.has(selectedOption)) {
      errors.push({
        field: 'selectedOptions',
        message: `Invalid option '${selectedOption}' for product '${product.name}'`,
      });
    }
  }

  // Check for conflicting options
  const selectedOptionsSet = new Set(selectedOptions);
  for (const selectedOption of selectedOptions) {
    const option = product.options.find((opt) => opt.id === selectedOption);
    if (option?.conflicts) {
      for (const conflictingOption of option.conflicts) {
        if (selectedOptionsSet.has(conflictingOption)) {
          const conflictOption = product.options.find((opt) => opt.id === conflictingOption);
          errors.push({
            field: 'selectedOptions',
            message: `Options '${option.name}' and '${conflictOption?.name}' cannot be selected together`,
          });
        }
      }
    }
  }

  // Check for missing dependencies
  for (const selectedOption of selectedOptions) {
    const option = product.options.find((opt) => opt.id === selectedOption);
    if (option?.dependencies) {
      for (const dependency of option.dependencies) {
        if (!selectedOptionsSet.has(dependency)) {
          const dependencyOption = product.options.find((opt) => opt.id === dependency);
          errors.push({
            field: 'selectedOptions',
            message: `Option '${option.name}' requires '${dependencyOption?.name}' to be selected`,
          });
        }
      }
    }
  }

  // Add warnings for recommended options
  if (product.id.startsWith('cloud-server-') && !selectedOptions.includes('backup-daily')) {
    warnings.push({
      field: 'selectedOptions',
      message: 'Daily backups are recommended for production workloads',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Get option by ID from a product
 */
export function getOptionById(product: Product, optionId: string): ProductOption | undefined {
  return product.options.find((opt) => opt.id === optionId);
}

/**
 * Check if two options conflict
 */
export function hasConflict(
  product: Product,
  option1Id: string,
  option2Id: string
): boolean {
  const option1 = getOptionById(product, option1Id);
  if (!option1) return false;

  return option1.conflicts?.includes(option2Id) ?? false;
}

/**
 * Get all dependencies for an option (recursive)
 */
export function getAllDependencies(product: Product, optionId: string): string[] {
  const option = getOptionById(product, optionId);
  if (!option?.dependencies) return [];

  const allDeps = new Set<string>();
  const toProcess = [...option.dependencies];

  while (toProcess.length > 0) {
    const dep = toProcess.pop()!;
    if (!allDeps.has(dep)) {
      allDeps.add(dep);
      const depOption = getOptionById(product, dep);
      if (depOption?.dependencies) {
        toProcess.push(...depOption.dependencies);
      }
    }
  }

  return Array.from(allDeps);
}
