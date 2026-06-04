export type Tab = 'MISSIONS' | 'SPIN' | 'PROGRESS' | 'STATS' | 'LOG' | 'STORE';

export interface Mission {
  id: string;
  name: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'VETERAN' | 'EXTREME' | 'INSANE';
  location: string;
  durationSeconds: number;
  rewardCash: number;
  rewardRespect: number;
  status: 'IDLE' | 'ACTIVE' | 'VERIFY' | 'PASSED' | 'FAILED';
  timeRemaining?: number;
  category: string;
}

export interface LogEntry {
  id: string;
  name: string;
  timestamp: string;
  points: number;
  type: 'RESPECT' | 'CREDITS';
  passed: boolean;
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

export interface AppState {
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
}
