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

// Commission rates by driver type
export const commissionRates = {
  company_driver: { fullRate: 0.0175, partialRate: 0.025 },
  owner_operator: { fullRate: 0.01, partialRate: 0.02 },
};
