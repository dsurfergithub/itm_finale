import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  Mission,
  LogEntry,
  Reward,
  Settings,
  PenaltyRule,
} from "../types";
import {
  initialState,
  migrate,
  reconcile,
  uid,
  finishMission,
  applyPenalty,
  newLog,
  dayKey,
} from "../utils/game";
import { soundManager } from "../utils/audio";

function loadState(): AppState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem("itm_state");
    if (raw) {
      const data = JSON.parse(raw);
      const migrated = migrate(data);
      if (
        !migrated.lastBonusDate &&
        localStorage.getItem("itm_last_bonus_date") ===
          new Date().toLocaleDateString()
      )
        migrated.lastBonusDate = dayKey();
      try {
        if (data.version !== 2 && !localStorage.getItem("itm_pre_v2_backup"))
          localStorage.setItem("itm_pre_v2_backup", raw);
      } catch {
        /* A full quota must not discard a valid save. */
      }
      return migrated;
    }
  } catch {
    if (raw)
      try {
        localStorage.setItem("itm_recovery_backup", raw);
      } catch {}
  }
  return initialState();
}
interface Store {
  state: AppState;
  storageError: string;
  updateState: (s: Partial<AppState>) => void;
  resetAll: () => void;
  addMission: (m: Mission) => void;
  updateMission: (id: string, m: Partial<Mission>) => void;
  startMission: (id: string) => void;
  pauseMission: (id: string) => void;
  removeMission: (id: string) => void;
  completeMission: (id: string) => void;
  failMission: (id: string) => void;
  addLog: (l: LogEntry) => void;
  addCategory: (name: string) => void;
  removeCategory: (id: string) => void;
  punish: () => void;
  addReward: (r: Reward) => void;
  buyReward: (id: string) => void;
  claimBonus: () => void;
  buySoborno: () => void;
  setSettings: (s: Partial<Settings>) => void;
  saveRule: (r: PenaltyRule) => void;
  deleteRule: (id: string) => void;
  completeConsequence: (id: string) => void;
  restore: (data: unknown) => void;
}
const Context = createContext<Store | undefined>(undefined);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    try {
      localStorage.setItem("itm_state", JSON.stringify(state));
      setStorageError("");
    } catch {
      setStorageError(
        "No hay espacio para guardar. Exporta una copia antes de cerrar.",
      );
    }
  }, [state]);
  useEffect(() => {
    soundManager.enabled = state.settings.sound;
    document.documentElement.dataset.motion = state.settings.motion
      ? "full"
      : "reduced";
  }, [state.settings.sound, state.settings.motion]);
  useEffect(() => {
    const tick = () => setState((s) => reconcile(s));
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);
  const updateState = (s: Partial<AppState>) =>
    setState((p) => ({ ...p, ...s }));
  const addMission = (mission: Mission) =>
    setState((s) => ({
      ...s,
      missions: [mission, ...s.missions],
      categories: s.categories.some((c) => c.name === mission.category)
        ? s.categories
        : [
            ...s.categories,
            {
              id: uid(),
              name: mission.category,
              percentage: 0,
              label: "NOVATO",
            },
          ],
    }));
  const updateMission = (id: string, updates: Partial<Mission>) =>
    setState((s) => ({
      ...s,
      missions: s.missions.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      categories:
        updates.category &&
        !s.categories.some((c) => c.name === updates.category)
          ? [
              ...s.categories,
              {
                id: uid(),
                name: updates.category,
                percentage: 0,
                label: "NOVATO",
              },
            ]
          : s.categories,
    }));
  const startMission = (id: string) =>
    setState((s) => ({
      ...s,
      missions: s.missions.map((m) =>
        m.id === id && m.status === "IDLE"
          ? {
              ...m,
              status: "ACTIVE",
              deadline:
                Date.now() + (m.timeRemaining ?? m.durationSeconds) * 1000,
            }
          : m,
      ),
    }));
  const pauseMission = (id: string) =>
    setState((s) => ({
      ...s,
      missions: s.missions.map((m) =>
        m.id === id && m.status === "ACTIVE"
          ? {
              ...m,
              status: "IDLE",
              deadline: undefined,
              timeRemaining: Math.max(
                0,
                Math.ceil(((m.deadline ?? Date.now()) - Date.now()) / 1000),
              ),
            }
          : m,
      ),
    }));
  const removeMission = (id: string) =>
    setState((s) => {
      if (!s.missions.some((m) => m.id === id)) return s;
      const next = { ...s, missions: s.missions.filter((m) => m.id !== id) };
      return s.settings.penalizeDelete ? applyPenalty(next, 1) : next;
    });
  const buyReward = (id: string) =>
    setState((s) => {
      const r = s.rewards.find((r) => r.id === id);
      if (!r || s.credits < r.cost) return s;
      return {
        ...s,
        credits: s.credits - r.cost,
        rewards: s.rewards.filter((r) => r.id !== id),
        logs: [
          newLog(`Compra: ${r.name}`, -r.cost, "CREDITS", "purchase"),
          ...s.logs,
        ],
      };
    });
  const claimBonus = () =>
    setState((s) =>
      s.lastBonusDate === dayKey()
        ? s
        : {
            ...s,
            lastBonusDate: dayKey(),
            credits: s.credits + 2000,
            logs: [newLog("Bonus diario", 2000, "CREDITS", "bonus"), ...s.logs],
          },
    );
  const buySoborno = () =>
    setState((s) =>
      s.credits < 5000 || s.strikes === 0
        ? s
        : {
            ...s,
            credits: s.credits - 5000,
            strikes: s.strikes - 1,
            logs: [
              newLog("Una estrella menos", -5000, "CREDITS", "purchase"),
              ...s.logs,
            ],
          },
    );
  const saveRule = (r: PenaltyRule) =>
    setState((s) => ({
      ...s,
      penaltyRules: s.penaltyRules.some((x) => x.id === r.id)
        ? s.penaltyRules.map((x) => (x.id === r.id ? r : x))
        : [...s.penaltyRules, r],
    }));
  const completeConsequence = (id: string) =>
    setState((s) => {
      const c = s.consequences.find((c) => c.id === id && !c.completedAt);
      return !c
        ? s
        : {
            ...s,
            consequences: s.consequences.map((c) =>
              c.id === id ? { ...c, completedAt: new Date().toISOString() } : c,
            ),
            logs: [
              newLog(
                `Consecuencia cumplida: ${c.name}`,
                0,
                "RESPECT",
                "penalty",
              ),
              ...s.logs,
            ],
          };
    });
  return (
    <Context.Provider
      value={{
        state,
        storageError,
        updateState,
        addMission,
        updateMission,
        startMission,
        pauseMission,
        removeMission,
        buyReward,
        claimBonus,
        buySoborno,
        saveRule,
        completeConsequence,
        resetAll: () => setState(initialState(false)),
        completeMission: (id) =>
          setState((s) => finishMission(reconcile(s), id, true)),
        failMission: (id) =>
          setState((s) => finishMission(reconcile(s), id, false)),
        addLog: (l) => setState((s) => ({ ...s, logs: [l, ...s.logs] })),
        addCategory: (name) =>
          setState((s) =>
            s.categories.some((c) => c.name === name)
              ? s
              : {
                  ...s,
                  categories: [
                    ...s.categories,
                    { id: uid(), name, percentage: 0, label: "NOVATO" },
                  ],
                },
          ),
        removeCategory: (id) =>
          setState((s) => ({
            ...s,
            categories: s.categories.filter((c) => c.id !== id),
          })),
        punish: () =>
          setState((s) => (s.settings.penalizeReject ? applyPenalty(s, 1) : s)),
        addReward: (r) =>
          setState((s) => ({ ...s, rewards: [...s.rewards, r] })),
        setSettings: (settings) =>
          setState((s) => ({ ...s, settings: { ...s.settings, ...settings } })),
        deleteRule: (id) =>
          setState((s) => ({
            ...s,
            penaltyRules: s.penaltyRules.filter((r) => r.id !== id),
          })),
        restore: (data) => setState(migrate(data)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider missing");
  return value;
}
