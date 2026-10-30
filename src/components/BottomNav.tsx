import { Building2, ListChecks, ShoppingBag, Sun, UserRound } from 'lucide-react';
import { Tab } from '../types';
import { useUI } from '../context/UIContext';
import { soundManager } from '../utils/audio';

const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'TODAY', label: 'Hoy', icon: Sun },
  { id: 'MISSIONS', label: 'Misiones', icon: ListChecks },
  { id: 'CITY', label: 'Ciudad', icon: Building2 },
  { id: 'MARKET', label: 'Mercado', icon: ShoppingBag },
  { id: 'PROFILE', label: 'Perfil', icon: UserRound },
];

export function BottomNav() {
  const { tab, setTab } = useUI();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-bg/90 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label="Principal">
      <div className="mx-auto max-w-xl grid grid-cols-5 h-16">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => {
                if (!active) soundManager.playClick();
                setTab(id);
              }}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 text-[0.7rem] font-semibold transition-colors ${active ? 'text-cream' : 'text-muted hover:text-cream-dim'}`}
            >
              <span className={`flex items-center justify-center h-7 w-12 rounded-full transition-colors ${active ? 'bg-gradient-to-r from-coral to-pink text-bg-deep' : ''}`}>
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
