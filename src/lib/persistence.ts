import { ActivityEvent, AppState, District, EventKind, Mission, MissionStatus, Reward, Settings } from '../types';
import { normalizeDifficulty, newId } from './missions';
import { dayKey } from './time';

export const STORAGE_KEY = 'itm_state';
const LEGACY_BACKUP_KEY = 'itm_state_v1_backup';
const MAX_EVENTS = 1000;

export const defaultSettings: Settings = {
  mode: 'STANDARD',
  restDays: [],
  soundEnabled: true,
  volume: 0.5,
};

export function createBlankState(): AppState {
  return {
    version: 2,
    respect: 0,
    credits: 0,
    strikes: 0,
    missions: [],
    rewards: [],
    events: [],
    districts: [],
    campaigns: [],
    activeDays: [],
    repairedDays: [],
    totalMissions: 0,
    score: 0,
    settings: { ...defaultSettings },
  };
}

export function trimEvents(events: ActivityEvent[]) {
  return events.length > MAX_EVENTS ? events.slice(0, MAX_EVENTS) : events;
}

// ─── Loading ────────────────────────────────────────────────────────────────

export function loadState(): AppState {
  if (typeof window === 'undefined') return createBlankState();
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return createBlankState();
  }
  if (!raw) return createBlankState();

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 2) {
      // Keep the untouched v1 data around in case the migration needs to be revisited.
      try {
        localStorage.setItem(LEGACY_BACKUP_KEY, raw);
      } catch {
        /* storage full: migration still proceeds */
      }
    }
    return normalizeState(parsed) ?? createBlankState();
  } catch (error) {
    console.warn('Estado local corrupto. Se empieza desde cero.', error);
    return createBlankState();
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('No se pudo guardar el progreso.', error);
  }
}

/** Accepts a v2 state, a v1 state or a backup envelope. Returns null if unrecognisable. */
export function normalizeState(input: unknown): AppState | null {
  if (!input || typeof input !== 'object') return null;
  const data = input as Record<string, any>;
  if (data.app === 'into-the-mission' && data.state) return normalizeState(data.state);
  if (data.version === 2) return sanitizeV2(data);
  if (isV1State(data)) return migrateV1(data);
  return null;
}

// ─── Backups ────────────────────────────────────────────────────────────────

export function createBackup(state: AppState) {
  return JSON.stringify({ app: 'into-the-mission', version: 2, exportedAt: new Date().toISOString(), state }, null, 2);
}

// ─── v2 sanitising ──────────────────────────────────────────────────────────

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const STATUSES: MissionStatus[] = ['IDLE', 'ACTIVE', 'PAUSED', 'VERIFY', 'PASSED', 'FAILED'];
const KINDS: EventKind[] = ['MISSION_COMPLETED', 'MISSION_FAILED', 'PURCHASE', 'BONUS', 'RANK_UP', 'PENALTY', 'CAMPAIGN_COMPLETED', 'STREAK_REPAIR'];

