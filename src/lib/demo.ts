import { ActivityEvent, AppState } from '../types';
import { createMission, newId } from './missions';
import { createBlankState } from './persistence';
import { addDays, dayKey } from './time';

/** Sample data the user can load on purpose from the welcome screen or Perfil. */
export function createDemoState(): AppState {
  const state = createBlankState();
  const now = new Date();
  const campaignId = newId();

  state.districts = [
    { id: newId(), name: 'Trabajo', completions: 9, weeklyTarget: 5 },
    { id: newId(), name: 'Salud', completions: 6, weeklyTarget: 3 },
    { id: newId(), name: 'Estudio', completions: 4, weeklyTarget: 4 },
    { id: newId(), name: 'Hogar', completions: 2, weeklyTarget: 2 },
  ];

  state.campaigns = [{ id: campaignId, name: 'Terminar mi aplicación', category: 'Trabajo', createdAt: Date.now() }];

  const base = { location: '', recurrence: 'NONE' as const };
  state.missions = [
    createMission({ ...base, name: 'Preparar la presentación del viernes', difficulty: 'HARD', minutes: 50, rewardCash: 3300, rewardRespect: 220, category: 'Trabajo', dueDate: dayKey(now) }, { featured: true }),
    createMission({ ...base, name: 'Entrenamiento de fuerza', difficulty: 'HARD', minutes: 45, rewardCash: 3950, rewardRespect: 395, category: 'Salud', location: 'Gimnasio' }),
    createMission({ ...base, name: 'Leer 20 páginas', difficulty: 'EASY', minutes: 20, rewardCash: 800, rewardRespect: 80, category: 'Estudio', location: 'Casa', recurrence: 'DAILY' }),
    createMission({ ...base, name: 'Ordenar el escritorio', difficulty: 'EASY', minutes: 15, rewardCash: 600, rewardRespect: 60, category: 'Hogar', location: 'Casa' }),
    ...['Diseño de pantallas', 'Desarrollo', 'Pruebas', 'Publicación'].map((name, i) =>
      createMission(
        { ...base, name, difficulty: 'NORMAL', minutes: 50, rewardCash: 3000, rewardRespect: 300, category: 'Trabajo' },
        { campaignId, campaignStep: i, status: i === 0 ? 'PASSED' : 'IDLE', archived: false },
      ),
    ),
  ];

  state.rewards = [
    { id: newId(), name: 'Episodio de mi serie', cost: 1500 },
    { id: newId(), name: 'Cena especial', cost: 15000 },
    { id: newId(), name: 'Escapada de fin de semana', cost: 55000, oneTime: true },
  ];
  state.savingGoalId = state.rewards[1].id;

  const events: ActivityEvent[] = [];
  for (let i = 1; i <= 4; i++) {
    const day = addDays(now, -i);
    day.setHours(19, 15);
    events.push({ id: newId(), kind: 'MISSION_COMPLETED', title: i % 2 ? 'Entrenamiento de fuerza' : 'Bloque de trabajo profundo', at: day.getTime(), credits: 3000, respect: 300, category: i % 2 ? 'Salud' : 'Trabajo', minutes: 45 });
    state.activeDays.push(dayKey(day));
  }
  state.activeDays.sort();
  state.events = events;
  state.respect = 1200;
  state.credits = 9800;
  state.totalMissions = 4;
  state.score = 13200;
  return state;
}
