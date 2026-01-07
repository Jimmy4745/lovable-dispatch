import { useState } from 'react';
import { WeekPicker } from './WeekPicker';
import { Driver, WeekRange, ownerOperatorBonusThresholds, companyDriverBonusThresholds } from '@/types';
import { TrendingUp, Award, AlertCircle, Plus, Pencil, Trash2, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DriverFormDialog } from './DriverFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DriversPanelProps {
  driverPerformance: {
    driverId: string;
    driverName: string;
    driverType: 'company_driver' | 'owner_operator';
    totalGross: number;
    loadCount: number;
    bonusAmount: number;
    bonusThreshold: number;
    status: 'active' | 'inactive';
  }[];
  allDrivers: Driver[];
  selectedWeek: WeekRange;
  onWeekChange: (week: WeekRange) => void;
  onAddDriver: (driver: Omit<Driver, 'driverId' | 'createdAt'>) => void;
  onUpdateDriver: (driverId: string, updates: Partial<Driver>) => void;
  onDeleteDriver: (driverId: string) => void;
}

export function DriversPanel({
  driverPerformance,
  allDrivers,
  selectedWeek,
  onWeekChange,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
}: DriversPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteDriverId, setDeleteDriverId] = useState<string | null>(null);

  const topPerformer = driverPerformance.reduce(
    (top, driver) => (driver.totalGross > (top?.totalGross || 0) ? driver : top),
    driverPerformance[0]
  );

  const getNextThreshold = (gross: number, driverType: 'company_driver' | 'owner_operator') => {
    const thresholds = driverType === 'owner_operator' 
      ? ownerOperatorBonusThresholds 
      : companyDriverBonusThresholds;
    const nextTier = thresholds.find((t) => t.threshold > gross);
    return nextTier || thresholds[thresholds.length - 1];
  };

  const companyDrivers = allDrivers.filter((d) => d.driverType === 'company_driver');
  const ownerOperators = allDrivers.filter((d) => d.driverType === 'owner_operator');

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (driverData: Omit<Driver, 'driverId' | 'createdAt'>) => {
    if (editingDriver) {
      onUpdateDriver(editingDriver.driverId, driverData);
    } else {
      onAddDriver(driverData);
    }
    setIsFormOpen(false);
    setEditingDriver(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteDriverId) {
      onDeleteDriver(deleteDriverId);
      setDeleteDriverId(null);
    }
  };

  const renderDriverList = (drivers: Driver[], title: string, icon: React.ReactNode) => (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold">{title}</h4>
          <span className="text-sm text-muted-foreground">({drivers.length})</span>
        </div>
      </div>
      <div className="space-y-2">
        {drivers.map((driver) => {
          const perf = driverPerformance.find((p) => p.driverId === driver.driverId);
          return (
            <div key={driver.driverId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {driver.driverName.charAt(0)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">{driver.driverName}</span>
                  <span className={`ml-2 text-xs ${driver.status === 'active' ? 'text-revenue' : 'text-muted-foreground'}`}>
                    ({driver.status})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {perf && (
                  <span className="text-sm font-medium mr-4">
                    ${perf.totalGross.toLocaleString()}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(driver)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteDriverId(driver.driverId)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {drivers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No drivers in this category
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Week Selection and Add Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border">
          <span className="text-sm font-medium text-muted-foreground">Week:</span>
          <WeekPicker selectedWeek={selectedWeek} onWeekChange={onWeekChange} />
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Driver
        </Button>
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

      {/* Driver Lists by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderDriverList(companyDrivers, 'Company Drivers', <Truck className="w-5 h-5 text-revenue" />)}
        {renderDriverList(ownerOperators, 'Owner Operators', <User className="w-5 h-5 text-partial" />)}
      </div>

      {/* Performance Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Weekly Performance</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Type</th>
              <th className="text-center">Loads</th>
              <th className="text-right">Total Gross</th>
              <th className="text-right">Bonus Status</th>
              <th className="text-right">Next Tier</th>
            </tr>
          </thead>
          <tbody>
            {driverPerformance.map((driver) => {
              const nextTier = getNextThreshold(driver.totalGross, driver.driverType);
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
                  <td>
                    <span className={driver.driverType === 'owner_operator' ? 'badge-partial' : 'badge-full'}>
                      {driver.driverType === 'owner_operator' ? 'Owner Op' : 'Company'}
                    </span>
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

      {/* Bonus Thresholds Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-revenue" />
            Company Driver Bonuses
          </h4>
          <div className="flex flex-wrap gap-3">
            {companyDriverBonusThresholds.map((t) => (
              <div key={t.threshold} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  ${(t.threshold / 1000)}k+
                </span>
                <span className="font-medium text-revenue">${t.bonus}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-partial" />
            Owner Operator Bonuses
          </h4>
          <div className="flex flex-wrap gap-3">
            {ownerOperatorBonusThresholds.map((t) => (
              <div key={t.threshold} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  ${(t.threshold / 1000)}k+
                </span>
                <span className="font-medium text-partial">${t.bonus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DriverFormDialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDriver(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDriver}
      />

      <AlertDialog open={!!deleteDriverId} onOpenChange={() => setDeleteDriverId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this driver? This will not delete their associated loads.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
