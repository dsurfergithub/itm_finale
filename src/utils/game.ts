import type {
  AppState,
  Mission,
  PenaltyRule,
  LogEntry,
  Settings,
} from "../types";

export const uid = () => crypto.randomUUID();
export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const defaults: Settings = {
  sound: false,
  motion: true,
  penalizeDelete: false,
  penalizeReject: false,
  failureStars: 1,
  respectLossPercent: 50,
  strikeLimit: 10,
  confiscation: true,
};
export const defaultRules: PenaltyRule[] = [
  {
    id: "desk",
    name: "Ordenar el escritorio durante 10 minutos",
    enabled: true,
    trigger: "failures",
    every: 3,
  },
  {
    id: "drawer",
    name: "Organizar ese cajón que siempre pospongo",
    enabled: true,
    trigger: "strikes",
    every: 5,
  },
  {
    id: "bathroom",
    name: "Limpiar el baño",
    enabled: false,
    trigger: "failures",
    every: 5,
  },
];
export const starterMissions = (): Mission[] => [
  {
    id: uid(),
    name: "Muévete. Cambia el día.",
    difficulty: "EASY",
    location: "Al aire libre",
    durationSeconds: 1200,
    timeRemaining: 1200,
    rewardCash: 500,
    rewardRespect: 100,
    status: "IDLE",
    category: "SALUD",
    recurrence: "daily",
  },
  {
    id: uid(),
    name: "Despeja tu espacio",
    difficulty: "NORMAL",
    location: "Tu rincón",
    durationSeconds: 900,
    timeRemaining: 900,
    rewardCash: 400,
    rewardRespect: 80,
    status: "IDLE",
    category: "PERSONAL",
    recurrence: "none",
  },
  {
    id: uid(),
    name: "Aprende algo nuevo",
    difficulty: "NORMAL",
    location: "Donde quieras",
    durationSeconds: 1500,
    timeRemaining: 1500,
    rewardCash: 750,
    rewardRespect: 150,
    status: "IDLE",
    category: "APRENDIZAJE",
    recurrence: "weekdays",
  },
];
export function initialState(withMissions = true): AppState {
  return {
    version: 2,
    respect: 0,
    credits: 0,
    strikes: 0,
    missions: withMissions ? starterMissions() : [],
    rewards: [
      { id: uid(), name: "Una tarde para mí", cost: 2500 },
      { id: uid(), name: "Cena especial", cost: 5000 },
      { id: uid(), name: "Una escapada", cost: 20000 },
    ],
    logs: [],
    categories: [
      { id: "health", name: "SALUD", percentage: 0, label: "NOVATO" },
      { id: "personal", name: "PERSONAL", percentage: 0, label: "NOVATO" },
      { id: "learn", name: "APRENDIZAJE", percentage: 0, label: "NOVATO" },
    ],
    stats: {
      streak: 0,
      totalMissions: 0,
      score: 0,
      activity: [0, 0, 0, 0, 0, 0, 0],
    },
    settings: { ...defaults },
    penaltyRules: defaultRules.map((r) => ({ ...r })),
    consequences: [],
    failureCount: 0,
    earnedStrikes: 0,
    activityByDate: {},
  };
}
const finite = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) && n >= 0;
export function isValidBackup(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const x = value as AppState;
  return (
    finite(x.respect) &&
    finite(x.credits) &&
    finite(x.strikes) &&
    Array.isArray(x.missions) &&
    x.missions.every(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.name === "string" &&
        !!m.name.trim() &&
        typeof m.category === "string" &&
        typeof m.location === "string" &&
        ["IDLE", "ACTIVE", "VERIFY", "PASSED", "FAILED"].includes(m.status) &&
        ["EASY", "NORMAL", "HARD", "VETERAN", "EXTREME", "INSANE"].includes(
          m.difficulty,
        ) &&
        finite(m.durationSeconds) &&
        m.durationSeconds > 0 &&
        finite(m.rewardCash) &&
        finite(m.rewardRespect) &&
        (m.timeRemaining === undefined || finite(m.timeRemaining)) &&
        (m.deadline === undefined || finite(m.deadline)) &&
        (!m.recurrence ||
          ["none", "daily", "weekdays", "weekly"].includes(m.recurrence)),
    ) &&
    new Set(x.missions.map((m) => m.id)).size === x.missions.length &&
    Array.isArray(x.rewards) &&
    x.rewards.every(
      (r) =>
        r &&
        typeof r.id === "string" &&
        typeof r.name === "string" &&
        finite(r.cost),
    ) &&
    Array.isArray(x.categories) &&
    x.categories.every(
      (c) =>
        c &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        finite(c.percentage) &&
        typeof c.label === "string",
    ) &&
    Array.isArray(x.logs) &&
    x.logs.every(
      (l) =>
        l &&
        typeof l.id === "string" &&
        typeof l.name === "string" &&
        typeof l.timestamp === "string" &&
        Number.isFinite(l.points) &&
        ["CREDITS", "RESPECT"].includes(l.type) &&
        typeof l.passed === "boolean",
    ) &&
    !!x.stats &&
    finite(x.stats.streak) &&
    finite(x.stats.totalMissions) &&
    finite(x.stats.score) &&
    Array.isArray(x.stats.activity) &&
    x.stats.activity.every(finite) &&
    (x.version !== 2 ||
      (!!x.settings &&
        typeof x.settings.sound === "boolean" &&
        typeof x.settings.motion === "boolean" &&
        typeof x.settings.penalizeDelete === "boolean" &&
        typeof x.settings.penalizeReject === "boolean" &&
        typeof x.settings.confiscation === "boolean" &&
        finite(x.settings.failureStars) &&
        x.settings.failureStars <= 5 &&
        Number.isInteger(x.settings.failureStars) &&
        (x.settings.respectLossPercent === undefined ||
          (Number.isInteger(x.settings.respectLossPercent) &&
            x.settings.respectLossPercent >= 0 &&
            x.settings.respectLossPercent <= 100)) &&
        finite(x.settings.strikeLimit) &&
        x.settings.strikeLimit >= 1 &&
        x.settings.strikeLimit <= 20 &&
        Number.isInteger(x.settings.strikeLimit) &&
        Array.isArray(x.penaltyRules) &&
        x.penaltyRules.every(
          (r) =>
            r &&
            typeof r.id === "string" &&
            typeof r.name === "string" &&
            typeof r.enabled === "boolean" &&
            ["failures", "strikes"].includes(r.trigger) &&
            Number.isInteger(r.every) &&
            r.every >= 1 &&
            r.every <= 100,
        ) &&
        Array.isArray(x.consequences) &&
        x.consequences.every(
          (c) =>
            c &&
            typeof c.id === "string" &&
            typeof c.ruleId === "string" &&
            typeof c.name === "string" &&
            typeof c.createdAt === "string" &&
            (!c.completedAt || typeof c.completedAt === "string"),
        ) &&
        finite(x.failureCount) &&
        finite(x.earnedStrikes) &&
        !!x.activityByDate &&
        typeof x.activityByDate === "object" &&
        !Array.isArray(x.activityByDate) &&
        Object.entries(x.activityByDate).every(
          ([date, n]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && finite(n),
        )))
  );
}
export function streakFor(activity: Record<string, number>, now = new Date()) {
  const cursor = new Date(now);
  let streak = 0;
  if (!activity[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (activity[dayKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
export function reconcile(state: AppState, now = Date.now()): AppState {
  let changed = false;
  const date = new Date(now);
  const today = dayKey(date);
  const missions = state.missions.map((m) => {
    if (m.status === "ACTIVE") {
      const deadline =
        m.deadline ?? now + (m.timeRemaining ?? m.durationSeconds) * 1000;
      const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
      if (remaining !== m.timeRemaining || !m.deadline || remaining === 0) {
        changed = true;
        return {
          ...m,
          deadline,
          timeRemaining: remaining,
          status: remaining === 0 ? ("VERIFY" as const) : ("ACTIVE" as const),
        };
      }
    }
    if (
      (m.status === "PASSED" || m.status === "FAILED") &&
      m.recurrence &&
      m.recurrence !== "none" &&
      m.nextAvailable &&
      m.nextAvailable <= today
    ) {
      changed = true;
      return {
        ...m,
        status: "IDLE" as const,
        timeRemaining: m.durationSeconds,
        deadline: undefined,
        nextAvailable: undefined,
      };
    }
    return m;
  });
  const streak = streakFor(state.activityByDate, date);
  if (streak !== state.stats.streak) changed = true;
  return changed
    ? { ...state, missions, stats: { ...state.stats, streak } }
    : state;
}
export function migrate(value: unknown, now = Date.now()): AppState {
  if (!isValidBackup(value))
    throw new Error(
      "El archivo contiene datos incompletos o valores inválidos.",
    );
  const base = initialState(false);
  const old = value as AppState;
  const activity = old.activityByDate ?? {};
  return reconcile(
    {
      ...base,
      ...old,
      version: 2,
      settings: { ...defaults, ...old.settings },
      penaltyRules: old.penaltyRules ?? base.penaltyRules,
      consequences: old.consequences ?? [],
      failureCount: old.failureCount ?? 0,
      earnedStrikes: old.earnedStrikes ?? old.strikes,
      activityByDate: activity,
      legacyStats: old.version === 2 ? old.legacyStats : { ...old.stats },
      stats: { ...old.stats, streak: streakFor(activity, new Date(now)) },
      logs: old.logs.map((l) => ({
        ...l,
        event:
          l.event ??
          (l.name.toUpperCase().startsWith("COMPRA:") ||
          l.name.toUpperCase().startsWith("SOBORNO")
            ? "purchase"
            : l.name.includes("BONIFICACIÓN")
              ? "bonus"
              : l.name.startsWith("GAME OVER")
                ? "system"
                : l.passed
                  ? "completed"
                  : "failed"),
      })),
    },
    now,
  );
}
export const newLog = (
  name: string,
  points: number,
  type: LogEntry["type"],
  event: LogEntry["event"],
): LogEntry => ({
  id: uid(),
  name,
  points,
  type,
  event,
  passed: event === "completed" || event === "bonus",
  timestamp: new Date().toLocaleString("es-ES"),
  date: new Date().toISOString(),
});
export function applyPenalty(
  state: AppState,
  stars: number,
  failure = false,
): AppState {
  const failureCount = state.failureCount + (failure ? 1 : 0);
  const earnedStrikes = state.earnedStrikes + stars;
  const pending = state.penaltyRules.flatMap((r) => {
    if (!r.enabled) return [];
    const before =
      r.trigger === "failures" ? state.failureCount : state.earnedStrikes;
    const after = r.trigger === "failures" ? failureCount : earnedStrikes;
    const count = Math.floor(after / r.every) - Math.floor(before / r.every);
    return Array.from({ length: count }, () => ({
      id: uid(),
      ruleId: r.id,
      name: r.name,
      createdAt: new Date().toISOString(),
    }));
  });
  let next: AppState = {
    ...state,
    failureCount,
    earnedStrikes,
    strikes: state.strikes + stars,
    consequences: [...pending, ...state.consequences],
  };
  if (
    stars > 0 &&
    next.settings.confiscation &&
    next.strikes >= next.settings.strikeLimit
  ) {
    const loss = Math.ceil(next.respect / 2);
    next = {
      ...next,
      strikes: 0,
      respect: next.respect - loss,
      credits: 0,
      logs: [
        newLog(
          "Límite de estrellas: créditos confiscados y respeto reducido",
          -loss,
          "RESPECT",
          "system",
        ),
        ...next.logs,
      ],
    };
  }
  return next;
}
const nextDay = (recurrence: Mission["recurrence"]) => {
  const d = new Date();
  d.setDate(d.getDate() + (recurrence === "weekly" ? 7 : 1));
  if (recurrence === "weekdays")
    while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1);
  return dayKey(d);
};
export function finishMission(
  state: AppState,
  id: string,
  passed: boolean,
): AppState {
  const mission = state.missions.find((m) => m.id === id);
  if (!mission || !["ACTIVE", "VERIFY"].includes(mission.status)) return state;
  const today = dayKey();
  const activity = { ...state.activityByDate };
  if (passed) activity[today] = (activity[today] ?? 0) + 1;
  const respect = passed
    ? mission.rewardRespect
    : -Math.min(
        state.respect,
        Math.floor(
          (mission.rewardRespect * (state.settings.respectLossPercent ?? 50)) /
            100,
        ),
      );
  const categories = state.categories.map((c) =>
    c.name !== mission.category || !passed
      ? c
      : {
          ...c,
          percentage: Math.min(
            100,
            c.percentage + Math.max(1, Math.floor(mission.rewardRespect / 100)),
          ),
          label: "EN MARCHA",
        },
  );
  const next: AppState = {
    ...state,
    respect: state.respect + respect,
    credits: state.credits + (passed ? mission.rewardCash : 0),
    categories,
    activityByDate: activity,
    missions: state.missions.map((m) =>
      m.id !== id
        ? m
        : {
            ...m,
            status: passed ? "PASSED" : "FAILED",
            deadline: undefined,
            completedAt: new Date().toISOString(),
            nextAvailable:
              m.recurrence && m.recurrence !== "none"
                ? nextDay(m.recurrence)
                : undefined,
          },
    ),
    logs: [
      newLog(mission.name, respect, "RESPECT", passed ? "completed" : "failed"),
      ...state.logs,
    ],
    stats: {
      ...state.stats,
      totalMissions: state.stats.totalMissions + (passed ? 1 : 0),
      score:
        state.stats.score +
        (passed ? mission.rewardCash + mission.rewardRespect : 0),
      streak: streakFor(activity),
    },
  };
  return passed ? next : applyPenalty(next, next.settings.failureStars, true);
}
