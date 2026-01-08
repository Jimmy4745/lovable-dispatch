import { Driver, Load, Bonus, ownerOperatorBonusThresholds, companyDriverBonusThresholds } from '@/types';

export const sampleDrivers: Driver[] = [];

export const sampleLoads: Load[] = [];

export const sampleBonuses: Bonus[] = [];

// Re-export bonus thresholds for backward compatibility
export const bonusThresholds = companyDriverBonusThresholds;

export function getBonusThresholdsForDriverType(driverType: 'company_driver' | 'owner_operator') {
  return driverType === 'owner_operator' ? ownerOperatorBonusThresholds : companyDriverBonusThresholds;
}
