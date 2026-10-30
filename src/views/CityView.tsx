import { useMemo, useState } from 'react';
import { Check, Lock, Minus, Play, Plus, Trash2 } from 'lucide-react';
import { District } from '../types';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useMissionActions } from '../hooks/useMissionActions';
import { isAvailable } from '../lib/missions';
import { getRankIndex, RANKS } from '../lib/ranks';
import { formatMinutes, startOfWeek } from '../lib/time';
import { CityPanorama, districtColor, districtLevel } from '../components/Illustrations';
import { Sheet } from '../components/Sheet';

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function CityView() {
  const { state, addDistrict } = useStore();
  const [selectedId, setSelectedId] = useState<string>();
  const [newName, setNewName] = useState('');
  const rankIndex = getRankIndex(state.respect);
  const weekStart = startOfWeek().getTime();

  const weekly = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of state.events) {
      if (e.kind !== 'MISSION_COMPLETED' || e.at < weekStart || !e.category) continue;
      const key = e.category.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [state.events, weekStart]);

  const selected = state.districts.find(d => d.id === selectedId);

  return (
    <div className="page flex flex-col gap-5">
      <section>
        <h1 className="title-display text-5xl sm:text-6xl text-cream">Ciudad</h1>
        <p className="text-cream-dim mt-2">Cada distrito es un área de tu vida. Crece con las misiones que completas allí y cada rango añade algo nuevo a la costa.</p>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto h-56 sm:h-72">
          <CityPanorama districts={state.districts} rankIndex={rankIndex} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        {state.districts.length === 0 && <p className="p-4 text-sm text-cream-dim">Tu costa está vacía. Crea un distrito o completa una misión para levantar los primeros edificios.</p>}
      </section>

      {state.districts.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {state.districts.map((d, i) => {
            const done = weekly.get(d.name.trim().toLowerCase()) ?? 0;
            const pending = state.missions.filter(m => sameName(m.category, d.name) && isAvailable(m, state.missions)).length;
            return (
              <button key={d.id} className="card p-4 text-left hover:bg-surface-2 transition-colors" onClick={() => setSelectedId(d.id)}>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: districtColor(i) }} />
                  <span className="font-semibold text-cream flex-1 min-w-0 truncate">{d.name}</span>
                  <span className="chip">Nivel {districtLevel(d)}</span>
                </div>
                {d.weeklyTarget > 0 ? (
                  <>
                    <p className="text-sm text-cream-dim mt-3">
                      <span className="counter text-cream">{done}</span> de <span className="counter text-cream">{d.weeklyTarget}</span> sesiones esta semana
                      {done >= d.weeklyTarget && <span className="text-teal"> · Objetivo cumplido</span>}
                    </p>
                    <div className="progress mt-2">
                      <div style={{ width: `${Math.min(100, (done / d.weeklyTarget) * 100)}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted mt-3">
                    {done} esta semana · Sin objetivo semanal
                  </p>
                )}
                <p className="text-xs text-muted mt-3">
                  {d.completions} {d.completions === 1 ? 'misión completada' : 'misiones completadas'} · {pending} {pending === 1 ? 'pendiente' : 'pendientes'}
                </p>
              </button>
            );
          })}
        </section>
      )}

      <section className="card p-4">
        <p className="font-semibold">Nuevo distrito</p>
        <form
          className="flex gap-2 mt-3"
          onSubmit={e => {
            e.preventDefault();
            if (!newName.trim()) return;
            addDistrict(newName);
            setNewName('');
          }}
        >
          <input className="input flex-1" value={newName} placeholder="Ej.: Finanzas, Música…" onChange={e => setNewName(e.target.value)} />
          <button className="btn btn-secondary" type="submit" disabled={!newName.trim()}>
            <Plus size={18} /> Añadir
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Desbloqueos de la ciudad</h2>
        <ol className="card divide-y divide-line">
          {RANKS.map((rank, i) => {
            const unlocked = i <= rankIndex;
            return (
              <li key={rank.name} className="flex items-center gap-3 p-3 pl-4">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${unlocked ? 'bg-gradient-to-br from-sun to-coral text-bg-deep' : 'bg-bg-deep text-muted'}`}>
                  {unlocked ? <Check size={16} /> : <Lock size={14} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${unlocked ? 'text-cream' : 'text-muted'}`}>{rank.unlock}</p>
                  <p className="text-xs text-muted">
                    {rank.name} · {rank.min.toLocaleString('es-ES')} de respeto
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <DistrictSheet district={selected} weeklyDone={selected ? weekly.get(selected.name.trim().toLowerCase()) ?? 0 : 0} onClose={() => setSelectedId(undefined)} />
    </div>
  );
}

function DistrictSheet({ district, weeklyDone, onClose }: { district?: District; weeklyDone: number; onClose: () => void }) {
  const { state, updateDistrict, removeDistrict } = useStore();
  const { toast, editMission, setTab } = useUI();
  const actions = useMissionActions();
  const [name, setName] = useState('');
  const [lastId, setLastId] = useState<string>();

  if (district && district.id !== lastId) {
    setLastId(district.id);
    setName(district.name);
  }
  if (!district) return null;

  const missions = state.missions.filter(m => sameName(m.category, district.name) && isAvailable(m, state.missions));
  const saveName = () => {
    if (name.trim() && name.trim() !== district.name) {
      updateDistrict(district.id, { name });
      toast('Distrito renombrado');
    }
  };

  return (
    <Sheet open onClose={onClose} title={district.name}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-bg-deep p-3">
            <p className="counter text-2xl text-cream">{districtLevel(district)}</p>
            <p className="text-xs text-muted">Nivel</p>
          </div>
          <div className="rounded-2xl bg-bg-deep p-3">
            <p className="counter text-2xl text-cream">{district.completions}</p>
            <p className="text-xs text-muted">Completadas</p>
          </div>
          <div className="rounded-2xl bg-bg-deep p-3">
            <p className="counter text-2xl text-cream">{weeklyDone}</p>
            <p className="text-xs text-muted">Esta semana</p>
          </div>
        </div>

        <div className="field">
          <span>Objetivo semanal (sesiones)</span>
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-icon" aria-label="Menos" onClick={() => updateDistrict(district.id, { weeklyTarget: Math.max(0, district.weeklyTarget - 1) })}>
              <Minus size={18} />
            </button>
            <span className="counter text-2xl w-10 text-center">{district.weeklyTarget}</span>
            <button className="btn btn-secondary btn-icon" aria-label="Más" onClick={() => updateDistrict(district.id, { weeklyTarget: Math.min(21, district.weeklyTarget + 1) })}>
              <Plus size={18} />
            </button>
            <span className="text-sm text-muted">{district.weeklyTarget === 0 ? 'Sin objetivo' : `${weeklyDone} de ${district.weeklyTarget} esta semana`}</span>
          </div>
        </div>

        <label className="field">
          <span>Nombre</span>
          <input className="input" value={name} onChange={e => setName(e.target.value)} onBlur={saveName} onKeyDown={e => e.key === 'Enter' && saveName()} />
        </label>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold">Misiones disponibles</p>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onClose();
                editMission(null);
              }}
            >
              <Plus size={16} /> Nueva
            </button>
          </div>
          {missions.length === 0 ? (
            <p className="text-sm text-muted">No hay misiones pendientes en este distrito.</p>
          ) : (
            <div className="rounded-2xl border border-line divide-y divide-line">
              {missions.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted">{formatMinutes(m.durationSeconds / 60)}</p>
                  </div>
                  <button
                    className="btn btn-secondary btn-icon btn-sm"
                    aria-label={`Empezar ${m.name}`}
                    onClick={() => {
                      actions.start(m);
                      onClose();
                      setTab('TODAY');
                    }}
                  >
                    <Play size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn btn-danger"
          onClick={() => {
            const snapshot = removeDistrict(district.id);
            onClose();
            toast('Distrito eliminado. Sus misiones se conservan.', snapshot);
          }}
        >
          <Trash2 size={16} /> Eliminar distrito
        </button>
      </div>
    </Sheet>
  );
}
