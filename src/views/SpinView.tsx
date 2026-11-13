import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Clock3, Radar, X } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { difficultyNames } from "./MissionsView";
import { soundManager } from "../utils/audio";
export function SpinView({
  onMissionAccepted,
}: {
  onMissionAccepted: (id: string) => void;
}) {
  const { state, startMission, punish } = useStore();
  const [scanning, setScanning] = useState(false);
  const [resultId, setResultId] = useState<string>();
  const [category, setCategory] = useState("Todas");
  const [minutes, setMinutes] = useState("0");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const available = state.missions.filter(
    (m) =>
      m.status === "IDLE" &&
      (category === "Todas" || m.category === category) &&
      (!Number(minutes) || m.durationSeconds <= Number(minutes) * 60),
  );
  const result = state.missions.find(
    (m) => m.id === resultId && m.status === "IDLE",
  );
  const scan = () => {
    if (!available.length || scanning) return;
    setResultId(undefined);
    setScanning(true);
    soundManager.playSpinClick();
    timer.current = setTimeout(() => {
      setResultId(available[Math.floor(Math.random() * available.length)].id);
      setScanning(false);
      soundManager.playAccept();
    }, 1500);
  };
  return (
    <div className="inner-page radar-page">
      <span className="eyebrow">DEJA QUE EL AZAR TE ENCUENTRE</span>
      <h1>
        Una señal.
        <br />
        <em>Un comienzo.</em>
      </h1>
      <p className="page-intro">
        Dinos cuánto tiempo tienes. El siguiente paso lo elegimos al azar.
      </p>
      <div className="form-pair radar-filters">
        <label>
          Territorio
          <select
            value={category}
            disabled={scanning}
            onChange={(e) => {
              setCategory(e.target.value);
              setResultId(undefined);
            }}
          >
            <option>Todas</option>
            {[...new Set(state.missions.map((m) => m.category))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Tiempo disponible
          <select
            value={minutes}
            disabled={scanning}
            onChange={(e) => {
              setMinutes(e.target.value);
              setResultId(undefined);
            }}
          >
            <option value="0">Sin límite</option>
            <option value="15">Hasta 15 min</option>
            <option value="30">Hasta 30 min</option>
            <option value="60">Hasta 1 hora</option>
          </select>
        </label>
      </div>
      <div
        className={`radar-disc ${scanning ? "scanning" : ""}`}
        aria-hidden="true"
      >
        <div className="radar-rings" />
        <div className="radar-sweep" />
        <span className="radar-marker one" />
        <span className="radar-marker two" />
        <span className="radar-marker three" />
        <Radar size={33} />
        <span className="radar-coordinate">25°46′ N / 80°12′ W</span>
      </div>
      <div className="radar-status" role="status">
        <span className="live-dot" />
        {scanning
          ? "BUSCANDO TU SIGUIENTE PASO…"
          : result
            ? "SEÑAL ENCONTRADA"
            : `${available.length} MISIONES EN TU FRECUENCIA`}
      </div>
      {result ? (
        <article className="radar-result animate__animated animate__zoomIn">
          <span className="eyebrow">
            {result.category} / {difficultyNames[result.difficulty]}
          </span>
          <h2>{result.name}</h2>
          <p>
            <Clock3 size={16} />
            {Math.ceil(result.durationSeconds / 60)} min{" "}
            <span>
              +{result.rewardCash} CR · +{result.rewardRespect} XP
            </span>
          </p>
          <button
            className="primary-button"
            onClick={() => {
              startMission(result.id);
              onMissionAccepted(result.id);
            }}
          >
            <Check size={19} />
            Acepto el reto
          </button>
          <button
            className="text-button centered"
            onClick={() => {
              punish();
              setResultId(undefined);
            }}
          >
            <X size={16} />
            Otra vez será{state.settings.penalizeReject ? " (+1 estrella)" : ""}
          </button>
        </article>
      ) : (
        <>
          <button
            className="primary-button"
            disabled={scanning || !available.length}
            onClick={scan}
          >
            {scanning ? "Sintonizando…" : "Encontrar mi misión"}
            <ArrowRight size={20} />
          </button>
          {!available.length && (
            <p className="supporting centered">
              No hay misiones pendientes con esos filtros. Prueba otro tiempo o
              añade una misión.
            </p>
          )}
        </>
      )}
    </div>
  );
}
