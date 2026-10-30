import { useMemo, useState } from 'react';
import { Check, Flag, Lock, MoreHorizontal, Play, Plus, Radar, Search, Trash2 } from 'lucide-react';
import { Campaign, Difficulty, Mission } from '../types';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useMissionActions } from '../hooks/useMissionActions';
import { useNow } from '../hooks/useNow';
import { campaignProgress, isDoneForPeriod, isLocked, suggestRewards } from '../lib/missions';
import { dayKey, formatMinutes } from '../lib/time';
import { MissionCard } from '../components/MissionCard';
import { ActionSheet, Sheet } from '../components/Sheet';
import { ScannerSheet } from './ScannerSheet';
import { soundManager } from '../utils/audio';

type StatusFilter = 'PENDING' | 'DONE' | 'ARCHIVED';
type DurationFilter = 'ALL' | 'SHORT' | 'MEDIUM' | 'LONG';

const DURATION_FILTERS: { value: DurationFilter; label: string; test: (min: number) => boolean }[] = [
  { value: 'ALL', label: 'Cualquier duración', test: () => true },
  { value: 'SHORT', label: 'Hasta 15 min', test: m => m <= 15 },
  { value: 'MEDIUM', label: '16–45 min', test: m => m > 15 && m <= 45 },
  { value: 'LONG', label: 'Más de 45 min', test: m => m > 45 },
];

const statusOrder = (m: Mission, now: number) => {
  if (m.status === 'ACTIVE') return 0;
  if (m.status === 'VERIFY') return 1;
  if (m.status === 'PAUSED') return 2;
  if (isDoneForPeriod(m, now)) return 5;
  return 3;
};

