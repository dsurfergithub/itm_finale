import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Radar, RefreshCw } from 'lucide-react';
import { Difficulty, Mission } from '../types';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useMissionActions } from '../hooks/useMissionActions';
import { DIFFICULTY_LABEL, isAvailable } from '../lib/missions';
import { dayKey, formatMinutes } from '../lib/time';
import { Scene } from '../components/Illustrations';
import { Sheet } from '../components/Sheet';
import { soundManager } from '../utils/audio';

const TIMES = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 h', value: 60 },
  { label: 'Sin límite', value: Infinity },
];
const ENERGY: { label: string; value: Difficulty }[] = [
  { label: 'Baja', value: 'EASY' },
  { label: 'Media', value: 'NORMAL' },
  { label: 'Alta', value: 'HARD' },
];
const LEVEL: Record<Difficulty, number> = { EASY: 0, NORMAL: 1, HARD: 2 };

/** Picks a mission that fits the time, energy and place the user has right now. */
export function ScannerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, rejectSuggestion } = useStore();
  const { setTab } = useUI();
  const actions = useMissionActions();
  const [time, setTime] = useState(30);
  const [energy, setEnergy] = useState<Difficulty>('NORMAL');
  const [place, setPlace] = useState('');
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<Mission | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const skipped = useRef(new Set<string>());
  const timer = useRef<number | undefined>(undefined);

  const now = Date.now();
  const available = state.missions.filter(m => isAvailable(m, state.missions, now));
  const places = useMemo(
    () => [...new Set(available.map(m => m.location.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.missions],
  );

  useEffect(() => {
    if (!open) {
      window.clearInterval(timer.current);
      setScanning(false);
      setResult(null);
      setNoMatch(false);
      skipped.current.clear();
    }
  }, [open]);

  const matches = available.filter(
    m =>
      m.durationSeconds / 60 <= time &&
      LEVEL[m.difficulty] <= LEVEL[energy] &&
      (!place || !m.location || m.location.toLowerCase() === place.toLowerCase()),
  );

  const scan = () => {
    const pool = matches.filter(m => !skipped.current.has(m.id));
    const candidates = pool.length ? pool : matches;
    setResult(null);
    setNoMatch(false);
    if (candidates.length === 0) {
      soundManager.playError();
      setNoMatch(true);
      return;
    }
    if (!pool.length) skipped.current.clear();

    // Featured and due missions are more likely to come up.
    const today = dayKey();
    const weighted = candidates.flatMap(m => Array(1 + (m.featured ? 3 : 0) + (m.dueDate && m.dueDate <= today ? 2 : 0)).fill(m) as Mission[]);
    const pick = weighted[Math.floor(Math.random() * weighted.length)];

    setScanning(true);
    let ticks = 0;
    timer.current = window.setInterval(() => {
      soundManager.playScan();
      setPreview(candidates[ticks % candidates.length].name);
      ticks++;
      if (ticks > 9) {
        window.clearInterval(timer.current);
        setScanning(false);
        setResult(pick);
        soundManager.playAccept();
      }
    }, 110);
  };

  const another = () => {
    if (result) skipped.current.add(result.id);
    if (state.settings.mode === 'DEMANDING') rejectSuggestion();
    scan();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Escáner de misiones">
      <div className="flex flex-col gap-4">
        <p className="text-cream-dim text-sm">Dime cuánto tiempo y energía tienes, y dónde estás. Te propongo una misión que encaje.</p>

        <div className="field">
          <span>Tiempo disponible</span>
          <div className="segmented">
            {TIMES.map(t => (
              <button key={t.label} aria-pressed={time === t.value} onClick={() => setTime(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Energía</span>
          <div className="segmented">
            {ENERGY.map(e => (
              <button key={e.value} aria-pressed={energy === e.value} onClick={() => setEnergy(e.value)}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Dónde estás</span>
          <select className="input" value={place} onChange={e => setPlace(e.target.value)}>
            <option value="">En cualquier sitio</option>
            {places.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-muted">
          {matches.length} {matches.length === 1 ? 'misión encaja' : 'misiones encajan'} de {available.length} disponibles.
        </p>

        {!result && (
          <button className="btn btn-primary btn-lg" onClick={scan} disabled={scanning}>
            <Radar size={18} className={scanning ? 'animate-spin' : ''} />
            {scanning ? preview || 'Buscando…' : 'Buscar misión'}
          </button>
        )}

        {noMatch && (
          <div className="rounded-2xl bg-bg-deep border border-line p-4 text-sm text-cream-dim">
            Ninguna misión encaja con esto. Prueba con más tiempo, otra energía u «En cualquier sitio».
          </div>
        )}

        {result && (
          <div className="rounded-2xl overflow-hidden border border-line bg-bg-deep animate-pop">
            <Scene category={result.category} seed={result.id} className="h-24 w-full block" />
            <div className="p-4">
              <p className="eyebrow">Propuesta</p>
              <p className="text-xl font-semibold mt-1">{result.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="chip">{formatMinutes(result.durationSeconds / 60)}</span>
                <span className="chip">{DIFFICULTY_LABEL[result.difficulty]}</span>
                {result.category && <span className="chip text-teal">{result.category}</span>}
                {result.location && <span className="chip">{result.location}</span>}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn btn-secondary flex-1" onClick={another}>
                  <RefreshCw size={16} /> {state.settings.mode === 'DEMANDING' ? 'Otra (−1 estrella)' : 'Otra opción'}
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => {
                    actions.start(result);
                    onClose();
                    setTab('TODAY');
                  }}
                >
                  <Play size={16} /> Empezar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
