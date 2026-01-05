import { PricingRule, PricingContext } from '../types/index.js';

/**
 * Pricing Rules - Data as Code
 *
 * All pricing rules are defined here as TypeScript functions.
 * Rules are evaluated in priority order (lower number = higher priority).
 */

export const pricingRules: PricingRule[] = [
  {
    id: 'volume-discount-10-percent',
    name: 'Volume Discount - 10%',
    description: '10% discount for quantities of 5 or more',
    type: 'percentage',
    priority: 10,
    condition: (context: PricingContext) => {
      return context.configuration.quantity >= 5 && context.configuration.quantity < 10;
    },
    apply: (price: number, _context: PricingContext) => {
      return price * 0.9; // 10% discount
    },
  },
  {
    id: 'volume-discount-20-percent',
    name: 'Volume Discount - 20%',
    description: '20% discount for quantities of 10 or more',
    type: 'percentage',
    priority: 9, // Higher priority than 10% discount
    condition: (context: PricingContext) => {
      return context.configuration.quantity >= 10;
    },
    apply: (price: number, _context: PricingContext) => {
      return price * 0.8; // 20% discount
    },
  },
  {
    id: 'enterprise-tier-discount',
    name: 'Enterprise Tier Discount',
    description: '15% discount for enterprise customers',
    type: 'percentage',
    priority: 5,
    condition: (context: PricingContext) => {
      return context.customerTier === 'enterprise';
    },
    apply: (price: number, _context: PricingContext) => {
      return price * 0.85; // 15% discount
    },
  },
  {
    id: 'startup-tier-discount',
    name: 'Startup Tier Discount',
    description: '25% discount for startup customers',
    type: 'percentage',
    priority: 5,
    condition: (context: PricingContext) => {
      return context.customerTier === 'startup';
    },
    apply: (price: number, _context: PricingContext) => {
      return price * 0.75; // 25% discount
    },
  },
  {
    id: 'bundle-discount-compute-database',
    name: 'Compute + Database Bundle Discount',
    description: '10% discount when purchasing cloud server with managed database',
    type: 'bundle',
    priority: 15,
    condition: (context: PricingContext) => {
      const hasCloudServer = context.allConfigurations.some((c) =>
        c.productId.startsWith('cloud-server-')
      );
      const hasDatabase = context.allConfigurations.some((c) =>
        c.productId.startsWith('database-')
      );
      return hasCloudServer && hasDatabase;
    },
    apply: (price: number, _context: PricingContext) => {
      return price * 0.9; // 10% bundle discount
    },
  },
  {
    id: 'premium-support-bundle',
    name: 'Premium Support Bundle',
    description: 'Free premium support with Cloud Server Pro and 2+ other products',
    type: 'bundle',
    priority: 8,
    condition: (context: PricingContext) => {
      const hasCloudServerPro = context.allConfigurations.some(
        (c) => c.productId === 'cloud-server-pro'
      );
      const hasPremiumSupport = context.configuration.selectedOptions.includes('support-premium');
      const totalProducts = context.allConfigurations.length;

      return hasCloudServerPro && hasPremiumSupport && totalProducts >= 3;
    },
    apply: (price: number, context: PricingContext) => {
      // Find the premium support option price
      const premiumSupportOption = context.product.options.find(
        (opt) => opt.id === 'support-premium'
      );
      if (premiumSupportOption) {
        return price - premiumSupportOption.price; // Free premium support
      }
      return price;
    },
  },
  {
    id: 'region-pricing-us-west',
    name: 'US West Region Standard Pricing',
    description: 'Standard pricing for US West region',
    type: 'fixed',
    priority: 20,
    condition: (context: PricingContext) => {
      return context.region === 'us-west';
    },
    apply: (price: number, _context: PricingContext) => {
      return price; // No change for standard region
    },
  },
  {
    id: 'region-pricing-eu',
    name: 'EU Region Premium',
    description: '8% premium for EU regions due to compliance requirements',
    type: 'percentage',
    priority: 20,
    condition: (context: PricingContext) => {
      return context.region === 'eu-central' || context.region === 'eu-west';
    },
    apply: (price: number, _context: PricingContext) => {
      return price * 1.08; // 8% premium
    },
  },
  {
    id: 'region-pricing-apac',
    name: 'APAC Region Premium',
    description: '5% premium for APAC regions',
    type: 'percentage',
    priority: 20,
    condition: (context: PricingContext) => {
      return context.region === 'apac-east' || context.region === 'apac-south';
    },
    apply: (price: number, _context: PricingContext) => {
      return price * 1.05; // 5% premium
    },
  },
  {
    id: 'professional-services-early-bird',
    name: 'Professional Services Early Bird',
    description: '$1000 discount on professional services package',
    type: 'fixed',
    priority: 12,
    condition: (context: PricingContext) => {
      return (
        context.product.id === 'professional-services' &&
        context.customFields?.earlyBird === true
      );
    },
    apply: (price: number, _context: PricingContext) => {
      return price - 1000; // $1000 flat discount
    },
  },
];

/**
 * Get all applicable pricing rules for a given context
 */
export function getApplicableRules(context: PricingContext): PricingRule[] {
  return pricingRules
    .filter((rule) => rule.condition(context))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Apply all applicable pricing rules to a price
 */
export function applyPricingRules(basePrice: number, context: PricingContext): {
  finalPrice: number;
  appliedRules: Array<{ ruleId: string; ruleName: string; discountAmount: number }>;
} {
  const applicableRules = getApplicableRules(context);
  let currentPrice = basePrice;
  const appliedRules: Array<{ ruleId: string; ruleName: string; discountAmount: number }> = [];

  for (const rule of applicableRules) {
    const previousPrice = currentPrice;
    currentPrice = rule.apply(currentPrice, context);
    const discountAmount = previousPrice - currentPrice;

    if (discountAmount !== 0) {
      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        discountAmount,
      });
    }
  }

  return {
    finalPrice: Math.max(0, currentPrice), // Price cannot be negative
    appliedRules,
  };
}
