import { useState, useMemo, useCallback } from 'react';
import { Load, Driver, Bonus, DateRange, WeekRange, DriverType, ownerOperatorBonusThresholds, companyDriverBonusThresholds } from '@/types';
import { sampleDrivers, sampleLoads, sampleBonuses } from '@/data/sampleData';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format, addDays } from 'date-fns';

export function useDispatcherData() {
  const [loads, setLoads] = useState<Load[]>(sampleLoads);
  const [drivers, setDrivers] = useState<Driver[]>(sampleDrivers);
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

  // Calculate bonuses for each driver based on their type
  const calculateDriverBonus = useCallback((totalGross: number, driverType: DriverType) => {
    const thresholds = driverType === 'owner_operator' 
      ? ownerOperatorBonusThresholds 
      : companyDriverBonusThresholds;
    
    const eligibleBonus = thresholds
      .filter((t) => totalGross >= t.threshold)
      .pop();
    
    return {
      bonusAmount: eligibleBonus?.bonus || 0,
      bonusThreshold: eligibleBonus?.threshold || 0,
    };
  }, []);

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
      
      const { bonusAmount, bonusThreshold } = calculateDriverBonus(totalGross, driver.driverType);
      
      return {
        ...driver,
        totalGross,
        loadCount,
        bonusAmount,
        bonusThreshold,
      };
    });
  }, [drivers, filteredLoads, calculateDriverBonus]);

  // Check if load ID already exists
  const loadIdExists = useCallback((loadId: string, excludeLoadId?: string) => {
    return loads.some((l) => l.loadId === loadId && l.loadId !== excludeLoadId);
  }, [loads]);

  // Get all FULL loads (for linking PARTIAL loads)
  const getFullLoads = useCallback(() => {
    return loads.filter((l) => l.loadType === 'FULL');
  }, [loads]);

  // Sync automatic bonuses when loads change
  const syncAutomaticBonuses = useCallback(() => {
    const weekStart = format(selectedWeek.start, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Calculate what automatic bonuses should exist
    const newAutoBonuses: Bonus[] = driverPerformance
      .filter((driver) => driver.bonusAmount > 0)
      .map((driver) => ({
        bonusId: `auto-${driver.driverId}-${weekStart}`,
        driverId: driver.driverId,
        bonusType: 'automatic' as const,
        amount: driver.bonusAmount,
        week: weekStart,
        date: today,
        note: `Weekly bonus for $${driver.totalGross.toLocaleString()} gross (${driver.driverType === 'owner_operator' ? 'Owner Operator' : 'Company Driver'})`,
        createdAt: today,
      }));

    // Remove old automatic bonuses for this week and add new ones
    setBonuses((prev) => {
      const manualBonuses = prev.filter(
        (b) => b.bonusType === 'manual' || b.week !== weekStart
      );
      return [...manualBonuses, ...newAutoBonuses];
    });
  }, [driverPerformance, selectedWeek]);

  const addLoad = useCallback((load: Omit<Load, 'createdAt'> & { loadId: string }) => {
    const newLoad: Load = {
      ...load,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLoads((prev) => [...prev, newLoad]);
    
    // Sync bonuses after adding load
    setTimeout(syncAutomaticBonuses, 0);
  }, [syncAutomaticBonuses]);

  const updateLoad = useCallback((loadId: string, updates: Partial<Load>) => {
    setLoads((prev) =>
      prev.map((l) => (l.loadId === loadId ? { ...l, ...updates } : l))
    );
    
    // Sync bonuses after updating load
    setTimeout(syncAutomaticBonuses, 0);
  }, [syncAutomaticBonuses]);

  const deleteLoad = useCallback((loadId: string) => {
    setLoads((prev) => prev.filter((l) => l.loadId !== loadId));
    
    // Sync bonuses after deleting load
    setTimeout(syncAutomaticBonuses, 0);
  }, [syncAutomaticBonuses]);

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

  // Driver management
  const addDriver = useCallback((driver: Omit<Driver, 'driverId' | 'createdAt'>) => {
    const newDriver: Driver = {
      ...driver,
      driverId: `d${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setDrivers((prev) => [...prev, newDriver]);
  }, []);

  const updateDriver = useCallback((driverId: string, updates: Partial<Driver>) => {
    setDrivers((prev) =>
      prev.map((d) => (d.driverId === driverId ? { ...d, ...updates } : d))
    );
  }, []);

  const deleteDriver = useCallback((driverId: string) => {
    setDrivers((prev) => prev.filter((d) => d.driverId !== driverId));
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
    addDriver,
    updateDriver,
    deleteDriver,
    loadIdExists,
    getFullLoads,
    syncAutomaticBonuses,
  };
}
