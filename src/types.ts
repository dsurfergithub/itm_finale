export type Tab =
  "MISSIONS" | "SPIN" | "PROGRESS" | "STATS" | "LOG" | "STORE" | "SETTINGS";
export type Difficulty =
  "EASY" | "NORMAL" | "HARD" | "VETERAN" | "EXTREME" | "INSANE";
export interface Mission {
  id: string;
  name: string;
  difficulty: Difficulty;
  location: string;
  durationSeconds: number;
  rewardCash: number;
  rewardRespect: number;
  status: "IDLE" | "ACTIVE" | "VERIFY" | "PASSED" | "FAILED";
  timeRemaining?: number;
  category: string;
  deadline?: number;
  completedAt?: string;
  recurrence?: "none" | "daily" | "weekdays" | "weekly";
  nextAvailable?: string;
}
export interface LogEntry {
  id: string;
  name: string;
  timestamp: string;
  points: number;
  type: "RESPECT" | "CREDITS";
  passed: boolean;
  event?: "completed" | "failed" | "purchase" | "bonus" | "penalty" | "system";
  date?: string;
}
export interface Category {
  id: string;
  name: string;
  percentage: number;
  label: string;
}
export interface Reward {
  id: string;
  name: string;
  cost: number;
}
export interface PenaltyRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: "failures" | "strikes";
  every: number;
}
export interface Consequence {
  id: string;
  ruleId: string;
  name: string;
  createdAt: string;
  completedAt?: string;
}
export interface Settings {
  sound: boolean;
  motion: boolean;
  penalizeDelete: boolean;
  penalizeReject: boolean;
  failureStars: number;
  respectLossPercent: number;
  strikeLimit: number;
  confiscation: boolean;
}
export interface AppState {
  version: 2;
  respect: number;
  credits: number;
  strikes: number;
  missions: Mission[];
  rewards: Reward[];
  logs: LogEntry[];
  categories: Category[];
  stats: {
    streak: number;
    totalMissions: number;
    score: number;
    activity: number[];
  };
  settings: Settings;
  penaltyRules: PenaltyRule[];
  consequences: Consequence[];
  failureCount: number;
  earnedStrikes: number;
  activityByDate: Record<string, number>;
  lastBonusDate?: string;
  legacyStats?: Record<string, unknown>;
}
