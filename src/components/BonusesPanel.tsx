import { useState } from 'react';
import { Bonus, Driver } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Hand } from 'lucide-react';
import { BonusFormDialog } from './BonusFormDialog';
import { format, parseISO } from 'date-fns';
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
  onAddBonus: (bonus: Omit<Bonus, 'bonusId' | 'createdAt'>) => void;
  onDeleteBonus: (bonusId: string) => void;
}

export function BonusesPanel({
  bonuses,
  drivers,
  onAddBonus,
  onDeleteBonus,
}: BonusesPanelProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteBonusId, setDeleteBonusId] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteBonusId) {
      onDeleteBonus(deleteBonusId);
      setDeleteBonusId(null);
    }
  };

  // Only manual bonuses now
  const manualBonuses = bonuses.filter((b) => b.bonusType === 'manual');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Hand className="w-4 h-4" />
            Bonuses ({manualBonuses.length})
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
                <th>Note</th>
                <th className="text-right">Amount</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {manualBonuses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    No bonuses in selected period
                  </td>
                </tr>
              ) : (
                manualBonuses.map((bonus) => (
                  <tr key={bonus.bonusId}>
                    <td>{format(parseISO(bonus.date), 'MMM d, yyyy')}</td>
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

      <BonusFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(bonus) => {
          onAddBonus(bonus);
          setIsFormOpen(false);
        }}
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
