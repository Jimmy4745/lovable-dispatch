import { WeekPicker } from './WeekPicker';
import { WeekRange } from '@/types';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';
import { bonusThresholds } from '@/data/sampleData';

interface DriversPanelProps {
  driverPerformance: {
    driverId: string;
    driverName: string;
    totalGross: number;
    loadCount: number;
    bonusAmount: number;
    bonusThreshold: number;
    status: 'active' | 'inactive';
  }[];
  selectedWeek: WeekRange;
  onWeekChange: (week: WeekRange) => void;
}

export function DriversPanel({
  driverPerformance,
  selectedWeek,
  onWeekChange,
}: DriversPanelProps) {
  const topPerformer = driverPerformance.reduce(
    (top, driver) => (driver.totalGross > (top?.totalGross || 0) ? driver : top),
    driverPerformance[0]
  );

  const getNextThreshold = (gross: number) => {
    const nextTier = bonusThresholds.find((t) => t.threshold > gross);
    return nextTier || bonusThresholds[bonusThresholds.length - 1];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Week Selection */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
        <span className="text-sm font-medium text-muted-foreground">Week:</span>
        <WeekPicker selectedWeek={selectedWeek} onWeekChange={onWeekChange} />
      </div>

      {/* Top Performer */}
      {topPerformer && topPerformer.totalGross > 0 && (
        <div className="bg-gradient-to-r from-revenue/10 to-revenue/5 rounded-lg border border-revenue/20 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-revenue/20">
              <Award className="w-5 h-5 text-revenue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Performer This Week</p>
              <p className="font-semibold">{topPerformer.driverName}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-revenue">
                ${topPerformer.totalGross.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {topPerformer.loadCount} loads
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drivers Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th className="text-center">Loads</th>
              <th className="text-right">Total Gross</th>
              <th className="text-right">Bonus Status</th>
              <th className="text-right">Next Tier</th>
            </tr>
          </thead>
          <tbody>
            {driverPerformance.map((driver) => {
              const nextTier = getNextThreshold(driver.totalGross);
              const toNextTier = nextTier.threshold - driver.totalGross;
              const progressToNext = driver.bonusThreshold > 0 
                ? Math.min(100, ((driver.totalGross - driver.bonusThreshold) / (nextTier.threshold - driver.bonusThreshold)) * 100)
                : Math.min(100, (driver.totalGross / nextTier.threshold) * 100);

              return (
                <tr key={driver.driverId}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {driver.driverName.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{driver.driverName}</span>
                    </div>
                  </td>
                  <td className="text-center">{driver.loadCount}</td>
                  <td className="text-right">
                    <span className={`font-bold ${driver.totalGross >= 10000 ? 'text-revenue' : ''}`}>
                      ${driver.totalGross.toLocaleString()}
                    </span>
                  </td>
                  <td className="text-right">
                    {driver.bonusAmount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-revenue font-medium">
                        <TrendingUp className="w-4 h-4" />
                        ${driver.bonusAmount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center justify-end gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Not eligible
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm">
                        ${nextTier.bonus} @ ${nextTier.threshold.toLocaleString()}
                      </span>
                      {toNextTier > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-revenue rounded-full transition-all"
                              style={{ width: `${Math.max(0, progressToNext)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ${toNextTier.toLocaleString()} to go
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
