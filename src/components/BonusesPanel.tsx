import { useState } from 'react';
import { Bonus, Driver } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Zap, Hand } from 'lucide-react';
import { BonusFormDialog } from './BonusFormDialog';
import { format, parseISO } from 'date-fns';
import { bonusThresholds } from '@/data/sampleData';
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

interface BonusesPanelProps {
  bonuses: Bonus[];
  drivers: Driver[];
  driverPerformance: {
    driverId: string;
    driverName: string;
    totalGross: number;
    bonusAmount: number;
    bonusThreshold: number;
  }[];
  onAddBonus: (bonus: Omit<Bonus, 'bonusId' | 'createdAt'>) => void;
  onDeleteBonus: (bonusId: string) => void;
}

export function BonusesPanel({
  bonuses,
  drivers,
  driverPerformance,
  onAddBonus,
  onDeleteBonus,
}: BonusesPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteBonusId, setDeleteBonusId] = useState<string | null>(null);

  const getDriverName = (driverId: string) => {
    return drivers.find((d) => d.driverId === driverId)?.driverName || 'Unknown';
  };

  const handleDeleteConfirm = () => {
    if (deleteBonusId) {
      onDeleteBonus(deleteBonusId);
      setDeleteBonusId(null);
    }
  };

  const automaticBonuses = bonuses.filter((b) => b.bonusType === 'automatic');
  const manualBonuses = bonuses.filter((b) => b.bonusType === 'manual');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bonus Thresholds Reference */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          Weekly Bonus Thresholds
        </h3>
        <div className="flex flex-wrap gap-3">
          {bonusThresholds.map((t) => (
            <div key={t.threshold} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                ${t.threshold.toLocaleString()}+
              </span>
              <span className="font-medium text-revenue">${t.bonus}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Eligibility */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Driver Eligibility This Week
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {driverPerformance.map((driver) => (
            <div
              key={driver.driverId}
              className={`p-4 rounded-lg border ${
                driver.bonusAmount > 0
                  ? 'bg-revenue/5 border-revenue/20'
                  : 'bg-card border-border'
              }`}
            >
              <p className="font-medium text-sm">{driver.driverName}</p>
              <p className="text-lg font-bold mt-1">
                ${driver.totalGross.toLocaleString()}
              </p>
              {driver.bonusAmount > 0 ? (
                <p className="text-sm text-revenue mt-1">
                  Eligible: ${driver.bonusAmount} bonus
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  ${(10000 - driver.totalGross).toLocaleString()} to first bonus
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Manual Bonuses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Hand className="w-4 h-4" />
            Manual Bonuses ({manualBonuses.length})
          </h3>
          <Button onClick={() => setIsFormOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Bonus
          </Button>
        </div>
        
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Driver</th>
                <th>Note</th>
                <th className="text-right">Amount</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {manualBonuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No manual bonuses in selected period
                  </td>
                </tr>
              ) : (
                manualBonuses.map((bonus) => (
                  <tr key={bonus.bonusId}>
                    <td>{format(parseISO(bonus.date), 'MMM d, yyyy')}</td>
                    <td className="font-medium">{getDriverName(bonus.driverId)}</td>
                    <td className="text-muted-foreground">{bonus.note}</td>
                    <td className="text-right font-medium text-revenue">
                      ${bonus.amount.toLocaleString()}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteBonusId(bonus.bonusId)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automatic Bonuses */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Automatic Bonuses ({automaticBonuses.length})
        </h3>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Driver</th>
                <th>Reason</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {automaticBonuses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    No automatic bonuses in selected period
                  </td>
                </tr>
              ) : (
                automaticBonuses.map((bonus) => (
                  <tr key={bonus.bonusId}>
                    <td>{format(parseISO(bonus.date), 'MMM d, yyyy')}</td>
                    <td className="font-medium">{getDriverName(bonus.driverId)}</td>
                    <td className="text-muted-foreground">{bonus.note}</td>
                    <td className="text-right font-medium text-revenue">
                      ${bonus.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BonusFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(bonus) => {
          onAddBonus(bonus);
          setIsFormOpen(false);
        }}
        drivers={drivers}
      />

      <AlertDialog open={!!deleteBonusId} onOpenChange={() => setDeleteBonusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bonus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bonus? This will affect salary calculations.
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
