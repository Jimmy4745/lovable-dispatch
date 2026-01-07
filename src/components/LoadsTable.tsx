import { useState } from 'react';
import { Load, Driver } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { LoadFormDialog } from './LoadFormDialog';
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

interface LoadsTableProps {
  loads: Load[];
  drivers: Driver[];
  onAddLoad: (load: Omit<Load, 'createdAt'>) => void;
  onUpdateLoad: (loadId: string, updates: Partial<Load>) => void;
  onDeleteLoad: (loadId: string) => void;
  loadIdExists: (loadId: string, excludeLoadId?: string) => boolean;
  fullLoads: Load[];
}

export function LoadsTable({ 
  loads, 
  drivers, 
  onAddLoad, 
  onUpdateLoad, 
  onDeleteLoad,
  loadIdExists,
  fullLoads,
}: LoadsTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [deleteLoadId, setDeleteLoadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getDriverName = (driverId: string) => {
    const driver = drivers.find((d) => d.driverId === driverId);
    return driver?.driverName || 'Unknown';
  };

  const handleEdit = (load: Load) => {
    setEditingLoad(load);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (loadData: Omit<Load, 'createdAt'>) => {
    if (editingLoad) {
      onUpdateLoad(editingLoad.loadId, loadData);
    } else {
      onAddLoad(loadData);
    }
    setIsFormOpen(false);
    setEditingLoad(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingLoad(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteLoadId) {
      onDeleteLoad(deleteLoadId);
      setDeleteLoadId(null);
    }
  };

  // Filter loads by search query
  const filteredLoads = loads.filter((load) =>
    load.loadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    load.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    load.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Loads</h2>
          <p className="text-sm text-muted-foreground">
            {filteredLoads.length} loads in selected period
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Load ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Load
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Load ID</th>
              <th>Pickup</th>
              <th>Delivery</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Driver</th>
              <th>Type</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Commission</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLoads.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No loads match your search' : 'No loads in selected period'}
                </td>
              </tr>
            ) : (
              filteredLoads.map((load) => {
                const commission = load.loadType === 'FULL' 
                  ? load.rate * 0.01 
                  : load.rate * 0.02;
                
                return (
                  <tr key={load.loadId}>
                    <td className="font-medium font-mono">
                      {load.loadId}
                      {load.parentLoadId && (
                        <span className="text-xs text-muted-foreground block">
                          → {load.parentLoadId}
                        </span>
                      )}
                    </td>
                    <td className="font-medium">
                      {format(parseISO(load.pickupDate), 'MMM d')}
                    </td>
                    <td>{format(parseISO(load.deliveryDate), 'MMM d')}</td>
                    <td>{load.origin}</td>
                    <td>{load.destination}</td>
                    <td>{getDriverName(load.driverId)}</td>
                    <td>
                      <span className={load.loadType === 'FULL' ? 'badge-full' : 'badge-partial'}>
                        {load.loadType}
                      </span>
                    </td>
                    <td className="text-right font-medium">
                      ${load.rate.toLocaleString()}
                    </td>
                    <td className={`text-right font-medium ${
                      load.loadType === 'FULL' ? 'text-revenue' : 'text-partial'
                    }`}>
                      ${commission.toFixed(2)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(load)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteLoadId(load.loadId)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <LoadFormDialog
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        drivers={drivers}
        initialData={editingLoad}
        loadIdExists={loadIdExists}
        fullLoads={fullLoads}
      />

      <AlertDialog open={!!deleteLoadId} onOpenChange={() => setDeleteLoadId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Load</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this load? This action cannot be undone
              and will affect salary calculations.
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
