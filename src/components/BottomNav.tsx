import { ClipboardList, Dices, TrendingUp, BarChart2, History, ShoppingCart } from 'lucide-react';
import { Tab } from '../types';
import { soundManager } from '../utils/audio';

interface BottomNavProps {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const handleTabClick = (tab: Tab) => {
    soundManager.playClick();
    onChangeTab(tab);
  };

  const tabs = [
    { id: 'MISSIONS' as Tab, label: 'MISIONES', icon: ClipboardList },
    { id: 'SPIN' as Tab, label: 'RULETA', icon: Dices },
    { id: 'PROGRESS' as Tab, label: 'TITULO', icon: TrendingUp },
    { id: 'STORE' as Tab, label: 'TIENDA', icon: ShoppingCart },
    { id: 'STATS' as Tab, label: 'STATS', icon: BarChart2 },
    { id: 'LOG' as Tab, label: 'REGISTRO', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-surface border-t-4 border-primary hard-shadow pb-safe h-20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center justify-center p-2 w-full h-full transition-transform duration-75 active:scale-95 ${
              isActive 
                ? 'bg-primary text-on-primary' 
                : 'text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <Icon 
              size={24} 
              className={isActive ? 'fill-current' : ''} 
              strokeWidth={isActive ? 2.5 : 2} 
            />
            <span className="text-xs font-bold uppercase tracking-widest mt-1">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
