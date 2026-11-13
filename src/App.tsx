import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { TopBar } from "./components/TopBar";
import { BottomNav } from "./components/BottomNav";
import { MissionsView } from "./views/MissionsView";
import { ProgressView } from "./views/ProgressView";
import { LogView } from "./views/LogView";
import { SpinView } from "./views/SpinView";
import { StoreView } from "./views/StoreView";
import { SettingsView } from "./views/SettingsView";
import { FocusMission, Celebration } from "./components/FocusMission";
import { StoreProvider, useStore } from "./context/StoreContext";
import { soundManager } from "./utils/audio";
import type { Tab } from "./types";
import { lockBody } from "./utils/bodyLock";

function AppContent() {
  const { state, storageError } = useStore();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("MISSIONS");
  const [focus, setFocus] = useState<string>();
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      document.documentElement.style.setProperty(
        "--visible-height",
        `${viewport.height}px`,
      );
      document.documentElement.style.setProperty(
        "--keyboard-inset",
        `${Math.max(0, innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  const [celebration, setCelebration] = useState<{
    name: string;
    cash: number;
    xp: number;
  }>();
  useEffect(() => {
    if (!focus && !celebration) return;
    return lockBody();
  }, [focus, celebration]);
  const navigate = (next: Tab) => {
    soundManager.playClick();
    setTab(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const view =
    tab === "MISSIONS" ? (
      <MissionsView onFocus={setFocus} />
    ) : tab === "SPIN" ? (
      <SpinView
        onMissionAccepted={(id) => {
          setTab("MISSIONS");
          setFocus(id);
        }}
      />
    ) : tab === "STORE" ? (
      <StoreView />
    ) : tab === "PROGRESS" || tab === "STATS" ? (
      <ProgressView onHistory={() => navigate("LOG")} />
    ) : tab === "LOG" ? (
      <LogView onBack={() => navigate("PROGRESS")} />
    ) : (
      <SettingsView onBack={() => navigate("MISSIONS")} />
    );
  return (
    <MotionConfig reducedMotion={state.settings.motion ? "user" : "always"}>
      <div
        className={`app-shell ${tab === "MISSIONS" ? "home-scene" : "inner-scene"}`}
      >
        <div className="coastal-background" aria-hidden="true" />
        <div className="scene-shade" aria-hidden="true" />
        <div className="film-grain" aria-hidden="true" />
        <div
          inert={Boolean(focus || celebration)}
          aria-hidden={focus || celebration ? true : undefined}
        >
          <TopBar onSettings={() => navigate("SETTINGS")} />
          {storageError && (
            <p className="storage-warning" role="alert">
              {storageError}
            </p>
          )}
          <main id="main-content">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: state.settings.motion && !reduce ? 0.2 : 0,
                }}
              >
                {view}
              </motion.div>
            </AnimatePresence>
          </main>
          <BottomNav activeTab={tab} onChangeTab={navigate} />
        </div>
        {focus && (
          <FocusMission
            id={focus}
            onClose={() => setFocus(undefined)}
            onComplete={(name, cash, xp) => {
              setFocus(undefined);
              setCelebration({ name, cash, xp });
            }}
          />
        )}
        {celebration && (
          <Celebration
            {...celebration}
            onClose={() => setCelebration(undefined)}
          />
        )}
      </div>
    </MotionConfig>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
