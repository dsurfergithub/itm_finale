import { useState } from 'react';
import { SegmentedProgressBar } from '../components/SegmentedProgressBar';
import { Trash2 } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { useStore } from '../context/StoreContext';
import { getRankData } from '../utils/leveling';

export function ProgressView() {
  const { state, addCategory, removeCategory } = useStore();
  const [newCat, setNewCat] = useState('');

  const handleDelete = (id: string) => {
    soundManager.playError();
    removeCategory(id);
  };

  const handleAdd = () => {
    if (newCat.trim()) {
      soundManager.playClick();
      addCategory(newCat.trim().toUpperCase());
      setNewCat('');
    }
  };

  const getColorClass = (index: number) => {
    const colors = ['bg-tertiary', 'bg-secondary', 'bg-error', 'bg-primary-container'];
    return colors[index % colors.length];
  };

  const { rank, percentage } = getRankData(state.respect);
  const passedMissions = state.missions.filter(m => m.status === 'PASSED').length;
  const efiRatio = state.missions.length > 0 ? Math.floor((passedMissions / state.missions.length) * 100) : 100;

  return (
    <div className="pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] px-4 max-w-3xl mx-auto space-y-12 animate-in slide-in-from-right-4 duration-300">
      
      <section>
        <div className="flex items-center justify-between mb-4 border-l-8 border-primary pl-2">
          <h2 className="text-2xl font-bold text-primary uppercase">ESTADÍSTICAS DE RESPETO</h2>
          <div className="bg-primary text-on-primary px-2 py-0.5 font-bold text-sm">NIVEL {Math.floor(state.respect / 100)}</div>
        </div>

        <div className="space-y-6 bg-surface-container-low p-4 border-2 border-outline-variant hard-shadow-lg">
          {state.categories.length === 0 && <p className="text-on-surface-variant font-bold text-sm">NO HAY CATEGORÍAS</p>}
          {state.categories.map((cat, i) => {
            const colorClass = getColorClass(i);
            const textColorClass = colorClass.replace('bg-', 'text-');
            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold uppercase text-on-surface">{cat.name}</span>
                  <span className={`text-xs font-bold ${textColorClass}`}>{cat.percentage}% - {cat.label}</span>
                </div>
                <SegmentedProgressBar percentage={cat.percentage} colorClass={colorClass} />
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary uppercase mb-4 border-l-8 border-primary pl-2">
          OPERACIONES DE CAMPO
        </h2>
        
        <div className="bg-black p-4 border-2 border-secondary shadow-[4px_4px_0px_0px_var(--color-secondary-container)]">
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold text-secondary uppercase tracking-widest">
              NUEVO OBJETIVO DE RESPETO
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="EJ: MEDITACIÓN"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 bg-surface text-secondary border-2 border-secondary p-2 font-bold focus:ring-0 focus:outline-none placeholder:text-secondary/30 uppercase rounded-none"
              />
              <button 
                onClick={handleAdd}
                className="bg-secondary text-on-secondary px-6 font-bold uppercase active:scale-95 transition-transform rounded-none"
              >
                AÑADIR
              </button>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            {state.categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-2 border-b border-outline-variant hover:bg-surface-variant group transition-colors">
                <span className="text-base font-bold text-on-surface">{cat.name}</span>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="text-error opacity-50 group-hover:opacity-100 hover:scale-110 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative group mt-8">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-tertiary blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-surface p-6 border-2 border-primary hard-shadow">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-tertiary material-symbols-outlined text-4xl leading-none">↗</span>
            <h3 className="text-xl font-bold text-on-surface uppercase">PROGRESO TOTAL</h3>
          </div>
          <p className="text-base text-on-surface-variant mt-2">
            Tu progreso actual en el rango. Completa misiones para ganar respeto y ascender.
          </p>
          <div className="mt-6 flex justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.stats.totalMissions}</div>
              <div className="text-xs font-bold text-outline uppercase">MISIONES</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-tertiary">{efiRatio}%</div>
              <div className="text-xs font-bold text-outline uppercase">EFI_RATIO</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary truncate max-w-[80px]">{rank}</div>
              <div className="text-xs font-bold text-outline uppercase">RANGO</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
