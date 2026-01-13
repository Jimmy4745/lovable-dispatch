export type LoadType = 'FULL' | 'PARTIAL';
export type DriverType = 'company_driver' | 'owner_operator';

export interface Load {
  loadId: string;
  pickupDate: string;
  deliveryDate: string;
  origin: string;
  destination: string;
  rate: number;
  loadType: LoadType;
  driverId: string;
  parentLoadId?: string; // For PARTIAL loads linked to FULL loads
  createdAt: string;
}

export interface Driver {
  driverId: string;
  driverName: string;
  driverType: DriverType;
  truckNumber?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CalendarNote {
  id: string;
  date: string;
  note: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BonusType = 'automatic' | 'manual';

export interface Bonus {
  bonusId: string;
  driverId?: string; // Optional - only for driver-specific bonuses
  bonusType: BonusType;
  amount: number;
  week: string;
  date: string;
  note: string;
  createdAt: string;
}

export type PrebookStatus = 'driver_needed' | 'has_driver' | 'lane';

export interface Prebook {
  id: string;
  date: string;
  loadNumber?: string;
  status: PrebookStatus;
  note?: string;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalarySnapshot {
  salaryId: string;
  periodType: 'week' | 'customRange';
  periodStart: string;
  periodEnd: string;
  fullLoadCommission: number;
  partialLoadCommission: number;
  totalBonuses: number;
  totalSalary: number;
  calculatedAt: string;
}

export interface WeekRange {
  start: Date;
  end: Date;
  label: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export type TabType = 'team' | 'loads' | 'bonuses' | 'drivers' | 'notes';

// Bonus thresholds by driver type
export const ownerOperatorBonusThresholds = [
  { threshold: 13000, bonus: 50 },
  { threshold: 14000, bonus: 75 },
  { threshold: 15000, bonus: 100 },
];

export const companyDriverBonusThresholds = [
  { threshold: 10000, bonus: 30 },
  { threshold: 11000, bonus: 50 },
  { threshold: 12000, bonus: 70 },
  { threshold: 13000, bonus: 90 },
  { threshold: 14000, bonus: 110 },
  { threshold: 15000, bonus: 150 },
];
