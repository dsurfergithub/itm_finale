import { useState } from "react";
import {
  ArrowRight,
  Coffee,
  Gift,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Sheet } from "../components/Sheet";
import { dayKey, uid } from "../utils/game";
import { soundManager } from "../utils/audio";
export function StoreView() {
  const { state, claimBonus, buyReward, addReward, buySoborno } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("2500");
  const [notice, setNotice] = useState("");
  const claimed = state.lastBonusDate === dayKey();
  return (
    <div className="inner-page store-page">
      <div className="section-heading">
        <span className="eyebrow">TE LO ESTÁS GANANDO</span>
        <button
          className="icon-button"
          aria-label="Añadir recompensa"
          onClick={() => setAdding(true)}
        >
          <Plus size={22} />
        </button>
      </div>
      <h1>
        El lado bueno
        <br />
        <em>del esfuerzo.</em>
      </h1>
      <div className="wallet-balance">
        <span>TU BOTÍN</span>
        <strong>
          {state.credits.toLocaleString("es-ES")}
          <small> CR</small>
        </strong>
      </div>
      <section className={`daily-bonus ${claimed ? "claimed" : ""}`}>
        <span className="bonus-doodle">
          <Sparkles size={47} strokeWidth={1} />
        </span>
        <div>
          <span className="eyebrow">UNA VEZ AL DÍA</span>
          <h2>{claimed ? "Nos vemos mañana." : "Un empujón extra."}</h2>
          <p>
            {claimed
              ? "Tu bonus ya está en el bolsillo."
              : "+2.000 créditos por pasarte por aquí."}
          </p>
        </div>
        <button
          aria-label={
            claimed ? "Bonus diario ya reclamado" : "Reclamar bonus diario"
          }
          disabled={claimed}
          onClick={() => {
            claimBonus();
            soundManager.playJackpot();
            setNotice("Bonus diario: +2.000 CR");
          }}
        >
          {claimed ? <ShieldCheck size={23} /> : <ArrowRight size={24} />}
        </button>
      </section>
      <div className="section-heading">
        <h2 className="section-title">Pequeñas grandes recompensas</h2>
        <span className="small-count">{state.rewards.length}</span>
      </div>
      <div className="reward-list">
        {state.rewards.map((r, i) => {
          const Icon = [Coffee, Ticket, Gift][i % 3];
          const affordable = state.credits >= r.cost;
          return (
            <article key={r.id} className="reward-item">
              <span className={`reward-symbol symbol-${i % 3}`}>
                <Icon size={25} strokeWidth={1.6} />
              </span>
              <div>
                <h3>{r.name}</h3>
                <p>{r.cost.toLocaleString("es-ES")} CR</p>
                {!affordable && (
                  <small>
                    Te faltan {(r.cost - state.credits).toLocaleString("es-ES")}{" "}
                    CR
                  </small>
                )}
              </div>
              <button
                className="icon-button"
                aria-label={`Canjear ${r.name}`}
                disabled={!affordable}
                onClick={() => {
                  buyReward(r.id);
                  soundManager.playJackpot();
                  setNotice(`Recompensa canjeada: ${r.name}`);
                }}
              >
                <ArrowRight size={22} />
              </button>
            </article>
          );
        })}
        {!state.rewards.length && (
          <p className="empty-note">
            Todas canjeadas. Añade algo que te haga ilusión.
          </p>
        )}
      </div>
      <section className="clear-record">
        <ShieldCheck size={29} strokeWidth={1.5} />
        <div>
          <h3>Borrón y cuenta nueva</h3>
          <p>Reduce una estrella por 5.000 CR.</p>
        </div>
        <button
          className="text-button"
          disabled={state.credits < 5000 || state.strikes === 0}
          onClick={() => {
            buySoborno();
            setNotice("Una estrella menos.");
          }}
        >
          Canjear
        </button>
      </section>
      {notice && (
        <p className="inline-notice" role="status">
          {notice}
        </p>
      )}
      {adding && (
        <Sheet
          title="Algo que merezca la pena"
          onClose={() => setAdding(false)}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              addReward({ id: uid(), name: name.trim(), cost: Number(cost) });
              setAdding(false);
              setName("");
            }}
          >
            <label>
              Tu recompensa
              <input
                autoFocus
                required
                maxLength={100}
                value={name}
                placeholder="Una cena, un libro, una escapada…"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Créditos necesarios
              <input
                required
                type="number"
                min="0"
                max="10000000"
                step="1"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </label>
            <button className="primary-button">
              Guardar recompensa <ArrowRight size={19} />
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
