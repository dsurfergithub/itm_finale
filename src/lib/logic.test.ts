import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Mission } from '../types';
import { previewCsv } from './csv';
import { createMission, getRemainingMs, isLocked } from './missions';
import { migrateV1, normalizeState, parseLegacyTimestamp } from './persistence';
import { computeBestStreak, computeStreak, repairableDay } from './streak';
import { addDays, dayKey } from './time';

const today = new Date(2026, 9, 30, 12); // viernes 30/10/2026
const day = (offset: number) => dayKey(addDays(today, offset));
const streakOf = (activeDays: string[], restDays: number[] = [], repairedDays: string[] = []) =>
  computeStreak({ activeDays, repairedDays, restDays }, today);

describe('racha por días reales', () => {
  it('varias misiones el mismo día cuentan como un solo día', () => {
    assert.equal(streakOf([day(0)]), 1);
    assert.equal(streakOf([day(-2), day(-1), day(0)]), 3);
  });

  it('un hoy todavía vacío no rompe la racha de ayer', () => {
    assert.equal(streakOf([day(-2), day(-1)]), 2);
  });

  it('un día sin misiones rompe la racha', () => {
    assert.equal(streakOf([day(-4), day(-3), day(-1), day(0)]), 2);
  });

  it('los días de descanso no rompen ni suman', () => {
    const yesterday = addDays(today, -1).getDay();
    assert.equal(streakOf([day(-3), day(-2), day(0)], [yesterday]), 3);
  });

  it('recuperar ayer reconstruye la racha', () => {
    const input = { activeDays: [day(-3), day(-2), day(0)], repairedDays: [], restDays: [] };
    assert.equal(repairableDay(input, today), day(-1));
    assert.equal(computeStreak({ ...input, repairedDays: [day(-1)] }, today), 4);
    assert.equal(repairableDay({ ...input, activeDays: [day(0)] }, today), null);
  });

  it('calcula la mejor racha histórica', () => {
    assert.equal(computeBestStreak({ activeDays: [day(-10), day(-9), day(-8), day(-1)], repairedDays: [], restDays: [] }, today), 3);
  });
});

describe('temporizador por marcas de tiempo', () => {
  const base = createMission({ name: 'Foco', difficulty: 'NORMAL', location: '', minutes: 25, rewardCash: 0, rewardRespect: 0, category: 'Trabajo', recurrence: 'NONE' });

  it('descuenta el tiempo transcurrido aunque la app estuviera cerrada', () => {
    const start = 1_000_000;
    const running: Mission = { ...base, status: 'ACTIVE', startedAt: start, elapsedMs: 0 };
    assert.equal(getRemainingMs(running, start + 10 * 60_000), 15 * 60_000);
    assert.equal(getRemainingMs(running, start + 60 * 60_000), 0);
  });

  it('una misión en pausa conserva el tiempo acumulado', () => {
    const paused: Mission = { ...base, status: 'PAUSED', elapsedMs: 5 * 60_000 };
    assert.equal(getRemainingMs(paused, Date.now() + 3_600_000), 20 * 60_000);
  });
});

describe('campañas', () => {
  it('un paso se desbloquea al completar el anterior', () => {
    const step = (i: number, status: Mission['status']) => ({ ...createMission({ name: `Paso ${i}`, difficulty: 'NORMAL', location: '', minutes: 10, rewardCash: 0, rewardRespect: 0, category: 'X', recurrence: 'NONE' }), campaignId: 'c', campaignStep: i, status });
    const missions = [step(0, 'PASSED'), step(1, 'IDLE'), step(2, 'IDLE')];
    assert.equal(isLocked(missions[1], missions), false);
    assert.equal(isLocked(missions[2], missions), true);
  });
});

