import { useState, useMemo, useCallback, useEffect } from 'react';
import { Load, Driver, Bonus, DateRange, WeekRange, DriverType, Prebook, CalendarNote } from '@/types';
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
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedWeek, setSelectedWeek] = useState<WeekRange>(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);
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
        const [loadsRes, driversRes, bonusesRes, prebooksRes, notesRes] = await Promise.all([
          supabase.from('loads').select('*').order('pickup_date', { ascending: false }),
          supabase.from('drivers').select('*').order('driver_name'),
          supabase.from('bonuses').select('*').order('date', { ascending: false }),
          supabase.from('prebooks').select('*').order('date'),
          supabase.from('calendar_notes').select('*').order('date'),
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
            truckNumber: d.truck_number || undefined,
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

        if (notesRes.data) {
          setCalendarNotes(notesRes.data.map(n => ({
            id: n.id,
            date: n.date,
            note: n.note,
            isCompleted: n.is_completed,
            createdAt: n.created_at,
            updatedAt: n.updated_at,
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

      if (useCustomRange && customDateRange) {
        return isWithinInterval(pickupDate, { start: customDateRange.from, end: customDateRange.to });
      }

      // Week mode: Monday -> next Monday (end is exclusive)
      return pickupDate >= selectedWeek.start && pickupDate < selectedWeek.end;
    });
  }, [loads, useCustomRange, customDateRange, selectedWeek]);

  const filteredBonuses = useMemo(() => {
    return bonuses.filter((bonus) => {
      const bonusDate = parseISO(bonus.date);

      if (useCustomRange && customDateRange) {
        return isWithinInterval(bonusDate, { start: customDateRange.from, end: customDateRange.to });
      }

      // Week mode: Monday -> next Monday (end is exclusive)
      return bonusDate >= selectedWeek.start && bonusDate < selectedWeek.end;
    });
  }, [bonuses, useCustomRange, customDateRange, selectedWeek]);

  // Get the week range for a given date (Monday -> next Monday)
  // NOTE: `end` is the next Monday and should be treated as an exclusive bound for pickup-date filtering.
  const getWeekRange = useCallback((date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = addDays(weekStart, 7); // next Monday
    return { start: weekStart, end: weekEnd };
  }, []);

  // Commission rates by driver type
  const getCommissionRates = useCallback((driverType: DriverType) => {
    if (driverType === 'company_driver') {
      return { fullRate: 0.0175, partialRate: 0.025 };
    }
    return { fullRate: 0.01, partialRate: 0.02 };
  }, []);

  // Calculate driver performance with bonuses based on loads within the week (Monday -> next Monday)
  // Weekly gross rule: count loads picked up within the week and delivered by next Monday.
  const calculateDriverPerformanceFromLoads = useCallback((currentLoads: Load[], weekAnchor: Date) => {
    const weekRange = getWeekRange(weekAnchor);

    return drivers.filter(d => d.status === 'active').map((driver) => {
      const driverLoads = currentLoads.filter((l) => {
        if (l.driverId !== driver.driverId) return false;

        const pickupDate = parseISO(l.pickupDate);
        const deliveryDate = parseISO(l.deliveryDate);

        const pickupInWeek = pickupDate >= weekRange.start && pickupDate < weekRange.end;
        const deliveredByNextMonday = deliveryDate <= weekRange.end; // include next Monday deliveries

        return pickupInWeek && deliveredByNextMonday;
      });

      const totalGross = driverLoads.reduce((sum, l) => sum + l.rate, 0);
      const loadCount = driverLoads.length;
      
      return {
        ...driver,
        totalGross,
        loadCount,
      };
    });
  }, [drivers, getWeekRange]);

  const metrics = useMemo(() => {
    const fullLoadsGross = filteredLoads
      .filter((l) => l.loadType === 'FULL')
      .reduce((sum, l) => sum + l.rate, 0);
    
    const partialLoadsGross = filteredLoads
      .filter((l) => l.loadType === 'PARTIAL')
      .reduce((sum, l) => sum + l.rate, 0);
    
    const totalGross = fullLoadsGross + partialLoadsGross;
    
    const totalBonuses = filteredBonuses.reduce((sum, b) => sum + b.amount, 0);
    
    // Calculate commission per load based on driver type
    let cdFullGross = 0, cdPartialGross = 0, ooFullGross = 0, ooPartialGross = 0;
    filteredLoads.forEach(load => {
      const driver = drivers.find(d => d.driverId === load.driverId);
      const driverType = driver?.driverType || 'company_driver';
      if (load.loadType === 'FULL') {
        if (driverType === 'company_driver') cdFullGross += load.rate;
        else ooFullGross += load.rate;
      } else {
        if (driverType === 'company_driver') cdPartialGross += load.rate;
        else ooPartialGross += load.rate;
      }
    });

    const cdFullCommission = cdFullGross * 0.0175;
    const cdPartialCommission = cdPartialGross * 0.025;
    const ooFullCommission = ooFullGross * 0.01;
    const ooPartialCommission = ooPartialGross * 0.02;

    const fullLoadCommission = cdFullCommission + ooFullCommission;
    const partialLoadCommission = cdPartialCommission + ooPartialCommission;
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
  }, [filteredLoads, filteredBonuses, drivers]);

  const driverPerformance = useMemo(() => {
    return calculateDriverPerformanceFromLoads(loads, activePeriod.start);
  }, [loads, activePeriod.start, calculateDriverPerformanceFromLoads]);


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
        
        setLoads(prev => [...prev, newLoad]);
        
        toast.success('Load added successfully');
      }
    } catch (error) {
      console.error('Error adding load:', error);
      toast.error('Failed to add load');
    }
  }, [user]);

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

      setLoads(prev => prev.map(l => l.loadId === loadId ? { ...l, ...updates } : l));
      
      toast.success('Load updated successfully');
    } catch (error) {
      console.error('Error updating load:', error);
      toast.error('Failed to update load');
    }
  }, [user]);

  const deleteLoad = useCallback(async (loadId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('loads')
        .delete()
        .eq('load_id', loadId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLoads(prev => prev.filter(l => l.loadId !== loadId));
      
      toast.success('Load deleted successfully');
    } catch (error) {
      console.error('Error deleting load:', error);
      toast.error('Failed to delete load');
    }
  }, [user]);

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
        truck_number: driver.truckNumber || null,
        status: driver.status,
      }).select().single();

      if (error) throw error;

      if (data) {
        setDrivers(prev => [...prev, {
          driverId: data.id,
          driverName: data.driver_name,
          driverType: data.driver_type,
          truckNumber: data.truck_number || undefined,
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
      if (updates.truckNumber !== undefined) updateData.truck_number = updates.truckNumber || null;
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

  // Calendar notes management
  const addCalendarNote = useCallback(async (note: Omit<CalendarNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from('calendar_notes').insert({
        user_id: user.id,
        date: note.date,
        note: note.note,
        is_completed: note.isCompleted,
      }).select().single();

      if (error) throw error;

      if (data) {
        setCalendarNotes(prev => [...prev, {
          id: data.id,
          date: data.date,
          note: data.note,
          isCompleted: data.is_completed,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }]);
        toast.success('Note added successfully');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  }, [user]);

  const updateCalendarNote = useCallback(async (id: string, updates: Partial<CalendarNote>) => {
    if (!user) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.date) updateData.date = updates.date;
      if (updates.note !== undefined) updateData.note = updates.note;
      if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;

      const { error } = await supabase.from('calendar_notes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setCalendarNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
      toast.success('Note updated');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  }, [user]);

  const deleteCalendarNote = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('calendar_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCalendarNotes(prev => prev.filter(n => n.id !== id));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  }, [user]);

  return {
    loads,
    drivers,
    bonuses,
    prebooks,
    calendarNotes,
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
    addCalendarNote,
    updateCalendarNote,
    deleteCalendarNote,
    loadIdExists,
    getFullLoads,
    isLoading,
  };
}
