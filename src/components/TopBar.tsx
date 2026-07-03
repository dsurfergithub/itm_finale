import { Banknote, RotateCcw, ShieldAlert, Star } from 'lucide-react';
import { getRankData } from '../utils/leveling';

interface TopBarProps {
  respect: number;
  credits: number;
  strikes?: number;
  onReset: () => void;
}

export function TopBar({ respect, credits, strikes = 0, onReset }: TopBarProps) {
  const { rank } = getRankData(respect);

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-3 sm:px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
      <div className="vice-glass neon-panel mx-auto max-w-6xl rounded-2xl px-3 sm:px-4 py-3 flex justify-between items-center gap-3 overflow-hidden relative palm-silhouette text-primary">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-tertiary shadow-[0_0_14px_rgba(var(--fx-lime),0.9)] animate-pulse" />
            <span className="text-[10px] sm:text-xs text-secondary uppercase tracking-[0.35em] font-black cyan-text-glow">Mission OS</span>
          </div>
          <h1 className="font-display text-lg sm:text-2xl md:text-3xl font-black text-primary uppercase tracking-tight neon-text truncate">
            Into The Mission
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2 bg-black/35 border border-secondary/30 px-3 py-2 rounded-xl">
            <ShieldAlert className="text-secondary" size={18} />
            <div className="leading-none">
              <div className="text-[9px] uppercase text-on-surface-variant font-black tracking-widest">Rango</div>
              <div className="text-xs font-black text-secondary uppercase max-w-[9rem] truncate">{rank}</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-black/35 border border-primary/30 px-3 py-2 rounded-xl">
            <Banknote className="text-tertiary" size={18} />
            <div className="leading-none text-right">
              <div className="text-[9px] uppercase text-on-surface-variant font-black tracking-widest">Créditos</div>
              <div className="text-sm font-black text-tertiary tabular-nums">${credits.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-0.5 text-error" title={`${strikes}/10 estrellas de penalización`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <Star
                  key={i}
                  className={i < strikes ? 'fill-error glow-star' : 'text-outline-variant fill-transparent'}
                  size={13}
                />
              ))}
            </div>
            <div className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest tabular-nums">
              {respect.toLocaleString()} RESP
            </div>
          </div>

          <button
            onClick={onReset}
            className="bg-error/90 text-white p-2 border border-white/15 rounded-xl hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:brightness-110 shrink-0"
            title="Reiniciar partida"
          >
            <RotateCcw size={19} strokeWidth={3} />
          </button>
        </div>
      </div>
    </header>
  );
}
