import { useState, useEffect } from 'react';
import { Driver, DriverType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DriverFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (driver: Omit<Driver, 'driverId' | 'createdAt'>) => void;
  initialData?: Driver | null;
}

export function DriverFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
}: DriverFormDialogProps) {
  const [formData, setFormData] = useState({
    driverName: '',
    driverType: 'company_driver' as DriverType,
    truckNumber: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        driverName: initialData.driverName,
        driverType: initialData.driverType,
        truckNumber: initialData.truckNumber || '',
        status: initialData.status,
      });
    } else {
      setFormData({
        driverName: '',
        driverType: 'company_driver',
        truckNumber: '',
        status: 'active',
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      truckNumber: formData.truckNumber || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="driverName">Driver Name</Label>
            <Input
              id="driverName"
              placeholder="John Doe"
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="truckNumber">Truck Number</Label>
            <Input
              id="truckNumber"
              placeholder="e.g., 0101"
              value={formData.truckNumber}
              onChange={(e) => setFormData({ ...formData, truckNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverType">Driver Type</Label>
            <Select
              value={formData.driverType}
              onValueChange={(value: DriverType) => setFormData({ ...formData, driverType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_driver">Company Driver</SelectItem>
                <SelectItem value="owner_operator">Owner Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Save Changes' : 'Add Driver'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
