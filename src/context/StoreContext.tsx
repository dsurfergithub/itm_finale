import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityEvent, AppState, Difficulty, District, Mission, Reward, Settings } from '../types';
import { createMission, getElapsedMs, MissionDraft, newId } from '../lib/missions';
import { createBlankState, loadState, saveState, trimEvents } from '../lib/persistence';
import { getRankIndex, Rank, RANKS } from '../lib/ranks';
import { dayKey } from '../lib/time';
import { repairableDay } from '../lib/streak';
import { soundManager } from '../utils/audio';

export const DAILY_BONUS = 2000;
export const STREAK_REPAIR_COST = 3000;
export const CLEAR_STRIKE_COST = 5000;
const MAX_STRIKES = 10;

export interface CompletionOutcome {
  credits: number;
  respect: number;
  rankUp?: Rank;
  campaignCompleted?: { name: string; bonus: number };
}

interface StoreContextType {
  state: AppState;
  /** Restores a snapshot returned by any mutating action. */
  restore: (snapshot: AppState) => void;
  replaceState: (next: AppState) => void;
  resetAll: () => void;

  addMission: (draft: MissionDraft) => Mission;
  addMissions: (drafts: MissionDraft[]) => void;
  updateMission: (id: string, patch: Partial<Mission>) => void;
  duplicateMission: (id: string) => void;
  removeMission: (id: string) => AppState;
  archiveMission: (id: string, archived: boolean) => AppState;
  toggleFeatured: (id: string) => void;

  startMission: (id: string) => void;
  pauseMission: (id: string) => void;
  resetTimer: (id: string) => void;
  completeMission: (id: string) => { snapshot: AppState; outcome: CompletionOutcome } | null;
  failMission: (id: string) => AppState;
  /** Scanner rejection: only costs something in demanding mode. */
  rejectSuggestion: () => void;

  addCampaign: (input: { name: string; category: string; steps: string[]; minutes: number; difficulty: Difficulty; rewardCash: number; rewardRespect: number }) => void;
  removeCampaign: (id: string) => AppState;

  addDistrict: (name: string) => void;
  updateDistrict: (id: string, patch: Partial<Pick<District, 'name' | 'weeklyTarget'>>) => void;
  removeDistrict: (id: string) => AppState;

  addReward: (reward: Omit<Reward, 'id'>) => void;
  updateReward: (id: string, patch: Partial<Reward>) => void;
  removeReward: (id: string) => AppState;
  redeemReward: (id: string) => AppState | null;
  setSavingGoal: (id: string | undefined) => void;
  claimDailyBonus: () => boolean;
  repairStreak: () => boolean;
  clearStrike: () => boolean;

