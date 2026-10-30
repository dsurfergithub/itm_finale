import { addDays, dayKey, parseDayKey } from './time';

interface StreakInput {
  activeDays: string[];
  repairedDays: string[];
  restDays: number[];
}

/**
 * Consecutive calendar days with at least one completed mission.
 * Rest days neither count nor break the streak, and today only counts once
 * something is done (an empty today does not break yesterday's streak).
 */
export function computeStreak({ activeDays, repairedDays, restDays }: StreakInput, now = new Date()): number {
  const good = new Set([...activeDays, ...repairedDays]);
  if (good.size === 0) return 0;
  const earliest = [...good].sort()[0];

  let cursor = new Date(now);
  if (!good.has(dayKey(cursor))) cursor = addDays(cursor, -1);

  let streak = 0;
  while (dayKey(cursor) >= earliest) {
    const key = dayKey(cursor);
    if (good.has(key)) streak++;
    else if (!restDays.includes(cursor.getDay())) break;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function computeBestStreak({ activeDays, repairedDays, restDays }: StreakInput, now = new Date()): number {
  const good = new Set([...activeDays, ...repairedDays]);
  if (good.size === 0) return 0;
  let cursor = parseDayKey([...good].sort()[0]);
  const end = dayKey(now);
  let best = 0;
  let run = 0;
  while (dayKey(cursor) <= end) {
    const key = dayKey(cursor);
    if (good.has(key)) {
      run++;
      best = Math.max(best, run);
    } else if (!restDays.includes(cursor.getDay()) && key !== end) {
      run = 0;
    }
    cursor = addDays(cursor, 1);
  }
  return best;
}

/** Yesterday's key if recovering it would restore a broken streak, otherwise null. */
export function repairableDay(input: StreakInput, now = new Date()): string | null {
  const yesterday = addDays(now, -1);
  const key = dayKey(yesterday);
  const good = new Set([...input.activeDays, ...input.repairedDays]);
  if (good.has(key) || input.restDays.includes(yesterday.getDay())) return null;

  const current = computeStreak(input, now);
  const repaired = computeStreak({ ...input, repairedDays: [...input.repairedDays, key] }, now);
  const gain = repaired - current - 1;
  return gain > 0 ? key : null;
}
