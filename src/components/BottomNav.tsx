import { Compass, Radar, ShoppingBag, TrendingUp } from "lucide-react";
import type { Tab } from "../types";
export function BottomNav({
  activeTab,
  onChangeTab,
}: {
  activeTab: Tab;
  onChangeTab: (t: Tab) => void;
}) {
  const tabs = [
    { id: "MISSIONS", label: "Misiones", icon: Compass },
    { id: "SPIN", label: "Radar", icon: Radar },
    { id: "STORE", label: "Recompensas", icon: ShoppingBag },
    { id: "PROGRESS", label: "Mi huella", icon: TrendingUp },
  ] as const;
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChangeTab(id)}
          aria-current={activeTab === id ? "page" : undefined}
          className={activeTab === id ? "selected" : ""}
        >
          <Icon size={21} strokeWidth={activeTab === id ? 2.3 : 1.7} />
          <span>{label}</span>
          {activeTab === id && <i />}
        </button>
      ))}
    </nav>
  );
}
