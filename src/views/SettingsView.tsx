import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Sheet, Toggle } from "../components/Sheet";
import { downloadFile } from "../utils/csv";
import { dayKey, uid } from "../utils/game";
import type { PenaltyRule } from "../types";
function RuleForm({
  rule,
  onClose,
}: {
  rule?: PenaltyRule;
  onClose: () => void;
}) {
  const { saveRule, deleteRule } = useStore();
  const [name, setName] = useState(rule?.name ?? "");
  const [trigger, setTrigger] = useState<PenaltyRule["trigger"]>(
    rule?.trigger ?? "failures",
  );
  const [every, setEvery] = useState(String(rule?.every ?? 3));
  return (
    <Sheet
      title={rule ? "Tus reglas, a tu manera" : "Una consecuencia real"}
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          saveRule({
            id: rule?.id ?? uid(),
            name: name.trim(),
            trigger,
            every: Number(every),
            enabled: rule?.enabled ?? true,
          });
          onClose();
        }}
      >
        <label>
          La tarea que te tocará hacer
          <input
            autoFocus
            value={name}
            required
            maxLength={150}
            placeholder="Por ejemplo, ordenar el trastero"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="form-pair">
          <label>
            Por cada
            <input
              required
              type="number"
              min="1"
              max="100"
              step="1"
              value={every}
              onChange={(e) => setEvery(e.target.value)}
            />
          </label>
          <label>
            Que acumules
            <select
              value={trigger}
              onChange={(e) =>
                setTrigger(e.target.value as PenaltyRule["trigger"])
              }
            >
              <option value="failures">Misiones fallidas</option>
              <option value="strikes">Estrellas ganadas</option>
            </select>
          </label>
        </div>
        <p className="supporting">
          Se activará una tarea al alcanzar cada múltiplo de ese total. Las
          estrellas cuentan aunque después las reduzcas. No se generan tareas
          por fallos anteriores.
        </p>
        <button className="primary-button">
          Guardar regla <ArrowRight size={18} />
        </button>
        {rule && (
          <button
            type="button"
            className="text-button danger-text centered"
            onClick={() => {
              if (
                window.confirm(
                  "¿Eliminar esta regla? Las tareas ya pendientes se conservarán.",
                )
              ) {
                deleteRule(rule.id);
                onClose();
              }
            }}
          >
            <Trash2 size={17} />
            Eliminar regla
          </button>
        )}
      </form>
    </Sheet>
  );
}
export function SettingsView({ onBack }: { onBack: () => void }) {
  const { state, setSettings, saveRule, restore, resetAll } = useStore();
  const [rule, setRule] = useState<PenaltyRule | null | undefined>();
  const [status, setStatus] = useState("");
  const [originalBackup] = useState(() => {
    try {
      return (
        localStorage.getItem("itm_recovery_backup") ??
        localStorage.getItem("itm_pre_v2_backup")
      );
    } catch {
      return null;
    }
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const backup = () =>
    downloadFile(`itm_backup_${dayKey()}.json`, JSON.stringify(state, null, 2));
  return (
    <div className="inner-page settings-page">
      <button className="text-button back-link" onClick={onBack}>
        <ArrowLeft size={18} />
        Volver
      </button>
      <span className="eyebrow">A TU MANERA</span>
      <h1>
        Tu tiempo.
        <br />
        <em>Tus reglas.</em>
      </h1>
      <p className="page-intro">
        Todo está preparado. Cambia solo lo que quieras.
      </p>
      <section className="settings-section">
        <h2>La atmósfera</h2>
        <Toggle
          label="Movimiento"
          description="Fondos, transiciones y celebraciones."
          checked={state.settings.motion}
          onChange={(motion) => setSettings({ motion })}
        />
        <Toggle
          label="Sonidos"
          description="Pequeñas señales al interactuar."
          checked={state.settings.sound}
          onChange={(sound) => setSettings({ sound })}
        />
      </section>
      <section className="settings-section">
        <div className="section-heading">
          <h2>Consecuencias reales</h2>
          <button
            className="icon-button"
            aria-label="Añadir regla de penalización"
            onClick={() => setRule(null)}
          >
            <Plus size={21} />
          </button>
        </div>
        <p className="supporting">
          Tareas que preferirías evitar. Tú decides cuándo te las ganas.
        </p>
        {state.penaltyRules.map((r) => (
          <div className="rule-item" key={r.id}>
            <Toggle
              label={r.name}
              description={`Cada ${r.every} ${r.trigger === "failures" ? "misiones fallidas" : "estrellas ganadas"}`}
              checked={r.enabled}
              onChange={(enabled) => saveRule({ ...r, enabled })}
            />
            <button
              className="text-button rule-edit"
              onClick={() => setRule(r)}
            >
              <Pencil size={14} />
              Editar esta regla
            </button>
          </div>
        ))}
        <button className="secondary-button" onClick={() => setRule(null)}>
          <Plus size={17} />
          Añadir mi propia tarea
        </button>
        <p className="fine-print">
          Acumulado: {state.failureCount} fallos · {state.earnedStrikes}{" "}
          estrellas ganadas.
        </p>
      </section>
      <section className="settings-section">
        <h2>El precio de fallar</h2>
        <label>
          Respeto perdido al fallar
          <select
            value={state.settings.respectLossPercent}
            onChange={(e) =>
              setSettings({ respectLossPercent: Number(e.target.value) })
            }
          >
            {[0, 25, 50, 75, 100].map((n) => (
              <option key={n} value={n}>
                {n}% del respeto que ofrecía la misión
              </option>
            ))}
          </select>
        </label>
        <div className="form-pair">
          <label>
            Estrellas por fallo
            <select
              value={state.settings.failureStars}
              onChange={(e) =>
                setSettings({ failureStars: Number(e.target.value) })
              }
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Ninguna" : n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Límite de estrellas
            <input
              type="number"
              min="1"
              max="20"
              step="1"
              value={state.settings.strikeLimit}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isInteger(n) && n >= 1 && n <= 20)
                  setSettings({ strikeLimit: n });
              }}
            />
          </label>
        </div>
        <Toggle
          label="Penalizar al borrar"
          description="Añade una estrella al eliminar una misión."
          checked={state.settings.penalizeDelete}
          onChange={(penalizeDelete) => setSettings({ penalizeDelete })}
        />
        <Toggle
          label="Penalizar al rechazar"
          description="Añade una estrella al rechazar la propuesta del radar."
          checked={state.settings.penalizeReject}
          onChange={(penalizeReject) => setSettings({ penalizeReject })}
        />
        <Toggle
          label="Confiscación al llegar al límite"
          description="Pierdes los créditos y la mitad del respeto. Las estrellas vuelven a cero."
          checked={state.settings.confiscation}
          onChange={(confiscation) => setSettings({ confiscation })}
        />
        <p className="fine-print">
          La pérdida de respeto nunca deja tu saldo por debajo de cero. La racha
          cuenta días con misiones completadas.
        </p>
      </section>
      <section className="settings-section">
        <h2>Tu partida, a salvo</h2>
        <p className="supporting">
          El progreso se guarda en este navegador. Exporta una copia para
          cambiar de dispositivo.
        </p>
        <div className="data-actions">
          <button className="secondary-button" onClick={backup}>
            <Download size={18} />
            Exportar copia
          </button>
          <button
            className="text-button"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={17} />
            Restaurar copia
          </button>
        </div>
        {originalBackup && (
          <button
            className="text-button"
            onClick={() =>
              downloadFile("itm_copia_anterior.json", originalBackup)
            }
          >
            <Download size={17} />
            Descargar copia anterior a esta versión
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const data = JSON.parse(await file.text());
              if (
                window.confirm(
                  "¿Restaurar esta copia y sustituir la partida actual? Exporta una copia primero si quieres conservarla.",
                )
              ) {
                restore(data);
                setStatus("Partida restaurada.");
              }
            } catch (error) {
              setStatus((error as Error).message);
            }
            e.target.value = "";
          }}
        />
        {status && (
          <p className="inline-notice" role="status">
            {status}
          </p>
        )}
        <details className="advanced danger-zone">
          <summary>Empezar de nuevo</summary>
          <p className="supporting">
            Borra tus misiones, progreso e historial. Las opciones iniciales
            vuelven a sus valores predeterminados.
          </p>
          <button
            className="danger-button"
            onClick={() => {
              if (
                window.confirm(
                  "¿Borrar esta partida y empezar de nuevo? Esta acción no se puede deshacer.",
                )
              ) {
                backup();
                resetAll();
                setStatus(
                  "Partida reiniciada. Se ha descargado una copia de la anterior.",
                );
              }
            }}
          >
            <RotateCcw size={18} />
            Reiniciar partida
          </button>
        </details>
      </section>
      <p className="app-signature">
        INTO THE MISSION <span>COASTAL EDITION / 02</span>
      </p>
      {rule !== undefined && (
        <RuleForm rule={rule ?? undefined} onClose={() => setRule(undefined)} />
      )}
    </div>
  );
}
