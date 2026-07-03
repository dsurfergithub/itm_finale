import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Mission, LogEntry, Category, Reward } from '../types';

interface StoreContextType {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  resetAll: () => void;
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  completeMission: (id: string) => void;
  failMission: (id: string) => void;
  addLog: (log: LogEntry) => void;
  addCategory: (name: string) => void;
  removeCategory: (id: string) => void;
  removeMission: (id: string) => void;
  punish: () => void;
  addReward: (reward: Reward) => void;
  buyReward: (id: string) => void;
}

const defaultState: AppState = {
  respect: 2450,
  credits: 14500,
  strikes: 0,
  missions: [
    {
      id: '1',
      name: 'LIMPIAR EL SECTOR',
      difficulty: 'HARD',
      location: 'OFICINA CENTRO',
      durationSeconds: 45 * 60,
      rewardCash: 5000,
      rewardRespect: 500,
      status: 'IDLE',
      timeRemaining: 45 * 60,
      category: 'TRABAJO'
    },
    {
      id: '2',
      name: 'RECUPERAR DATOS',
      difficulty: 'EASY',
      location: 'CIBERCAFÉ',
      durationSeconds: 15 * 60,
      rewardCash: 1200,
      rewardRespect: 150,
      status: 'IDLE',
      timeRemaining: 15 * 60,
      category: 'TRABAJO'
    }
  ],
  rewards: [
    { id: '1', name: 'DÍA LIBRE', cost: 100000 },
    { id: '2', name: 'CENA ESPECIAL', cost: 15000 },
    { id: '3', name: 'ESCAPADA DE FIN DE SEMANA', cost: 55000 }
  ],
  logs: [
    { id: '1', name: 'MISIÓN DE NEÓN', timestamp: '2023.10.24 // 22:45', points: 5000, type: 'RESPECT', passed: true },
    { id: '2', name: 'OBJETIVO POSPUESTO', timestamp: '2023.10.23 // 14:12', points: -1200, type: 'CREDITS', passed: false },
    { id: '3', name: 'RECUPERACIÓN INTEL', timestamp: '2023.10.22 // 03:20', points: 2500, type: 'RESPECT', passed: true },
  ],
  categories: [
    { id: '1', name: 'TRABAJO', percentage: 85, label: 'EL CAPO' },
    { id: '2', name: 'SALUD', percentage: 60, label: 'ATLETA' },
    { id: '3', name: 'OCIO', percentage: 30, label: 'NOVATO' }
  ],
  stats: {
    streak: 12,
    totalMissions: 142,
    score: 1240500,
    activity: [40, 60, 90, 30, 75, 100, 20]
  }
};

