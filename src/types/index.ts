// Product Configuration Types
export interface ProductOption {
  id: string;
  name: string;
  description: string;
  price: number;
  isRequired: boolean;
  category?: string;
  dependencies?: string[]; // IDs of options that must be selected
  conflicts?: string[]; // IDs of options that cannot be selected together
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  options: ProductOption[];
  metadata?: Record<string, unknown>;
}

// Pricing Rule Types
export type PricingRuleType = 'percentage' | 'fixed' | 'tiered' | 'bundle';

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: PricingRuleType;
  condition: (context: PricingContext) => boolean;
  apply: (price: number, context: PricingContext) => number;
  priority: number; // Lower number = higher priority
}

export interface TieredPricing {
  minQuantity: number;
  maxQuantity?: number;
  discount: number; // Percentage or fixed amount
}

export interface BundleDiscount {
  productIds: string[];
  discountPercentage: number;
}

// Configuration and Quote Types
export interface ConfigurationItem {
  productId: string;
  selectedOptions: string[];
  quantity: number;
  customizations?: Record<string, string>;
}

export interface QuoteLineItem {
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number;
  selectedOptions: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  subtotal: number;
  discounts: Array<{
    ruleId: string;
    ruleName: string;
    amount: number;
  }>;
  total: number;
}

export interface Quote {
  id: string;
  createdAt: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  totalDiscounts: number;
  tax?: number;
  total: number;
  metadata?: Record<string, unknown>;
}

// Pricing Context
export interface PricingContext {
  product: Product;
  configuration: ConfigurationItem;
  allConfigurations: ConfigurationItem[];
  customerTier?: string;
  region?: string;
  customFields?: Record<string, unknown>;
}

// API Request/Response Types
export interface ConfigureRequest {
  configurations: ConfigurationItem[];
  customerTier?: string;
  region?: string;
  customFields?: Record<string, unknown>;
}

export interface ValidateConfigurationRequest {
  productId: string;
  selectedOptions: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
}

// Error Types
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class PricingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PricingError';
  }
}
