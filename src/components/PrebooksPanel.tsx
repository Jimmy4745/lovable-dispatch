import { useState, useMemo } from 'react';
import { Prebook, PrebookStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  UserX, 
  UserCheck, 
  Route 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

interface PrebooksPanelProps {
  prebooks: Prebook[];
  onAddPrebook: (prebook: Omit<Prebook, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePrebook: (id: string, updates: Partial<Prebook>) => void;
  onDeletePrebook: (id: string) => void;
}

const statusConfig: Record<PrebookStatus, { label: string; icon: React.ReactNode; className: string }> = {
  driver_needed: { 
    label: 'Driver Needed', 
    icon: <UserX className="w-3 h-3" />, 
    className: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  has_driver: { 
    label: 'Has Driver', 
    icon: <UserCheck className="w-3 h-3" />, 
    className: 'bg-revenue/10 text-revenue border-revenue/20' 
  },
  lane: { 
    label: 'Lane', 
    icon: <Route className="w-3 h-3" />, 
    className: 'bg-partial/10 text-partial border-partial/20' 
  },
};

export function PrebooksPanel({
  prebooks,
  onAddPrebook,
  onUpdatePrebook,
  onDeletePrebook,
}: PrebooksPanelProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrebook, setEditingPrebook] = useState<Prebook | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    loadNumber: '',
    status: 'driver_needed' as PrebookStatus,
    note: '',
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const prebooksByDate = useMemo(() => {
    const map: Record<string, Prebook[]> = {};
    prebooks.forEach((prebook) => {
      const dateKey = prebook.date;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(prebook);
    });
    return map;
  }, [prebooks]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingPrebook(null);
    setFormData({ loadNumber: '', status: 'driver_needed', note: '' });
    setIsFormOpen(true);
  };

  const handleEditPrebook = (prebook: Prebook) => {
    setEditingPrebook(prebook);
    setFormData({
      loadNumber: prebook.loadNumber || '',
      status: prebook.status,
      note: prebook.note || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPrebook) {
      onUpdatePrebook(editingPrebook.id, {
        loadNumber: formData.loadNumber || undefined,
        status: formData.status,
        note: formData.note || undefined,
      });
    } else if (selectedDate) {
      onAddPrebook({
        date: format(selectedDate, 'yyyy-MM-dd'),
        loadNumber: formData.loadNumber || undefined,
        status: formData.status,
        note: formData.note || undefined,
      });
    }
    
    setIsFormOpen(false);
    setEditingPrebook(null);
    setSelectedDate(null);
    setFormData({ loadNumber: '', status: 'driver_needed', note: '' });
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDeletePrebook(deleteId);
      setDeleteId(null);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex gap-4 text-sm">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded border ${config.className}`}>
              {config.icon}
              <span>{config.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayPrebooks = prebooksByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-b border-r border-border last:border-r-0 ${
                  !isCurrentMonth ? 'bg-muted/30' : ''
                } ${isCurrentDay ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      !isCurrentMonth ? 'text-muted-foreground' : ''
                    } ${isCurrentDay ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''}`}
                  >
                    {format(day, 'd')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 hover:opacity-100 transition-opacity"
                    onClick={() => handleDayClick(day)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {dayPrebooks.slice(0, 3).map((prebook) => {
                    const config = statusConfig[prebook.status];
                    return (
                      <div
                        key={prebook.id}
                        onClick={() => handleEditPrebook(prebook)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer border transition-colors hover:opacity-80 ${config.className}`}
                      >
                        {config.icon}
                        <span className="truncate">
                          {prebook.loadNumber || prebook.note?.slice(0, 15) || 'Prebook'}
                        </span>
                      </div>
                    );
                  })}
                  {dayPrebooks.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayPrebooks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Prebook Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrebook ? 'Edit Prebook' : `Add Prebook - ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="loadNumber">Load Number (Optional)</Label>
              <Input
                id="loadNumber"
                placeholder="e.g., L001"
                value={formData.loadNumber}
                onChange={(e) => setFormData({ ...formData, loadNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: PrebookStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Additional details about this prebook..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-4">
              {editingPrebook && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setDeleteId(editingPrebook.id);
                    setIsFormOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPrebook ? 'Update' : 'Add Prebook'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prebook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prebook? This action cannot be undone.
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