function sanitizeV2(data: Record<string, any>): AppState {
  const blank = createBlankState();
  const settings = data.settings ?? {};
  return {
    ...blank,
    respect: num(data.respect),
    credits: num(data.credits),
    strikes: num(data.strikes),
    missions: arr<any>(data.missions).filter(m => m && typeof m.id === 'string').map(sanitizeMission),
    rewards: arr<any>(data.rewards)
      .filter(r => r && typeof r.id === 'string')
      .map(r => ({ id: r.id, name: str(r.name, 'Recompensa'), cost: num(r.cost), oneTime: !!r.oneTime })),
    events: trimEvents(arr<any>(data.events).filter(e => e && KINDS.includes(e.kind))),
    districts: arr<any>(data.districts)
      .filter(d => d && typeof d.id === 'string')
      .map(d => ({ id: d.id, name: str(d.name, 'Distrito'), completions: num(d.completions), weeklyTarget: num(d.weeklyTarget) })),
    campaigns: arr<any>(data.campaigns).filter(c => c && typeof c.id === 'string'),
    activeDays: arr<string>(data.activeDays).filter(d => typeof d === 'string'),
    repairedDays: arr<string>(data.repairedDays).filter(d => typeof d === 'string'),
    totalMissions: num(data.totalMissions),
    score: num(data.score),
    savingGoalId: typeof data.savingGoalId === 'string' ? data.savingGoalId : undefined,
    lastBonusDay: typeof data.lastBonusDay === 'string' ? data.lastBonusDay : undefined,
    settings: {
      mode: ['RELAXED', 'STANDARD', 'DEMANDING'].includes(settings.mode) ? settings.mode : defaultSettings.mode,
      restDays: arr<number>(settings.restDays).filter(d => Number.isInteger(d) && d >= 0 && d <= 6),
      soundEnabled: typeof settings.soundEnabled === 'boolean' ? settings.soundEnabled : defaultSettings.soundEnabled,
      volume: Math.min(1, Math.max(0, num(settings.volume, defaultSettings.volume))),
    },
  };
}

function sanitizeMission(m: any): Mission {
  return {
    id: m.id,
    name: str(m.name, 'Misión'),
    difficulty: normalizeDifficulty(str(m.difficulty, 'NORMAL')),
    location: str(m.location),
    durationSeconds: Math.max(60, num(m.durationSeconds, 1800)),
    rewardCash: num(m.rewardCash),
    rewardRespect: num(m.rewardRespect),
    status: STATUSES.includes(m.status) ? m.status : 'IDLE',
    category: str(m.category),
    createdAt: num(m.createdAt, Date.now()),
    startedAt: typeof m.startedAt === 'number' ? m.startedAt : undefined,
    elapsedMs: num(m.elapsedMs),
    finishedAt: typeof m.finishedAt === 'number' ? m.finishedAt : undefined,
    archived: !!m.archived,
    featured: !!m.featured,
    dueDate: typeof m.dueDate === 'string' ? m.dueDate : undefined,
    recurrence: m.recurrence === 'DAILY' || m.recurrence === 'WEEKLY' ? m.recurrence : 'NONE',
    lastCompletedAt: typeof m.lastCompletedAt === 'number' ? m.lastCompletedAt : undefined,
    campaignId: typeof m.campaignId === 'string' ? m.campaignId : undefined,
    campaignStep: typeof m.campaignStep === 'number' ? m.campaignStep : undefined,
  };
}

// ─── v1 migration ───────────────────────────────────────────────────────────

const SEED_LOG_NAMES = ['MISIÓN DE NEÓN', 'OBJETIVO POSPUESTO', 'RECUPERACIÓN INTEL'];
const SEED_STATS = { totalMissions: 142, score: 1_240_500, respect: 2450, credits: 14500 };

function isV1State(data: Record<string, any>) {
  return typeof data.respect === 'number' && Array.isArray(data.missions) && Array.isArray(data.logs);
}

