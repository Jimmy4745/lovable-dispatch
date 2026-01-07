import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { WeekRange } from '@/types';
import { startOfWeek, addWeeks, subWeeks, format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';

interface WeekPickerProps {
  selectedWeek: WeekRange;
  onWeekChange: (week: WeekRange) => void;
}

export function WeekPicker({ selectedWeek, onWeekChange }: WeekPickerProps) {
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = direction === 'prev' 
      ? subWeeks(selectedWeek.start, 1)
      : addWeeks(selectedWeek.start, 1);
    const newEnd = addDays(newStart, 6);
    
    onWeekChange({
      start: newStart,
      end: newEnd,
      label: `${format(newStart, 'MMM d')} - ${format(newEnd, 'MMM d, yyyy')}`,
    });
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    onWeekChange({
      start: weekStart,
      end: weekEnd,
      label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateWeek('prev')}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg min-w-[200px] justify-center">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{selectedWeek.label}</span>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateWeek('next')}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={goToCurrentWeek}
        className="text-xs"
      >
        Today
      </Button>
    </div>
  );
}
