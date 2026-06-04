import { useState, useEffect } from 'react';
import { Target, AlertTriangle, Box, Locate, Info } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { useStore } from '../context/StoreContext';

const MISSION_POOL = [
  { name: "INFILTRAR DISTRITO NEÓN", diff: "HARD", time: 45 },
  { name: "SABOTEAR DATA CENTER B", diff: "EXTREME", time: 30 },
  { name: "EXTRAER EL ACTIVO", diff: "NORMAL", time: 60 },
  { name: "SECUESTRAR COMBOY", diff: "INSANE", time: 20 },
  { name: "RECUPERAR CAJA NEGRA", diff: "EASY", time: 40 },
];

export function SpinView({ onMissionAccepted }: { onMissionAccepted?: () => void }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinText, setSpinText] = useState('BUSCANDO MISIÓN...');
  const [result, setResult] = useState<typeof MISSION_POOL[0] | null>(null);
  const { state, addMission, punish } = useStore();

  const startSpin = () => {
    if (isSpinning) return;
    soundManager.playSpinClick();
    setIsSpinning(true);
    setResult(null);

    // Fake spin delays
    let loops = 0;
    const interval = setInterval(() => {
      soundManager.playSpinClick();
      setSpinText(MISSION_POOL[Math.floor(Math.random() * MISSION_POOL.length)].name);
      loops++;
      if (loops > 10) {
        clearInterval(interval);
        const randomMission = MISSION_POOL[Math.floor(Math.random() * MISSION_POOL.length)];
        setResult(randomMission);
        setIsSpinning(false);
        soundManager.playJackpot();
        setSpinText('BUSCANDO MISIÓN...');
      }
    }, 150);
  };

  const acceptMission = () => {
    if (!result) return;
    soundManager.playAccept();
    addMission({
      id: Date.now().toString(),
      name: result.name,
      difficulty: result.diff as any,
      location: 'UBICACIÓN CLASIFICADA',
      durationSeconds: result.time * 60,
      rewardCash: result.time * 50,
      rewardRespect: result.time * 10,
      status: 'ACTIVE',
      timeRemaining: result.time * 60,
      category: 'MISIÓN ALEATORIA'
    });
    setResult(null);
    if (onMissionAccepted) {
      onMissionAccepted();
    } else {
      alert('MISIÓN AÑADIDA Y ACTIVADA EN EL REGISTRO DE OBJETIVOS');
    }
  };

  const rejectMission = () => {
    soundManager.playError();
    punish();
    setResult(null);
  };

  // Convert diff string to color class
  const getDiffColor = (d: string) => {
    if (d === 'EASY') return 'bg-tertiary text-black';
    if (d === 'NORMAL') return 'bg-primary text-black';
    if (d === 'HARD' || d === 'EXTREME' || d === 'INSANE') return 'bg-error text-white';
    return 'bg-surface-variant text-white';
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center pt-24 pb-32 px-4 relative z-10 w-full animate-in fade-in duration-300">
      
      <div className="relative w-full max-w-sm">
        {/* SLOT MACHINE UI */}
        <div className="bg-surface-container border-4 border-primary p-2 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-primary text-on-primary text-center py-1 mb-2 border-2 border-black">
            <span className="text-xs font-black uppercase tracking-[0.2em]">CASINO LAS VENTURAS</span>
          </div>
          
          <div className="relative bg-surface-container-highest border-4 border-black p-4 h-48 flex items-center justify-center overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-primary/30 -translate-y-1/2 z-10 pointer-events-none"></div>
            
            <div className="w-full h-full bg-surface border-2 border-outline-variant relative overflow-hidden flex items-center justify-center">
               <div className="text-2xl font-black text-primary uppercase text-center px-4 tracking-tighter italic">
                 {isSpinning ? spinText : 'BUSCANDO MISIÓN...'}
               </div>
            </div>
          </div>
          
          <div className="mt-2 flex justify-center items-center p-4 bg-surface-container-high border-2 border-outline-variant">
            <button 
              onClick={startSpin}
              disabled={isSpinning}
              className="w-full bg-primary-container text-on-primary-container py-4 font-black uppercase border-4 border-black hard-shadow active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 disabled:grayscale rounded-none"
            >
                TIRA
            </button>
          </div>
        </div>

        <p className="mt-12 text-center text-sm font-bold text-on-surface-variant uppercase tracking-widest animate-pulse">
            TOMA EL RIESGO. GANA EL RESPETO.
        </p>

        {/* RESULT MODAL */}
        {result && !isSpinning && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[105%] animate-in zoom-in-95 duration-200">
            <div className="bg-surface border-4 border-tertiary p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
              <h2 className="text-2xl font-bold text-tertiary italic mb-4">MISIÓN ENCONTRADA</h2>
              
              <div className="border-2 border-outline-variant p-4 bg-background mb-6 text-left">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-outline-variant uppercase">OBJETIVO</p>
                  <span className={`text-[10px] px-1 font-black uppercase ${getDiffColor(result.diff)}`}>
                    {result.diff}
                  </span>
                </div>
                <p className="text-lg font-bold text-primary uppercase leading-tight mb-2">
                  {result.name}
                </p>
                <div className="text-tertiary text-sm font-bold uppercase flex items-center gap-2">
                  <span className="tabular-nums">{result.time}:00</span> MIN
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={acceptMission}
                  className="w-full bg-tertiary text-on-tertiary font-black py-4 uppercase border-2 border-black hover:brightness-110 hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none"
                >
                    ACEPTAR MISIÓN
                </button>
                <button 
                  onClick={rejectMission}
                  className="w-full bg-error text-white font-black py-2 uppercase border-2 border-black hover:brightness-110 hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all rounded-none"
                >
                    RECHAZAR (-1 ESTRELLA)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
