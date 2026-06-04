import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, ShieldAlert } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { soundManager } from '../utils/audio';

export function StoreView() {
  const { state, updateState, addReward, buyReward, addLog } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', cost: 1000 });
  const [showDailyBonus, setShowDailyBonus] = useState(false);

  useEffect(() => {
    // Check for daily bonus in this view just as a fun popup
    const lastBonus = localStorage.getItem('itm_last_bonus_date');
    const today = new Date().toLocaleDateString();
    if (lastBonus !== today) {
      setShowDailyBonus(true);
    }
  }, []);

  const claimDailyBonus = () => {
    soundManager.playJackpot();
    updateState({ credits: state.credits + 2000 });
    addLog({
      id: Date.now().toString(),
      name: 'BONIFICACIÓN DIARIA RECLAMADA',
      timestamp: new Date().toLocaleString(),
      points: 2000,
      type: 'CREDITS',
      passed: true
    });
    localStorage.setItem('itm_last_bonus_date', new Date().toLocaleDateString());
    setShowDailyBonus(false);
  };

  const buySoborno = () => {
    if (state.credits < 5000 || state.strikes === 0) {
      soundManager.playError();
      return;
    }
    soundManager.playJackpot();
    updateState({ 
      credits: state.credits - 5000, 
      strikes: Math.max(0, state.strikes - 1) 
    });
    addLog({
      id: Date.now().toString(),
      name: 'SOBORNO POLICIAL - ESTRELLA ELIMINADA',
      timestamp: new Date().toLocaleString(),
      points: -5000,
      type: 'CREDITS',
      passed: false
    });
  };

  const handleManualSubmit = () => {
    if (!formData.name.trim()) {
      soundManager.playError();
      return;
    }
    soundManager.playAccept();
    addReward({
      id: Date.now().toString(),
      name: formData.name.toUpperCase(),
      cost: formData.cost
    });
    setShowAddForm(false);
    setFormData({ name: '', cost: 1000 });
  };

  return (
    <div className="pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] px-4 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-black text-primary uppercase tracking-tighter hidden sm:block">MERCADO NEGRO</h2>
          <p className="text-sm font-bold text-on-surface-variant uppercase">INTERCAMBIA CRÉDITOS POR RECOMPENSAS</p>
        </div>
        
        <div className="flex gap-4 w-full sm:w-auto">
          {showDailyBonus && (
             <button 
               onClick={claimDailyBonus}
               className="bg-tertiary text-on-tertiary font-black px-4 py-2 flex items-center justify-center gap-2 border-2 border-black hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase whitespace-nowrap animate-pulse"
             >
               RECLAMAR BONUS
             </button>
          )}
          <div className="bg-surface border-2 border-primary-container p-2 flex-grow text-center">
            <span className="text-[10px] font-bold text-primary-container block">FONDOS DISPONIBLES</span>
            <span className="font-black text-primary-container tabular-nums">${state.credits}</span>
          </div>
          <button 
            onClick={() => {
              soundManager.playClick();
              setShowAddForm(!showAddForm);
            }}
            className="bg-primary text-on-primary font-black px-4 py-2 flex items-center justify-center gap-2 border-2 border-black hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase whitespace-nowrap"
          >
            NUEVA OFERTA
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-surface border-4 border-secondary p-4 mb-6 hard-shadow animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-bold text-secondary uppercase mb-4">AÑADIR RECOMPENSA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">DESCRIPCIÓN</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="EJ. ARMA NUEVA, VACACIONES..."
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">COSTE (CRÉDITOS)</label>
              <input 
                type="number"
                value={formData.cost}
                onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none tabular-nums"
                min="0"
                step="100"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button 
              onClick={handleManualSubmit}
              className="bg-secondary text-on-secondary font-black px-6 py-2 border-2 border-black hard-shadow hover:brightness-110 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase flex-1"
            >
              CREAR
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* SOBORNO PERMANENTE */}
        <div 
          className={`bg-surface border-2 p-4 flex flex-col justify-between group transition-all
            ${state.credits >= 5000 && state.strikes > 0 ? 'border-error hard-shadow hover:-translate-y-1' : 'border-outline opacity-75'}
          `}
        >
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-black text-on-surface uppercase leading-tight pr-4">SOBORNO POLICIAL</h3>
              <ShieldAlert className={state.credits >= 5000 && state.strikes > 0 ? 'text-error' : 'text-outline'} size={24} />
            </div>
            <div className="text-xs font-bold text-on-surface-variant uppercase mb-2">REDUCE -1 ESTRELLA DE PENALIZACIÓN</div>
            <div className={`font-bold tabular-nums text-lg ${state.credits >= 5000 ? 'text-tertiary' : 'text-error'}`}>
              $5000
            </div>
          </div>
          
          <button
            onClick={buySoborno}
            disabled={state.credits < 5000 || state.strikes === 0}
            className={`w-full font-black tracking-widest uppercase p-3 border-2 border-black transition-all flex justify-center items-center gap-2
              ${state.credits >= 5000 && state.strikes > 0
                ? 'bg-error text-white hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none hover:brightness-110' 
                : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}
            `}
          >
            {state.strikes === 0 ? 'HISTORIAL LIMPIO' : state.credits >= 5000 ? 'PAGAR SOBORNO' : 'FONDOS INSUFICIENTES'}
          </button>
        </div>

        {state.rewards.length === 0 && (
          <div className="col-span-full text-center p-8 bg-surface-container border-2 border-outline-variant italic font-bold text-outline uppercase">
            NO HAY RECOMPENSAS DEFINIDAS
          </div>
        )}
        
        {state.rewards.map(reward => {
           const canAfford = state.credits >= reward.cost;
           
           return (
             <div 
               key={reward.id} 
               className={`bg-surface border-2 p-4 flex flex-col justify-between group transition-all
                 ${canAfford ? 'border-primary-container hard-shadow hover:-translate-y-1' : 'border-outline opacity-75'}
               `}
             >
               <div className="mb-4">
                 <div className="flex items-start justify-between mb-2">
                   <h3 className="text-xl font-black text-on-surface uppercase leading-tight pr-4">{reward.name}</h3>
                   <ShoppingCart className={canAfford ? 'text-primary' : 'text-outline'} size={24} />
                 </div>
                 <div className={`font-bold tabular-nums text-lg ${canAfford ? 'text-tertiary' : 'text-error'}`}>
                   ${reward.cost}
                 </div>
               </div>
               
               <button
                 onClick={() => {
                   if (canAfford) {
                     soundManager.playJackpot();
                     buyReward(reward.id);
                   } else {
                     soundManager.playError();
                   }
                 }}
                 disabled={!canAfford}
                 className={`w-full font-black tracking-widest uppercase p-3 border-2 border-black transition-all flex justify-center items-center gap-2
                   ${canAfford 
                     ? 'bg-primary-container text-on-primary-container hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none hover:brightness-110' 
                     : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}
                 `}
               >
                 {canAfford ? 'COMPRAR' : 'FONDOS INSUFICIENTES'}
               </button>
             </div>
           );
        })}
      </div>
    </div>
  );
}
