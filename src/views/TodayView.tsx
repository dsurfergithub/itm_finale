import { useMemo } from 'react';
import { Check, Flame, Gift, Pause, Play, Plus, Sparkles, Trophy, X } from 'lucide-react';
import { Mission } from '../types';
import { DAILY_BONUS, STREAK_REPAIR_COST, useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useMissionActions } from '../hooks/useMissionActions';
import { useNow } from '../hooks/useNow';
import { createDemoState } from '../lib/demo';
import { getProgress, getRemainingMs, isAvailable, TEMPLATES, suggestRewards } from '../lib/missions';
import { getRankData } from '../lib/ranks';
import { computeStreak, repairableDay } from '../lib/streak';
import { dayKey, formatClock, formatDueDate, formatLongDay, formatMinutes } from '../lib/time';
import { Scene } from '../components/Illustrations';
import { soundManager } from '../utils/audio';

/** Today's priority: featured first, then due or overdue, then the soonest planned, then reward. */
function rankForToday(missions: Mission[], today: string) {
  return [...missions].sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    const aDue = a.dueDate && a.dueDate <= today ? 0 : 1;
    const bDue = b.dueDate && b.dueDate <= today ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    if (a.dueDate !== b.dueDate) return (a.dueDate ?? '9999') < (b.dueDate ?? '9999') ? -1 : 1;
    return b.rewardRespect - a.rewardRespect;
  });
}

