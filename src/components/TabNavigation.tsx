import { TabType } from '@/types';
import { Users, Package, Gift, UserCheck, CalendarDays } from 'lucide-react';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
  { id: 'loads', label: 'Loads', icon: <Package className="w-4 h-4" /> },
  { id: 'bonuses', label: 'Bonuses', icon: <Gift className="w-4 h-4" /> },
  { id: 'drivers', label: 'Drivers', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'notes', label: 'Notes', icon: <CalendarDays className="w-4 h-4" /> },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'tab-active'
                  : 'tab-inactive border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
