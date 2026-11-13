import test from "node:test";
import assert from "node:assert/strict";
import {
  applyPenalty,
  dayKey,
  finishMission,
  initialState,
  isValidBackup,
  migrate,
  reconcile,
  streakFor,
} from "../src/utils/game";
import { exportMissions, importMissions, parseRows } from "../src/utils/csv";

test("An active timer catches up after suspension and a reload", () => {
  const state = initialState();
  const m = state.missions[0];
  m.status = "ACTIVE";
  m.deadline = 100000;
  m.timeRemaining = 100;
  assert.equal(reconcile(state, 75000).missions[0].timeRemaining, 25);
  const reloaded = migrate(JSON.parse(JSON.stringify(state)), 110000);
  assert.equal(reloaded.missions[0].status, "VERIFY");
  assert.equal(reloaded.missions[0].timeRemaining, 0);
});
test("A paused mission does not lose time", () => {
  const s = initialState();
  s.missions[0].timeRemaining = 123;
  assert.equal(
    reconcile(s, Date.now() + 86400000).missions[0].timeRemaining,
    123,
  );
});
test("Completion is idempotent and only started missions earn rewards", () => {
  const s = initialState();
  const m = s.missions[0];
  assert.equal(finishMission(s, m.id, true), s);
  m.status = "ACTIVE";
  const next = finishMission(s, m.id, true);
  assert.equal(next.credits, m.rewardCash);
  assert.equal(next.stats.streak, 1);
  assert.equal(next.stats.totalMissions, 1);
  assert.equal(finishMission(next, m.id, true), next);
});
test("Two completions on the same day still form a one-day streak", () => {
  const s = initialState();
  s.missions[0].status = "ACTIVE";
  s.missions[1].status = "ACTIVE";
  const one = finishMission(s, s.missions[0].id, true);
  const two = finishMission(one, s.missions[1].id, true);
  assert.equal(two.stats.streak, 1);
  assert.equal(two.activityByDate[dayKey()], 2);
});
test("Streak spans consecutive local dates and expires after a missed day", () => {
  assert.equal(
    streakFor({ "2026-11-11": 1, "2026-11-12": 2 }, new Date(2026, 10, 13, 12)),
    2,
  );
  assert.equal(streakFor({ "2026-11-11": 1 }, new Date(2026, 10, 13, 12)), 0);
});
test("A recurring mission reappears without losing its historical completion", () => {
  const s = initialState();
  const m = s.missions[0];
  m.status = "ACTIVE";
  const done = finishMission(s, m.id, true);
  assert.equal(done.missions[0].status, "PASSED");
  const later = reconcile(done, Date.now() + 86400000 * 2);
  assert.equal(later.missions[0].status, "IDLE");
  assert.equal(later.missions[0].timeRemaining, m.durationSeconds);
  assert.equal(later.logs.length, 1);
});
test("Failure consequences trigger at configured multiples and are not duplicated by ticks", () => {
  const s = initialState();
  s.settings.confiscation = false;
  let next = applyPenalty(s, 1, true);
  next = applyPenalty(next, 1, true);
  assert.equal(next.consequences.length, 0);
  next = applyPenalty(next, 1, true);
  assert.equal(next.consequences.length, 1);
  assert.equal(reconcile(next).consequences.length, 1);
  next = applyPenalty(next, 1, true);
  assert.equal(next.consequences.length, 1);
});
test("Crossing a star threshold generates a task even with multi-star failures", () => {
  const s = initialState();
  s.settings.confiscation = false;
  s.penaltyRules = [
    {
      id: "custom",
      name: "Ordenar",
      enabled: true,
      trigger: "strikes",
      every: 3,
    },
  ];
  s.earnedStrikes = 2;
  s.strikes = 2;
  const next = applyPenalty(s, 2, true);
  assert.equal(next.consequences.length, 1);
  assert.equal(next.consequences[0].name, "Ordenar");
});
test("Disabled rules do not create tasks; zero-star failures can still create tasks", () => {
  const s = initialState();
  s.penaltyRules = [
    { id: "a", name: "Activa", enabled: true, trigger: "failures", every: 1 },
    {
      id: "b",
      name: "Desactivada",
      enabled: false,
      trigger: "failures",
      every: 1,
    },
  ];
  const next = applyPenalty(s, 0, true);
  assert.equal(next.strikes, 0);
  assert.deepEqual(
    next.consequences.map((c) => c.name),
    ["Activa"],
  );
});
test("Confiscation is configurable and preserves newly earned consequences", () => {
  const s = initialState();
  s.respect = 101;
  s.credits = 500;
  s.strikes = 9;
  s.earnedStrikes = 9;
  const next = applyPenalty(s, 1, true);
  assert.equal(next.credits, 0);
  assert.equal(next.respect, 50);
  assert.equal(next.strikes, 0);
  assert.equal(next.consequences.length, 1);
  s.settings.confiscation = false;
  assert.equal(applyPenalty(s, 1, true).credits, 500);
});
test("A failed mission cannot be charged twice", () => {
  const s = initialState();
  s.missions[0].status = "ACTIVE";
  const failed = finishMission(s, s.missions[0].id, false);
  assert.equal(failed.failureCount, 1);
  assert.equal(finishMission(failed, s.missions[0].id, false), failed);
});
test("Legacy migration preserves missions, balances and totals, and classifies purchases", () => {
  const s: any = initialState();
  delete s.version;
  delete s.settings;
  delete s.activityByDate;
  delete s.penaltyRules;
  delete s.consequences;
  s.credits = 14500;
  s.stats.streak = 12;
  s.stats.totalMissions = 142;
  s.logs = [
    {
      id: "purchase",
      name: "COMPRA: CENA",
      timestamp: "13/11/2026",
      points: -500,
      type: "CREDITS",
      passed: false,
    },
  ];
  const next = migrate(s);
  assert.deepEqual(next.missions, s.missions);
  assert.equal(next.credits, 14500);
  assert.equal(next.stats.totalMissions, 142);
  assert.equal(next.stats.streak, 0);
  assert.equal(next.legacyStats?.streak, 12);
  assert.equal(next.logs[0].event, "purchase");
  assert.equal(next.penaltyRules.length, 3);
});
test("Backup rejects malformed nested values and duplicate mission IDs", () => {
  const s = initialState();
  assert.ok(isValidBackup(s));
  const bad = structuredClone(s);
  (bad.missions[0] as any).name = 12;
  assert.equal(isValidBackup(bad), false);
  s.missions[1].id = s.missions[0].id;
  assert.equal(isValidBackup(s), false);
});
test("CSV round trip preserves commas, quotes and accented text", () => {
  const s = initialState();
  s.missions[0].name = 'Leer, pensar y "seguir"';
  const parsed = importMissions(exportMissions(s.missions));
  assert.equal(parsed[0].name, s.missions[0].name);
  assert.equal(parsed[0].durationSeconds, s.missions[0].durationSeconds);
});
test("CSV accepts semicolons and multiline quoted fields", () => {
  assert.deepEqual(parseRows('A;B\n"uno;dos";"tres\ncuatro"'), [
    ["A", "B"],
    ["uno;dos", "tres\ncuatro"],
  ]);
});
test("Invalid CSV aborts the import rather than creating broken timers", () => {
  assert.throws(() =>
    importMissions("a,b,c,d,e,f,g\nMisión,NORMAL,Casa,abc,100,20,SALUD"),
  );
  assert.throws(() => parseRows('A,B\n"sin cerrar,abc'));
});

test("Every crossed star multiple creates its own configured consequence", () => {
  const state = initialState();
  state.settings.confiscation = false;
  state.penaltyRules = [
    { id: "a", name: "Ordenar", enabled: true, trigger: "strikes", every: 1 },
  ];
  assert.equal(applyPenalty(state, 3, true).consequences.length, 3);
});
test("Respect loss can be disabled independently of task consequences", () => {
  const state = initialState();
  state.respect = 500;
  state.settings.respectLossPercent = 0;
  state.settings.failureStars = 0;
  state.penaltyRules = [
    { id: "a", name: "Ordenar", enabled: true, trigger: "failures", every: 1 },
  ];
  state.missions[0].status = "ACTIVE";
  const failed = finishMission(state, state.missions[0].id, false);
  assert.equal(failed.respect, 500);
  assert.equal(failed.strikes, 0);
  assert.equal(failed.consequences.length, 1);
});
