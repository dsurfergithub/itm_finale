import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Flag,
  Flame,
  Gift,
  ShoppingBag,
  Sparkles,
  Upload,
  Volume2,
  XCircle,
} from 'lucide-react';
import { ActivityEvent, EventKind, GameMode } from '../types';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { CsvRow, downloadFile, missionsToCsv, previewCsv } from '../lib/csv';
import { createDemoState } from '../lib/demo';
import { createBackup, normalizeState } from '../lib/persistence';
import { getRankData } from '../lib/ranks';
import { computeBestStreak, computeStreak } from '../lib/streak';
import { addDays, dayKey, formatDateTime, formatMinutes, WEEKDAY_NAMES, WEEKDAY_SHORT } from '../lib/time';
import { Monogram } from '../components/Illustrations';
import { Sheet } from '../components/Sheet';
import { soundManager } from '../utils/audio';

type Section = 'SUMMARY' | 'HISTORY' | 'SETTINGS';

export function ProfileView() {
  const [section, setSection] = useState<Section>('SUMMARY');
  return (
    <div className="page flex flex-col gap-5">
      <h1 className="title-display text-5xl sm:text-6xl text-cream">Perfil</h1>
      <div className="segmented">
        <button aria-pressed={section === 'SUMMARY'} onClick={() => setSection('SUMMARY')}>
          Resumen
        </button>
        <button aria-pressed={section === 'HISTORY'} onClick={() => setSection('HISTORY')}>
          Historial
        </button>
        <button aria-pressed={section === 'SETTINGS'} onClick={() => setSection('SETTINGS')}>
          Ajustes
        </button>
      </div>
      {section === 'SUMMARY' && <Summary />}
      {section === 'HISTORY' && <History />}
      {section === 'SETTINGS' && <Settings />}
    </div>
  );
}

// ─── Resumen ────────────────────────────────────────────────────────────────

