import { useState } from 'react';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { TeamDashboard } from '@/components/TeamDashboard';
import { LoadsTable } from '@/components/LoadsTable';
import { BonusesPanel } from '@/components/BonusesPanel';
import { DriversPanel } from '@/components/DriversPanel';
import { CalendarNotesPanel } from '@/components/CalendarNotesPanel';
import { useDispatcherData } from '@/hooks/useDispatcherData';
import { TabType } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const {
    loads,
    drivers,
    filteredLoads,
    filteredBonuses,
    calendarNotes,
    metrics,
    driverPerformance,
    selectedWeek,
    setSelectedWeek,
    customDateRange,
    setCustomDateRange,
    useCustomRange,
    setUseCustomRange,
    addLoad,
    updateLoad,
    deleteLoad,
    addBonus,
    deleteBonus,
    addDriver,
    updateDriver,
    deleteDriver,
    addCalendarNote,
    updateCalendarNote,
    deleteCalendarNote,
    loadIdExists,
    getFullLoads,
  } = useDispatcherData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-6 py-6">
        {activeTab === 'team' && (
          <TeamDashboard
            metrics={metrics}
            driverPerformance={driverPerformance}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            customDateRange={customDateRange}
            onCustomDateRangeChange={setCustomDateRange}
            useCustomRange={useCustomRange}
            onToggleCustomRange={setUseCustomRange}
          />
        )}
        
        {activeTab === 'loads' && (
          <LoadsTable
            loads={filteredLoads}
            drivers={drivers}
            onAddLoad={addLoad}
            onUpdateLoad={updateLoad}
            onDeleteLoad={deleteLoad}
            loadIdExists={loadIdExists}
            fullLoads={getFullLoads()}
          />
        )}
        
        {activeTab === 'bonuses' && (
          <BonusesPanel
            bonuses={filteredBonuses}
            drivers={drivers}
            driverPerformance={driverPerformance}
            onAddBonus={addBonus}
            onDeleteBonus={deleteBonus}
          />
        )}
        
        {activeTab === 'drivers' && (
          <DriversPanel
            driverPerformance={driverPerformance}
            allDrivers={drivers}
            allLoads={loads}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            onAddDriver={addDriver}
            onUpdateDriver={updateDriver}
            onDeleteDriver={deleteDriver}
          />
        )}

        {activeTab === 'notes' && (
          <CalendarNotesPanel
            notes={calendarNotes}
            onAddNote={addCalendarNote}
            onUpdateNote={updateCalendarNote}
            onDeleteNote={deleteCalendarNote}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
