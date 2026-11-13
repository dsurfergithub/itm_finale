import {
  ArrowLeft,
  Check,
  Gift,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "../context/StoreContext";
const labels = {
  completed: "Misión completada",
  failed: "Misión fallida",
  purchase: "Recompensa canjeada",
  bonus: "Bonus diario",
  penalty: "Consecuencia cumplida",
  system: "Cambio de partida",
};
export function LogView({ onBack }: { onBack: () => void }) {
  const { state } = useStore();
  const [filter, setFilter] = useState("all");
  const logs = state.logs.filter(
    (l) =>
      filter === "all" ||
      (filter === "missions"
        ? l.event === "completed" || l.event === "failed"
        : l.event !== "completed" && l.event !== "failed"),
  );
  return (
    <div className="inner-page log-page">
      <button className="text-button back-link" onClick={onBack}>
        <ArrowLeft size={18} />
        Mi huella
      </button>
      <span className="eyebrow">LO HECHO, HECHO ESTÁ</span>
      <h1>
        Tu archivo.
        <br />
        <em>Sin filtros.</em>
      </h1>
      <div className="segmented">
        {[
          ["all", "Todo"],
          ["missions", "Misiones"],
          ["other", "Movimientos"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={filter === id ? "selected" : ""}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="history-list">
        {logs.slice(0, 200).map((log) => {
          const event = log.event ?? (log.passed ? "completed" : "failed");
          const Icon =
            event === "completed"
              ? Check
              : event === "failed"
                ? X
                : event === "purchase"
                  ? ShoppingBag
                  : event === "bonus"
                    ? Gift
                    : ShieldCheck;
          return (
            <article key={log.id} className={`history-item event-${event}`}>
              <span className="history-icon">
                <Icon size={18} />
              </span>
              <div>
                <span className="eyebrow">{labels[event]}</span>
                <h2>{log.name}</h2>
                <time>{log.timestamp}</time>
              </div>
              <strong>
                {log.points > 0 ? "+" : ""}
                {log.points}
                <small>{log.type === "CREDITS" ? "CR" : "XP"}</small>
              </strong>
            </article>
          );
        })}
        {!logs.length && (
          <div className="empty-state">
            <h2>La historia empieza aquí.</h2>
            <p>
              Tus misiones, compras y consecuencias aparecerán en este archivo.
            </p>
          </div>
        )}
        {logs.length > 200 && (
          <p className="fine-print">
            Mostrando los 200 últimos movimientos. La copia de seguridad incluye
            el historial completo.
          </p>
        )}
      </div>
    </div>
  );
}
