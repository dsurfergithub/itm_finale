import { Database, Download, Upload } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { useStore } from '../context/StoreContext';
import { useRef } from 'react';
import { getRankData } from '../utils/leveling';

export function StatsView() {
  const { state, updateState } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    soundManager.playAccept();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
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
        updateState(data);
        soundManager.playJackpot();
        alert('DATOS RESTAURADOS CON ÉXITO.');
      } catch (error) {
        soundManager.playError();
        alert('ARCHIVO DE DATOS DAÑADO.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const { rank, percentage } = getRankData(state.respect);
  const blocks = Math.floor(percentage / 10);

  return (
    <div className="pt-24 pb-32 px-4 max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      
      <section className="mb-10">
        <div className="text-xs font-bold text-primary mb-1">RANGO ACTUAL</div>
        <h2 className="text-3xl sm:text-4xl font-black text-on-surface uppercase mb-2 tracking-tighter">
          {rank}
        </h2>
        
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold uppercase text-tertiary">RESPETO GANADO</span>
            <span className="text-xs font-bold text-tertiary tabular-nums">{state.respect} XP</span>
          </div>
          <div className="h-6 w-full border-2 border-tertiary p-1 flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-full flex-1 ${i < blocks ? 'bg-tertiary shadow-[0_0_10px_var(--color-tertiary)]' : 'bg-surface-variant'}`} 
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-black border-2 border-on-surface p-4 hard-shadow flex flex-col justify-between">
          <div className="text-xs font-bold uppercase text-on-surface-variant">RACHA ACTUAL</div>
          <div className="text-2xl font-bold text-primary mt-2 tabular-nums">{state.stats.streak} DÍAS</div>
        </div>
        <div className="bg-black border-2 border-on-surface p-4 hard-shadow flex flex-col justify-between">
          <div className="text-xs font-bold uppercase text-on-surface-variant">MISIONES TOTALES</div>
          <div className="text-2xl font-bold text-primary mt-2 tabular-nums">{state.stats.totalMissions}</div>
        </div>
        <div className="col-span-2 bg-black border-2 border-secondary p-4 hard-shadow">
          <div className="flex justify-between items-center text-secondary mb-2">
            <span className="text-xs font-bold uppercase">PUNTUACIÓN TOTAL</span>
            <Database size={20} />
          </div>
          <div className="text-4xl sm:text-[48px] font-black leading-none text-secondary tabular-nums">
            {state.stats.score.toLocaleString()}
          </div>
        </div>
      </div>

      <section className="bg-black border-2 border-on-surface p-4 hard-shadow mb-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold uppercase text-on-surface">REGISTRO DE ACTIVIDAD</h3>
          <span className="text-[10px] text-on-surface-variant uppercase">Últimos 7 días</span>
        </div>
        <div className="flex items-end justify-between h-32 gap-2 pb-4">
          {state.stats.activity.map((h, i) => (
            <div 
              key={i}
              className={`flex-1 transition-colors cursor-help group relative
                ${h > 70 ? 'bg-primary shadow-[0_0_15px_rgba(255,198,135,0.3)]' : 'bg-surface-variant hover:bg-primary'}
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
          className="bg-primary text-on-primary font-bold py-4 uppercase flex items-center justify-center gap-2 hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none"
        >
          <Download size={20} />
          COPIA DE SEGURIDAD
        </button>
        <button 
          onClick={handleRestoreClick}
          className="border-2 border-primary text-primary font-bold py-4 uppercase flex items-center justify-center gap-2 hover:bg-primary/10 active:translate-x-1 active:translate-y-1 transition-all rounded-none"
        >
          <Upload size={20} />
          RESTAURAR DATOS
        </button>
        <input 
          type="file" 
          accept=".json" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
      </section>

      <div className="mt-8 border-2 border-on-surface-variant/20 p-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsUMy29ft8aV9MGLAcEpJAJX-3SE9CiATKWJOZm-oTuYpb6HX3Kr2Ebx6HgqwTD2suNtmoPlp6qiqjY4ZDhC9G-tcTK8aG06svDGt9pZUTNMYXWM0-JWYKaOSZoBrBP2oYGTIItYVT-q0iC9iKWqDLz7Enpb3Uk-iUJ-6n4enxI1yVpW52-Yztd0fOEjqibVgRwao1-oFEW0EjLy-7YtKbfx-HrKgCiQS_D5fhcYi3HdofWdo3_GHOuMtrw3xqK44muU4cpWOS5MVP"
          className="w-full h-24 object-cover" 
          alt="Atmospheric City Grime" 
          referrerPolicy="no-referrer"
        />
      </div>

    </div>
  );
}
