import { Star } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { getRankData } from '../lib/ranks';
import { Monogram } from './Illustrations';

export function AppHeader() {
  const { state } = useStore();
  const { setTab } = useUI();
  const { rank } = getRankData(state.respect);
  const showStrikes = state.settings.mode === 'DEMANDING';

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-bg/85 backdrop-blur-md border-b border-line pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-5xl h-16 px-4 md:px-6 flex items-center gap-3">
        <button className="flex items-center gap-2.5 min-w-0" onClick={() => setTab('TODAY')} aria-label="Ir a Hoy">
          <Monogram size={36} className="shrink-0 rounded-[10px]" />
          <span className="min-w-0 text-left leading-none">
            <span className="block title-display text-[1.35rem] text-cream whitespace-nowrap">
              <span className="sm:hidden">ITM</span>
              <span className="hidden sm:inline">Into The Mission</span>
            </span>
            <span className="block text-[0.7rem] font-medium text-muted mt-1 truncate">{rank}</span>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {showStrikes && state.strikes > 0 && (
            <span className="chip text-danger" title={`${state.strikes} de 10 estrellas de penalización`}>
              <Star size={12} className="fill-danger" />
              <span className="counter">{state.strikes}/10</span>
            </span>
          )}
          <button className="chip min-h-8 px-3 bg-surface-2 hover:bg-surface-3" onClick={() => setTab('MARKET')} aria-label={`${state.credits} créditos`}>
            <span className="text-sun">$</span>
            <span className="counter text-cream">{state.credits.toLocaleString('es-ES')}</span>
          </button>
          <button className="chip min-h-8 px-3 bg-surface-2 hover:bg-surface-3" onClick={() => setTab('PROFILE')} aria-label={`${state.respect} de respeto`}>
            <span className="text-pink font-bold">R</span>
            <span className="counter text-cream">{state.respect.toLocaleString('es-ES')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
