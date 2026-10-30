import { Campaign, Difficulty, Mission, Recurrence } from '../types';
import { isSameDay, isSameWeek } from './time';

/**
 * Timer model: a mission stores the time spent in finished segments (`elapsedMs`)
 * and, while running, the moment the current segment started (`startedAt`).
 * Remaining time is always recomputed from the wall clock, so closing the app or
 * a throttled background tab never loses time.
 */
export function getElapsedMs(m: Mission, now = Date.now()): number {
  const running = m.status === 'ACTIVE' && m.startedAt ? now - m.startedAt : 0;
  return Math.min(m.durationSeconds * 1000, m.elapsedMs + Math.max(0, running));
}

export function getRemainingMs(m: Mission, now = Date.now()): number {
  return Math.max(0, m.durationSeconds * 1000 - getElapsedMs(m, now));
}

export function getProgress(m: Mission, now = Date.now()): number {
  if (m.durationSeconds <= 0) return 1;
  return getElapsedMs(m, now) / (m.durationSeconds * 1000);
}

export function isRunning(m: Mission) {
  return m.status === 'ACTIVE' || m.status === 'PAUSED' || m.status === 'VERIFY';
}

/** A recurring mission already done in its current period (today / this week). */
export function isDoneForPeriod(m: Mission, now = Date.now()): boolean {
  if (m.recurrence === 'NONE' || !m.lastCompletedAt) return false;
  return m.recurrence === 'DAILY' ? isSameDay(m.lastCompletedAt, now) : isSameWeek(m.lastCompletedAt, now);
}

export function isResolved(m: Mission) {
  return m.status === 'PASSED' || m.status === 'FAILED';
}

/** Campaign steps unlock in order: only the first unfinished step is available. */
export function isLocked(m: Mission, missions: Mission[]): boolean {
  if (!m.campaignId || m.campaignStep === undefined) return false;
  return missions.some(
    other =>
      other.campaignId === m.campaignId &&
      other.campaignStep !== undefined &&
      other.campaignStep < m.campaignStep! &&
      other.status !== 'PASSED',
  );
}

/** Missions the user can start right now. */
export function isAvailable(m: Mission, missions: Mission[], now = Date.now()): boolean {
  return (
    !m.archived &&
    (m.status === 'IDLE' || m.status === 'PAUSED') &&
    !isDoneForPeriod(m, now) &&
    !isLocked(m, missions)
  );
}

export function campaignProgress(c: Campaign, missions: Mission[]) {
  const steps = missions.filter(m => m.campaignId === c.id).sort((a, b) => (a.campaignStep ?? 0) - (b.campaignStep ?? 0));
  const done = steps.filter(m => m.status === 'PASSED').length;
  const next = steps.find(m => m.status !== 'PASSED');
  return { steps, done, total: steps.length, next };
}

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = { EASY: 1, NORMAL: 1.5, HARD: 2.2 };

/** Suggested reward so users don't have to invent numbers. */
export function suggestRewards(minutes: number, difficulty: Difficulty) {
  const mult = DIFFICULTY_MULTIPLIER[difficulty];
  return {
    rewardCash: Math.max(50, Math.round((minutes * 40 * mult) / 50) * 50),
    rewardRespect: Math.max(10, Math.round((minutes * 4 * mult) / 5) * 5),
  };
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { EASY: 'Fácil', NORMAL: 'Normal', HARD: 'Difícil' };
export const ENERGY_LABEL: Record<Difficulty, string> = { EASY: 'Energía baja', NORMAL: 'Energía media', HARD: 'Energía alta' };

export function normalizeDifficulty(value: string): Difficulty {
  const v = value.trim().toUpperCase();
  if (v === 'EASY' || v === 'FACIL' || v === 'FÁCIL') return 'EASY';
  if (['HARD', 'DIFICIL', 'DIFÍCIL', 'VETERAN', 'EXTREME', 'INSANE'].includes(v)) return 'HARD';
  return 'NORMAL';
}

export function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface MissionDraft {
  name: string;
  difficulty: Difficulty;
  location: string;
  minutes: number;
  rewardCash: number;
  rewardRespect: number;
  category: string;
  recurrence: Recurrence;
  dueDate?: string;
}

export function createMission(draft: MissionDraft, extra: Partial<Mission> = {}): Mission {
  return {
    id: newId(),
    name: draft.name.trim(),
    difficulty: draft.difficulty,
    location: draft.location.trim(),
    durationSeconds: Math.max(1, Math.round(draft.minutes)) * 60,
    rewardCash: Math.max(0, Math.round(draft.rewardCash)),
    rewardRespect: Math.max(0, Math.round(draft.rewardRespect)),
    status: 'IDLE',
    category: draft.category.trim(),
    createdAt: Date.now(),
    elapsedMs: 0,
    recurrence: draft.recurrence,
    dueDate: draft.dueDate || undefined,
    ...extra,
  };
}

export interface MissionTemplate {
  name: string;
  minutes: number;
  difficulty: Difficulty;
  category: string;
  location: string;
  recurrence: Recurrence;
}

export const TEMPLATES: MissionTemplate[] = [
  { name: 'Bloque de trabajo profundo', minutes: 50, difficulty: 'HARD', category: 'Trabajo', location: '', recurrence: 'NONE' },
  { name: 'Entrenamiento', minutes: 45, difficulty: 'HARD', category: 'Salud', location: 'Gimnasio', recurrence: 'NONE' },
  { name: 'Paseo sin móvil', minutes: 20, difficulty: 'EASY', category: 'Salud', location: '', recurrence: 'DAILY' },
  { name: 'Lectura', minutes: 20, difficulty: 'EASY', category: 'Estudio', location: 'Casa', recurrence: 'DAILY' },
  { name: 'Ordenar la casa', minutes: 15, difficulty: 'EASY', category: 'Hogar', location: 'Casa', recurrence: 'NONE' },
  { name: 'Revisión semanal', minutes: 30, difficulty: 'NORMAL', category: 'Trabajo', location: '', recurrence: 'WEEKLY' },
];
