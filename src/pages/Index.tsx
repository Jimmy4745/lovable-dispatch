import { useState } from 'react';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { TeamDashboard } from '@/components/TeamDashboard';
import { LoadsTable } from '@/components/LoadsTable';
import { BonusesPanel } from '@/components/BonusesPanel';
import { DriversPanel } from '@/components/DriversPanel';
import { useDispatcherData } from '@/hooks/useDispatcherData';
import { TabType } from '@/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const {
    drivers,
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
    addLoad,
    updateLoad,
    deleteLoad,
    addBonus,
    deleteBonus,
  } = useDispatcherData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-6 py-6">
        {activeTab === 'team' && (
          <TeamDashboard
            metrics={metrics}
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
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
