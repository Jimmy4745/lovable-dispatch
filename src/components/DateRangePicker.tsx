import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import { DateRange } from '@/types';
import { format } from 'date-fns';
import { DateRange as DayPickerDateRange } from 'react-day-picker';

interface DateRangePickerProps {
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export function DateRangePicker({ 
  dateRange, 
  onDateRangeChange, 
  isActive, 
  onToggle 
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (range: DayPickerDateRange | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
      onToggle(true);
    } else if (range?.from) {
      onDateRangeChange({ from: range.from, to: range.from });
    }
  };

  const displayValue = dateRange
    ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
    : 'Select date range';

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
            onSelect={handleSelect}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      {isActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onToggle(false);
            onDateRangeChange(null);
          }}
          className="text-xs text-muted-foreground"
        >
          Use Week
        </Button>
      )}
    </div>
  );
}
