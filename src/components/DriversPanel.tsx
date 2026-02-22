import { useState } from 'react';
import { WeekPicker } from './WeekPicker';
import { WeeklyGrossTable } from './WeeklyGrossTable';
import { Driver, Load, WeekRange } from '@/types';
import { TrendingUp, Plus, Pencil, Trash2, Truck, User, Award } from 'lucide-react';
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
    truckNumber?: string;
    totalGross: number;
    loadCount: number;
    status: 'active' | 'inactive';
  }[];
  allDrivers: Driver[];
  allLoads: Load[];
  selectedWeek: WeekRange;
  onWeekChange: (week: WeekRange) => void;
  onAddDriver: (driver: Omit<Driver, 'driverId' | 'createdAt'>) => void;
  onUpdateDriver: (driverId: string, updates: Partial<Driver>) => void;
  onDeleteDriver: (driverId: string) => void;
}

export function DriversPanel({
  driverPerformance,
  allDrivers,
  allLoads,
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

      {/* Weekly Gross Table */}
      <div className="space-y-4">
        <h3 className="font-semibold">Weekly Gross by Day</h3>
        <WeeklyGrossTable
          drivers={allDrivers}
          loads={allLoads}
          selectedWeek={selectedWeek}
        />
      </div>

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
            </tr>
          </thead>
          <tbody>
            {driverPerformance.map((driver) => (
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
              </tr>
            ))}
          </tbody>
        </table>
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
