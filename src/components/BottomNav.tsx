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
    { id: 'SPIN' as Tab, label: 'ESCÁNER', icon: Dices },
    { id: 'PROGRESS' as Tab, label: 'MAPA', icon: TrendingUp },
    { id: 'STORE' as Tab, label: 'MERCADO', icon: ShoppingCart },
    { id: 'STATS' as Tab, label: 'STATS', icon: BarChart2 },
    { id: 'LOG' as Tab, label: 'ARCHIVO', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 px-2 sm:px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="vice-glass neon-panel mx-auto max-w-4xl rounded-2xl h-20 flex justify-around items-center overflow-hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center p-2 w-full h-full transition-all duration-200 active:scale-95 group ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-on-surface-variant hover:text-secondary hover:bg-secondary/5'
              }`}
            >
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-10 rounded-b-full bg-primary shadow-[0_0_18px_rgba(var(--fx-primary),0.9)]" />}
              <Icon
                size={24}
                className={`${isActive ? 'drop-shadow-[0_0_10px_rgba(var(--fx-primary),0.9)]' : 'group-hover:drop-shadow-[0_0_8px_rgba(var(--fx-secondary),0.75)]'}`}
                strokeWidth={isActive ? 2.8 : 2.1}
              />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1 truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
