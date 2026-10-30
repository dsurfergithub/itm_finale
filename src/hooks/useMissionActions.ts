import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { Mission } from '../types';
import { soundManager } from '../utils/audio';

/** Mission actions with their sounds, toasts, undo and celebrations, shared by every screen. */
export function useMissionActions() {
  const store = useStore();
  const ui = useUI();

  return {
    start(m: Mission) {
      soundManager.playAccept();
      store.startMission(m.id);
    },
    pause(m: Mission) {
      soundManager.playClick();
      store.pauseMission(m.id);
    },
    complete(m: Mission) {
      const result = store.completeMission(m.id);
      if (!result) return;
      soundManager.playSuccess();
      const { outcome, snapshot } = result;
      if (outcome.rankUp) ui.celebrate('¡Ascenso!', `Ahora eres ${outcome.rankUp.name}. Desbloqueado: ${outcome.rankUp.unlock}`);
      else if (outcome.campaignCompleted) ui.celebrate('Campaña completada', `${outcome.campaignCompleted.name} · +$${outcome.campaignCompleted.bonus.toLocaleString('es-ES')}`);
      else ui.celebrate('Misión cumplida', `+$${outcome.credits.toLocaleString('es-ES')} · +${outcome.respect} respeto`);
      ui.toast(`«${m.name}» completada`, snapshot);
    },
    fail(m: Mission) {
      soundManager.playError();
      const snapshot = store.failMission(m.id);
      ui.toast('Registrada como no lograda', snapshot);
    },
    archive(m: Mission, archived = true) {
      soundManager.playClick();
      const snapshot = store.archiveMission(m.id, archived);
      ui.toast(archived ? 'Misión archivada' : 'Misión recuperada', snapshot);
    },
    remove(m: Mission) {
      soundManager.playClick();
      const snapshot = store.removeMission(m.id);
      ui.toast('Misión eliminada', snapshot);
    },
  };
}