function Summary() {
  const { state } = useStore();
  const { rank, percentage, next, toNext } = getRankData(state.respect);
  const streakInput = { activeDays: state.activeDays, repairedDays: state.repairedDays, restDays: state.settings.restDays };
  const streak = computeStreak(streakInput);
  const best = computeBestStreak(streakInput);

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(new Date(), i - 6);
      return { key: dayKey(date), label: i === 6 ? 'Hoy' : WEEKDAY_SHORT[date.getDay()], name: WEEKDAY_NAMES[date.getDay()], count: 0, minutes: 0 };
    });
    const index = new Map(days.map((d, i) => [d.key, i]));
    for (const e of state.events) {
      if (e.kind !== 'MISSION_COMPLETED' || !e.at) continue;
      const i = index.get(dayKey(e.at));
      if (i === undefined) continue;
      days[i].count++;
      days[i].minutes += e.minutes ?? 0;
    }
    return days;
  }, [state.events]);
  const maxCount = Math.max(1, ...week.map(d => d.count));
  const weekTotal = week.reduce((sum, d) => sum + d.count, 0);
  const weekMinutes = week.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <>
      <section className="card p-5 flex items-center gap-4">
        <Monogram size={64} className="rounded-2xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="eyebrow">Rango actual</p>
          <p className="title-display text-3xl sm:text-4xl sunset-text mt-1">{rank}</p>
          <div className="progress mt-3">
            <div style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-sm text-muted mt-1.5">
            <span className="counter text-pink">{state.respect.toLocaleString('es-ES')}</span> de respeto
            {next && ` · ${toNext.toLocaleString('es-ES')} para ${next.name}`}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat icon={<Flame size={16} className="text-coral" />} label="Racha actual" value={`${streak} ${streak === 1 ? 'día' : 'días'}`} />
        <Stat icon={<Award size={16} className="text-sun" />} label="Mejor racha" value={`${best} ${best === 1 ? 'día' : 'días'}`} />
        <Stat icon={<CheckCircle2 size={16} className="text-teal" />} label="Misiones completadas" value={state.totalMissions.toLocaleString('es-ES')} />
        <Stat icon={<Sparkles size={16} className="text-pink" />} label="Puntuación" value={state.score.toLocaleString('es-ES')} />
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Últimos 7 días</h2>
          <p className="text-sm text-muted">
            {weekTotal} {weekTotal === 1 ? 'misión' : 'misiones'} · {formatMinutes(weekMinutes)}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2 items-end h-36" role="list" aria-label="Misiones completadas por día">
          {week.map(d => (
            <div key={d.key} role="listitem" className="flex flex-col items-center justify-end h-full gap-1.5" aria-label={`${d.name}: ${d.count} misiones`}>
              <span className="counter text-xs text-cream-dim">{d.count || ''}</span>
              <div
                className={`w-full max-w-10 rounded-t-lg ${d.count ? 'bg-gradient-to-t from-pink to-coral' : 'bg-surface-2'}`}
                style={{ height: `${d.count ? Math.max(8, (d.count / maxCount) * 100) : 4}%` }}
              />
              <span className={`text-xs ${d.label === 'Hoy' ? 'text-cream font-semibold' : 'text-muted'}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="flex items-center gap-1.5 text-sm text-muted">
        {icon} {label}
      </p>
      <p className="counter text-2xl text-cream mt-2">{value}</p>
    </div>
  );
}

// ─── Historial ──────────────────────────────────────────────────────────────

const EVENT_META: Record<EventKind, { label: string; icon: typeof Flag; color: string }> = {
  MISSION_COMPLETED: { label: 'Misión completada', icon: CheckCircle2, color: 'text-teal' },
  MISSION_FAILED: { label: 'No lograda', icon: XCircle, color: 'text-danger' },
  PURCHASE: { label: 'Canje', icon: ShoppingBag, color: 'text-sun' },
  BONUS: { label: 'Bonificación', icon: Gift, color: 'text-sun' },
  RANK_UP: { label: 'Ascenso', icon: Award, color: 'text-pink' },
  PENALTY: { label: 'Penalización', icon: AlertTriangle, color: 'text-danger' },
  CAMPAIGN_COMPLETED: { label: 'Campaña', icon: Flag, color: 'text-coral' },
  STREAK_REPAIR: { label: 'Racha recuperada', icon: Flame, color: 'text-coral' },
};

const HISTORY_FILTERS: { label: string; kinds: EventKind[] | null }[] = [
  { label: 'Todo', kinds: null },
  { label: 'Misiones', kinds: ['MISSION_COMPLETED', 'MISSION_FAILED', 'CAMPAIGN_COMPLETED'] },
  { label: 'Canjes', kinds: ['PURCHASE', 'STREAK_REPAIR'] },
  { label: 'Bonificaciones', kinds: ['BONUS'] },
  { label: 'Ascensos', kinds: ['RANK_UP'] },
];

function History() {
  const { state } = useStore();
  const [filter, setFilter] = useState(0);
  const [limit, setLimit] = useState(40);
  const kinds = HISTORY_FILTERS[filter].kinds;
  const events = state.events.filter(e => !kinds || kinds.includes(e.kind));

  return (
    <>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {HISTORY_FILTERS.map((f, i) => (
          <button key={f.label} className={`chip min-h-9 px-3 shrink-0 ${filter === i ? 'bg-cream text-bg-deep' : 'hover:bg-surface-3'}`} aria-pressed={filter === i} onClick={() => setFilter(i)}>
            {f.label}
          </button>
        ))}
      </div>
      {events.length === 0 ? (
        <div className="card p-8 text-center text-cream-dim">Aquí aparecerán tus misiones, canjes y ascensos.</div>
      ) : (
        <ul className="card divide-y divide-line">
          {events.slice(0, limit).map(e => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      )}
      {events.length > limit && (
        <button className="btn btn-secondary self-center" onClick={() => setLimit(l => l + 40)}>
          Ver más
        </button>
      )}
    </>
  );
}

function EventRow({ event }: { event: ActivityEvent }) {
  const meta = EVENT_META[event.kind];
  const Icon = meta.icon;
  const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('es-ES')}`;
  return (
    <li className="flex items-center gap-3 p-3 pl-4">
      <Icon size={20} className={`${meta.color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{event.title}</p>
        <p className="text-xs text-muted">
          {meta.label} · {formatDateTime(event.at)}
          {event.minutes ? ` · ${formatMinutes(event.minutes)}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0 text-sm">
        {event.credits ? <p className={`counter ${event.credits > 0 ? 'text-sun' : 'text-cream-dim'}`}>{signed(event.credits)} $</p> : null}
        {event.respect ? <p className={`counter ${event.respect > 0 ? 'text-pink' : 'text-danger'}`}>{signed(event.respect)} R</p> : null}
      </div>
    </li>
  );
}

// ─── Ajustes ────────────────────────────────────────────────────────────────

const MODES: { value: GameMode; label: string; description: string }[] = [
  { value: 'RELAXED', label: 'Relajado', description: 'Sin penalizaciones. Si una misión no sale, simplemente no suma.' },
  { value: 'STANDARD', label: 'Estándar', description: 'No lograr una misión resta la mitad del respeto que daba.' },
  { value: 'DEMANDING', label: 'Exigente', description: 'Además suma estrellas; con diez pierdes la mitad de tus créditos. Rechazar al escáner también cuenta.' },
];

function Settings() {
  const { state, updateSettings, replaceState, resetAll, addMissions } = useStore();
  const { toast, confirm, setTab } = useUI();
  const backupInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const { settings } = state;

  const readFile = (e: React.ChangeEvent<HTMLInputElement>, onText: (text: string) => void) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file.text().then(onText, () => toast('No se pudo leer el archivo'));
  };

  const restoreBackup = (text: string) => {
    let restored = null;
    try {
      restored = normalizeState(JSON.parse(text));
    } catch {
      restored = null;
    }
    if (!restored) {
      soundManager.playError();
      toast('El archivo no es una copia válida de Into The Mission');
      return;
    }
    const next = restored;
    confirm({
      title: 'Restaurar copia',
      message: `Se reemplazará tu progreso actual por la copia (${next.missions.length} misiones, ${next.events.length} registros).`,
      confirmLabel: 'Restaurar',
    }).then(ok => {
      if (!ok) return;
      const snapshot = state;
      replaceState(next);
      soundManager.playSuccess();
      toast('Copia restaurada', snapshot);
    });
  };

  return (
    <>
      <section className="card p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Modo de juego</h2>
        <div className="flex flex-col gap-2">
          {MODES.map(m => (
            <button
              key={m.value}
              className={`text-left rounded-2xl border p-3 transition-colors ${settings.mode === m.value ? 'border-coral bg-coral/10' : 'border-line hover:bg-surface-2'}`}
              aria-pressed={settings.mode === m.value}
              onClick={() => updateSettings({ mode: m.value })}
            >
              <p className="font-semibold">{m.label}</p>
              <p className="text-sm text-cream-dim mt-0.5">{m.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">Días de descanso</h2>
        <p className="text-sm text-cream-dim mt-1">Estos días no rompen tu racha aunque no completes misiones.</p>
        <div className="grid grid-cols-7 gap-1.5 mt-3">
          {[1, 2, 3, 4, 5, 6, 0].map(day => {
            const on = settings.restDays.includes(day);
            return (
              <button
                key={day}
                className={`h-11 rounded-xl font-semibold ${on ? 'bg-teal text-bg-deep' : 'bg-bg-deep text-cream-dim border border-line'}`}
                aria-pressed={on}
                aria-label={WEEKDAY_NAMES[day]}
                onClick={() => updateSettings({ restDays: on ? settings.restDays.filter(d => d !== day) : [...settings.restDays, day] })}
              >
                {WEEKDAY_SHORT[day]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Volume2 size={18} /> Sonido
          </h2>
          <button
            role="switch"
            aria-checked={settings.soundEnabled}
            aria-label="Activar sonido"
            className={`relative h-7 w-12 rounded-full transition-colors ${settings.soundEnabled ? 'bg-coral' : 'bg-surface-3'}`}
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-cream transition-all ${settings.soundEnabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <label className="flex items-center gap-3">
          <span className="text-sm text-cream-dim w-16">Volumen</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            disabled={!settings.soundEnabled}
            className="flex-1 accent-coral"
            onChange={e => updateSettings({ volume: Number(e.target.value) })}
            onPointerUp={() => soundManager.playSuccess()}
          />
        </label>
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Datos</h2>
        <p className="text-sm text-cream-dim">Tu progreso se guarda en este dispositivo. Haz copias de vez en cuando.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button className="btn btn-secondary" onClick={() => downloadFile(`into-the-mission_${dayKey()}.json`, createBackup(state), 'application/json')}>
            <Download size={18} /> Exportar copia
          </button>
          <button className="btn btn-secondary" onClick={() => backupInput.current?.click()}>
            <Upload size={18} /> Restaurar copia
          </button>
          <button className="btn btn-secondary" onClick={() => csvInput.current?.click()}>
            <FileSpreadsheet size={18} /> Importar misiones (CSV)
          </button>
          <button className="btn btn-secondary" onClick={() => downloadFile(`misiones_${dayKey()}.csv`, missionsToCsv(state.missions.filter(m => !m.archived && !m.campaignId)), 'text/csv;charset=utf-8')}>
            <Download size={18} /> {state.missions.length ? 'Exportar misiones (CSV)' : 'Descargar plantilla CSV'}
          </button>
        </div>
        <input ref={backupInput} type="file" accept=".json,application/json" className="hidden" onChange={e => readFile(e, restoreBackup)} />
        <input ref={csvInput} type="file" accept=".csv,text/csv" className="hidden" onChange={e => readFile(e, text => setCsvRows(previewCsv(text, state.missions)))} />
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="font-semibold">Demostración y reinicio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            className="btn btn-secondary"
            onClick={async () => {
              const ok = await confirm({ title: 'Cargar demostración', message: 'Se reemplazará tu progreso actual por datos de ejemplo.', confirmLabel: 'Cargar ejemplo' });
              if (!ok) return;
              const snapshot = state;
              replaceState({ ...createDemoState(), settings });
              setTab('TODAY');
              toast('Demostración cargada', snapshot);
            }}
          >
            <Sparkles size={18} /> Cargar demostración
          </button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              const ok = await confirm({
                title: 'Empezar desde cero',
                message: 'Se borrarán misiones, distritos, recompensas, créditos e historial de este dispositivo. Tus ajustes se conservan.',
                confirmLabel: 'Borrar todo',
                danger: true,
              });
              if (!ok) return;
              const snapshot = state;
              resetAll();
              setTab('TODAY');
              toast('Progreso borrado', snapshot);
            }}
          >
            <AlertTriangle size={18} /> Empezar desde cero
          </button>
        </div>
      </section>

      <CsvPreview
        rows={csvRows}
        onClose={() => setCsvRows(null)}
        onImport={rows => {
          addMissions(rows.map(r => r.draft));
          soundManager.playSuccess();
          toast(`${rows.length} ${rows.length === 1 ? 'misión importada' : 'misiones importadas'}`);
          setCsvRows(null);
        }}
      />
    </>
  );
}

function CsvPreview({ rows, onClose, onImport }: { rows: CsvRow[] | null; onClose: () => void; onImport: (rows: CsvRow[]) => void }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lastRows, setLastRows] = useState<CsvRow[] | null>(null);

  if (rows !== lastRows) {
    setLastRows(rows);
    // Duplicates and invalid rows start unchecked.
    setSelected(new Set((rows ?? []).filter(r => !r.errors.length && !r.duplicate).map(r => r.line)));
  }
  if (!rows) return null;

  const valid = rows.filter(r => !r.errors.length);
  const toImport = valid.filter(r => selected.has(r.line));

  return (
    <Sheet
      open
      onClose={onClose}
      title="Vista previa del CSV"
      size="lg"
      footer={
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary flex-1" disabled={toImport.length === 0} onClick={() => onImport(toImport)}>
            Importar {toImport.length} {toImport.length === 1 ? 'misión' : 'misiones'}
          </button>
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="text-cream-dim">El archivo no contiene filas. Columnas esperadas: NOMBRE, DIFICULTAD, UBICACION, DURACION_MINUTOS, RECOMPENSA_CASH, RECOMPENSA_RESPETO, CATEGORIA, RECURRENCIA.</p>
      ) : (
        <>
          <p className="text-sm text-cream-dim mb-3">
            {valid.length} válidas · {rows.filter(r => r.duplicate).length} posibles duplicados · {rows.length - valid.length} con errores
          </p>
          <ul className="rounded-2xl border border-line divide-y divide-line">
            {rows.map(r => {
              const disabled = r.errors.length > 0;
              return (
                <li key={r.line} className={`flex items-start gap-3 p-3 ${disabled ? 'opacity-60' : ''}`}>
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 accent-coral shrink-0"
                    disabled={disabled}
                    checked={selected.has(r.line)}
                    aria-label={`Importar ${r.draft.name || `línea ${r.line}`}`}
                    onChange={e => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(r.line);
                      else next.delete(r.line);
                      setSelected(next);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium break-words">{r.draft.name || <span className="text-muted">(sin nombre)</span>}</p>
                    <p className="text-xs text-muted">
                      Línea {r.line} · {r.draft.category} · {r.draft.minutes} min · ${r.draft.rewardCash.toLocaleString('es-ES')}
                    </p>
                    {r.duplicate && <p className="text-xs text-sun mt-1">Ya existe una misión igual en este distrito</p>}
                    {r.errors.map(err => (
                      <p key={err} className="text-xs text-danger mt-1">
                        {err}
                      </p>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
