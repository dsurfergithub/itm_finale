import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Download,
  ListFilter,
  List,
  MapPin,
  Pencil,
  Play,
  Plus,
  Repeat2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Sheet } from "../components/Sheet";
import type { Mission, Difficulty } from "../types";
import { starterMissions, uid } from "../utils/game";
import { downloadFile, exportMissions, importMissions } from "../utils/csv";
import { soundManager } from "../utils/audio";

export const difficultyNames: Record<Difficulty, string> = {
  EASY: "Suave",
  NORMAL: "A tu ritmo",
  HARD: "Exigente",
  VETERAN: "Veterano",
  EXTREME: "Extremo",
  INSANE: "Sin límites",
};
export const timeText = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
export function MissionForm({
  mission,
  onClose,
}: {
  mission?: Mission;
  onClose: () => void;
}) {
  const { state, addMission, updateMission } = useStore();
  const [name, setName] = useState(mission?.name ?? "");
  const [category, setCategory] = useState(
    mission?.category ?? state.categories[0]?.name ?? "PERSONAL",
  );
  const [location, setLocation] = useState(
    mission?.location ?? "Donde quieras",
  );
  const [minutes, setMinutes] = useState(
    String((mission?.durationSeconds ?? 1500) / 60),
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    mission?.difficulty ?? "NORMAL",
  );
  const [cash, setCash] = useState(String(mission?.rewardCash ?? 500));
  const [respect, setRespect] = useState(String(mission?.rewardRespect ?? 100));
  const [recurrence, setRecurrence] = useState<Mission["recurrence"]>(
    mission?.recurrence ?? "none",
  );
  return (
    <Sheet
      title={mission ? "Dale otra forma" : "Tu próxima misión"}
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !category.trim() || !location.trim()) return;
          const duration = Math.round(Number(minutes) * 60);
          const values = {
            name: name.trim(),
            category: category.trim().toUpperCase(),
            location: location.trim(),
            difficulty,
            durationSeconds: duration,
            rewardCash: Number(cash),
            rewardRespect: Number(respect),
            recurrence,
          };
          if (mission)
            updateMission(mission.id, {
              ...values,
              timeRemaining:
                mission.durationSeconds === duration
                  ? mission.timeRemaining
                  : duration,
            });
          else
            addMission({
              id: uid(),
              ...values,
              status: "IDLE",
              timeRemaining: duration,
            });
          soundManager.playAccept();
          onClose();
        }}
      >
        <label>
          ¿Qué vas a hacer?
          <input
            autoFocus
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ese pequeño gran paso…"
          />
        </label>
        <div className="form-pair">
          <label>
            Minutos
            <input
              required
              type="number"
              min="1"
              max="1440"
              step="1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
          <label>
            Se repite
            <select
              value={recurrence}
              onChange={(e) =>
                setRecurrence(e.target.value as Mission["recurrence"])
              }
            >
              <option value="none">Una vez</option>
              <option value="daily">Cada día</option>
              <option value="weekdays">De lunes a viernes</option>
              <option value="weekly">Cada semana</option>
            </select>
          </label>
        </div>
        <label>
          Tu territorio
          <input
            required
            list="categories"
            maxLength={40}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="categories">
            {state.categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </label>
        <details className="advanced">
          <summary>
            Más detalles <span>Ya están preparados</span>
          </summary>
          <div className="form-stack">
            <label>
              Ubicación
              <input
                required
                maxLength={80}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
            <label>
              Dificultad
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                {Object.entries(difficultyNames).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-pair">
              <label>
                Créditos
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  required
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                />
              </label>
              <label>
                Respeto
                <input
                  type="number"
                  min="0"
                  max="100000"
                  required
                  value={respect}
                  onChange={(e) => setRespect(e.target.value)}
                />
              </label>
            </div>
          </div>
        </details>
        <button className="primary-button" type="submit">
          {mission ? "Guardar cambios" : "Añadir misión"}
          <ArrowRight size={19} />
        </button>
      </form>
    </Sheet>
  );
}
export function Consequences({ onClose }: { onClose: () => void }) {
  const { state, completeConsequence } = useStore();
  const pending = state.consequences.filter((c) => !c.completedAt);
  return (
    <Sheet title="Toca cumplir" onClose={onClose}>
      <p className="supporting">
        Las consecuencias que elegiste. Una a una, también se resuelven.
      </p>
      {pending.length === 0 ? (
        <div className="empty-state">
          <Check />
          <h3>Todo en paz.</h3>
          <p>No tienes consecuencias pendientes.</p>
        </div>
      ) : (
        pending.map((c) => (
          <div className="consequence-row" key={c.id}>
            <div>
              <small>{new Date(c.createdAt).toLocaleDateString("es-ES")}</small>
              <h3>{c.name}</h3>
            </div>
            <button
              className="icon-button"
              aria-label={`Marcar como realizada: ${c.name}`}
              onClick={() => completeConsequence(c.id)}
            >
              <Check size={22} />
            </button>
          </div>
        ))
      )}
    </Sheet>
  );
}
export function MissionsView({ onFocus }: { onFocus: (id: string) => void }) {
  const { state, removeMission, addMission, startMission } = useStore();
  const [selected, setSelected] = useState<string>();
  const [sheet, setSheet] = useState<
    "list" | "new" | "filter" | "consequences" | null
  >(null);
  const [edit, setEdit] = useState<Mission>();
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const [listStatus, setListStatus] = useState("open");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const available = state.missions
    .filter(
      (m) =>
        ["IDLE", "ACTIVE", "VERIFY"].includes(m.status) &&
        (category === "Todas" || m.category === category),
    )
    .sort((a, b) => {
      const priority = { VERIFY: 0, ACTIVE: 1, IDLE: 2, PASSED: 3, FAILED: 3 };
      return priority[a.status] - priority[b.status];
    });
  const index = Math.max(
    0,
    available.findIndex((m) => m.id === selected),
  );
  const mission = available[index];
  const active = state.missions.find(
    (m) => m.status === "ACTIVE" || m.status === "VERIFY",
  );
  const choose = (step: number) => {
    if (!available.length) return;
    setSelected(
      available[(index + step + available.length) % available.length].id,
    );
    soundManager.playClick();
  };
  const pending = state.consequences.filter((c) => !c.completedAt).length;
  const list = state.missions.filter(
    (m) =>
      (category === "Todas" || m.category === category) &&
      m.name.toLowerCase().includes(query.toLowerCase()) &&
      (listStatus === "open"
        ? ["IDLE", "ACTIVE", "VERIFY"].includes(m.status)
        : listStatus === "passed"
          ? m.status === "PASSED"
          : m.status === "FAILED"),
  );
  const begin = (m: Mission) => {
    if (m.status === "IDLE") startMission(m.id);
    soundManager.playAccept();
    onFocus(m.id);
  };
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div className="mission-page">
      <div className="scene-caption">
        <span className="live-dot" /> TU TIEMPO. TUS REGLAS.
        <span className="edition">VOL. 01</span>
      </div>
      <div className="scene-title animate__animated animate__fadeInDown">
        <span>HAZ QUE</span>
        <span>
          CUENTE<span className="title-dot">.</span>
        </span>
        <p>Un pequeño paso. Una buena historia.</p>
      </div>
      <div className="mission-tools">
        <button className="text-button" onClick={() => setSheet("filter")}>
          <ListFilter size={16} />
          {category === "Todas" ? "Todos los territorios" : category}
          <ChevronRight size={14} />
        </button>
        <button
          className="icon-button"
          aria-label="Todas tus misiones"
          onClick={() => setSheet("list")}
        >
          <List size={20} />
        </button>
        <button
          className="icon-button"
          aria-label="Nueva misión"
          onClick={() => setSheet("new")}
        >
          <Plus size={22} />
        </button>
      </div>
      {active && active.id !== mission?.id && (
        <button className="active-strip" onClick={() => onFocus(active.id)}>
          <span className="live-dot" />
          Una misión sigue en marcha <ArrowRight size={16} />
        </button>
      )}
      <section
        className="mission-deck"
        aria-label="Seleccionar misión"
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const dx = e.changedTouches[0].clientX - touch.current.x;
          const dy = e.changedTouches[0].clientY - touch.current.y;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4)
            choose(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {mission ? (
          <article
            key={mission.id}
            className={`mission-ticket animate__animated animate__fadeInRight ${mission.status === "ACTIVE" ? "is-active" : ""}`}
          >
            <div className="ticket-top">
              <span className="eyebrow">
                MISIÓN {String(index + 1).padStart(2, "0")}{" "}
                <span>/ {String(available.length).padStart(2, "0")}</span>
              </span>
              <button
                className="icon-button"
                disabled={mission.status !== "IDLE"}
                aria-label="Editar misión"
                onClick={() => setEdit(mission)}
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="mission-category">{mission.category}</div>
            <h2>{mission.name}</h2>
            <div className="mission-meta">
              <span>
                <Clock3 size={15} />
                {Math.ceil(mission.durationSeconds / 60)} min
              </span>
              <span>
                <MapPin size={15} />
                {mission.location}
              </span>
            </div>
            <div className="ticket-rule" />
            <div className="ticket-rewards">
              <span>
                EL BOTÍN
                <strong>
                  +{mission.rewardCash.toLocaleString("es-ES")}{" "}
                  <small>CR</small>
                </strong>
              </span>
              <span>
                EL RESPETO
                <strong>
                  +{mission.rewardRespect} <small>XP</small>
                </strong>
              </span>
              <span className="difficulty-mark">
                {difficultyNames[mission.difficulty]}
                {mission.recurrence && mission.recurrence !== "none" && (
                  <Repeat2 size={14} />
                )}
              </span>
            </div>
            <button
              className="primary-button start-button"
              onClick={() => begin(mission)}
            >
              {mission.status === "ACTIVE"
                ? "Volver a la misión"
                : mission.status === "VERIFY"
                  ? "Verificar misión"
                  : (mission.timeRemaining ?? mission.durationSeconds) <
                      mission.durationSeconds
                    ? "Continuar misión"
                    : "Empezar misión"}
              <Play size={19} fill="currentColor" />
            </button>
          </article>
        ) : (
          <article className="mission-ticket empty-state">
            <span className="eyebrow">EL SIGUIENTE PASO ES TUYO</span>
            <h2>Espacio para algo bueno.</h2>
            <p>
              {category === "Todas"
                ? "Crea tu próxima misión. Las terminadas siguen en tu archivo."
                : "No hay misiones pendientes en este territorio."}
            </p>
            <button className="primary-button" onClick={() => setSheet("new")}>
              Crear misión <Plus size={19} />
            </button>
            {state.missions.length === 0 && (
              <button
                className="text-button"
                onClick={() => starterMissions().forEach(addMission)}
              >
                Usar misiones de inicio
              </button>
            )}
          </article>
        )}
      </section>
      <div className="deck-controls">
        <button
          className="icon-button"
          disabled={available.length < 2}
          aria-label="Misión anterior"
          onClick={() => choose(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <span>
          {available.length > 1 ? "DESLIZA Y ELIGE" : "A TU RITMO"}
          <span className="deck-dots">
            {available.slice(0, 12).map((m, i) => (
              <i key={m.id} className={i === index ? "current" : ""} />
            ))}
          </span>
        </span>
        <button
          className="icon-button"
          disabled={available.length < 2}
          aria-label="Misión siguiente"
          onClick={() => choose(1)}
        >
          <ArrowRight size={20} />
        </button>
      </div>
      <div className="below-deck">
        <button onClick={() => setSheet("list")}>
          Todas tus misiones{" "}
          <span>
            {state.missions.length}
            <ArrowDown size={16} />
          </span>
        </button>
        <button
          className={pending ? "pending-link" : ""}
          onClick={() => setSheet("consequences")}
        >
          {pending ? "Toca cumplir" : "Sin cuentas pendientes"}
          <span>
            {pending || <Check size={16} />}
            <ChevronRight size={17} />
          </span>
        </button>
      </div>
      {message && !sheet && (
        <p className="toast" role="status">
          {message}
        </p>
      )}
      {sheet === "new" && <MissionForm onClose={() => setSheet(null)} />}
      {edit && (
        <MissionForm mission={edit} onClose={() => setEdit(undefined)} />
      )}
      {sheet === "consequences" && (
        <Consequences onClose={() => setSheet(null)} />
      )}
      {sheet === "filter" && (
        <Sheet title="Elige tu territorio" onClose={() => setSheet(null)}>
          <div className="choice-list">
            {["Todas", ...new Set(state.missions.map((m) => m.category))].map(
              (c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setSelected(undefined);
                    setSheet(null);
                  }}
                >
                  {c}
                  {category === c ? (
                    <Check size={20} />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </button>
              ),
            )}
          </div>
        </Sheet>
      )}
      {sheet === "list" && (
        <Sheet title="Tus misiones" onClose={() => setSheet(null)}>
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Buscar misiones"
              placeholder="Busca tu próximo paso"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="segmented">
            {[
              ["open", "Pendientes"],
              ["passed", "Hechas"],
              ["failed", "Fallidas"],
            ].map(([id, title]) => (
              <button
                key={id}
                className={listStatus === id ? "selected" : ""}
                onClick={() => setListStatus(id)}
              >
                {title}
              </button>
            ))}
          </div>
          {category !== "Todas" && (
            <p className="supporting">
              Territorio: {category}{" "}
              <button
                className="text-button"
                onClick={() => setCategory("Todas")}
              >
                Ver todos
              </button>
            </p>
          )}
          <div className="mission-list">
            {list.map((m) => (
              <div key={m.id} className="mission-row">
                <button
                  className="mission-row-main"
                  onClick={() => {
                    if (["ACTIVE", "VERIFY"].includes(m.status)) {
                      setSheet(null);
                      onFocus(m.id);
                    } else if (m.status === "IDLE") {
                      setSelected(m.id);
                      setSheet(null);
                    }
                  }}
                >
                  <small>
                    {m.category} · {Math.ceil(m.durationSeconds / 60)} MIN
                  </small>
                  <strong>{m.name}</strong>
                  {m.nextAvailable && (
                    <small>
                      Vuelve el {m.nextAvailable.split("-").reverse().join("/")}
                    </small>
                  )}
                </button>
                <div className="row-actions">
                  {m.status === "IDLE" && (
                    <button
                      className="icon-button"
                      aria-label={`Editar ${m.name}`}
                      onClick={() => setEdit(m)}
                    >
                      <Pencil size={17} />
                    </button>
                  )}
                  <button
                    className="icon-button"
                    aria-label={`Eliminar ${m.name}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Eliminar «${m.name}»?${state.settings.penalizeDelete ? " Se añadirá una estrella." : ""}`,
                        )
                      )
                        removeMission(m.id);
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
            {!list.length && (
              <p className="empty-note">No hay misiones en esta selección.</p>
            )}
          </div>
          <div className="import-tools">
            <button
              className="text-button"
              onClick={() => {
                downloadFile(
                  "misiones.csv",
                  exportMissions(state.missions),
                  "text/csv;charset=utf-8",
                );
              }}
            >
              <Download size={16} />
              Exportar CSV
            </button>
            <button
              className="text-button"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} />
              Importar CSV
            </button>
            <button
              className="text-button"
              onClick={() =>
                downloadFile(
                  "plantilla_misiones.csv",
                  exportMissions(starterMissions()),
                  "text/csv;charset=utf-8",
                )
              }
            >
              Plantilla
            </button>
          </div>
          {message && (
            <p className="inline-notice" role="alert">
              {message}
            </p>
          )}
          <input
            type="file"
            ref={inputRef}
            hidden
            accept=".csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const missions = importMissions(await file.text());
                missions.forEach(addMission);
                setMessage(`${missions.length} misiones importadas`);
                setSheet(null);
              } catch (error) {
                setMessage((error as Error).message);
              }
              e.target.value = "";
            }}
          />
        </Sheet>
      )}
    </div>
  );
}
