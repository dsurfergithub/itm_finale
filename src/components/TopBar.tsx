import { DollarSign, Star, StarHalf, RotateCcw } from 'lucide-react';
import { getRankData } from '../utils/leveling';

interface TopBarProps {
  respect: number;
  strikes?: number;
  onReset: () => void;
}

export function TopBar({ respect, strikes = 0, onReset }: TopBarProps) {
  const { rank } = getRankData(respect);

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 bg-background border-b-4 border-primary hard-shadow">
      <div className="flex items-center gap-2 max-w-[50%] sm:max-w-none overflow-hidden">
        <h1 className="text-xl md:text-3xl font-black text-primary italic tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis hidden lg:block">
          INTO THE MISSION
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <div className="flex gap-0.5 text-error">
            {Array.from({ length: 10 }).map((_, i) => (
              <Star 
                key={i} 
                className={i < strikes ? 'fill-error' : 'text-surface-variant fill-transparent'} 
                size={14} 
              />
            ))}
          </div>
          <div className="text-sm font-bold text-primary uppercase mt-1 tracking-widest hidden sm:block">
            {rank}: {respect}
          </div>
        </div>
        <button 
          onClick={onReset}
          className="bg-error text-on-error p-2 border-2 border-black hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:brightness-110 shrink-0"
          title="Hard Reset"
        >
          <RotateCcw size={20} strokeWidth={3} />
        </button>
      </div>
    </header>
  );
}
