import { SlidersHorizontal, Star, Wallet } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { AnimatedNumber } from "./AnimatedNumber";
export function TopBar({ onSettings }: { onSettings: () => void }) {
  const { state } = useStore();
  return (
    <header className="topbar">
      <div className="wordmark" aria-label="Into the Mission">
        itm<span aria-hidden="true">✦</span>
      </div>
      <div className="player-cash">
        <Wallet size={15} />
        <AnimatedNumber value={state.credits} enabled={state.settings.motion} />
        <small>CR</small>
      </div>
      <span
        className="heat"
        aria-label={`${state.strikes} de ${state.settings.strikeLimit} estrellas`}
      >
        <Star size={15} fill={state.strikes ? "currentColor" : "none"} />
        {state.strikes}
      </span>
      <button
        className="icon-button settings-button"
        aria-label="Ajustes"
        onClick={onSettings}
      >
        <SlidersHorizontal size={20} />
      </button>
    </header>
  );
}
