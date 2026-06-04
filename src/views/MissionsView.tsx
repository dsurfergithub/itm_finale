import { MapPin, Clock, Trash2, Plus, X, Check } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { useStore } from '../context/StoreContext';
import { useRef, useState } from 'react';
import { getRankData } from '../utils/leveling';

export function MissionsView() {
  const { state, updateState, updateMission, addMission, removeMission, completeMission, failMission } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    difficulty: 'NORMAL',
    location: '',
    durationMinutes: 30,
    rewardCash: 1000,
    rewardRespect: 100,
    category: 'TRABAJO'
  });

  const toggleMission = (id: string, status: string) => {
    soundManager.playClick();
    if (status === 'IDLE') {
      updateMission(id, { status: 'ACTIVE' });
    } else if (status === 'ACTIVE') {
      updateMission(id, { status: 'IDLE' });
    }
  };

  const deleteMission = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playError();
    removeMission(id);
  };

  const handleManualSubmit = () => {
    if (!formData.name.trim() || !formData.location.trim() || !formData.category.trim()) {
      soundManager.playError();
      return;
    }
    soundManager.playAccept();
    addMission({
      id: Date.now().toString(),
      name: formData.name.trim().toUpperCase(),
      difficulty: formData.difficulty.toUpperCase() as any,
      location: formData.location.trim().toUpperCase(),
      durationSeconds: formData.durationMinutes * 60,
      rewardCash: formData.rewardCash,
      rewardRespect: formData.rewardRespect,
      status: 'IDLE',
      timeRemaining: formData.durationMinutes * 60,
      category: formData.category.trim().toUpperCase()
    });
    setShowAddForm(false);
    setFormData({ name: '', difficulty: 'NORMAL', location: '', durationMinutes: 30, rewardCash: 1000, rewardRespect: 100, category: 'TRABAJO' });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getDiffColor = (diff: string) => {
    if (diff === 'EASY') return 'bg-secondary-container text-on-secondary-container';
    if (diff === 'HARD') return 'bg-error text-white';
    return 'bg-tertiary text-black';
  };

  const downloadTemplateArea = () => {
    soundManager.playHover();
    const headers = "NOMBRE,DIFICULTAD,UBICACION,DURACION_MINUTOS,RECOMPENSA_CASH,RECOMPENSA_RESPETO,CATEGORIA\n";
    const example = "NUEVO OBJETIVO,NORMAL,CENTRO CIUDAD,30,1500,200,TRABAJO\nATRACO NOCTURNO,HARD,BANCO,60,5000,1000,DINERO\n";
    const currentMissions = state.missions.map(m => 
      `${m.name},${m.difficulty},${m.location},${Math.floor(m.durationSeconds / 60)},${m.rewardCash},${m.rewardRespect},${m.category}`
    ).join('\n');
    
    // We will now include the example at the top of the file so users see the format clearly
    // but we can just use current missions if they exist, else show example
    const csvContent = headers + (currentMissions ? (currentMissions + '\n' + example) : example);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dt = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `plantilla_misiones_${dt}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    soundManager.playClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        let newMissions = [];
        // Skip header line (index 0)
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length >= 7) {
            newMissions.push({
              id: Date.now().toString() + i,
              name: cols[0].toUpperCase(),
              difficulty: cols[1].toUpperCase() as any,
              location: cols[2].toUpperCase(),
              durationSeconds: parseInt(cols[3]) * 60,
              rewardCash: parseInt(cols[4]),
              rewardRespect: parseInt(cols[5]),
              status: 'IDLE',
              timeRemaining: parseInt(cols[3]) * 60,
              category: cols[6].toUpperCase()
            });
          }
        }
        if (newMissions.length > 0) {
           updateState({ ...state, missions: [...newMissions, ...state.missions] });
           soundManager.playJackpot();
           alert(`SE IMPORTARON ${newMissions.length} MISIONES CON ÉXITO`);
        } else {
           throw new Error("No valid rows");
        }
      } catch (error) {
        soundManager.playError();
        alert('ARCHIVO CSV DAÑADO O FORMATO INVÁLIDO.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const { rank, percentage } = getRankData(state.respect);
  const blocks = Math.floor(percentage / 10);

  return (
    <div className="pt-24 pb-32 px-4 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold uppercase text-on-surface">OBJETIVOS ACTUALES</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            className="bg-surface-variant px-3 py-1 border-2 border-on-surface text-xs font-bold hover:bg-on-surface hover:text-surface transition-all active:translate-x-1 active:translate-y-1 rounded-none flex items-center justify-center gap-1"
            onClick={downloadTemplateArea}
          >
            PLANTILLA CSV
          </button>
          <button 
            className="bg-primary text-on-primary px-3 py-1 border-2 border-black text-xs font-bold hover:brightness-110 transition-all active:translate-x-1 active:translate-y-1 rounded-none flex items-center justify-center gap-1"
            onClick={handleImportClick}
          >
            IMPORTAR CSV
          </button>
          <button 
            className="bg-secondary text-on-secondary px-3 py-1 border-2 border-black text-xs font-bold hover:brightness-110 transition-all active:translate-x-1 active:translate-y-1 rounded-none flex items-center justify-center gap-1"
            onClick={() => {
               soundManager.playClick();
               setShowAddForm(!showAddForm);
            }}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />} 
            MANUAL
          </button>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
        </div>
      </div>

      {showAddForm && (
        <div className="bg-surface border-4 border-secondary p-4 mb-6 hard-shadow animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-bold text-secondary uppercase mb-4">DATOS NUEVO OBJETIVO</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase">DESIGNACIÓN</label>
              <input 
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">CATEGORÍA</label>
              <input 
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="EJ. TRABAJO, SALUD..."
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">UBICACIÓN</label>
              <input 
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">DIFICULTAD</label>
              <select 
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none uppercase"
              >
                <option value="EASY">FÁCIL</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HARD">DIFÍCIL</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">DURACIÓN (MIN)</label>
              <input 
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">RECOMPENSA (DINERO)</label>
              <input 
                type="number"
                min="0"
                value={formData.rewardCash}
                onChange={e => setFormData({ ...formData, rewardCash: parseInt(e.target.value) || 0 })}
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">RECOMPENSA (RESPETO)</label>
              <input 
                type="number"
                min="0"
                value={formData.rewardRespect}
                onChange={e => setFormData({ ...formData, rewardRespect: parseInt(e.target.value) || 0 })}
                className="w-full bg-background border-2 border-secondary p-2 text-secondary font-bold focus:outline-none"
              />
            </div>
          </div>
          <button 
             onClick={handleManualSubmit}
             className="w-full mt-4 bg-secondary text-on-secondary font-black tracking-widest uppercase p-4 border-2 border-black hard-shadow active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:brightness-110 rounded-none"
          >
            INICIALIZAR OBJETIVO
          </button>
        </div>
      )}

      <div className="mb-10">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-bold text-tertiary uppercase italic">RANGO: {rank}</span>
          <span className="text-xs font-bold text-tertiary">{percentage}%</span>
        </div>
        <div className="h-6 w-full bg-surface-container border-2 border-primary flex p-0.5 gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`h-full w-[10%] ${i < blocks ? 'bg-tertiary' : 'bg-surface-container-high'}`} />
            ))}
        </div>
      </div>

      <div className="space-y-6">
        {state.missions.length === 0 && (
           <div className="p-8 text-center border-2 border-dashed border-on-surface-variant/50 text-on-surface-variant uppercase font-bold text-sm">
             SIN MISIONES ACTIVAS
           </div>
        )}
        {state.missions.map(mission => {
           const isActive = mission.status === 'ACTIVE';
           const isPassed = mission.status === 'PASSED';
           const isVerify = mission.status === 'VERIFY';
           const progressPercent = mission.timeRemaining ? ((mission.durationSeconds - mission.timeRemaining) / mission.durationSeconds) * 100 : 100;
           
           return (
            <div 
              key={mission.id}
              onClick={() => !isPassed && toggleMission(mission.id, mission.status)}
              className={`
                bg-surface border-2 p-4 cursor-pointer transition-all active:translate-x-1 active:translate-y-1 group relative
                ${isActive ? 'border-primary-container ring-2 ring-primary-container shadow-none translate-x-1 translate-y-1' : 'border-primary-container hard-shadow'}
                ${isPassed ? 'opacity-50 pointer-events-none' : ''}
                ${isVerify ? 'border-tertiary shadow-[0_0_15px_rgba(var(--color-tertiary),0.6)]' : ''}
              `}
            >
              <button 
                onClick={(e) => deleteMission(mission.id, e)}
                className="absolute top-2 right-2 text-error opacity-0 group-hover:opacity-100 hover:scale-110 transition-all bg-surface p-1 rounded-none border border-error z-10"
              >
                 <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-start mb-2 pr-8">
                <div>
                  <h3 className="text-xl font-bold text-primary-container uppercase">{mission.name}</h3>
                  <p className="text-[10px] text-tertiary uppercase font-black">{mission.category}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${getDiffColor(mission.difficulty)}`}>
                  DIFICULTAD: {mission.difficulty}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-on-surface-variant mb-6 text-sm">
                <MapPin size={16} />
                <span className="font-bold uppercase">{mission.location}</span>
                <span className="mx-2 text-outline">|</span>
                <Clock size={16} />
                <span className={`font-bold uppercase tabular-nums ${isActive ? 'text-primary' : ''} ${isVerify ? 'text-error animate-pulse' : ''}`}>
                  {formatTime(mission.timeRemaining || 0)}
                </span>
              </div>

              <div className="h-1.5 w-full bg-surface-container-highest mb-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isPassed || isVerify ? 'bg-tertiary' : 'bg-primary-container'}`} 
                  style={{ width: `${isPassed || isVerify ? 100 : progressPercent}%` }} 
                />
              </div>

              {isVerify && (
                <div className="flex flex-col gap-2 mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playJackpot();
                      completeMission(mission.id);
                    }}
                    className="w-full bg-tertiary text-on-tertiary font-black tracking-widest uppercase p-3 border-2 border-black hard-shadow hover:brightness-110 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
                  >
                    <Check size={20} />
                    VERIFICAR Y COMPLETAR
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playError();
                      failMission(mission.id);
                    }}
                    className="w-full bg-error text-white font-black tracking-widest uppercase p-3 border-2 border-black hard-shadow hover:brightness-110 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex justify-center items-center gap-2"
                  >
                    <X size={20} />
                    FALLIDA (-1 ESTRELLA)
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase">
                  RECOMPENSA: ${mission.rewardCash} + {mission.rewardRespect} RESPETO
                </span>
                {isActive && <div className="text-tertiary font-bold animate-pulse text-sm">MISIÓN ACTIVA...</div>}
                {isVerify && <div className="text-tertiary font-bold animate-pulse text-sm">PENDIENTE...</div>}
                {isPassed && <div className="text-tertiary font-bold text-sm uppercase">MISIÓN COMPLETADA</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
