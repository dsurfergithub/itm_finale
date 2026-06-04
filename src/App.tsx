import { useState, StrictMode } from 'react';
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
    soundManager.playAlert();
    setShowMeme(true);
    setTimeout(() => {
      resetAll();
      setActiveTab('MISSIONS');
      setShowMeme(false);
    }, 3000);
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
    <div className="min-h-[100dvh] bg-background relative flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Global Retro Overlays */}
      <div className="fixed inset-0 city-grit z-0" />
      <div className="retro-scanline fixed inset-0 z-40 opacity-10 pointer-events-none" />

      {showMeme && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          <img 
            src="/here_we_go_again.png" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.endsWith('.png')) target.src = '/here_we_go_again.jpg';
              else target.src = 'https://i.kym-cdn.com/entries/icons/original/000/029/322/ahshit.jpg';
            }}
            alt="Here we go again" 
            className="max-w-full max-h-[70vh] object-contain px-4 drop-shadow-2xl"
          />
        </div>
      )}

      <TopBar respect={state.respect} strikes={state.strikes} onReset={handleReset} />
      
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

