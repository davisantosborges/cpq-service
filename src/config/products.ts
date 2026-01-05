import { Product } from '../types/index.js';

/**
 * Product Catalog - Data as Code
 *
 * All products are defined here in TypeScript.
 * Changes to products are versioned in git and reviewed through PRs.
 */

export const products: Product[] = [
  {
    id: 'cloud-server-basic',
    name: 'Cloud Server - Basic',
    description: 'Entry-level cloud server for small applications',
    basePrice: 50,
    category: 'compute',
    options: [
      {
        id: 'ram-8gb',
        name: '8GB RAM Upgrade',
        description: 'Upgrade from 4GB to 8GB RAM',
        price: 20,
        isRequired: false,
        category: 'memory',
      },
      {
        id: 'ram-16gb',
        name: '16GB RAM Upgrade',
        description: 'Upgrade from 4GB to 16GB RAM',
        price: 50,
        isRequired: false,
        category: 'memory',
        conflicts: ['ram-8gb'],
      },
      {
        id: 'storage-ssd-100gb',
        name: '100GB SSD Storage',
        description: 'Add 100GB SSD storage',
        price: 15,
        isRequired: false,
        category: 'storage',
      },
      {
        id: 'storage-ssd-500gb',
        name: '500GB SSD Storage',
        description: 'Add 500GB SSD storage',
        price: 60,
        isRequired: false,
        category: 'storage',
        conflicts: ['storage-ssd-100gb'],
      },
      {
        id: 'backup-daily',
        name: 'Daily Backups',
        description: 'Automated daily backups with 30-day retention',
        price: 25,
        isRequired: false,
        category: 'services',
      },
      {
        id: 'monitoring-basic',
        name: 'Basic Monitoring',
        description: 'CPU, Memory, and Disk monitoring with alerts',
        price: 10,
        isRequired: false,
        category: 'services',
      },
    ],
    metadata: {
      cpu: '2 vCPU',
      baseRam: '4GB',
      baseStorage: '50GB SSD',
    },
  },
  {
    id: 'cloud-server-pro',
    name: 'Cloud Server - Professional',
    description: 'High-performance cloud server for production workloads',
    basePrice: 150,
    category: 'compute',
    options: [
      {
        id: 'ram-32gb',
        name: '32GB RAM Upgrade',
        description: 'Upgrade from 16GB to 32GB RAM',
        price: 80,
        isRequired: false,
        category: 'memory',
      },
      {
        id: 'ram-64gb',
        name: '64GB RAM Upgrade',
        description: 'Upgrade from 16GB to 64GB RAM',
        price: 180,
        isRequired: false,
        category: 'memory',
        conflicts: ['ram-32gb'],
      },
      {
        id: 'storage-nvme-1tb',
        name: '1TB NVMe Storage',
        description: 'Add 1TB ultra-fast NVMe storage',
        price: 120,
        isRequired: false,
        category: 'storage',
      },
      {
        id: 'load-balancer',
        name: 'Load Balancer',
        description: 'Managed load balancer for high availability',
        price: 50,
        isRequired: false,
        category: 'services',
      },
      {
        id: 'cdn',
        name: 'Global CDN',
        description: 'Content delivery network with edge caching',
        price: 75,
        isRequired: false,
        category: 'services',
      },
      {
        id: 'support-premium',
        name: 'Premium Support',
        description: '24/7 premium support with 1-hour response SLA',
        price: 200,
        isRequired: false,
        category: 'support',
      },
    ],
    metadata: {
      cpu: '8 vCPU',
      baseRam: '16GB',
      baseStorage: '200GB NVMe',
    },
  },
  {
    id: 'database-managed-mysql',
    name: 'Managed MySQL Database',
    description: 'Fully managed MySQL database with automatic backups',
    basePrice: 80,
    category: 'database',
    options: [
      {
        id: 'db-storage-50gb',
        name: '50GB Database Storage',
        description: 'Add 50GB of database storage',
        price: 20,
        isRequired: false,
        category: 'storage',
      },
      {
        id: 'db-storage-200gb',
        name: '200GB Database Storage',
        description: 'Add 200GB of database storage',
        price: 70,
        isRequired: false,
        category: 'storage',
        conflicts: ['db-storage-50gb'],
      },
      {
        id: 'read-replicas-2',
        name: '2 Read Replicas',
        description: 'Add 2 read replicas for scaling reads',
        price: 100,
        isRequired: false,
        category: 'performance',
      },
      {
        id: 'point-in-time-recovery',
        name: 'Point-in-Time Recovery',
        description: 'Restore database to any point in the last 35 days',
        price: 40,
        isRequired: false,
        category: 'services',
      },
    ],
    metadata: {
      engine: 'MySQL 8.0',
      baseStorage: '20GB',
      backupRetention: '7 days',
    },
  },
  {
    id: 'professional-services',
    name: 'Professional Services Package',
    description: 'Expert consulting and implementation services',
    basePrice: 5000,
    category: 'services',
    options: [
      {
        id: 'architecture-review',
        name: 'Architecture Review',
        description: 'Comprehensive architecture review and recommendations',
        price: 2000,
        isRequired: false,
        category: 'consulting',
      },
      {
        id: 'migration-support',
        name: 'Migration Support',
        description: 'Hands-on support for migrating workloads',
        price: 3000,
        isRequired: false,
        category: 'implementation',
      },
      {
        id: 'training-basic',
        name: 'Basic Training (8 hours)',
        description: 'Team training on platform basics',
        price: 1500,
        isRequired: false,
        category: 'training',
      },
      {
        id: 'training-advanced',
        name: 'Advanced Training (16 hours)',
        description: 'In-depth training on advanced features',
        price: 3500,
        isRequired: false,
        category: 'training',
        dependencies: ['training-basic'],
      },
    ],
    metadata: {
      duration: '1 month',
      deliverables: 'Reports, documentation, and training materials',
    },
  },
];

/**
 * Get product by ID
 */
export function getProductById(productId: string): Product | undefined {
  return products.find((p) => p.id === productId);
}

/**
 * Get all products in a category
 */
export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
  return [...new Set(products.map((p) => p.category))];
}
