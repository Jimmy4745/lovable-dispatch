import { useState, useMemo, useCallback, useEffect } from 'react';
import { Load, Driver, Bonus, DateRange, WeekRange, DriverType, Prebook, ownerOperatorBonusThresholds, companyDriverBonusThresholds } from '@/types';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useDispatcherData() {
  const { user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [prebooks, setPrebooks] = useState<Prebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Fetch all data from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [loadsRes, driversRes, bonusesRes, prebooksRes] = await Promise.all([
          supabase.from('loads').select('*').order('pickup_date', { ascending: false }),
          supabase.from('drivers').select('*').order('driver_name'),
          supabase.from('bonuses').select('*').order('date', { ascending: false }),
          supabase.from('prebooks').select('*').order('date'),
        ]);

        if (loadsRes.data) {
          setLoads(loadsRes.data.map(l => ({
            loadId: l.load_id,
            pickupDate: l.pickup_date,
            deliveryDate: l.delivery_date,
            origin: l.origin,
            destination: l.destination,
            rate: Number(l.rate),
            loadType: l.load_type,
            driverId: l.driver_id || '',
            parentLoadId: l.parent_load_id || undefined,
            createdAt: l.created_at,
          })));
        }

        if (driversRes.data) {
          setDrivers(driversRes.data.map(d => ({
            driverId: d.id,
            driverName: d.driver_name,
            driverType: d.driver_type,
            status: d.status as 'active' | 'inactive',
            createdAt: d.created_at,
          })));
        }

        if (bonusesRes.data) {
          setBonuses(bonusesRes.data.map(b => ({
            bonusId: b.id,
            driverId: b.driver_id || undefined,
            bonusType: b.bonus_type,
            amount: Number(b.amount),
            week: b.week_start,
            date: b.date,
            note: b.note || '',
            createdAt: b.created_at,
          })));
        }

        if (prebooksRes.data) {
          setPrebooks(prebooksRes.data.map(p => ({
            id: p.id,
            date: p.date,
            loadNumber: p.load_number || undefined,
            status: p.status,
            note: p.note || undefined,
            fileUrl: p.file_url || undefined,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  // Get the week range for a given date (Monday to Sunday)
  const getWeekRange = useCallback((date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = addDays(weekStart, 6); // Sunday
    return { start: weekStart, end: weekEnd };
  }, []);

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

  // Calculate driver performance with bonuses based on loads within the week (Monday-Sunday)
  const calculateDriverPerformanceFromLoads = useCallback((currentLoads: Load[]) => {
    const weekRange = getWeekRange(activePeriod.start);
    
    return drivers.filter(d => d.status === 'active').map((driver) => {
      const driverLoads = currentLoads.filter((l) => {
        const pickupDate = parseISO(l.pickupDate);
        return l.driverId === driver.driverId && 
          isWithinInterval(pickupDate, { start: weekRange.start, end: weekRange.end });
      });
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
  }, [drivers, activePeriod, calculateDriverBonus, getWeekRange]);

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
    return calculateDriverPerformanceFromLoads(loads);
  }, [loads, calculateDriverPerformanceFromLoads]);

  // Sync automatic bonuses - now with immediate calculation
  const syncAutomaticBonuses = useCallback(async (updatedLoads?: Load[]) => {
    if (!user) return;

    const currentLoads = updatedLoads || loads;
    const weekStart = format(selectedWeek.start, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Calculate driver performance with the current/updated loads
    const currentPerformance = calculateDriverPerformanceFromLoads(currentLoads);
    
    // Calculate what automatic bonuses should exist
    const newAutoBonuses = currentPerformance
      .filter((driver) => driver.bonusAmount > 0)
      .map((driver) => ({
        driverId: driver.driverId,
        bonusType: 'automatic' as const,
        amount: driver.bonusAmount,
        week: weekStart,
        date: today,
        note: `Weekly bonus for $${driver.totalGross.toLocaleString()} gross (${driver.driverType === 'owner_operator' ? 'Owner Operator' : 'Company Driver'})`,
      }));

    // Get existing automatic bonuses for this week
    const existingAutoForWeek = bonuses.filter(
      b => b.bonusType === 'automatic' && b.week === weekStart
    );

    // Determine bonuses to add, update, or keep
    for (const newBonus of newAutoBonuses) {
      const existing = existingAutoForWeek.find(b => b.driverId === newBonus.driverId);
      
      if (!existing) {
        // Add new bonus
        try {
          const { data, error } = await supabase.from('bonuses').insert({
            user_id: user.id,
            driver_id: newBonus.driverId,
            bonus_type: newBonus.bonusType,
            amount: newBonus.amount,
            week_start: newBonus.week,
            date: newBonus.date,
            note: newBonus.note,
          }).select().single();

          if (error) throw error;
          
          if (data) {
            setBonuses(prev => [...prev, {
              bonusId: data.id,
              driverId: data.driver_id || undefined,
              bonusType: data.bonus_type,
              amount: Number(data.amount),
              week: data.week_start,
              date: data.date,
              note: data.note || '',
              createdAt: data.created_at,
            }]);
          }
        } catch (error) {
          console.error('Error adding automatic bonus:', error);
        }
      } else if (existing.amount !== newBonus.amount) {
        // Update existing bonus if amount changed
        try {
          const { error } = await supabase.from('bonuses')
            .update({ 
              amount: newBonus.amount, 
              note: newBonus.note 
            })
            .eq('id', existing.bonusId);

          if (error) throw error;
          
          setBonuses(prev => prev.map(b => 
            b.bonusId === existing.bonusId 
              ? { ...b, amount: newBonus.amount, note: newBonus.note }
              : b
          ));
        } catch (error) {
          console.error('Error updating automatic bonus:', error);
        }
      }
    }

    // Remove automatic bonuses for drivers who no longer qualify
    const driversWithNewBonuses = new Set(newAutoBonuses.map(b => b.driverId));
    for (const existing of existingAutoForWeek) {
      if (existing.driverId && !driversWithNewBonuses.has(existing.driverId)) {
        try {
          const { error } = await supabase.from('bonuses')
            .delete()
            .eq('id', existing.bonusId);

          if (error) throw error;
          
          setBonuses(prev => prev.filter(b => b.bonusId !== existing.bonusId));
        } catch (error) {
          console.error('Error removing automatic bonus:', error);
        }
      }
    }
  }, [user, loads, bonuses, selectedWeek, calculateDriverPerformanceFromLoads]);

  // Check if load ID already exists
  const loadIdExists = useCallback((loadId: string, excludeLoadId?: string) => {
    return loads.some((l) => l.loadId === loadId && l.loadId !== excludeLoadId);
  }, [loads]);

  // Get all FULL loads (for linking PARTIAL loads)
  const getFullLoads = useCallback(() => {
    return loads.filter((l) => l.loadType === 'FULL');
  }, [loads]);

  const addLoad = useCallback(async (load: Omit<Load, 'createdAt'> & { loadId: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('loads').insert({
        user_id: user.id,
        load_id: load.loadId,
        pickup_date: load.pickupDate,
        delivery_date: load.deliveryDate,
        origin: load.origin,
        destination: load.destination,
        rate: load.rate,
        load_type: load.loadType,
        driver_id: load.driverId || null,
        parent_load_id: load.parentLoadId || null,
      }).select().single();

      if (error) throw error;

      if (data) {
        const newLoad: Load = {
          loadId: data.load_id,
          pickupDate: data.pickup_date,
          deliveryDate: data.delivery_date,
          origin: data.origin,
          destination: data.destination,
          rate: Number(data.rate),
          loadType: data.load_type,
          driverId: data.driver_id || '',
          parentLoadId: data.parent_load_id || undefined,
          createdAt: data.created_at,
        };
        
        // Update loads state and immediately sync bonuses with the new loads array
        setLoads(prev => {
          const updatedLoads = [...prev, newLoad];
          // Sync bonuses immediately with updated loads
          syncAutomaticBonuses(updatedLoads);
          return updatedLoads;
        });
        
        toast.success('Load added successfully');
      }
    } catch (error) {
      console.error('Error adding load:', error);
      toast.error('Failed to add load');
    }
  }, [user, syncAutomaticBonuses]);

  const updateLoad = useCallback(async (loadId: string, updates: Partial<Load>) => {
    if (!user) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.pickupDate) updateData.pickup_date = updates.pickupDate;
      if (updates.deliveryDate) updateData.delivery_date = updates.deliveryDate;
      if (updates.origin) updateData.origin = updates.origin;
      if (updates.destination) updateData.destination = updates.destination;
      if (updates.rate !== undefined) updateData.rate = updates.rate;
      if (updates.loadType) updateData.load_type = updates.loadType;
      if (updates.driverId !== undefined) updateData.driver_id = updates.driverId || null;
      if (updates.parentLoadId !== undefined) updateData.parent_load_id = updates.parentLoadId || null;

      const { error } = await supabase.from('loads')
        .update(updateData)
        .eq('load_id', loadId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLoads(prev => {
        const updatedLoads = prev.map(l => l.loadId === loadId ? { ...l, ...updates } : l);
        // Sync bonuses immediately with updated loads
        syncAutomaticBonuses(updatedLoads);
        return updatedLoads;
      });
      
      toast.success('Load updated successfully');
    } catch (error) {
      console.error('Error updating load:', error);
      toast.error('Failed to update load');
    }
  }, [user, syncAutomaticBonuses]);

  const deleteLoad = useCallback(async (loadId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('loads')
        .delete()
        .eq('load_id', loadId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLoads(prev => {
        const updatedLoads = prev.filter(l => l.loadId !== loadId);
        // Sync bonuses immediately with updated loads
        syncAutomaticBonuses(updatedLoads);
        return updatedLoads;
      });
      
      toast.success('Load deleted successfully');
    } catch (error) {
      console.error('Error deleting load:', error);
      toast.error('Failed to delete load');
    }
  }, [user, syncAutomaticBonuses]);

  const addBonus = useCallback(async (bonus: Omit<Bonus, 'bonusId' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('bonuses').insert({
        user_id: user.id,
        driver_id: bonus.driverId || null,
        bonus_type: bonus.bonusType,
        amount: bonus.amount,
        week_start: bonus.week,
        date: bonus.date,
        note: bonus.note || null,
      }).select().single();

      if (error) throw error;

      if (data) {
        setBonuses(prev => [...prev, {
          bonusId: data.id,
          driverId: data.driver_id || undefined,
          bonusType: data.bonus_type,
          amount: Number(data.amount),
          week: data.week_start,
          date: data.date,
          note: data.note || '',
          createdAt: data.created_at,
        }]);
        toast.success('Bonus added successfully');
      }
    } catch (error) {
      console.error('Error adding bonus:', error);
      toast.error('Failed to add bonus');
    }
  }, [user]);

  const deleteBonus = useCallback(async (bonusId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('bonuses')
        .delete()
        .eq('id', bonusId);

      if (error) throw error;

      setBonuses(prev => prev.filter(b => b.bonusId !== bonusId));
      toast.success('Bonus deleted successfully');
    } catch (error) {
      console.error('Error deleting bonus:', error);
      toast.error('Failed to delete bonus');
    }
  }, [user]);

  // Driver management
  const addDriver = useCallback(async (driver: Omit<Driver, 'driverId' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('drivers').insert({
        user_id: user.id,
        driver_name: driver.driverName,
        driver_type: driver.driverType,
        status: driver.status,
      }).select().single();

      if (error) throw error;

      if (data) {
        setDrivers(prev => [...prev, {
          driverId: data.id,
          driverName: data.driver_name,
          driverType: data.driver_type,
          status: data.status as 'active' | 'inactive',
          createdAt: data.created_at,
        }]);
        toast.success('Driver added successfully');
      }
    } catch (error) {
      console.error('Error adding driver:', error);
      toast.error('Failed to add driver');
    }
  }, [user]);

  const updateDriver = useCallback(async (driverId: string, updates: Partial<Driver>) => {
    if (!user) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.driverName) updateData.driver_name = updates.driverName;
      if (updates.driverType) updateData.driver_type = updates.driverType;
      if (updates.status) updateData.status = updates.status;

      const { error } = await supabase.from('drivers')
        .update(updateData)
        .eq('id', driverId);

      if (error) throw error;

      setDrivers(prev => prev.map(d => d.driverId === driverId ? { ...d, ...updates } : d));
      toast.success('Driver updated successfully');
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver');
    }
  }, [user]);

  const deleteDriver = useCallback(async (driverId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) throw error;

      setDrivers(prev => prev.filter(d => d.driverId !== driverId));
      toast.success('Driver deleted successfully');
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver');
    }
  }, [user]);

  // Prebook management
  const addPrebook = useCallback(async (prebook: Omit<Prebook, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('prebooks').insert({
        user_id: user.id,
        date: prebook.date,
        load_number: prebook.loadNumber || null,
        status: prebook.status,
        note: prebook.note || null,
        file_url: prebook.fileUrl || null,
      }).select().single();

      if (error) throw error;

      if (data) {
        setPrebooks(prev => [...prev, {
          id: data.id,
          date: data.date,
          loadNumber: data.load_number || undefined,
          status: data.status,
          note: data.note || undefined,
          fileUrl: data.file_url || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }]);
        toast.success('Prebook added successfully');
      }
    } catch (error) {
      console.error('Error adding prebook:', error);
      toast.error('Failed to add prebook');
    }
  }, [user]);

  const updatePrebook = useCallback(async (id: string, updates: Partial<Prebook>) => {
    if (!user) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.date) updateData.date = updates.date;
      if (updates.loadNumber !== undefined) updateData.load_number = updates.loadNumber || null;
      if (updates.status) updateData.status = updates.status;
      if (updates.note !== undefined) updateData.note = updates.note || null;
      if (updates.fileUrl !== undefined) updateData.file_url = updates.fileUrl || null;

      const { error } = await supabase.from('prebooks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setPrebooks(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
      toast.success('Prebook updated successfully');
    } catch (error) {
      console.error('Error updating prebook:', error);
      toast.error('Failed to update prebook');
    }
  }, [user]);

  const deletePrebook = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('prebooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrebooks(prev => prev.filter(p => p.id !== id));
      toast.success('Prebook deleted successfully');
    } catch (error) {
      console.error('Error deleting prebook:', error);
      toast.error('Failed to delete prebook');
    }
  }, [user]);

  return {
    loads,
    drivers,
    bonuses,
    prebooks,
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
    addPrebook,
    updatePrebook,
    deletePrebook,
    loadIdExists,
    getFullLoads,
    syncAutomaticBonuses,
    isLoading,
  };
}