export function TodayView() {
  const { state, claimDailyBonus, repairStreak, replaceState, addMission } = useStore();
  const { editMission, setTab, toast, confirm, celebrate } = useUI();
  const actions = useMissionActions();
  const running = state.missions.find(m => m.status === 'ACTIVE') ?? state.missions.find(m => m.status === 'VERIFY') ?? state.missions.find(m => m.status === 'PAUSED');
  const now = useNow(true, running?.status === 'ACTIVE' ? 1000 : 30_000);
  const today = dayKey(now);

  const available = useMemo(
    () => rankForToday(state.missions.filter(m => m.id !== running?.id && isAvailable(m, state.missions, now)), today),
    [state.missions, running?.id, now, today],
  );
  const main = running ? undefined : available[0];
  const secondary = available.filter(m => m.id !== main?.id).slice(0, 3);
  const doneToday = state.events.filter(e => e.kind === 'MISSION_COMPLETED' && e.at && dayKey(e.at) === today).length;

  const streakInput = { activeDays: state.activeDays, repairedDays: state.repairedDays, restDays: state.settings.restDays };
  const streak = computeStreak(streakInput, new Date(now));
  const repairable = repairableDay(streakInput, new Date(now));
  const { rank, percentage, next, toNext } = getRankData(state.respect);
  const goal = state.rewards.find(r => r.id === state.savingGoalId);
  const bonusAvailable = state.lastBonusDay !== today;
  const isNewUser = state.missions.length === 0 && state.events.length === 0;

  const loadDemo = async () => {
    const ok = await confirm({
      title: 'Ver demostración',
      message: 'Se cargarán misiones, distritos y recompensas de ejemplo. Podrás volver a empezar desde cero en Perfil › Ajustes.',
      confirmLabel: 'Cargar ejemplo',
    });
    if (ok) {
      replaceState({ ...createDemoState(), settings: state.settings });
      toast('Demostración cargada');
    }
  };

  return (
    <div className="page flex flex-col gap-5">
      <section className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{formatLongDay(new Date(now))}</p>
          <h1 className="title-display text-5xl sm:text-6xl text-cream mt-1">Hoy</h1>
        </div>
        <button className="btn btn-primary shrink-0" onClick={() => editMission(null)}>
          <Plus size={18} /> Nueva misión
        </button>
      </section>

      {!isNewUser && (
        <section className="flex flex-wrap gap-2">
          <span className="chip min-h-8 px-3">
            <Flame size={14} className="text-coral" />
            <span className="counter text-cream">{streak}</span> {streak === 1 ? 'día' : 'días'} de racha
          </span>
          <span className="chip min-h-8 px-3">
            <Check size={14} className="text-teal" />
            <span className="counter text-cream">{doneToday}</span> {doneToday === 1 ? 'completada hoy' : 'completadas hoy'}
          </span>
        </section>
      )}

      {isNewUser && (
        <section className="card overflow-hidden">
          <div className="relative h-44 sm:h-56">
            <Scene category="costa" seed="welcome" className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <p className="eyebrow text-cream-dim">Bienvenida</p>
              <h2 className="title-display text-4xl sm:text-5xl text-cream mt-1">Tu ciudad empieza aquí</h2>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <p className="text-cream-dim">
              Convierte tus objetivos en misiones con tiempo y recompensa. Cada misión completada construye un distrito de tu ciudad costera.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="btn btn-primary btn-lg flex-1" onClick={() => editMission(null)}>
                <Plus size={18} /> Crear mi primera misión
              </button>
              <button className="btn btn-secondary btn-lg flex-1" onClick={loadDemo}>
                <Sparkles size={18} /> Ver una demostración
              </button>
            </div>
            <div>
              <p className="eyebrow mb-2">O empieza con una plantilla</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.slice(0, 4).map(t => (
                  <button
                    key={t.name}
                    className="chip min-h-9 px-3 hover:bg-surface-3"
                    onClick={() => {
                      soundManager.playAccept();
                      addMission({ ...t, ...suggestRewards(t.minutes, t.difficulty) });
                      toast(`Añadida: ${t.name}`);
                    }}
                  >
                    <Plus size={12} /> {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {running && <RunningMission mission={running} now={now} />}

      {main && (
        <section className="card overflow-hidden">
          <div className="relative h-40 sm:h-52">
            <Scene category={main.category} seed={main.id} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <p className="eyebrow text-cream-dim">Misión principal</p>
              <h2 className="title-display text-3xl sm:text-4xl text-cream mt-1 break-words">{main.name}</h2>
            </div>
          </div>
          <div className="p-5 pt-3 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-wrap gap-1.5 flex-1">
              <span className="chip">{formatMinutes(main.durationSeconds / 60)}</span>
              {main.category && <span className="chip text-teal">{main.category}</span>}
              {main.dueDate && <span className="chip">{formatDueDate(main.dueDate, now)}</span>}
              <span className="chip">
                <span className="counter text-sun">${main.rewardCash.toLocaleString('es-ES')}</span>
              </span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => actions.start(main)}>
              <Play size={18} /> {main.status === 'PAUSED' ? 'Reanudar misión' : 'Empezar misión'}
            </button>
          </div>
        </section>
      )}

      {!isNewUser && !running && !main && (
        <section className="card p-6 text-center">
          <p className="title-display text-3xl text-cream">Todo hecho por ahora</p>
          <p className="text-cream-dim mt-2">No quedan misiones disponibles. Crea una nueva o revisa tus campañas.</p>
          <button className="btn btn-primary mt-4" onClick={() => editMission(null)}>
            <Plus size={18} /> Nueva misión
          </button>
        </section>
      )}

      {secondary.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">También para hoy</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setTab('MISSIONS')}>
              Ver todas
            </button>
          </div>
          <div className="card divide-y divide-line">
            {secondary.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 pl-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-cream truncate">{m.name}</p>
                  <p className="text-sm text-muted truncate">
                    {formatMinutes(m.durationSeconds / 60)}
                    {m.category ? ` · ${m.category}` : ''}
                    {m.location ? ` · ${m.location}` : ''}
                  </p>
                </div>
                <button className="btn btn-secondary btn-icon btn-sm shrink-0" onClick={() => actions.start(m)} aria-label={`Empezar ${m.name}`}>
                  <Play size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isNewUser && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-muted text-sm">
              <Trophy size={16} className="text-sun" /> Siguiente desbloqueo
            </div>
            {next ? (
              <>
                <p className="font-semibold text-cream mt-2">{next.unlock}</p>
                <p className="text-sm text-muted mt-0.5">
                  Rango {next.name} · faltan <span className="counter text-pink">{toNext.toLocaleString('es-ES')}</span> de respeto
                </p>
                <div className="progress mt-3">
                  <div style={{ width: `${percentage}%` }} />
                </div>
              </>
            ) : (
              <p className="font-semibold text-cream mt-2">Eres {rank}. Has desbloqueado toda la ciudad.</p>
            )}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 text-muted text-sm">
              <Gift size={16} className="text-pink" /> Ahorro para recompensa
            </div>
            {goal ? (
              <>
                <p className="font-semibold text-cream mt-2">{goal.name}</p>
                <p className="text-sm text-muted mt-0.5">
                  <span className="counter text-sun">${Math.min(state.credits, goal.cost).toLocaleString('es-ES')}</span> de ${goal.cost.toLocaleString('es-ES')}
                </p>
                <div className="progress mt-3">
                  <div style={{ width: `${goal.cost ? Math.min(100, (state.credits / goal.cost) * 100) : 100}%` }} />
                </div>
              </>
            ) : (
              <>
                <p className="text-cream-dim mt-2 text-sm">Elige una recompensa del mercado como objetivo de ahorro.</p>
                <button className="btn btn-secondary btn-sm mt-3" onClick={() => setTab('MARKET')}>
                  Ir al mercado
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {!isNewUser && (bonusAvailable || repairable) && (
        <section className="flex flex-col gap-3">
          {bonusAvailable && (
            <div className="card p-4 flex items-center gap-3">
              <Gift size={22} className="text-sun shrink-0" />
              <p className="flex-1 text-sm text-cream-dim">
                Bonificación diaria disponible: <span className="counter text-sun">+${DAILY_BONUS.toLocaleString('es-ES')}</span>
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (claimDailyBonus()) {
                    soundManager.playSuccess();
                    toast(`+$${DAILY_BONUS.toLocaleString('es-ES')} añadidos`);
                  }
                }}
              >
                Reclamar
              </button>
            </div>
          )}
          {repairable && (
            <div className="card p-4 flex items-center gap-3">
              <Flame size={22} className="text-coral shrink-0" />
              <p className="flex-1 text-sm text-cream-dim">
                Ayer no completaste ninguna misión. Recupera la racha por <span className="counter text-sun">${STREAK_REPAIR_COST.toLocaleString('es-ES')}</span>.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                disabled={state.credits < STREAK_REPAIR_COST}
                onClick={() => {
                  if (repairStreak()) {
                    soundManager.playSuccess();
                    celebrate('Racha recuperada');
                  }
                }}
              >
                Recuperar
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function RunningMission({ mission, now }: { mission: Mission; now: number }) {
  const actions = useMissionActions();
  const remaining = getRemainingMs(mission, now);
  const progress = getProgress(mission, now);
  const verify = mission.status === 'VERIFY';

  return (
    <section className={`card overflow-hidden ${verify ? 'ring-2 ring-sun/80' : 'ring-2 ring-coral/60'}`} aria-live="polite">
      <div className="relative h-32 sm:h-40">
        <Scene category={mission.category} seed={mission.id} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        <div className="absolute bottom-3 left-5 right-5">
          <p className="eyebrow text-cream-dim">{verify ? 'Tiempo cumplido' : mission.status === 'PAUSED' ? 'En pausa' : 'En curso'}</p>
          <h2 className="title-display text-3xl sm:text-4xl text-cream mt-1 break-words">{mission.name}</h2>
        </div>
      </div>
      <div className="p-5 pt-3 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <span className={`counter text-5xl sm:text-6xl font-bold leading-none ${verify ? 'text-sun' : 'text-cream'}`}>{formatClock(remaining)}</span>
          <span className="text-sm text-muted text-right">
            de {formatMinutes(mission.durationSeconds / 60)}
            <br />
            <span className="counter text-sun">${mission.rewardCash.toLocaleString('es-ES')}</span> · <span className="counter text-pink">{mission.rewardRespect}</span> R
          </span>
        </div>
        <div className="progress h-2.5">
          <div style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
        {verify ? (
          <div className="flex flex-col gap-2">
            <p className="text-cream-dim text-sm">¿Has cumplido la misión?</p>
            <div className="flex gap-2">
              <button className="btn btn-secondary flex-1" onClick={() => actions.fail(mission)}>
                <X size={18} /> No lo logré
              </button>
              <button className="btn btn-primary flex-1 btn-lg" onClick={() => actions.complete(mission)}>
                <Check size={18} /> Sí, completada
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {mission.status === 'ACTIVE' ? (
              <button className="btn btn-secondary flex-1 btn-lg" onClick={() => actions.pause(mission)}>
                <Pause size={18} /> Pausar
              </button>
            ) : (
              <button className="btn btn-secondary flex-1 btn-lg" onClick={() => actions.start(mission)}>
                <Play size={18} /> Reanudar
              </button>
            )}
            <button className="btn btn-primary flex-1 btn-lg" onClick={() => actions.complete(mission)}>
              <Check size={18} /> Completar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
