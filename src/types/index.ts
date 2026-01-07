export type LoadType = 'FULL' | 'PARTIAL';

export interface Load {
  loadId: string;
  pickupDate: string;
  deliveryDate: string;
  origin: string;
  destination: string;
  rate: number;
  loadType: LoadType;
  driverId: string;
  createdAt: string;
}

export interface Driver {
  driverId: string;
  driverName: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type BonusType = 'automatic' | 'manual';

export interface Bonus {
  bonusId: string;
  driverId: string;
  bonusType: BonusType;
  amount: number;
  week: string;
  date: string;
  note: string;
  createdAt: string;
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

export type TabType = 'team' | 'loads' | 'bonuses' | 'drivers';