const blankState: AppState = {
  respect: 0,
  credits: 0,
  strikes: 0,
  missions: [],
  rewards: [],
  logs: [],
  categories: [],
  stats: {
    streak: 0,
    totalMissions: 0,
    score: 0,
    activity: [0, 0, 0, 0, 0, 0, 0]
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function loadSavedState(): AppState {
  if (typeof window === 'undefined') return defaultState;

  const saved = localStorage.getItem('itm_state');
  if (!saved) return defaultState;

  try {
    const parsed = JSON.parse(saved) as Partial<AppState>;
    return {
      ...defaultState,
      ...parsed,
      missions: Array.isArray(parsed.missions) ? parsed.missions : defaultState.missions,
      rewards: Array.isArray(parsed.rewards) ? parsed.rewards : defaultState.rewards,
      logs: Array.isArray(parsed.logs) ? parsed.logs : defaultState.logs,
      categories: Array.isArray(parsed.categories) ? parsed.categories : defaultState.categories,
      stats: {
        ...defaultState.stats,
        ...(parsed.stats || {}),
        activity: Array.isArray(parsed.stats?.activity) ? parsed.stats.activity : defaultState.stats.activity,
      },
    };
  } catch (error) {
    console.warn('Estado local corrupto. Se reinicia con valores por defecto.', error);
    localStorage.removeItem('itm_state');
    return defaultState;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadSavedState);

  useEffect(() => {
    localStorage.setItem('itm_state', JSON.stringify(state));
  }, [state]);

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const handleGameOver = (prev: AppState, cause: string): AppState => {
    if (typeof window !== 'undefined') {
      alert(`¡SISTEMA COMPROMETIDO! ALCANZASTE 10 ESTRELLAS DE PENALIZACIÓN. SE HA CONFISCADO LA MITAD DE TU RESPETO Y TODOS TUS CRÉDITOS.\nCAUSA: ${cause}`);
    }
    const gameoverLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      name: `GAME OVER: ${cause}`,
      timestamp: new Date().toLocaleString(),
      points: -Math.floor(prev.respect / 2),
      type: 'RESPECT',
      passed: false
    };
    return {
      ...prev,
      strikes: 0,
      respect: Math.floor(prev.respect / 2),
      credits: 0,
      logs: [gameoverLog, ...prev.logs]
    };
  };

  const punish = () => {
    setState(prev => {
      const newStrikes = (prev.strikes || 0) + 1;
      if (newStrikes >= 10) return handleGameOver({ ...prev, strikes: newStrikes }, 'MÚLTIPLES INFRACCIONES');
      return { ...prev, strikes: newStrikes };
    });
  };

  const removeMission = (id: string) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission) return prev;
      
      const newStrikes = (prev.strikes || 0) + 1;
      const nextState: AppState = {
        ...prev,
        missions: prev.missions.filter(m => m.id !== id),
        strikes: newStrikes
      };
      
      if (newStrikes >= 10) {
        return handleGameOver(nextState, 'MISIÓN ELIMINADA');
      }
      return nextState;
    });
  };

  const addReward = (reward: Reward) => {
    setState(prev => ({
      ...prev,
      rewards: [...(prev.rewards || []), reward]
    }));
  };

  const buyReward = (id: string) => {
    setState(prev => {
      const reward = prev.rewards?.find(r => r.id === id);
      if (!reward || prev.credits < reward.cost) return prev;
      
      const newLog: LogEntry = {
        id: Date.now().toString(),
        name: `COMPRA: ${reward.name}`,
        timestamp: new Date().toLocaleString(),
        points: -reward.cost,
        type: 'CREDITS',
        passed: false
      };

      return {
        ...prev,
        credits: prev.credits - reward.cost,
        rewards: prev.rewards?.filter(r => r.id !== id) || [],
        logs: [newLog, ...prev.logs]
      };
    });
  };

  const resetAll = () => {
    setState(blankState);
  };

  const addMission = (mission: Mission) => {
    setState(prev => {
      const categoryExists = prev.categories.some(c => c.name === mission.category);
      let newCategories = prev.categories;
      
      if (!categoryExists && mission.category) {
        newCategories = [...prev.categories, {
           id: Date.now().toString() + Math.random(),
           name: mission.category,
           percentage: 0,
           label: 'NUEVO'
        }];
      }

      return { 
        ...prev, 
        categories: newCategories,
        missions: [mission, ...prev.missions] 
      };
    });
  };

  const updateMission = (id: string, updates: Partial<Mission>) => {
    setState(prev => ({
      ...prev,
      missions: prev.missions.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  };

  const completeMission = (id: string) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission || mission.status === 'PASSED' || mission.status === 'FAILED') return prev;

      const finishDate = new Date();
      const elapsedMinutes = Math.floor((mission.durationSeconds - (mission.timeRemaining || 0)) / 60);
      const timeStr = elapsedMinutes > 0 ? ` (${elapsedMinutes} MIN)` : '';

      const passedLog: LogEntry = {
        id: Date.now().toString(),
        name: mission.name + timeStr,
        timestamp: finishDate.toLocaleString(),
        points: mission.rewardRespect,
        type: 'RESPECT',
        passed: true
      };

      const newStats = {
        ...prev.stats,
        totalMissions: prev.stats.totalMissions + 1,
        score: prev.stats.score + mission.rewardCash + mission.rewardRespect,
        streak: prev.stats.streak + 1,
        activity: [...prev.stats.activity]
      };
      newStats.activity[6] = Math.min(100, newStats.activity[6] + 15);

      let updatedCategories = [...prev.categories];
      const catIndex = updatedCategories.findIndex(c => c.name === mission.category);
      if (catIndex !== -1) {
        const cat = updatedCategories[catIndex];
        const newPct = Math.min(100, cat.percentage + Math.max(1, Math.floor(mission.rewardRespect / 100)));
        let newLabel = cat.label;
        if (newPct >= 100) newLabel = 'EL CAPO';
        else if (newPct >= 75) newLabel = 'VETERANO';
        else if (newPct >= 50) newLabel = 'AVANZADO';
        else if (newPct >= 20) newLabel = 'ACTIVO';
        
        updatedCategories[catIndex] = {
           ...cat,
           percentage: newPct,
           label: newLabel
        };
      }

      return {
        ...prev,
        categories: updatedCategories,
        respect: prev.respect + mission.rewardRespect,
        credits: prev.credits + mission.rewardCash,
        missions: prev.missions.map(m => m.id === id ? { ...m, status: 'PASSED' } as Mission : m),
        logs: [passedLog, ...prev.logs],
        stats: newStats
      };
    });
  };

  const failMission = (id: string) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission || mission.status === 'PASSED' || mission.status === 'FAILED') return prev;

      const finishDate = new Date();
      const failedLog: LogEntry = {
        id: Date.now().toString(),
        name: `FALLO: ${mission.name}`,
        timestamp: finishDate.toLocaleString(),
        points: -Math.floor(mission.rewardRespect / 2),
        type: 'RESPECT',
        passed: false
      };

      const newStrikes = (prev.strikes || 0) + 1;
      const nextState: AppState = {
        ...prev,
        strikes: newStrikes,
        respect: Math.max(0, prev.respect - Math.floor(mission.rewardRespect / 2)),
        missions: prev.missions.map(m => m.id === id ? { ...m, status: 'FAILED' } as Mission : m),
        logs: [failedLog, ...prev.logs],
        stats: {
          ...prev.stats,
          streak: 0
        }
      };

      if (newStrikes >= 10) {
        return handleGameOver(nextState, `FALLO EN ${mission.name}`);
      }
      
      return nextState;
    });
  };

  const addLog = (log: LogEntry) => {
    setState(prev => ({ ...prev, logs: [log, ...prev.logs] }));
  };

  const addCategory = (name: string) => {
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, {
        id: Date.now().toString(),
        name,
        percentage: 0,
        label: 'NOVATO'
      }]
    }));
  };

  const removeCategory = (id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }));
  };

  useEffect(() => {
    const lastDate = localStorage.getItem('itm_last_date');
    const today = new Date().toLocaleDateString();
    
    if (lastDate && lastDate !== today) {
      setState(prev => {
        const newActivity = [...prev.stats.activity.slice(1), 0];
        return {
          ...prev,
          stats: { ...prev.stats, activity: newActivity }
        };
      });
    }
    localStorage.setItem('itm_last_date', today);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        let changed = false;
        const newMissions = prev.missions.map(m => {
          if (m.status === 'ACTIVE' && m.timeRemaining !== undefined && m.timeRemaining > 0) {
            changed = true;
            const newTime = m.timeRemaining - 1;
            if (newTime <= 0) {
              return { ...m, status: 'VERIFY', timeRemaining: 0 } as Mission;
            }
            return { ...m, timeRemaining: newTime };
          }
          return m;
        });
        
        if (changed) {
          return { ...prev, missions: newMissions };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StoreContext.Provider value={{ state, updateState, resetAll, addMission, updateMission, removeMission, completeMission, failMission, addLog, addCategory, removeCategory, punish, addReward, buyReward }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
