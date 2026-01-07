import { MetricCard } from './MetricCard';
import { WeekPicker } from './WeekPicker';
import { DateRangePicker } from './DateRangePicker';
import { DriverPerformanceChart } from './DriverPerformanceChart';
import { WeekRange, DateRange } from '@/types';
import { Package, TrendingUp, Gift, DollarSign, Truck, FileText } from 'lucide-react';

interface TeamDashboardProps {
  metrics: {
    fullLoadsGross: number;
    partialLoadsGross: number;
    totalGross: number;
    totalBonuses: number;
    fullLoadCommission: number;
    partialLoadCommission: number;
    totalSalary: number;
    loadCount: number;
  };
  driverPerformance: {
    driverId: string;
    driverName: string;
    totalGross: number;
    driverType: 'company_driver' | 'owner_operator';
  }[];
  selectedWeek: WeekRange;
  onWeekChange: (week: WeekRange) => void;
  customDateRange: DateRange | null;
  onCustomDateRangeChange: (range: DateRange | null) => void;
  useCustomRange: boolean;
  onToggleCustomRange: (active: boolean) => void;
}

export function TeamDashboard({
  metrics,
  driverPerformance,
  selectedWeek,
  onWeekChange,
  customDateRange,
  onCustomDateRangeChange,
  useCustomRange,
  onToggleCustomRange,
}: TeamDashboardProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Time Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Week:</span>
          <WeekPicker 
            selectedWeek={selectedWeek} 
            onWeekChange={(week) => {
              onWeekChange(week);
              onToggleCustomRange(false);
            }} 
          />
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Custom:</span>
          <DateRangePicker
            dateRange={customDateRange}
            onDateRangeChange={onCustomDateRangeChange}
            isActive={useCustomRange}
            onToggle={onToggleCustomRange}
          />
        </div>
      </div>

      {/* Driver Performance Chart */}
      <DriverPerformanceChart driverPerformance={driverPerformance} />

      {/* Revenue Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Revenue
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="FULL Loads Gross"
            value={metrics.fullLoadsGross}
            variant="revenue"
            icon={<Package className="w-4 h-4 text-revenue" />}
            subValue="1% commission"
          />
          <MetricCard
            label="PARTIAL Loads Gross"
            value={metrics.partialLoadsGross}
            variant="partial"
            icon={<Truck className="w-4 h-4 text-partial" />}
            subValue="2% commission"
          />
          <MetricCard
            label="Total Gross"
            value={metrics.totalGross}
            variant="primary"
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            subValue={`${metrics.loadCount} loads`}
          />
          <MetricCard
            label="Bonuses"
            value={metrics.totalBonuses}
            icon={<Gift className="w-4 h-4 text-muted-foreground" />}
            subValue="Auto + Manual"
          />
        </div>
      </div>

      {/* Salary Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Salary Calculation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="FULL Commission (1%)"
            value={metrics.fullLoadCommission}
            variant="revenue"
            icon={<FileText className="w-4 h-4 text-revenue" />}
          />
          <MetricCard
            label="PARTIAL Commission (2%)"
            value={metrics.partialLoadCommission}
            variant="partial"
            icon={<FileText className="w-4 h-4 text-partial" />}
          />
          <MetricCard
            label="Total Bonuses"
            value={metrics.totalBonuses}
            icon={<Gift className="w-4 h-4 text-muted-foreground" />}
          />
          <div className="metric-card bg-primary text-primary-foreground">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium opacity-80">Total Salary</p>
                <p className="text-2xl font-bold">${metrics.totalSalary.toLocaleString()}</p>
                <p className="text-xs opacity-70">Fully automated</p>
              </div>
              <div className="p-2 rounded-lg bg-primary-foreground/10">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