export function MissionsView() {
  const { state } = useStore();
  const { editMission } = useUI();
  const hasRunning = state.missions.some(m => m.status === 'ACTIVE');
  const now = useNow(true, hasRunning ? 1000 : 30_000);
  const [view, setView] = useState<'LIST' | 'CAMPAIGNS'>('LIST');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState<DurationFilter>('ALL');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [campaignFormOpen, setCampaignFormOpen] = useState(false);

  const campaignNames = useMemo(() => new Map(state.campaigns.map(c => [c.id, c.name])), [state.campaigns]);
  const categories = useMemo(
    () => [...new Set([...state.districts.map(d => d.name), ...state.missions.map(m => m.category).filter(Boolean)])],
    [state.districts, state.missions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const durationTest = DURATION_FILTERS.find(d => d.value === duration)!.test;
    const today = dayKey(now);
    return state.missions
      .filter(m => {
        if (status === 'ARCHIVED') return !!m.archived;
        if (m.archived) return false;
        const resolved = m.status === 'PASSED' || m.status === 'FAILED';
        if (status === 'DONE') return resolved;
        // Later campaign steps live in the Campañas view until they unlock.
        return !resolved && !isLocked(m, state.missions);
      })
      .filter(m => !category || m.category.toLowerCase() === category.toLowerCase())
      .filter(m => durationTest(m.durationSeconds / 60))
      .filter(m => !q || m.name.toLowerCase().includes(q) || m.location.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
      .sort((a, b) => {
        if (status === 'DONE') return (b.finishedAt ?? 0) - (a.finishedAt ?? 0);
        const order = statusOrder(a, now) - statusOrder(b, now);
        if (order) return order;
        if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
        const aDue = a.dueDate ?? '9999';
        const bDue = b.dueDate ?? '9999';
        if (aDue !== bDue) return aDue < bDue ? -1 : 1;
        if (aDue <= today) return 0;
        return b.createdAt - a.createdAt;
      });
  }, [state.missions, status, category, duration, query, now]);

  const counts = useMemo(
    () => ({
      PENDING: state.missions.filter(m => !m.archived && m.status !== 'PASSED' && m.status !== 'FAILED' && !isLocked(m, state.missions)).length,
      DONE: state.missions.filter(m => !m.archived && (m.status === 'PASSED' || m.status === 'FAILED')).length,
      ARCHIVED: state.missions.filter(m => m.archived).length,
    }),
    [state.missions],
  );

  const filtersActive = !!query || !!category || duration !== 'ALL';

  return (
    <div className="page flex flex-col gap-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="title-display text-5xl sm:text-6xl text-cream">Misiones</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setScannerOpen(true)}>
            <Radar size={18} /> Escáner
          </button>
          <button className="btn btn-primary" onClick={() => (view === 'LIST' ? editMission(null) : setCampaignFormOpen(true))}>
            <Plus size={18} /> {view === 'LIST' ? 'Nueva' : 'Campaña'}
          </button>
        </div>
      </section>

      <div className="segmented">
        <button aria-pressed={view === 'LIST'} onClick={() => setView('LIST')}>
          Lista
        </button>
        <button aria-pressed={view === 'CAMPAIGNS'} onClick={() => setView('CAMPAIGNS')}>
          Campañas {state.campaigns.length > 0 && <span className="text-muted">· {state.campaigns.length}</span>}
        </button>
      </div>

      {view === 'LIST' ? (
        <>
          <section className="flex flex-col gap-3">
            <label className="relative block">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input className="input pl-10" type="search" placeholder="Buscar por nombre, lugar o distrito" value={query} onChange={e => setQuery(e.target.value)} />
            </label>
            <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
              {(
                [
                  ['PENDING', 'Pendientes'],
                  ['DONE', 'Completadas'],
                  ['ARCHIVED', 'Archivadas'],
                ] as [StatusFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  className={`chip min-h-9 px-3 shrink-0 ${status === value ? 'bg-cream text-bg-deep' : 'hover:bg-surface-3'}`}
                  aria-pressed={status === value}
                  onClick={() => setStatus(value)}
                >
                  {label} <span className="counter opacity-70">{counts[value]}</span>
                </button>
              ))}
              <select className="input !min-h-9 !w-auto !rounded-full !py-0 text-sm shrink-0" value={category} onChange={e => setCategory(e.target.value)} aria-label="Distrito">
                <option value="">Todos los distritos</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select className="input !min-h-9 !w-auto !rounded-full !py-0 text-sm shrink-0" value={duration} onChange={e => setDuration(e.target.value as DurationFilter)} aria-label="Duración">
                {DURATION_FILTERS.map(d => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            {filtered.map(m => (
              <MissionCard key={m.id} mission={m} now={now} campaignName={m.campaignId ? campaignNames.get(m.campaignId) : undefined} />
            ))}
            {filtered.length === 0 && (
              <div className="card p-8 text-center">
                <p className="font-semibold text-cream">
                  {filtersActive ? 'Nada coincide con estos filtros' : status === 'PENDING' ? 'No tienes misiones pendientes' : status === 'DONE' ? 'Todavía no has completado misiones' : 'El archivo está vacío'}
                </p>
                {filtersActive ? (
                  <button
                    className="btn btn-secondary mt-4"
                    onClick={() => {
                      setQuery('');
                      setCategory('');
                      setDuration('ALL');
                    }}
                  >
                    Quitar filtros
                  </button>
                ) : (
                  status === 'PENDING' && (
                    <button className="btn btn-primary mt-4" onClick={() => editMission(null)}>
                      <Plus size={18} /> Nueva misión
                    </button>
                  )
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        <CampaignList onCreate={() => setCampaignFormOpen(true)} />
      )}

      <ScannerSheet open={scannerOpen} onClose={() => setScannerOpen(false)} />
      <CampaignForm open={campaignFormOpen} onClose={() => setCampaignFormOpen(false)} />
    </div>
  );
}

function CampaignList({ onCreate }: { onCreate: () => void }) {
  const { state } = useStore();
  const sorted = [...state.campaigns].sort((a, b) => (a.completedAt ? 1 : 0) - (b.completedAt ? 1 : 0) || b.createdAt - a.createdAt);

  if (state.campaigns.length === 0) {
    return (
      <div className="card p-6 text-center flex flex-col items-center gap-3">
        <Flag size={28} className="text-coral" />
        <p className="font-semibold text-cream">Divide un gran objetivo en pasos</p>
        <p className="text-sm text-cream-dim max-w-md">
          Por ejemplo, «Terminar mi aplicación»: diseño, desarrollo, pruebas y publicación. Cada paso desbloquea el siguiente y completar la campaña da una bonificación.
        </p>
        <button className="btn btn-primary mt-1" onClick={onCreate}>
          <Plus size={18} /> Crear campaña
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      {sorted.map(c => (
        <CampaignCard key={c.id} campaign={c} />
      ))}
    </section>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { state, removeCampaign } = useStore();
  const { toast, setTab } = useUI();
  const actions = useMissionActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const { steps, done, total, next } = campaignProgress(campaign, state.missions);

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-teal">{campaign.category}</p>
          <h3 className="title-display text-2xl text-cream mt-0.5 break-words">{campaign.name}</h3>
          <p className="text-sm text-cream-dim mt-1">
            <span className="counter text-cream">{done}</span> de <span className="counter text-cream">{total}</span> pasos completados
            {campaign.completedAt && <span className="text-teal"> · Campaña completada</span>}
          </p>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-1" onClick={() => setMenuOpen(true)} aria-label={`Acciones de ${campaign.name}`}>
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="progress mt-3">
        <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <ol className="mt-4 flex flex-col gap-1">
        {steps.map(step => {
          const isNext = step.id === next?.id;
          const passed = step.status === 'PASSED';
          return (
            <li key={step.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${isNext ? 'bg-surface-2' : ''}`}>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${passed ? 'bg-teal text-bg-deep' : isNext ? 'bg-coral text-bg-deep' : 'bg-bg-deep text-muted'}`}
              >
                {passed ? <Check size={14} /> : isNext ? (step.campaignStep ?? 0) + 1 : <Lock size={12} />}
              </span>
              <span className={`flex-1 min-w-0 truncate ${passed ? 'text-muted line-through' : isNext ? 'text-cream font-medium' : 'text-muted'}`}>{step.name}</span>
              <span className="text-xs text-muted shrink-0">{formatMinutes(step.durationSeconds / 60)}</span>
              {isNext && step.status !== 'ACTIVE' && step.status !== 'VERIFY' && (
                <button
                  className="btn btn-primary btn-icon btn-sm shrink-0"
                  aria-label={`Empezar ${step.name}`}
                  onClick={() => {
                    actions.start(step);
                    setTab('TODAY');
                  }}
                >
                  <Play size={16} />
                </button>
              )}
              {isNext && (step.status === 'ACTIVE' || step.status === 'VERIFY') && <span className="chip text-coral shrink-0">En curso</span>}
            </li>
          );
        })}
      </ol>

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={campaign.name}
        actions={[
          {
            label: 'Eliminar campaña',
            icon: Trash2,
            danger: true,
            onSelect: () => {
              const snapshot = removeCampaign(campaign.id);
              toast('Campaña eliminada (los pasos completados siguen en tu historial)', snapshot);
            },
          },
        ]}
      />
    </article>
  );
}

function CampaignForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, addCampaign } = useStore();
  const { toast } = useUI();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [minutes, setMinutes] = useState(45);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [error, setError] = useState('');

  const steps = stepsText
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const rewards = suggestRewards(minutes || 1, difficulty);

  const submit = () => {
    if (!name.trim()) return setError('Ponle nombre a la campaña.');
    if (steps.length < 2) return setError('Escribe al menos dos pasos, uno por línea.');
    soundManager.playAccept();
    addCampaign({ name, category: category.trim() || 'General', steps, minutes: Math.max(1, minutes), difficulty, ...rewards });
    toast(`Campaña creada con ${steps.length} pasos`);
    setName('');
    setStepsText('');
    setError('');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nueva campaña"
      footer={
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary flex-1" onClick={submit}>
            Crear campaña
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="field">
          <span>Objetivo</span>
          <input className="input" value={name} placeholder="Terminar mi aplicación" onChange={e => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Distrito</span>
          <input className="input" list="campaign-districts" value={category} placeholder="Trabajo" onChange={e => setCategory(e.target.value)} />
          <datalist id="campaign-districts">
            {state.districts.map(d => (
              <option key={d.id} value={d.name} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>Pasos (uno por línea, en orden)</span>
          <textarea className="input" rows={5} value={stepsText} placeholder={'Diseño\nDesarrollo\nPruebas\nPublicación'} onChange={e => setStepsText(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field">
            <span>Minutos por paso</span>
            <input type="number" min={1} inputMode="numeric" className="input" value={minutes || ''} onChange={e => setMinutes(parseInt(e.target.value, 10) || 0)} />
          </label>
          <label className="field">
            <span>Dificultad</span>
            <select className="input" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
              <option value="EASY">Fácil</option>
              <option value="NORMAL">Normal</option>
              <option value="HARD">Difícil</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-muted">
          Cada paso: <span className="counter text-sun">${rewards.rewardCash.toLocaleString('es-ES')}</span> y <span className="counter text-pink">{rewards.rewardRespect}</span> de respeto.
          {steps.length >= 2 && (
            <>
              {' '}
              Bonificación al terminar: <span className="counter text-sun">${(1000 + steps.length * 500).toLocaleString('es-ES')}</span>.
            </>
          )}
        </p>
        {error && <p className="text-sm text-danger font-medium" role="alert">{error}</p>}
      </div>
    </Sheet>
  );
}
