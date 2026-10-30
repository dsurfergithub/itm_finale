import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Difficulty, Recurrence } from '../types';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { MissionDraft, suggestRewards, TEMPLATES } from '../lib/missions';
import { soundManager } from '../utils/audio';
import { Sheet } from './Sheet';

const DURATIONS = [15, 25, 45, 60, 90];

const emptyDraft = (category = ''): MissionDraft => ({
  name: '',
  difficulty: 'NORMAL',
  location: '',
  minutes: 25,
  category,
  recurrence: 'NONE',
  dueDate: undefined,
  ...suggestRewards(25, 'NORMAL'),
});

/** Create and edit form. Rewards follow the suggestion until the user types their own. */
export function MissionForm() {
  const { state, addMission, updateMission } = useStore();
  const { missionFormTarget, closeMissionForm, toast } = useUI();
  const open = missionFormTarget !== undefined;
  const editing = missionFormTarget ?? null;

  const [draft, setDraft] = useState<MissionDraft>(emptyDraft());
  const [customRewards, setCustomRewards] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editing) {
      setDraft({
        name: editing.name,
        difficulty: editing.difficulty,
        location: editing.location,
        minutes: Math.round(editing.durationSeconds / 60),
        rewardCash: editing.rewardCash,
        rewardRespect: editing.rewardRespect,
        category: editing.category,
        recurrence: editing.recurrence,
        dueDate: editing.dueDate,
      });
      const suggested = suggestRewards(Math.round(editing.durationSeconds / 60), editing.difficulty);
      setCustomRewards(suggested.rewardCash !== editing.rewardCash || suggested.rewardRespect !== editing.rewardRespect);
    } else {
      setDraft(emptyDraft(state.districts[0]?.name ?? ''));
      setCustomRewards(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = (patch: Partial<MissionDraft>) =>
    setDraft(prev => {
      const next = { ...prev, ...patch };
      if (!customRewards && (patch.minutes !== undefined || patch.difficulty !== undefined)) {
        Object.assign(next, suggestRewards(next.minutes || 1, next.difficulty));
      }
      return next;
    });

  const submit = () => {
    if (!draft.name.trim()) return setError('Ponle un nombre a la misión.');
    if (!draft.minutes || draft.minutes < 1) return setError('La duración debe ser de al menos 1 minuto.');
    const category = draft.category.trim() || 'General';
    soundManager.playAccept();
    if (editing) {
      const durationSeconds = Math.round(draft.minutes) * 60;
      updateMission(editing.id, {
        name: draft.name.trim(),
        difficulty: draft.difficulty,
        location: draft.location.trim(),
        durationSeconds,
        // Shortening a running mission must not leave more time spent than allowed.
        elapsedMs: Math.min(editing.elapsedMs, durationSeconds * 1000),
        rewardCash: draft.rewardCash,
        rewardRespect: draft.rewardRespect,
        category,
        recurrence: draft.recurrence,
        dueDate: draft.dueDate || undefined,
      });
      toast('Cambios guardados');
    } else {
      addMission({ ...draft, category });
      toast('Misión creada');
    }
    closeMissionForm();
  };

  const suggested = suggestRewards(draft.minutes || 1, draft.difficulty);

  return (
    <Sheet
      open={open}
      onClose={closeMissionForm}
      title={editing ? 'Editar misión' : 'Nueva misión'}
      footer={
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={closeMissionForm}>
            Cancelar
          </button>
          <button className="btn btn-primary flex-1" onClick={submit}>
            {editing ? 'Guardar cambios' : 'Crear misión'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {!editing && (
          <div>
            <p className="eyebrow mb-2">Plantillas rápidas</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
              {TEMPLATES.map(t => (
                <button
                  key={t.name}
                  className="chip min-h-9 px-3 hover:bg-surface-3 shrink-0"
                  onClick={() => {
                    setCustomRewards(false);
                    setDraft({ ...t, dueDate: undefined, ...suggestRewards(t.minutes, t.difficulty) });
                  }}
                >
                  {t.name} · {t.minutes} min
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span>Nombre</span>
          <input className="input" value={draft.name} autoFocus={!editing} placeholder="¿Qué vas a hacer?" onChange={e => set({ name: e.target.value })} onKeyDown={e => e.key === 'Enter' && submit()} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="field">
            <span>Distrito (área)</span>
            <input className="input" list="district-options" value={draft.category} placeholder="Trabajo, Salud…" onChange={e => set({ category: e.target.value })} />
            <datalist id="district-options">
              {state.districts.map(d => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>Lugar (opcional)</span>
            <input className="input" value={draft.location} placeholder="Casa, oficina…" onChange={e => set({ location: e.target.value })} />
          </label>
        </div>

        <div className="field">
          <span>Duración</span>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(d => (
              <button key={d} className={`chip min-h-9 px-3 ${draft.minutes === d ? 'bg-coral text-bg-deep' : 'hover:bg-surface-3'}`} onClick={() => set({ minutes: d })} aria-pressed={draft.minutes === d}>
                {d} min
              </button>
            ))}
            <input
              type="number"
              min={1}
              inputMode="numeric"
              className="input !min-h-9 !w-24"
              value={draft.minutes || ''}
              aria-label="Minutos personalizados"
              onChange={e => set({ minutes: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>

        <div className="field">
          <span>Dificultad</span>
          <div className="segmented">
            {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map(d => (
              <button key={d} aria-pressed={draft.difficulty === d} onClick={() => set({ difficulty: d })}>
                {{ EASY: 'Fácil', NORMAL: 'Normal', HARD: 'Difícil' }[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Repetición</span>
          <div className="segmented">
            {(['NONE', 'DAILY', 'WEEKLY'] as Recurrence[]).map(r => (
              <button key={r} aria-pressed={draft.recurrence === r} onClick={() => set({ recurrence: r })}>
                {{ NONE: 'Una vez', DAILY: 'Diaria', WEEKLY: 'Semanal' }[r]}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Fecha prevista (opcional)</span>
          <input type="date" className="input" value={draft.dueDate ?? ''} onChange={e => set({ dueDate: e.target.value || undefined })} />
        </label>

        <div className="rounded-2xl bg-bg-deep border border-line p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-sm font-semibold">Recompensa</p>
            {customRewards ? (
              <button
                className="btn btn-ghost btn-sm text-teal"
                onClick={() => {
                  setCustomRewards(false);
                  setDraft(prev => ({ ...prev, ...suggested }));
                }}
              >
                <Sparkles size={14} /> Usar sugerida
              </button>
            ) : (
              <span className="chip text-teal">
                <Sparkles size={12} /> Sugerida
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              <span>Créditos</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="input counter"
                value={draft.rewardCash}
                onChange={e => {
                  setCustomRewards(true);
                  setDraft(prev => ({ ...prev, rewardCash: Math.max(0, parseInt(e.target.value, 10) || 0) }));
                }}
              />
            </label>
            <label className="field">
              <span>Respeto</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="input counter"
                value={draft.rewardRespect}
                onChange={e => {
                  setCustomRewards(true);
                  setDraft(prev => ({ ...prev, rewardRespect: Math.max(0, parseInt(e.target.value, 10) || 0) }));
                }}
              />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-danger font-medium" role="alert">{error}</p>}
      </div>
    </Sheet>
  );
}