/** Old timestamps were locale strings ("30/10/2026, 22:45:00") or "2023.10.24 // 22:45". */
export function parseLegacyTimestamp(value: unknown): number {
  if (typeof value !== 'string') return 0;
  let m = value.match(/(\d{4})\.(\d{2})\.(\d{2})\s*\/\/\s*(\d{1,2}):(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime();

  m = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|a\.\s?m\.|p\.\s?m\.)?/i);
  if (m) {
    let [a, b] = [+m[1], +m[2]];
    // The app was Spanish (dd/mm) unless the first number can't be a day-of-month order.
    let day = a;
    let month = b;
    if (b > 12 && a <= 12) {
      day = b;
      month = a;
    }
    let hour = +m[4];
    const suffix = m[6]?.toLowerCase().replace(/[\s.]/g, '');
    if (suffix === 'pm' && hour < 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
    return new Date(+m[3], month - 1, day, hour, +m[5]).getTime();
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function legacyKind(log: any): EventKind {
  const name = str(log.name).toUpperCase();
  if (name.startsWith('COMPRA:')) return 'PURCHASE';
  if (name.startsWith('BONIFICACIÓN') || name.startsWith('BONIFICACION')) return 'BONUS';
  if (name.startsWith('GAME OVER') || name.startsWith('SOBORNO')) return 'PENALTY';
  if (name.startsWith('FALLO:')) return 'MISSION_FAILED';
  return log.passed ? 'MISSION_COMPLETED' : 'MISSION_FAILED';
}

function legacyTitle(log: any, kind: EventKind) {
  const name = str(log.name, 'Registro');
  if (kind === 'PURCHASE') return name.replace(/^COMPRA:\s*/i, '');
  if (kind === 'MISSION_FAILED') return name.replace(/^FALLO:\s*/i, '');
  return name;
}

export function migrateV1(data: Record<string, any>): AppState {
  const state = createBlankState();
  const logs = arr<any>(data.logs);
  const stats = data.stats ?? {};
  const seedLogs = logs.filter(l => ['1', '2', '3'].includes(l?.id) && SEED_LOG_NAMES.includes(l?.name));
  const hasSeed = seedLogs.length > 0;

  const untouched =
    hasSeed &&
    logs.length === seedLogs.length &&
    data.respect === SEED_STATS.respect &&
    data.credits === SEED_STATS.credits &&
    stats.totalMissions === SEED_STATS.totalMissions;
  // The previous version stored its demo values on first launch; an untouched copy is a fresh start.
  if (untouched) return state;

  const realLogs = logs.filter(l => !seedLogs.includes(l));
  state.events = trimEvents(
    realLogs.map(log => {
      const kind = legacyKind(log);
      const points = num(log.points);
      const event: ActivityEvent = { id: newId(), kind, title: legacyTitle(log, kind), at: parseLegacyTimestamp(log.timestamp) };
      if (log.type === 'CREDITS') event.credits = points;
      else event.respect = points;
      return event;
    }),
  );

  state.respect = num(data.respect);
  state.credits = num(data.credits);
  state.strikes = Math.min(9, num(data.strikes));
  state.totalMissions = Math.max(0, num(stats.totalMissions) - (hasSeed ? SEED_STATS.totalMissions : 0));
  state.score = Math.max(0, num(stats.score) - (hasSeed ? SEED_STATS.score : 0));

  state.activeDays = [
    ...new Set(state.events.filter(e => e.kind === 'MISSION_COMPLETED' && e.at > 0).map(e => dayKey(e.at))),
  ].sort();

  state.missions = arr<any>(data.missions)
    .filter(m => m && m.id !== undefined)
    .map(m => {
      const duration = Math.max(60, num(m.durationSeconds, 1800));
      const remaining = Math.min(duration, Math.max(0, num(m.timeRemaining, duration)));
      const elapsedMs = (duration - remaining) * 1000;
      let status: MissionStatus = STATUSES.includes(m.status) ? m.status : 'IDLE';
      // We can't know since when an old timer was running, so it resumes paused.
      if (status === 'ACTIVE' || (status === 'IDLE' && elapsedMs > 0)) status = 'PAUSED';
      return sanitizeMission({
        ...m,
        id: String(m.id),
        durationSeconds: duration,
        elapsedMs,
        status,
        createdAt: Date.now(),
        recurrence: 'NONE',
      });
    });

  state.districts = arr<any>(data.categories)
    .filter(c => c && typeof c.name === 'string')
    .map<District>(c => ({ id: String(c.id ?? newId()), name: c.name, completions: Math.round(num(c.percentage) / 5), weeklyTarget: 0 }));

  state.rewards = arr<any>(data.rewards)
    .filter(r => r && r.id !== undefined)
    .map<Reward>(r => ({ id: String(r.id), name: str(r.name, 'Recompensa'), cost: num(r.cost) }));

  return state;
}
