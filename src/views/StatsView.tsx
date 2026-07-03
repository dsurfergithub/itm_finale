import { Database, Download, Upload } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { useStore } from '../context/StoreContext';
import React, { useRef } from 'react';
import { getRankData } from '../utils/leveling';
import { AppState } from '../types';

function isValidBackup(data: unknown): data is AppState {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<AppState>;

  return (
    typeof candidate.respect === 'number' &&
    typeof candidate.credits === 'number' &&
    typeof candidate.strikes === 'number' &&
    Array.isArray(candidate.missions) &&
    Array.isArray(candidate.rewards) &&
    Array.isArray(candidate.logs) &&
    Array.isArray(candidate.categories) &&
    !!candidate.stats &&
    typeof candidate.stats.streak === 'number' &&
    typeof candidate.stats.totalMissions === 'number' &&
    typeof candidate.stats.score === 'number' &&
    Array.isArray(candidate.stats.activity)
  );
}

export function StatsView() {
  const { state, updateState } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    soundManager.playAccept();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dt = new Date().toISOString().split('T')[0];
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `itm_backup_${dt}.json`);
    dlAnchorElem.click();
  };

  const handleRestoreClick = () => {
    soundManager.playClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!isValidBackup(data)) {
          throw new Error('Invalid backup schema');
        }
        updateState(data);
        soundManager.playJackpot();
        alert('DATOS RESTAURADOS CON ÉXITO.');
      } catch (error) {
        soundManager.playError();
        alert('ARCHIVO DE DATOS DAÑADO O INCOMPATIBLE.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const { rank, percentage } = getRankData(state.respect);
  const blocks = Math.floor(percentage / 10);

  return (
    <div className="pt-[calc(7rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] px-4 max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <section className="mb-10 vice-glass neon-panel rounded-3xl p-5 overflow-hidden relative">
        <div className="absolute inset-0 hud-scanline opacity-25" />
        <div className="relative z-10">
          <div className="text-xs font-black text-secondary mb-1 uppercase tracking-[0.25em] cyan-text-glow">Rango actual</div>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-primary uppercase mb-2 tracking-tight neon-text">
            {rank}
          </h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-black uppercase text-tertiary">Respeto ganado</span>
              <span className="text-xs font-black text-tertiary tabular-nums">{state.respect.toLocaleString()} XP</span>
            </div>
            <div className="h-6 w-full border border-tertiary/70 rounded-full p-1 flex gap-1 bg-black/35">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`h-full flex-1 rounded-full ${i < blocks ? 'bg-tertiary shadow-[0_0_10px_rgba(var(--fx-lime),0.9)]' : 'bg-surface-variant'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="vice-glass rounded-2xl border border-primary/30 p-4 hard-shadow flex flex-col justify-between">
          <div className="text-xs font-black uppercase text-on-surface-variant">Racha actual</div>
          <div className="text-2xl font-black text-primary mt-2 tabular-nums neon-text">{state.stats.streak} DÍAS</div>
        </div>
        <div className="vice-glass rounded-2xl border border-primary/30 p-4 hard-shadow flex flex-col justify-between">
          <div className="text-xs font-black uppercase text-on-surface-variant">Misiones totales</div>
          <div className="text-2xl font-black text-primary mt-2 tabular-nums neon-text">{state.stats.totalMissions}</div>
        </div>
        <div className="col-span-2 vice-glass rounded-2xl border border-secondary/40 p-4 hard-shadow">
          <div className="flex justify-between items-center text-secondary mb-2">
            <span className="text-xs font-black uppercase tracking-widest">Puntuación total</span>
            <Database size={20} />
          </div>
          <div className="font-display text-4xl sm:text-[48px] font-black leading-none text-secondary tabular-nums cyan-text-glow">
            {state.stats.score.toLocaleString()}
          </div>
        </div>
      </div>

      <section className="vice-glass rounded-3xl border border-on-surface/10 p-4 hard-shadow mb-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase text-on-surface">Registro de actividad</h3>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Últimos 7 días</span>
        </div>
        <div className="flex items-end justify-between h-32 gap-2 pb-4">
          {state.stats.activity.map((h, i) => (
            <div 
              key={i}
              className={`flex-1 transition-colors cursor-help group relative rounded-t-xl
                ${h > 70 ? 'bg-primary shadow-[0_0_15px_rgba(var(--fx-primary),0.35)]' : 'bg-surface-variant hover:bg-secondary'}
              `}
              style={{ height: `${h}%` }}
              onMouseEnter={() => soundManager.playHover()}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] hidden group-hover:block font-bold">
                 {h}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-on-surface-variant pt-2 border-t border-surface-variant font-mono">
          <span>{new Date(Date.now() - 6 * 86400000).toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'})}</span>
          <span>{new Date(Date.now() - 5 * 86400000).toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'})}</span>
          <span>{new Date(Date.now() - 4 * 86400000).toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'})}</span>
          <span>{new Date(Date.now() - 3 * 86400000).toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'})}</span>
          <span>{new Date(Date.now() - 2 * 86400000).toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'})}</span>
          <span>{new Date(Date.now() - 1 * 86400000).toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'})}</span>
          <span>HOY</span>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={handleBackup}
          className="bg-primary text-on-primary font-black py-4 uppercase tracking-widest flex items-center justify-center gap-2 hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-2xl hover:brightness-110"
        >
          <Download size={20} />
          Copia de seguridad
        </button>
        <button 
          onClick={handleRestoreClick}
          className="border border-secondary/60 text-secondary font-black py-4 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-secondary/10 active:translate-x-1 active:translate-y-1 transition-all rounded-2xl"
        >
          <Upload size={20} />
          Restaurar datos
        </button>
        <input 
          type="file" 
          accept=".json" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
      </section>

      <div className="mt-8 vice-glass rounded-3xl border border-secondary/20 p-4 overflow-hidden relative h-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/10 to-primary-container/20" />
        <div className="absolute inset-x-0 bottom-0 h-20 vice-grid opacity-70" />
        <div className="absolute left-6 bottom-4 text-7xl text-black/25 font-display font-black tracking-tighter">ITM</div>
        <div className="relative z-10 h-full flex flex-col justify-end">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-secondary cyan-text-glow">City archive</p>
          <p className="text-sm text-on-surface-variant uppercase font-bold">Datos locales, progreso y actividad semanal</p>
        </div>
      </div>
    </div>
  );
}
