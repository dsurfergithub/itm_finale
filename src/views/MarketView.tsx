import { useMemo, useState } from 'react';
import { Gift, MoreHorizontal, Pencil, Plus, ShieldCheck, Target, Trash2 } from 'lucide-react';
import { Reward } from '../types';
import { CLEAR_STRIKE_COST, DAILY_BONUS, useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { dayKey, formatDateTime } from '../lib/time';
import { ActionSheet, Sheet } from '../components/Sheet';
import { soundManager } from '../utils/audio';

export function MarketView() {
  const { state, claimDailyBonus, clearStrike } = useStore();
  const { toast } = useUI();
  const [formTarget, setFormTarget] = useState<Reward | null | undefined>(undefined);
  const bonusAvailable = state.lastBonusDay !== dayKey();
  const purchases = state.events.filter(e => e.kind === 'PURCHASE');

  const redeemedCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of purchases) counts.set(e.title, (counts.get(e.title) ?? 0) + 1);
    return counts;
  }, [purchases]);

  const sorted = [...state.rewards].sort((a, b) => (a.id === state.savingGoalId ? -1 : b.id === state.savingGoalId ? 1 : a.cost - b.cost));

  return (
    <div className="page flex flex-col gap-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-display text-5xl sm:text-6xl text-cream">Mercado</h1>
          <p className="text-cream-dim mt-2">Canjea tus créditos por recompensas reales que tú eliges.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormTarget(null)}>
          <Plus size={18} /> Nueva recompensa
        </button>
      </section>

      <section className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[10rem]">
          <p className="text-sm text-muted">Créditos disponibles</p>
          <p className="counter text-4xl text-sun mt-1">${state.credits.toLocaleString('es-ES')}</p>
        </div>
        {bonusAvailable && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (claimDailyBonus()) {
                soundManager.playSuccess();
                toast(`+$${DAILY_BONUS.toLocaleString('es-ES')} de bonificación diaria`);
              }
            }}
          >
            <Gift size={18} className="text-sun" /> Reclamar bonificación
          </button>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map(r => (
          <RewardCard key={r.id} reward={r} redeemed={redeemedCount.get(r.name) ?? 0} onEdit={() => setFormTarget(r)} />
        ))}

        {state.settings.mode === 'DEMANDING' && (
          <article className="card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-teal" />
              <h3 className="font-semibold flex-1">Limpiar una estrella</h3>
            </div>
            <p className="text-sm text-cream-dim">Tienes {state.strikes} de 10 estrellas de penalización.</p>
            <p className="counter text-xl text-sun">${CLEAR_STRIKE_COST.toLocaleString('es-ES')}</p>
            <button
              className="btn btn-secondary mt-auto"
              disabled={state.strikes === 0 || state.credits < CLEAR_STRIKE_COST}
              onClick={() => {
                if (clearStrike()) {
                  soundManager.playSuccess();
                  toast('Una estrella menos');
                }
              }}
            >
              {state.strikes === 0 ? 'Expediente limpio' : 'Pagar'}
            </button>
          </article>
        )}

        {state.rewards.length === 0 && (
          <div className="card p-6 text-center sm:col-span-2 lg:col-span-3">
            <p className="font-semibold">Aún no hay recompensas</p>
            <p className="text-sm text-cream-dim mt-1">Añade cosas que te motiven: un episodio, una cena, una escapada…</p>
            <button className="btn btn-primary mt-4" onClick={() => setFormTarget(null)}>
              <Plus size={18} /> Nueva recompensa
            </button>
          </div>
        )}
      </section>

      {purchases.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Historial de canjes</h2>
          <ul className="card divide-y divide-line">
            {purchases.slice(0, 15).map(e => (
              <li key={e.id} className="flex items-center gap-3 p-3 pl-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{e.title}</p>
                  <p className="text-xs text-muted">{formatDateTime(e.at)}</p>
                </div>
                <span className="counter text-sm text-cream-dim">−${Math.abs(e.credits ?? 0).toLocaleString('es-ES')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RewardForm target={formTarget} onClose={() => setFormTarget(undefined)} />
    </div>
  );
}

function RewardCard({ reward, redeemed, onEdit }: { reward: Reward; redeemed: number; onEdit: () => void }) {
  const { state, redeemReward, setSavingGoal, removeReward } = useStore();
  const { toast, celebrate, confirm } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const canAfford = state.credits >= reward.cost;
  const isGoal = state.savingGoalId === reward.id;
  const progress = reward.cost ? Math.min(100, (state.credits / reward.cost) * 100) : 100;

  const redeem = async () => {
    const ok = await confirm({
      title: 'Canjear recompensa',
      message: `«${reward.name}» por $${reward.cost.toLocaleString('es-ES')}. ${reward.oneTime ? 'Es de un solo uso y saldrá del catálogo.' : 'Seguirá disponible para volver a canjearla.'}`,
      confirmLabel: 'Canjear',
    });
    if (!ok) return;
    const snapshot = redeemReward(reward.id);
    if (!snapshot) return;
    soundManager.playSuccess();
    celebrate('¡Disfrútalo!', reward.name);
    toast(`Canjeado: ${reward.name}`, snapshot);
  };

  return (
    <article className={`card p-4 flex flex-col gap-3 ${isGoal ? 'ring-2 ring-pink/60' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {isGoal && (
            <p className="text-xs font-semibold text-pink mb-1 flex items-center gap-1">
              <Target size={12} /> Objetivo de ahorro
            </p>
          )}
          <h3 className="font-semibold text-cream break-words">{reward.name}</h3>
          <p className="text-xs text-muted mt-0.5">
            {reward.oneTime ? 'Un solo uso' : 'Reutilizable'}
            {redeemed > 0 && ` · Canjeada ${redeemed} ${redeemed === 1 ? 'vez' : 'veces'}`}
          </p>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-1" onClick={() => setMenuOpen(true)} aria-label={`Acciones de ${reward.name}`}>
          <MoreHorizontal size={20} />
        </button>
      </div>
      <p className="counter text-xl text-sun">${reward.cost.toLocaleString('es-ES')}</p>
      {!canAfford && (
        <div>
          <div className="progress">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted mt-1.5">Faltan ${(reward.cost - state.credits).toLocaleString('es-ES')}</p>
        </div>
      )}
      <div className="flex gap-2 mt-auto">
        {!isGoal && !canAfford && (
          <button className="btn btn-secondary btn-sm flex-1" onClick={() => setSavingGoal(reward.id)}>
            <Target size={16} /> Ahorrar
          </button>
        )}
        <button className="btn btn-primary btn-sm flex-1" disabled={!canAfford} onClick={redeem}>
          Canjear
        </button>
      </div>

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={reward.name}
        actions={[
          { label: 'Editar', icon: Pencil, onSelect: onEdit },
          { label: isGoal ? 'Quitar objetivo de ahorro' : 'Fijar como objetivo de ahorro', icon: Target, onSelect: () => setSavingGoal(isGoal ? undefined : reward.id) },
          {
            label: 'Eliminar',
            icon: Trash2,
            danger: true,
            onSelect: () => {
              const snapshot = removeReward(reward.id);
              toast('Recompensa eliminada', snapshot);
            },
          },
        ]}
      />
    </article>
  );
}

function RewardForm({ target, onClose }: { target: Reward | null | undefined; onClose: () => void }) {
  const { addReward, updateReward } = useStore();
  const [name, setName] = useState('');
  const [cost, setCost] = useState(5000);
  const [oneTime, setOneTime] = useState(false);
  const [lastTarget, setLastTarget] = useState<Reward | null | undefined>(undefined);

  if (target !== lastTarget) {
    setLastTarget(target);
    setName(target?.name ?? '');
    setCost(target?.cost ?? 5000);
    setOneTime(target?.oneTime ?? false);
  }

  const submit = () => {
    if (!name.trim()) return;
    soundManager.playAccept();
    if (target) updateReward(target.id, { name: name.trim(), cost: Math.max(0, cost), oneTime });
    else addReward({ name: name.trim(), cost: Math.max(0, cost), oneTime });
    onClose();
  };

  return (
    <Sheet
      open={target !== undefined}
      onClose={onClose}
      title={target ? 'Editar recompensa' : 'Nueva recompensa'}
      size="sm"
      footer={
        <button className="btn btn-primary w-full" onClick={submit} disabled={!name.trim()}>
          {target ? 'Guardar' : 'Añadir al mercado'}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="field">
          <span>Recompensa</span>
          <input className="input" value={name} placeholder="Cena especial" onChange={e => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Coste en créditos</span>
          <input type="number" min={0} step={100} inputMode="numeric" className="input counter" value={cost} onChange={e => setCost(parseInt(e.target.value, 10) || 0)} />
        </label>
        <div className="field">
          <span>Tipo</span>
          <div className="segmented">
            <button aria-pressed={!oneTime} onClick={() => setOneTime(false)}>
              Reutilizable
            </button>
            <button aria-pressed={oneTime} onClick={() => setOneTime(true)}>
              Un solo uso
            </button>
          </div>
        </div>
        <p className="text-xs text-muted">Referencia: una misión normal de 45 minutos da unos $2.700.</p>
      </div>
    </Sheet>
  );
}
