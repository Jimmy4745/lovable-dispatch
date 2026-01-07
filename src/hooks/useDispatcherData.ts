import { useState, useMemo, useCallback } from 'react';
import { Load, Driver, Bonus, DateRange, WeekRange } from '@/types';
import { sampleDrivers, sampleLoads, sampleBonuses, bonusThresholds } from '@/data/sampleData';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format, addDays } from 'date-fns';

export function useDispatcherData() {
  const [loads, setLoads] = useState<Load[]>(sampleLoads);
  const [drivers] = useState<Driver[]>(sampleDrivers);
  const [bonuses, setBonuses] = useState<Bonus[]>(sampleBonuses);
  
  const [selectedWeek, setSelectedWeek] = useState<WeekRange>(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    return {
      start: weekStart,
      end: weekEnd,
      label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
    };
  });
  
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);
  const [useCustomRange, setUseCustomRange] = useState(false);

  const activePeriod = useMemo(() => {
    if (useCustomRange && customDateRange) {
      return { start: customDateRange.from, end: customDateRange.to };
    }
    return { start: selectedWeek.start, end: selectedWeek.end };
  }, [useCustomRange, customDateRange, selectedWeek]);

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      const pickupDate = parseISO(load.pickupDate);
      return isWithinInterval(pickupDate, { start: activePeriod.start, end: activePeriod.end });
    });
  }, [loads, activePeriod]);

  const filteredBonuses = useMemo(() => {
    return bonuses.filter((bonus) => {
      const bonusDate = parseISO(bonus.date);
      return isWithinInterval(bonusDate, { start: activePeriod.start, end: activePeriod.end });
    });
  }, [bonuses, activePeriod]);

  const metrics = useMemo(() => {
    const fullLoadsGross = filteredLoads
      .filter((l) => l.loadType === 'FULL')
      .reduce((sum, l) => sum + l.rate, 0);
    
    const partialLoadsGross = filteredLoads
      .filter((l) => l.loadType === 'PARTIAL')
      .reduce((sum, l) => sum + l.rate, 0);
    
    const totalGross = fullLoadsGross + partialLoadsGross;
    
    const totalBonuses = filteredBonuses.reduce((sum, b) => sum + b.amount, 0);
    
    const fullLoadCommission = fullLoadsGross * 0.01;
    const partialLoadCommission = partialLoadsGross * 0.02;
    const totalSalary = fullLoadCommission + partialLoadCommission + totalBonuses;

    return {
      fullLoadsGross,
      partialLoadsGross,
      totalGross,
      totalBonuses,
      fullLoadCommission,
      partialLoadCommission,
      totalSalary,
      loadCount: filteredLoads.length,
    };
  }, [filteredLoads, filteredBonuses]);

  const driverPerformance = useMemo(() => {
    return drivers.filter(d => d.status === 'active').map((driver) => {
      const driverLoads = filteredLoads.filter((l) => l.driverId === driver.driverId);
      const totalGross = driverLoads.reduce((sum, l) => sum + l.rate, 0);
      const loadCount = driverLoads.length;
      
      const eligibleBonus = bonusThresholds
        .filter((t) => totalGross >= t.threshold)
        .pop();
      
      return {
        ...driver,
        totalGross,
        loadCount,
        bonusAmount: eligibleBonus?.bonus || 0,
        bonusThreshold: eligibleBonus?.threshold || 0,
      };
    });
  }, [drivers, filteredLoads]);

  const addLoad = useCallback((load: Omit<Load, 'loadId' | 'createdAt'>) => {
    const newLoad: Load = {
      ...load,
      loadId: `l${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLoads((prev) => [...prev, newLoad]);
  }, []);

  const updateLoad = useCallback((loadId: string, updates: Partial<Load>) => {
    setLoads((prev) =>
      prev.map((l) => (l.loadId === loadId ? { ...l, ...updates } : l))
    );
  }, []);

  const deleteLoad = useCallback((loadId: string) => {
    setLoads((prev) => prev.filter((l) => l.loadId !== loadId));
  }, []);

  const addBonus = useCallback((bonus: Omit<Bonus, 'bonusId' | 'createdAt'>) => {
    const newBonus: Bonus = {
      ...bonus,
      bonusId: `b${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBonuses((prev) => [...prev, newBonus]);
  }, []);

  const deleteBonus = useCallback((bonusId: string) => {
    setBonuses((prev) => prev.filter((b) => b.bonusId !== bonusId));
  }, []);

  return {
    loads,
    drivers,
    bonuses,
    filteredLoads,
    filteredBonuses,
    metrics,
    driverPerformance,
    selectedWeek,
    setSelectedWeek,
    customDateRange,
    setCustomDateRange,
    useCustomRange,
    setUseCustomRange,
    activePeriod,
    addLoad,
    updateLoad,
    deleteLoad,
    addBonus,
    deleteBonus,
  };
}
