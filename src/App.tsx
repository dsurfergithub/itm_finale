import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { MissionForm } from './components/MissionForm';
import { StoreProvider } from './context/StoreContext';
import { UIProvider, useUI } from './context/UIContext';
import { CityView } from './views/CityView';
import { MarketView } from './views/MarketView';
import { MissionsView } from './views/MissionsView';
import { ProfileView } from './views/ProfileView';
import { TodayView } from './views/TodayView';

function AppContent() {
  const { tab } = useUI();

  return (
    <div className="min-h-[100dvh] bg-bg text-cream">
      <AppHeader />
      <main key={tab} className="animate-fade-in">
        {tab === 'TODAY' && <TodayView />}
        {tab === 'MISSIONS' && <MissionsView />}
        {tab === 'CITY' && <CityView />}
        {tab === 'MARKET' && <MarketView />}
        {tab === 'PROFILE' && <ProfileView />}
      </main>
      <BottomNav />
      <MissionForm />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <UIProvider>
        <AppContent />
      </UIProvider>
    </StoreProvider>
  );
}