  updateSettings: (patch: Partial<Settings>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function ensureDistricts(districts: District[], names: string[]): District[] {
  const next = [...districts];
  for (const name of names) {
    if (name.trim() && !next.some(d => sameName(d.name, name))) {
      next.push({ id: newId(), name: name.trim(), completions: 0, weeklyTarget: 0 });
    }
  }
  return next;
}

function event(kind: ActivityEvent['kind'], title: string, extra: Partial<ActivityEvent> = {}): ActivityEvent {
  return { id: newId(), kind, title, at: Date.now(), ...extra };
}

/** Freezes a running timer into `elapsedMs`. */
function freeze(m: Mission, now: number): Mission {
  if (m.status !== 'ACTIVE') return m;
  return { ...m, status: 'PAUSED', elapsedMs: getElapsedMs(m, now), startedAt: undefined };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const stateRef = useRef(state);

  // Actions run against the latest committed state so they can return snapshots for "Deshacer".
  const apply = useCallback((fn: (prev: AppState) => AppState) => {
    const prev = stateRef.current;
    const next = fn(prev);
    if (next !== prev) {
      stateRef.current = next;
      setState(next);
    }
    return prev;
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    soundManager.configure(state.settings.soundEnabled, state.settings.volume);
  }, [state.settings.soundEnabled, state.settings.volume]);

  // Moves finished timers to VERIFY. Remaining time is derived from timestamps,
  // so this also catches timers that ended while the app was closed.
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const due = stateRef.current.missions.some(
        m => m.status === 'ACTIVE' && getElapsedMs(m, now) >= m.durationSeconds * 1000,
      );
      if (!due) return;
      apply(prev => ({
        ...prev,
        missions: prev.missions.map(m => {
          if (m.status !== 'ACTIVE' || getElapsedMs(m, now) < m.durationSeconds * 1000) return m;
          const total = m.durationSeconds * 1000;
          return { ...m, status: 'VERIFY', elapsedMs: total, finishedAt: (m.startedAt ?? now) + (total - m.elapsedMs), startedAt: undefined };
        }),
      }));
      if (document.visibilityState === 'visible') soundManager.playAlert();
    };
    check();
    const interval = window.setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
    };
  }, [apply]);

  const mapMission = (id: string, fn: (m: Mission) => Mission) =>
    apply(prev => ({ ...prev, missions: prev.missions.map(m => (m.id === id ? fn(m) : m)) }));

  const actions = useMemo<Omit<StoreContextType, 'state'>>(() => {
    const addPenaltyStrike = (s: AppState, cause: string): AppState => {
      if (s.settings.mode !== 'DEMANDING') return s;
      const strikes = s.strikes + 1;
      if (strikes < MAX_STRIKES) return { ...s, strikes };
      const lost = Math.floor(s.credits / 2);
      return {
        ...s,
        strikes: 0,
        credits: s.credits - lost,
        events: trimEvents([event('PENALTY', `Diez estrellas: pierdes la mitad de tus créditos (${cause})`, { credits: -lost }), ...s.events]),
      };
    };

    return {
      restore: snapshot => apply(() => snapshot),
      replaceState: next => apply(() => next),
      resetAll: () => apply(prev => ({ ...createBlankState(), settings: prev.settings })),

      addMission: draft => {
        const mission = createMission(draft);
        apply(prev => ({ ...prev, missions: [mission, ...prev.missions], districts: ensureDistricts(prev.districts, [mission.category]) }));
        return mission;
      },

      addMissions: drafts => {
        const missions = drafts.map(d => createMission(d));
        apply(prev => ({
          ...prev,
          missions: [...missions, ...prev.missions],
          districts: ensureDistricts(prev.districts, missions.map(m => m.category)),
        }));
      },

      updateMission: (id, patch) =>
        apply(prev => ({
          ...prev,
          missions: prev.missions.map(m => (m.id === id ? { ...m, ...patch } : m)),
          districts: patch.category ? ensureDistricts(prev.districts, [patch.category]) : prev.districts,
        })),

      duplicateMission: id =>
        apply(prev => {
          const index = prev.missions.findIndex(m => m.id === id);
          if (index === -1) return prev;
          const source = prev.missions[index];
          const copy: Mission = {
            ...source,
            id: newId(),
            name: `${source.name} (copia)`,
            status: 'IDLE',
            elapsedMs: 0,
            startedAt: undefined,
            finishedAt: undefined,
            lastCompletedAt: undefined,
            archived: false,
            featured: false,
            campaignId: undefined,
            campaignStep: undefined,
            createdAt: Date.now(),
          };
          const missions = [...prev.missions];
          missions.splice(index + 1, 0, copy);
          return { ...prev, missions };
        }),

      removeMission: id => apply(prev => ({ ...prev, missions: prev.missions.filter(m => m.id !== id) })),

      archiveMission: (id, archived) =>
        mapMission(id, m => ({ ...freeze(m, Date.now()), archived, featured: archived ? false : m.featured })),

      toggleFeatured: id =>
        apply(prev => ({
          ...prev,
          missions: prev.missions.map(m => ({ ...m, featured: m.id === id ? !m.featured : false })),
        })),

      startMission: id =>
        apply(prev => {
          const now = Date.now();
          return {
            ...prev,
            // One mission in focus at a time: starting one pauses the rest.
            missions: prev.missions.map(m =>
              m.id === id ? { ...m, status: 'ACTIVE', startedAt: now, archived: false } : freeze(m, now),
            ),
          };
        }),

      pauseMission: id => mapMission(id, m => freeze(m, Date.now())),

      resetTimer: id =>
        mapMission(id, m => ({ ...m, status: 'IDLE', elapsedMs: 0, startedAt: undefined, finishedAt: undefined })),

      completeMission: id => {
        const current = stateRef.current;
        const mission = current.missions.find(m => m.id === id);
        if (!mission || mission.status === 'PASSED' || mission.status === 'FAILED') return null;

        const now = Date.now();
        const minutes = Math.max(1, Math.round(getElapsedMs(mission, now) / 60000));
        const outcome: CompletionOutcome = { credits: mission.rewardCash, respect: mission.rewardRespect };

        const snapshot = apply(prev => {
          const respect = prev.respect + mission.rewardRespect;
          const events: ActivityEvent[] = [
            event('MISSION_COMPLETED', mission.name, {
              credits: mission.rewardCash,
              respect: mission.rewardRespect,
              category: mission.category,
              minutes,
              missionId: mission.id,
            }),
          ];

          const before = getRankIndex(prev.respect);
          const after = getRankIndex(respect);
          if (after > before) {
            outcome.rankUp = RANKS[after];
            events.unshift(event('RANK_UP', `Nuevo rango: ${RANKS[after].name}`));
          }

          let missions = prev.missions.map<Mission>(m => {
            if (m.id !== id) return m;
            const base = { ...m, startedAt: undefined, featured: false };
            return m.recurrence === 'NONE'
              ? { ...base, status: 'PASSED', finishedAt: now, elapsedMs: getElapsedMs(m, now) }
              : { ...base, status: 'IDLE', elapsedMs: 0, finishedAt: undefined, lastCompletedAt: now };
          });

          let credits = prev.credits + mission.rewardCash;
          let campaigns = prev.campaigns;
          const campaign = mission.campaignId ? prev.campaigns.find(c => c.id === mission.campaignId) : undefined;
          if (campaign && !campaign.completedAt) {
            const steps = missions.filter(m => m.campaignId === campaign.id);
            if (steps.every(m => m.status === 'PASSED')) {
              const bonus = 1000 + steps.length * 500;
              credits += bonus;
              outcome.campaignCompleted = { name: campaign.name, bonus };
              campaigns = prev.campaigns.map(c => (c.id === campaign.id ? { ...c, completedAt: now } : c));
              events.unshift(event('CAMPAIGN_COMPLETED', `Campaña completada: ${campaign.name}`, { credits: bonus }));
            }
          }

          const today = dayKey(now);
          const districts = ensureDistricts(prev.districts, [mission.category]).map(d =>
            sameName(d.name, mission.category) ? { ...d, completions: d.completions + 1 } : d,
          );

          return {
            ...prev,
            respect,
            credits,
            missions,
            campaigns,
            districts,
            events: trimEvents([...events, ...prev.events]),
            activeDays: prev.activeDays.includes(today) ? prev.activeDays : [...prev.activeDays, today].sort(),
            totalMissions: prev.totalMissions + 1,
            score: prev.score + mission.rewardCash + mission.rewardRespect,
          };
        });
        return { snapshot, outcome };
      },

      failMission: id =>
        apply(prev => {
          const mission = prev.missions.find(m => m.id === id);
          if (!mission || mission.status === 'PASSED' || mission.status === 'FAILED') return prev;
          const now = Date.now();
          const loss = prev.settings.mode === 'RELAXED' ? 0 : Math.floor(mission.rewardRespect / 2);
          const next: AppState = {
            ...prev,
            respect: Math.max(0, prev.respect - loss),
            missions: prev.missions.map<Mission>(m => {
              if (m.id !== id) return m;
              return m.recurrence === 'NONE'
                ? { ...m, status: 'FAILED', startedAt: undefined, finishedAt: now, featured: false }
                : { ...m, status: 'IDLE', elapsedMs: 0, startedAt: undefined, finishedAt: undefined };
            }),
            events: trimEvents([
              event('MISSION_FAILED', mission.name, { respect: loss ? -loss : undefined, category: mission.category, missionId: id }),
              ...prev.events,
            ]),
          };
          return addPenaltyStrike(next, mission.name);
        }),

      rejectSuggestion: () => apply(prev => addPenaltyStrike(prev, 'misión rechazada')),

      addCampaign: ({ name, category, steps, minutes, difficulty, rewardCash, rewardRespect }) =>
        apply(prev => {
          const id = newId();
          const missions = steps.map((step, i) =>
            createMission(
              { name: step, difficulty, location: '', minutes, rewardCash, rewardRespect, category, recurrence: 'NONE' },
              { campaignId: id, campaignStep: i },
            ),
          );
          return {
            ...prev,
            campaigns: [{ id, name: name.trim(), category: category.trim(), createdAt: Date.now() }, ...prev.campaigns],
            missions: [...missions, ...prev.missions],
            districts: ensureDistricts(prev.districts, [category]),
          };
        }),

      removeCampaign: id =>
        apply(prev => ({
          ...prev,
          campaigns: prev.campaigns.filter(c => c.id !== id),
          // Finished steps stay in the history; pending steps go with the campaign.
          missions: prev.missions
            .filter(m => m.campaignId !== id || m.status === 'PASSED')
            .map(m => (m.campaignId === id ? { ...m, campaignId: undefined, campaignStep: undefined } : m)),
        })),

      addDistrict: name => apply(prev => ({ ...prev, districts: ensureDistricts(prev.districts, [name]) })),

      updateDistrict: (id, patch) =>
        apply(prev => {
          const district = prev.districts.find(d => d.id === id);
          if (!district) return prev;
          const renamed = patch.name && !sameName(patch.name, district.name) ? patch.name.trim() : undefined;
          return {
            ...prev,
            districts: prev.districts.map(d => (d.id === id ? { ...d, ...patch, name: renamed ?? d.name } : d)),
            missions: renamed
              ? prev.missions.map(m => (sameName(m.category, district.name) ? { ...m, category: renamed } : m))
              : prev.missions,
            campaigns: renamed
              ? prev.campaigns.map(c => (sameName(c.category, district.name) ? { ...c, category: renamed } : c))
              : prev.campaigns,
          };
        }),

      removeDistrict: id => apply(prev => ({ ...prev, districts: prev.districts.filter(d => d.id !== id) })),

      addReward: reward => apply(prev => ({ ...prev, rewards: [...prev.rewards, { ...reward, id: newId() }] })),

      updateReward: (id, patch) =>
        apply(prev => ({ ...prev, rewards: prev.rewards.map(r => (r.id === id ? { ...r, ...patch } : r)) })),

      removeReward: id =>
        apply(prev => ({
          ...prev,
          rewards: prev.rewards.filter(r => r.id !== id),
          savingGoalId: prev.savingGoalId === id ? undefined : prev.savingGoalId,
        })),

      redeemReward: id => {
        const reward = stateRef.current.rewards.find(r => r.id === id);
        if (!reward || stateRef.current.credits < reward.cost) return null;
        return apply(prev => ({
          ...prev,
          credits: prev.credits - reward.cost,
          rewards: reward.oneTime ? prev.rewards.filter(r => r.id !== id) : prev.rewards,
          savingGoalId: reward.oneTime && prev.savingGoalId === id ? undefined : prev.savingGoalId,
          events: trimEvents([event('PURCHASE', reward.name, { credits: -reward.cost }), ...prev.events]),
        }));
      },

      setSavingGoal: id => apply(prev => ({ ...prev, savingGoalId: id })),

      claimDailyBonus: () => {
        const today = dayKey();
        if (stateRef.current.lastBonusDay === today) return false;
        apply(prev => ({
          ...prev,
          credits: prev.credits + DAILY_BONUS,
          lastBonusDay: today,
          events: trimEvents([event('BONUS', 'Bonificación diaria', { credits: DAILY_BONUS }), ...prev.events]),
        }));
        return true;
      },

      repairStreak: () => {
        const s = stateRef.current;
        const day = repairableDay({ activeDays: s.activeDays, repairedDays: s.repairedDays, restDays: s.settings.restDays });
        if (!day || s.credits < STREAK_REPAIR_COST) return false;
        apply(prev => ({
          ...prev,
          credits: prev.credits - STREAK_REPAIR_COST,
          repairedDays: [...prev.repairedDays, day],
          events: trimEvents([event('STREAK_REPAIR', 'Racha recuperada', { credits: -STREAK_REPAIR_COST }), ...prev.events]),
        }));
        return true;
      },

      clearStrike: () => {
        const s = stateRef.current;
        if (s.strikes === 0 || s.credits < CLEAR_STRIKE_COST) return false;
        apply(prev => ({
          ...prev,
          credits: prev.credits - CLEAR_STRIKE_COST,
          strikes: prev.strikes - 1,
          events: trimEvents([event('PURCHASE', 'Limpiar una estrella', { credits: -CLEAR_STRIKE_COST }), ...prev.events]),
        }));
        return true;
      },

      updateSettings: patch =>
        apply(prev => ({
          ...prev,
          settings: { ...prev.settings, ...patch },
          strikes: patch.mode && patch.mode !== 'DEMANDING' ? 0 : prev.strikes,
        })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply]);

  const value = useMemo(() => ({ state, ...actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
