import { ArrowLeft, ArrowRight, Check, Pause, Play, X } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { useStore } from "../context/StoreContext";
import { Sheet } from "./Sheet";
import { timeText } from "../views/MissionsView";
import { soundManager } from "../utils/audio";
export function FocusMission({
  id,
  onClose,
  onComplete,
}: {
  id: string;
  onClose: () => void;
  onComplete: (name: string, cash: number, xp: number) => void;
}) {
  const { state, pauseMission, startMission, completeMission, failMission } =
    useStore();
  const [confirmFail, setConfirmFail] = useState(false);
  const m = state.missions.find((m) => m.id === id);
  if (!m || m.status === "PASSED" || m.status === "FAILED") return null;
  const remaining = m.timeRemaining ?? m.durationSeconds;
  const progress = Math.max(0, Math.min(1, 1 - remaining / m.durationSeconds));
  return (
    <section
      className="focus-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Misión en curso"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !confirmFail) onClose();
      }}
    >
      <div className="focus-background" />
      <header>
        <button autoFocus className="text-button" onClick={onClose}>
          <ArrowLeft size={19} />
          Volver
        </button>
        <span className="eyebrow">MODO MISIÓN</span>
      </header>
      <div className="focus-content">
        <span className="mission-category">{m.category}</span>
        <h1>{m.name}</h1>
        <p>
          {m.status === "VERIFY"
            ? "El tiempo terminó. ¿Lo has conseguido?"
            : m.status === "IDLE"
              ? "Una pausa. Tú decides cuándo seguir."
              : "Este momento es tuyo."}
        </p>
        <div className="timer-orbit">
          <svg viewBox="0 0 260 260" aria-hidden="true">
            <defs>
              <linearGradient id="timer-gradient">
                <stop stopColor="#ffbe96" />
                <stop offset="1" stopColor="#f86b9b" />
              </linearGradient>
            </defs>
            <circle className="timer-track" cx="130" cy="130" r="119" />
            <circle
              className="timer-progress"
              cx="130"
              cy="130"
              r="119"
              strokeDasharray={747.7}
              strokeDashoffset={747.7 * (1 - progress)}
            />
          </svg>
          <div>
            <span className="eyebrow">
              {m.status === "VERIFY"
                ? "A POR EL CIERRE"
                : m.status === "IDLE"
                  ? "EN PAUSA"
                  : "TIEMPO RESTANTE"}
            </span>
            <strong
              role="timer"
              aria-label={`${Math.floor(remaining / 60)} minutos ${remaining % 60} segundos`}
            >
              {timeText(remaining)}
            </strong>
            <span className="timer-duration">
              de {Math.ceil(m.durationSeconds / 60)} minutos
            </span>
          </div>
          <i
            className={
              m.status === "ACTIVE" ? "orbit-dot running" : "orbit-dot"
            }
          />
        </div>
        <div className="focus-rewards">
          <span>+{m.rewardCash} CR</span>
          <i />
          <span>+{m.rewardRespect} XP</span>
        </div>
        <div className="focus-actions">
          {m.status !== "VERIFY" && (
            <button
              className="secondary-button"
              onClick={() =>
                m.status === "ACTIVE" ? pauseMission(id) : startMission(id)
              }
            >
              {m.status === "ACTIVE" ? <Pause size={18} /> : <Play size={18} />}{" "}
              {m.status === "ACTIVE" ? "Pausar" : "Continuar"}
            </button>
          )}
          <button
            className="primary-button"
            disabled={m.status === "IDLE"}
            onClick={() => {
              completeMission(id);
              soundManager.playJackpot();
              onComplete(m.name, m.rewardCash, m.rewardRespect);
            }}
          >
            <Check size={21} />
            Lo he conseguido
          </button>
          <button
            className="text-button fail-link"
            onClick={() => setConfirmFail(true)}
          >
            Hoy no ha salido
          </button>
        </div>
      </div>
      {confirmFail && (
        <Sheet
          title="Un tropiezo también cuenta"
          onClose={() => setConfirmFail(false)}
        >
          <p className="supporting">
            Marcarás esta misión como fallida. Perderás hasta{" "}
            {Math.floor(
              (m.rewardRespect * state.settings.respectLossPercent) / 100,
            )}{" "}
            XP y sumarás {state.settings.failureStars} estrella(s). Las
            consecuencias se activarán según tus reglas.
          </p>
          <button
            className="danger-button"
            onClick={() => {
              failMission(id);
              soundManager.playError();
              onClose();
            }}
          >
            Marcar como fallida <X size={18} />
          </button>
          <button
            className="text-button centered"
            onClick={() => setConfirmFail(false)}
          >
            Seguir intentándolo <ArrowRight size={17} />
          </button>
        </Sheet>
      )}
    </section>
  );
}
export function Celebration({
  name,
  cash,
  xp,
  onClose,
}: {
  name: string;
  cash: number;
  xp: number;
  onClose: () => void;
}) {
  return (
    <div
      className="celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="celebration-sun" />
      {Array.from({ length: 18 }, (_, i) => (
        <i key={i} className="confetti" style={{ "--i": i } as CSSProperties} />
      ))}
      <span className="eyebrow">UN PASO MÁS. BIEN JUGADO.</span>
      <h1 id="celebration-title" className="animate__animated animate__zoomIn">
        MISSION
        <br />
        <em>PASSED.</em>
      </h1>
      <p>{name}</p>
      <div className="celebration-loot">
        <span>+{cash} CR</span>
        <span>+{xp} XP</span>
      </div>
      <button autoFocus className="primary-button" onClick={onClose}>
        A por la siguiente <ArrowRight size={20} />
      </button>
    </div>
  );
}
