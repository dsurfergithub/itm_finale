export type Tab = 'TODAY' | 'MISSIONS' | 'CITY' | 'MARKET' | 'PROFILE';

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export type MissionStatus = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'VERIFY' | 'PASSED' | 'FAILED';

export type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY';

export interface Mission {
  id: string;
  name: string;
  difficulty: Difficulty;
  /** Optional place, used by the scanner ("estoy en casa"). */
  location: string;
  durationSeconds: number;
  rewardCash: number;
  rewardRespect: number;
  status: MissionStatus;
  category: string;
  createdAt: number;
  /** Epoch ms when the current running segment started. Only set while ACTIVE. */
  startedAt?: number;
  /** Time already spent in previous segments (pauses split segments). */
  elapsedMs: number;
  /** Epoch ms when the timer reached zero or the mission was resolved. */
  finishedAt?: number;
  archived?: boolean;
  featured?: boolean;
  /** Planned day, YYYY-MM-DD. */
  dueDate?: string;
  recurrence: Recurrence;
  /** Recurring missions go back to IDLE; this marks the period as done. */
  lastCompletedAt?: number;
  campaignId?: string;
  campaignStep?: number;
}

export type EventKind =
  | 'MISSION_COMPLETED'
  | 'MISSION_FAILED'
  | 'PURCHASE'
  | 'BONUS'
  | 'RANK_UP'
  | 'PENALTY'
  | 'CAMPAIGN_COMPLETED'
  | 'STREAK_REPAIR';

export interface ActivityEvent {
  id: string;
  kind: EventKind;
  title: string;
  /** Epoch ms. 0 means unknown (imported from an old log without a parseable date). */
  at: number;
  credits?: number;
  respect?: number;
  category?: string;
  minutes?: number;
  missionId?: string;
}

export interface District {
  id: string;
  name: string;
  /** Missions completed here; drives how much the district has been built. */
  completions: number;
  /** Sessions per week the user wants to do in this area. 0 = no goal. */
  weeklyTarget: number;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  /** One-time rewards leave the catalogue after redeeming; the rest stay. */
  oneTime?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  category: string;
  createdAt: number;
  completedAt?: number;
}

export type GameMode = 'RELAXED' | 'STANDARD' | 'DEMANDING';

export interface Settings {
  mode: GameMode;
  /** Weekdays (0 = domingo) that never break a streak. */
  restDays: number[];
  soundEnabled: boolean;
  /** 0..1 */
  volume: number;
}

export interface AppState {
  version: 2;
  respect: number;
  credits: number;
  strikes: number;
  missions: Mission[];
  rewards: Reward[];
  events: ActivityEvent[];
  districts: District[];
  campaigns: Campaign[];
  /** YYYY-MM-DD days with at least one completed mission. */
  activeDays: string[];
  /** YYYY-MM-DD days recovered with a streak repair. */
  repairedDays: string[];
  totalMissions: number;
  score: number;
  savingGoalId?: string;
  lastBonusDay?: string;
  settings: Settings;
}