describe('migración desde la versión anterior', () => {
  const seedLogs = [
    { id: '1', name: 'MISIÓN DE NEÓN', timestamp: '2023.10.24 // 22:45', points: 5000, type: 'RESPECT', passed: true },
    { id: '2', name: 'OBJETIVO POSPUESTO', timestamp: '2023.10.23 // 14:12', points: -1200, type: 'CREDITS', passed: false },
    { id: '3', name: 'RECUPERACIÓN INTEL', timestamp: '2023.10.22 // 03:20', points: 2500, type: 'RESPECT', passed: true },
  ];
  const v1 = {
    respect: 2450,
    credits: 14500,
    strikes: 0,
    missions: [{ id: '1', name: 'LIMPIAR EL SECTOR', difficulty: 'HARD', location: 'OFICINA', durationSeconds: 2700, rewardCash: 5000, rewardRespect: 500, status: 'ACTIVE', timeRemaining: 600, category: 'TRABAJO' }],
    rewards: [{ id: '1', name: 'DÍA LIBRE', cost: 100000 }],
    logs: seedLogs,
    categories: [{ id: '1', name: 'TRABAJO', percentage: 85, label: 'EL CAPO' }],
    stats: { streak: 12, totalMissions: 142, score: 1240500, activity: [0, 0, 0, 0, 0, 0, 0] },
  };

  it('los datos de ejemplo sin tocar se convierten en un inicio desde cero', () => {
    const state = migrateV1(v1);
    assert.equal(state.missions.length, 0);
    assert.equal(state.totalMissions, 0);
    assert.equal(state.credits, 0);
  });

  it('conserva el progreso real, separa compras de fallos y quita los valores precargados', () => {
    const state = migrateV1({
      ...v1,
      credits: 9000,
      logs: [
        { id: 'a', name: 'COMPRA: CENA', timestamp: '30/10/2026, 21:10:00', points: -6000, type: 'CREDITS', passed: false },
        { id: 'b', name: 'CORRER', timestamp: '30/10/2026, 19:05:00', points: 300, type: 'RESPECT', passed: true },
        ...seedLogs,
      ],
      stats: { ...v1.stats, totalMissions: 143 },
    });
    assert.equal(state.credits, 9000);
    assert.equal(state.totalMissions, 1);
    assert.deepEqual(state.events.map(e => e.kind), ['PURCHASE', 'MISSION_COMPLETED']);
    assert.equal(state.events[0].title, 'CENA');
    assert.deepEqual(state.activeDays, ['2026-10-30']);
    // An old running timer resumes paused with its elapsed time.
    assert.equal(state.missions[0].status, 'PAUSED');
    assert.equal(state.missions[0].elapsedMs, (2700 - 600) * 1000);
    assert.equal(state.districts[0].name, 'TRABAJO');
  });

  it('acepta copias en formato nuevo y antiguo, y rechaza archivos ajenos', () => {
    const migrated = migrateV1({ ...v1, credits: 1 });
    assert.ok(normalizeState({ app: 'into-the-mission', version: 2, state: migrated }));
    assert.ok(normalizeState({ ...v1, credits: 1 }));
    assert.equal(normalizeState({ hello: 'world' }), null);
  });

  it('interpreta las fechas antiguas', () => {
    assert.equal(parseLegacyTimestamp('30/10/2026, 22:45:00'), new Date(2026, 9, 30, 22, 45).getTime());
    assert.equal(parseLegacyTimestamp('10/30/2026, 10:45:00 PM'), new Date(2026, 9, 30, 22, 45).getTime());
    assert.equal(parseLegacyTimestamp('basura'), 0);
  });
});

describe('importación CSV', () => {
  const existing = [createMission({ name: 'Leer', difficulty: 'EASY', location: '', minutes: 20, rewardCash: 0, rewardRespect: 0, category: 'Estudio', recurrence: 'NONE' })];

  it('detecta duplicados, errores, comillas y punto y coma', () => {
    const rows = previewCsv(
      'NOMBRE;DIFICULTAD;UBICACION;DURACION_MINUTOS;RECOMPENSA_CASH;RECOMPENSA_RESPETO;CATEGORIA\n' +
        'leer;EASY;;20;;;estudio\n' +
        '"Correr; suave";NORMAL;Parque;30;1000;100;Salud\n' +
        ';NORMAL;;0;;;Salud\n',
      existing,
    );
    assert.equal(rows.length, 3);
    assert.equal(rows[0].duplicate, true);
    assert.ok(rows[0].draft.rewardCash > 0, 'sugiere recompensa si falta');
    assert.equal(rows[1].draft.name, 'Correr; suave');
    assert.equal(rows[1].duplicate, false);
    assert.deepEqual(rows[2].errors, ['Falta el nombre', 'Duración no válida']);
  });
});
