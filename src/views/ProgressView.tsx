import { useState } from "react";
import { ArrowRight, Check, Flame, History, Plus, Trash2 } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { getRankData } from "../utils/leveling";
import { dayKey } from "../utils/game";
import { Sheet } from "../components/Sheet";
import { Reveal } from "../components/Reveal";
import { Consequences } from "./MissionsView";
export function ProgressView({ onHistory }: { onHistory: () => void }) {
  const { state, addCategory, removeCategory } = useStore();
  const [categories, setCategories] = useState(false);
  const [consequences, setConsequences] = useState(false);
  const [name, setName] = useState("");
  const { rank, percentage } = getRankData(state.respect);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return { date: d, count: state.activityByDate[dayKey(d)] ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.count));
  const pending = state.consequences.filter((c) => !c.completedAt).length;
  return (
    <div className="inner-page progress-page">
      <span className="eyebrow">CADA PASO DEJA ALGO</span>
      <h1>
        Tu huella
        <br />
        <em>se queda.</em>
      </h1>
      <section className="rank-section">
        <div>
          <span className="eyebrow">TU RANGO</span>
          <h2>{rank}</h2>
        </div>
        <span className="rank-number">
          {state.respect.toLocaleString("es-ES")}
          <small>XP</small>
        </span>
        <div
          className="rank-track"
          role="progressbar"
          aria-label="Progreso del rango"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ width: `${percentage}%` }} />
        </div>
        <p>
          {percentage === 100
            ? "Has llegado a lo más alto. Sigue dejando huella."
            : `${percentage}% del camino al siguiente rango`}
        </p>
      </section>
      <div className="stat-pair">
        <div>
          <Flame size={21} />
          <strong>
            {state.stats.streak}
            <small>días</small>
          </strong>
          <span>Racha actual</span>
        </div>
        <div>
          <Check size={22} />
          <strong>
            {state.stats.totalMissions}
            <small>hechas</small>
          </strong>
          <span>Misiones completadas</span>
        </div>
      </div>
      <section className="activity-section">
        <div className="section-heading">
          <h2 className="section-title">Tu última semana</h2>
          <span className="eyebrow">MISIONES / DÍA</span>
        </div>
        <div
          className="activity-chart"
          role="img"
          aria-label={days
            .map(
              (d) =>
                `${d.date.toLocaleDateString("es-ES")}: ${d.count} misiones`,
            )
            .join("; ")}
        >
          {days.map(({ date, count }, i) => (
            <div key={dayKey(date)} className={i === 6 ? "today" : ""}>
              <span className="bar-value">{count}</span>
              <div className="bar-space">
                <i
                  style={{
                    height: count
                      ? `${Math.max(8, (count / max) * 100)}%`
                      : "3px",
                  }}
                />
              </div>
              <small>
                {i === 6
                  ? "HOY"
                  : date.toLocaleDateString("es-ES", { weekday: "narrow" })}
              </small>
            </div>
          ))}
        </div>
        {state.legacyStats && (
          <p className="fine-print">
            La actividad por fecha y las rachas diarias se registran desde esta
            versión. Tus totales anteriores se conservan.
          </p>
        )}
      </section>
      <Reveal>
        <section className="territory-section">
          <div className="section-heading">
            <h2 className="section-title">Tus territorios</h2>
            <button
              className="icon-button"
              aria-label="Gestionar territorios"
              onClick={() => setCategories(true)}
            >
              <Plus size={20} />
            </button>
          </div>
          {state.categories.map((c, i) => (
            <div className={`territory-row territory-${i % 3}`} key={c.id}>
              <div>
                <span>{c.name}</span>
                <strong>{c.percentage}%</strong>
              </div>
              <div
                className="territory-track"
                role="progressbar"
                aria-label={c.name}
                aria-valuenow={c.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ width: `${c.percentage}%` }} />
              </div>
            </div>
          ))}
          {!state.categories.length && (
            <p className="empty-note">
              Cada misión puede abrir un nuevo territorio.
            </p>
          )}
        </section>
      </Reveal>
      <div className="profile-links">
        <button onClick={() => setConsequences(true)}>
          <span>
            Cuentas pendientes
            <small>
              {pending ? "Un compromiso contigo." : "Todo en paz, por ahora."}
            </small>
          </span>
          <b>{pending}</b>
          <ArrowRight size={20} />
        </button>
        <button onClick={onHistory}>
          <History size={21} />
          <span>
            Tu archivo<small>Lo que ya forma parte de la historia.</small>
          </span>
          <ArrowRight size={20} />
        </button>
      </div>
      <p className="score-signature">
        {state.stats.score.toLocaleString("es-ES")}
        <span>PUNTOS ACUMULADOS</span>
      </p>
      {consequences && <Consequences onClose={() => setConsequences(false)} />}
      {categories && (
        <Sheet title="Tus territorios" onClose={() => setCategories(false)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                addCategory(name.trim().toUpperCase());
                setName("");
              }
            }}
          >
            <label>
              Nuevo territorio
              <input
                value={name}
                maxLength={40}
                required
                placeholder="Salud, trabajo, creatividad…"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="secondary-button">
              <Plus size={18} />
              Añadir
            </button>
          </form>
          <div className="choice-list">
            {state.categories.map((c) => (
              <div className="category-management" key={c.id}>
                <strong>{c.name}</strong>
                <button
                  className="icon-button"
                  aria-label={`Eliminar territorio ${c.name}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Eliminar el progreso de ${c.name}? Las misiones se conservarán.`,
                      )
                    )
                      removeCategory(c.id);
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
