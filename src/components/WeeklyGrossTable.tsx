import { useMemo, useState } from 'react';
import { Driver, Load, WeekRange } from '@/types';
import { parseISO, format, addDays, isSameDay } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WeeklyGrossTableProps {
  drivers: Driver[];
  loads: Load[];
  selectedWeek: WeekRange;
}

interface DayLoads {
  date: Date;
  loads: Load[];
  total: number;
}

export function WeeklyGrossTable({ drivers, loads, selectedWeek }: WeeklyGrossTableProps) {
  const [selectedCell, setSelectedCell] = useState<{
    driver: Driver;
    date: Date;
    loads: Load[];
  } | null>(null);

  // Get the 7 days of the week (Mon-Sun)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(selectedWeek.start, i));
    }
    return days;
  }, [selectedWeek.start]);

  // Calculate gross per driver per day based on pickup date
  const driverWeeklyData = useMemo(() => {
    return drivers
      .filter(d => d.status === 'active')
      .map(driver => {
        const driverLoads = loads.filter(l => l.driverId === driver.driverId);
        
        const dailyData: DayLoads[] = weekDays.map(day => {
          const dayLoads = driverLoads.filter(l => {
            const pickupDate = parseISO(l.pickupDate);
            return isSameDay(pickupDate, day);
          });
          
          return {
            date: day,
            loads: dayLoads,
            total: dayLoads.reduce((sum, l) => sum + l.rate, 0),
          };
        });

        const weeklyTotal = dailyData.reduce((sum, d) => sum + d.total, 0);

        return {
          driver,
          dailyData,
          weeklyTotal,
        };
      })
      .sort((a, b) => {
        // Sort by truck number if available, otherwise by name
        const aTruck = a.driver.truckNumber || '';
        const bTruck = b.driver.truckNumber || '';
        if (aTruck && bTruck) {
          return aTruck.localeCompare(bTruck);
        }
        return a.driver.driverName.localeCompare(b.driver.driverName);
      });
  }, [drivers, loads, weekDays]);

  const handleCellClick = (driver: Driver, dayData: DayLoads) => {
    if (dayData.loads.length > 0) {
      setSelectedCell({
        driver,
        date: dayData.date,
        loads: dayData.loads,
      });
    }
  };

  const getCellStyle = (total: number) => {
    if (total === 0) return 'text-muted-foreground';
    if (total >= 3000) return 'bg-revenue/20 text-revenue font-semibold';
    if (total >= 1500) return 'bg-partial/20 text-partial font-medium';
    return 'bg-muted/50';
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px] font-semibold">Truck №</TableHead>
                <TableHead className="w-[180px] font-semibold">Driver</TableHead>
                <TableHead className="text-right font-semibold w-[120px]">Weekly total</TableHead>
                {weekDays.map((day, index) => (
                  <TableHead key={index} className="text-center font-semibold w-[100px]">
                    {format(day, 'EEEE')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverWeeklyData.map(({ driver, dailyData, weeklyTotal }) => (
                <TableRow key={driver.driverId} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {driver.truckNumber || '-'}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {driver.driverName.toUpperCase()}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${weeklyTotal > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {weeklyTotal > 0 ? `${weeklyTotal.toLocaleString()}$` : '0$'}
                  </TableCell>
                  {dailyData.map((dayData, index) => (
                    <TableCell
                      key={index}
                      className={`text-center cursor-pointer transition-colors ${getCellStyle(dayData.total)} ${
                        dayData.loads.length > 0 ? 'hover:opacity-80' : ''
                      }`}
                      onClick={() => handleCellClick(driver, dayData)}
                    >
                      {dayData.total > 0 ? `${dayData.total.toLocaleString()}$` : '0$'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {driverWeeklyData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No active drivers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Day loads detail dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.driver.driverName} - {selectedCell ? format(selectedCell.date, 'EEEE, MMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load ID</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCell?.loads.map((load) => (
                  <TableRow key={load.loadId}>
                    <TableCell className="font-medium">{load.loadId}</TableCell>
                    <TableCell>{load.origin}</TableCell>
                    <TableCell>{load.destination}</TableCell>
                    <TableCell>{format(parseISO(load.pickupDate), 'MMM d')}</TableCell>
                    <TableCell>{format(parseISO(load.deliveryDate), 'MMM d')}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${load.rate.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-muted-foreground">Total for this day:</span>
              <span className="text-xl font-bold">
                ${selectedCell?.loads.reduce((sum, l) => sum + l.rate, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}