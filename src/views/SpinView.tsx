import { useState } from 'react';
import { CheckCircle2, Radar, Satellite, XCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { useStore } from '../context/StoreContext';

export function SpinView({ onMissionAccepted }: { onMissionAccepted?: () => void }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinText, setSpinText] = useState('CALIBRANDO RADAR...');
  const [result, setResult] = useState<any | null>(null);
  const { state, updateMission, punish } = useStore();

  const startSpin = () => {
    if (isSpinning) return;
    
    const availableMissions = state.missions.filter(m => m.status === 'IDLE');
    if (availableMissions.length === 0) {
      soundManager.playError();
      alert('NO HAY MISIONES DISPONIBLES EN EL TERMINAL');
      return;
    }

    soundManager.playSpinClick();
    setIsSpinning(true);
    setResult(null);
    setSpinText('BARRIENDO DISTRITOS...');

    let loops = 0;
    const interval = setInterval(() => {
      soundManager.playSpinClick();
      const sample = availableMissions[Math.floor(Math.random() * availableMissions.length)];
      setSpinText(`${sample.location} // ${sample.name}`);
      loops++;
      if (loops > 12) {
        clearInterval(interval);
        const randomMission = availableMissions[Math.floor(Math.random() * availableMissions.length)];
        setResult(randomMission);
        setIsSpinning(false);
        soundManager.playJackpot();
        setSpinText('SEÑAL BLOQUEADA');
      }
    }, 140);
  };

  const acceptMission = () => {
    if (!result) return;
    soundManager.playAccept();
    updateMission(result.id, { status: 'ACTIVE' });
    setResult(null);
    if (onMissionAccepted) {
      onMissionAccepted();
    } else {
      alert('MISIÓN ACTIVADA EN EL REGISTRO DE OBJETIVOS');
    }
  };

  const rejectMission = () => {
    soundManager.playError();
    punish();
    setResult(null);
  };

  const getDiffColor = (d: string) => {
    if (d === 'EASY') return 'bg-tertiary text-on-tertiary';
    if (d === 'NORMAL') return 'bg-primary-container text-on-primary-container';
    if (d === 'HARD' || d === 'EXTREME' || d === 'INSANE') return 'bg-error text-white';
    return 'bg-surface-variant text-white';
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center pt-[calc(7rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] px-4 relative z-10 w-full animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl">
        <div className="vice-glass neon-panel rounded-3xl p-4 sm:p-6 overflow-hidden relative scan-beam">
          <div className="absolute inset-0 hud-scanline opacity-40" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-secondary cyan-text-glow">Mission Scanner</p>
                <h2 className="font-display text-2xl sm:text-4xl font-black uppercase text-primary neon-text">Radar de objetivos</h2>
              </div>
              <Satellite className="text-secondary drop-shadow-[0_0_12px_rgba(var(--fx-secondary),0.8)]" size={34} />
            </div>

            <div className="relative bg-black/50 border border-secondary/30 rounded-2xl p-4 h-72 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-8 rounded-full border border-secondary/30 animate-ping" />
              <div className="absolute inset-16 rounded-full border border-primary/25" />
              <div className="absolute inset-24 rounded-full border border-tertiary/20" />
              <div className="absolute left-1/2 top-1/2 h-[130%] w-1 origin-top bg-gradient-to-b from-secondary/70 to-transparent animate-spin" />
              <div className="absolute inset-0 vice-grid opacity-35" />

              <div className="relative z-10 text-center max-w-sm">
                <Radar className="mx-auto mb-4 text-secondary drop-shadow-[0_0_18px_rgba(var(--fx-secondary),0.9)]" size={54} />
                <div className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight neon-text min-h-16 flex items-center justify-center">
                  {isSpinning ? spinText : result ? 'OBJETIVO LOCALIZADO' : 'BUSCANDO MISIÓN'}
                </div>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-2">Toma el riesgo. Gana respeto.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-black tracking-widest text-on-surface-variant">
              <div className="bg-black/35 border border-outline-variant rounded-xl p-2">Idle: {state.missions.filter(m => m.status === 'IDLE').length}</div>
              <div className="bg-black/35 border border-outline-variant rounded-xl p-2">Activas: {state.missions.filter(m => m.status === 'ACTIVE').length}</div>
              <div className="bg-black/35 border border-outline-variant rounded-xl p-2">Riesgo: {state.strikes}/10</div>
            </div>

            <button
              onClick={startSpin}
              disabled={isSpinning}
              className="mt-4 w-full bg-primary text-on-primary py-4 font-black uppercase tracking-[0.25em] border border-white/15 rounded-2xl hard-shadow active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 disabled:grayscale hover:brightness-110"
            >
              {isSpinning ? 'Escaneando...' : 'Asignar misión'}
            </button>
          </div>
        </div>

        {result && !isSpinning && (
          <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-200">
            <div className="vice-glass neon-panel rounded-3xl p-6 w-full max-w-md text-center relative overflow-hidden">
              <div className="absolute inset-0 hud-scanline opacity-25" />
              <div className="relative z-10">
                <p className="text-xs font-black text-tertiary uppercase tracking-[0.3em] mission-passed-glow">Briefing recibido</p>
                <h2 className="font-display text-2xl font-black text-primary uppercase neon-text mt-1 mb-5">Misión encontrada</h2>
                
                <div className="border border-secondary/30 rounded-2xl p-4 bg-black/40 mb-6 text-left">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-black text-on-surface-variant uppercase tracking-widest">Objetivo</p>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase ${getDiffColor(result.difficulty)}`}>
                      {result.difficulty}
                    </span>
                  </div>
                  <p className="text-xl font-black text-primary uppercase leading-tight mb-3">
                    {result.name}
                  </p>
                  <div className="flex justify-between text-sm font-bold uppercase text-on-surface-variant">
                    <span>{result.location}</span>
                    <span className="tabular-nums text-secondary">{Math.floor(result.durationSeconds / 60)} MIN</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={acceptMission}
                    className="w-full bg-tertiary text-on-tertiary font-black py-4 uppercase tracking-widest border border-white/15 rounded-2xl hover:brightness-110 hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} />
                    Aceptar misión
                  </button>
                  <button
                    onClick={rejectMission}
                    className="w-full bg-error text-white font-black py-3 uppercase tracking-widest border border-white/15 rounded-2xl hover:brightness-110 hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Rechazar (-1 estrella)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
