import { useState, useEffect } from 'react';
import { Load, Driver, LoadType } from '@/types';
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

interface LoadFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (load: Omit<Load, 'loadId' | 'createdAt'>) => void;
  drivers: Driver[];
  initialData?: Load | null;
}

export function LoadFormDialog({
  open,
  onClose,
  onSubmit,
  drivers,
  initialData,
}: LoadFormDialogProps) {
  const [formData, setFormData] = useState({
    pickupDate: '',
    deliveryDate: '',
    origin: '',
    destination: '',
    rate: '',
    loadType: 'FULL' as LoadType,
    driverId: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        pickupDate: initialData.pickupDate,
        deliveryDate: initialData.deliveryDate,
        origin: initialData.origin,
        destination: initialData.destination,
        rate: initialData.rate.toString(),
        loadType: initialData.loadType,
        driverId: initialData.driverId,
      });
    } else {
      setFormData({
        pickupDate: '',
        deliveryDate: '',
        origin: '',
        destination: '',
        rate: '',
        loadType: 'FULL',
        driverId: '',
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      pickupDate: formData.pickupDate,
      deliveryDate: formData.deliveryDate,
      origin: formData.origin,
      destination: formData.destination,
      rate: parseFloat(formData.rate),
      loadType: formData.loadType,
      driverId: formData.driverId,
    });
  };

  const activeDrivers = drivers.filter((d) => d.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Load' : 'Add New Load'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupDate">Pickup Date</Label>
              <Input
                id="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                placeholder="City, State"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="City, State"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loadType">Load Type</Label>
              <Select
                value={formData.loadType}
                onValueChange={(value: LoadType) => setFormData({ ...formData, loadType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">FULL (1% commission)</SelectItem>
                  <SelectItem value="PARTIAL">PARTIAL (2% commission)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver">Assigned Driver</Label>
            <Select
              value={formData.driverId}
              onValueChange={(value) => setFormData({ ...formData, driverId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {activeDrivers.map((driver) => (
                  <SelectItem key={driver.driverId} value={driver.driverId}>
                    {driver.driverName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Save Changes' : 'Add Load'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
