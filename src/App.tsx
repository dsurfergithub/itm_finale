import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { MissionsView } from './views/MissionsView';
import { ProgressView } from './views/ProgressView';
import { StatsView } from './views/StatsView';
import { LogView } from './views/LogView';
import { SpinView } from './views/SpinView';
import { StoreView } from './views/StoreView';
import { Tab } from './types';
import { soundManager } from './utils/audio';
import { StoreProvider, useStore } from './context/StoreContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('MISSIONS');
  const [showMeme, setShowMeme] = useState(false);
  const { state, resetAll } = useStore();

  const handleReset = () => {
    const confirmed = window.confirm('¿Reiniciar toda la partida? Se borrarán misiones, progreso, créditos y registro local.');
    if (!confirmed) return;

    soundManager.playAlert();
    setShowMeme(true);
    setTimeout(() => {
      resetAll();
      setActiveTab('MISSIONS');
      setShowMeme(false);
    }, 2500);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'MISSIONS':
        return <MissionsView />;
      case 'PROGRESS':
        return <ProgressView />;
      case 'STATS':
        return <StatsView />;
      case 'STORE':
        return <StoreView />;
      case 'LOG':
        return <LogView />;
      case 'SPIN':
        return <SpinView onMissionAccepted={() => setActiveTab('MISSIONS')} />;
      default:
        return <MissionsView />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background relative flex flex-col selection:bg-primary selection:text-on-primary overflow-hidden">
      <div className="fixed inset-0 city-grit z-0" />
      <div className="fixed inset-x-0 bottom-0 h-1/2 vice-grid z-0 opacity-70" />
      <div className="fixed inset-0 retro-scanline z-40 opacity-10 pointer-events-none" />
      <div className="fixed -left-32 top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl z-0" />
      <div className="fixed -right-24 top-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl z-0" />

      {showMeme && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <img 
            src="/here_we_go_again.png" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.endsWith('.png')) target.src = '/here_we_go_again.jpg';
              else target.src = 'https://i.kym-cdn.com/entries/icons/original/000/029/322/ahshit.jpg';
            }}
            alt="Reset en curso" 
            className="max-w-full max-h-[70vh] object-contain px-4 drop-shadow-2xl"
          />
          <p className="mt-4 text-primary font-black uppercase tracking-[0.35em] animate-pulse">Reiniciando partida</p>
        </div>
      )}

      <TopBar respect={state.respect} credits={state.credits} strikes={state.strikes} onReset={handleReset} />
      
      <main className="flex-grow relative z-10 w-full overflow-x-hidden">
        {renderView()}
      </main>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
