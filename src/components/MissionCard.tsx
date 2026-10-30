import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Check,
  Clock,
  Copy,
  Lock,
  MapPin,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Repeat,
  RotateCcw,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Mission } from '../types';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useMissionActions } from '../hooks/useMissionActions';
import { DIFFICULTY_LABEL, getProgress, getRemainingMs, isDoneForPeriod } from '../lib/missions';
import { addDays, dayKey, formatClock, formatDueDate, formatMinutes } from '../lib/time';
import { Scene } from './Illustrations';
import { ActionSheet, Sheet } from './Sheet';

export function MissionCard({ mission, now, locked = false, campaignName }: { mission: Mission; now: number; locked?: boolean; campaignName?: string }) {
  const { toggleFeatured, duplicateMission, updateMission, resetTimer } = useStore();
  const { editMission, toast } = useUI();
  const actions = useMissionActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const { status } = mission;
  const resolved = status === 'PASSED' || status === 'FAILED';
  const doneForPeriod = isDoneForPeriod(mission, now);
  const running = status === 'ACTIVE' || status === 'PAUSED' || status === 'VERIFY';
  const progress = getProgress(mission, now);
  const minutes = Math.round(mission.durationSeconds / 60);
  const overdue = mission.dueDate && !resolved && mission.dueDate < dayKey(now);

  return (
    <article
      className={`card overflow-hidden flex flex-col sm:flex-row ${status === 'ACTIVE' ? 'ring-2 ring-coral/70' : ''} ${status === 'VERIFY' ? 'ring-2 ring-sun/80' : ''} ${resolved || doneForPeriod || locked ? 'opacity-70' : ''}`}
    >
      <div className="relative h-20 sm:h-auto sm:w-40 shrink-0">
        <Scene category={mission.category} seed={mission.id} className="absolute inset-0 h-full w-full" />
        {mission.featured && (
          <span className="absolute left-2 top-2 chip bg-bg-deep/80 text-sun">
            <Star size={12} className="fill-sun" /> Principal
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {campaignName && (
              <p className="text-xs font-semibold text-teal mb-0.5">
                {campaignName} · Paso {(mission.campaignStep ?? 0) + 1}
              </p>
            )}
            <h3 className="text-lg font-semibold leading-snug text-cream break-words">{mission.name}</h3>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-1 shrink-0" onClick={() => setMenuOpen(true)} aria-label={`Acciones de ${mission.name}`}>
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="chip">
            <Clock size={12} /> {formatMinutes(minutes)}
          </span>
          {mission.category && <span className="chip text-teal">{mission.category}</span>}
          <span className="chip">{DIFFICULTY_LABEL[mission.difficulty]}</span>
          {mission.location && (
            <span className="chip">
              <MapPin size={12} /> {mission.location}
            </span>
          )}
          {mission.recurrence !== 'NONE' && (
            <span className="chip">
              <Repeat size={12} /> {mission.recurrence === 'DAILY' ? 'Diaria' : 'Semanal'}
            </span>
          )}
          {mission.dueDate && !resolved && (
            <span className={`chip ${overdue ? 'text-danger' : ''}`}>
              <CalendarClock size={12} /> {formatDueDate(mission.dueDate, now)}
            </span>
          )}
        </div>

        {running && (
          <div className="flex items-center gap-3">
            <div className="progress flex-1">
              <div style={{ width: `${Math.min(100, progress * 100)}%` }} />
            </div>
            <span className={`counter text-sm ${status === 'VERIFY' ? 'text-sun' : 'text-cream'}`}>
              {status === 'VERIFY' ? 'Tiempo cumplido' : formatClock(getRemainingMs(mission, now))}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 mt-auto">
          <span className="text-sm text-cream-dim">
            <span className="counter text-sun">${mission.rewardCash.toLocaleString('es-ES')}</span>
            <span className="mx-1.5 text-muted">·</span>
            <span className="counter text-pink">{mission.rewardRespect}</span> respeto
          </span>

          <div className="flex gap-2">
            {locked && (
              <span className="chip">
                <Lock size={12} /> Completa el paso anterior
              </span>
            )}
            {resolved && <span className={`chip ${status === 'PASSED' ? 'text-teal' : 'text-danger'}`}>{status === 'PASSED' ? 'Completada' : 'No lograda'}</span>}
            {doneForPeriod && !running && <span className="chip text-teal">Hecha {mission.recurrence === 'DAILY' ? 'hoy' : 'esta semana'}</span>}

            {!locked && !resolved && !doneForPeriod && !mission.archived && (
              <>
                {status === 'IDLE' && (
                  <button className="btn btn-primary btn-sm" onClick={() => actions.start(mission)}>
                    <Play size={16} /> Empezar
                  </button>
                )}
                {status === 'PAUSED' && (
                  <button className="btn btn-primary btn-sm" onClick={() => actions.start(mission)}>
                    <Play size={16} /> Reanudar
                  </button>
                )}
                {status === 'ACTIVE' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => actions.pause(mission)}>
                    <Pause size={16} /> Pausar
                  </button>
                )}
                {status === 'VERIFY' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => actions.fail(mission)}>
                    <X size={16} /> No lo logré
                  </button>
                )}
                {running && (
                  <button className="btn btn-primary btn-sm" onClick={() => actions.complete(mission)}>
                    <Check size={16} /> Completar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={mission.name}
        actions={[
          { label: 'Editar', icon: Pencil, onSelect: () => editMission(mission) },
          { label: 'Duplicar', icon: Copy, onSelect: () => { duplicateMission(mission.id); toast('Misión duplicada'); } },
          { label: 'Reprogramar', icon: CalendarClock, onSelect: () => setRescheduleOpen(true), hidden: resolved },
          {
            label: mission.featured ? 'Quitar como principal' : 'Marcar como principal',
            icon: Star,
            onSelect: () => toggleFeatured(mission.id),
            hidden: resolved || mission.archived,
          },
          { label: 'Reiniciar temporizador', icon: RotateCcw, onSelect: () => resetTimer(mission.id), hidden: !running },
          { label: 'Archivar', icon: Archive, onSelect: () => actions.archive(mission, true), hidden: mission.archived },
          { label: 'Recuperar del archivo', icon: ArchiveRestore, onSelect: () => actions.archive(mission, false), hidden: !mission.archived },
          {
            label: 'Volver a pendientes',
            icon: RotateCcw,
            onSelect: () => updateMission(mission.id, { status: 'IDLE', elapsedMs: 0, finishedAt: undefined, archived: false }),
            hidden: !resolved,
          },
          { label: 'Eliminar', icon: Trash2, onSelect: () => actions.remove(mission), danger: true },
        ]}
      />

      <Sheet open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} title="Reprogramar" size="sm">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Hoy', value: dayKey(now) },
            { label: 'Mañana', value: dayKey(addDays(new Date(now), 1)) },
            { label: 'En una semana', value: dayKey(addDays(new Date(now), 7)) },
            { label: 'Sin fecha', value: '' },
          ].map(option => (
            <button
              key={option.label}
              className="btn btn-secondary"
              onClick={() => {
                updateMission(mission.id, { dueDate: option.value || undefined });
                setRescheduleOpen(false);
                toast(option.value ? `Programada: ${formatDueDate(option.value, now).toLowerCase()}` : 'Fecha eliminada');
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="field mt-4">
          <span>Otra fecha</span>
          <input
            type="date"
            className="input"
            defaultValue={mission.dueDate}
            onChange={e => e.target.value && updateMission(mission.id, { dueDate: e.target.value })}
          />
        </label>
      </Sheet>
    </article>
  );
}
