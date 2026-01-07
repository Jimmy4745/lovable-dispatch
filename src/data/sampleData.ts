import { Driver, Load, Bonus, ownerOperatorBonusThresholds, companyDriverBonusThresholds } from '@/types';

export const sampleDrivers: Driver[] = [
  { driverId: 'd1', driverName: 'Alex Johnson', driverType: 'company_driver', status: 'active', createdAt: '2024-01-01' },
  { driverId: 'd2', driverName: 'Maria Garcia', driverType: 'owner_operator', status: 'active', createdAt: '2024-01-05' },
  { driverId: 'd3', driverName: 'James Wilson', driverType: 'company_driver', status: 'active', createdAt: '2024-01-10' },
  { driverId: 'd4', driverName: 'Sarah Chen', driverType: 'owner_operator', status: 'active', createdAt: '2024-02-01' },
  { driverId: 'd5', driverName: 'Michael Brown', driverType: 'company_driver', status: 'inactive', createdAt: '2024-02-15' },
];

export const sampleLoads: Load[] = [
  {
    loadId: 'L001',
    pickupDate: '2025-01-06',
    deliveryDate: '2025-01-07',
    origin: 'Los Angeles, CA',
    destination: 'Phoenix, AZ',
    rate: 3500,
    loadType: 'FULL',
    driverId: 'd1',
    createdAt: '2025-01-06',
  },
  {
    loadId: 'L002',
    pickupDate: '2025-01-06',
    deliveryDate: '2025-01-08',
    origin: 'Dallas, TX',
    destination: 'Houston, TX',
    rate: 2800,
    loadType: 'FULL',
    driverId: 'd2',
    createdAt: '2025-01-06',
  },
  {
    loadId: 'L002-P1',
    pickupDate: '2025-01-06',
    deliveryDate: '2025-01-08',
    origin: 'Dallas, TX',
    destination: 'Austin, TX',
    rate: 1200,
    loadType: 'PARTIAL',
    driverId: 'd2',
    parentLoadId: 'L002',
    createdAt: '2025-01-06',
  },
  {
    loadId: 'L003',
    pickupDate: '2025-01-07',
    deliveryDate: '2025-01-09',
    origin: 'Chicago, IL',
    destination: 'Detroit, MI',
    rate: 4200,
    loadType: 'FULL',
    driverId: 'd1',
    createdAt: '2025-01-07',
  },
  {
    loadId: 'L004',
    pickupDate: '2025-01-07',
    deliveryDate: '2025-01-08',
    origin: 'Miami, FL',
    destination: 'Orlando, FL',
    rate: 3500,
    loadType: 'FULL',
    driverId: 'd3',
    createdAt: '2025-01-07',
  },
  {
    loadId: 'L005',
    pickupDate: '2025-01-08',
    deliveryDate: '2025-01-10',
    origin: 'Seattle, WA',
    destination: 'Portland, OR',
    rate: 5500,
    loadType: 'FULL',
    driverId: 'd4',
    createdAt: '2025-01-08',
  },
  {
    loadId: 'L006',
    pickupDate: '2025-01-08',
    deliveryDate: '2025-01-09',
    origin: 'Denver, CO',
    destination: 'Salt Lake City, UT',
    rate: 3200,
    loadType: 'FULL',
    driverId: 'd2',
    createdAt: '2025-01-08',
  },
];

export const sampleBonuses: Bonus[] = [];

// Re-export bonus thresholds for backward compatibility
export const bonusThresholds = companyDriverBonusThresholds;

export function getBonusThresholdsForDriverType(driverType: 'company_driver' | 'owner_operator') {
  return driverType === 'owner_operator' ? ownerOperatorBonusThresholds : companyDriverBonusThresholds;
}
