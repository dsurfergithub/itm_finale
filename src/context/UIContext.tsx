import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Mission, Tab } from '../types';
import { AppState } from '../types';
import { useStore } from './StoreContext';
import { Sheet } from '../components/Sheet';

interface Toast {
  id: number;
  message: string;
  undo?: AppState;
}

interface Celebration {
  id: number;
  title: string;
  subtitle?: string;
}

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

interface UIContextType {
  tab: Tab;
  setTab: (tab: Tab) => void;
  toast: (message: string, undo?: AppState) => void;
  celebrate: (title: string, subtitle?: string) => void;
  confirm: (opts: Omit<ConfirmRequest, 'resolve'>) => Promise<boolean>;
  /** Opens the mission form; pass a mission to edit it. */
  editMission: (mission?: Mission | null) => void;
  missionFormTarget: Mission | null | undefined;
  closeMissionForm: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);
const CONFETTI_COLORS = ['#ffc65c', '#ff7a59', '#ff4f8b', '#3fd0c9', '#a98bff'];

export function UIProvider({ children }: { children: React.ReactNode }) {
  const { restore } = useStore();
  const [tab, setTab] = useState<Tab>('TODAY');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  // undefined = closed, null = new mission, Mission = editing
  const [missionFormTarget, setMissionFormTarget] = useState<Mission | null | undefined>(undefined);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setToasts(list => list.filter(t => t.id !== id)), []);

  const toast = useCallback(
    (message: string, undo?: AppState) => {
      const id = ++counter.current;
      setToasts(list => [...list.slice(-2), { id, message, undo }]);
      window.setTimeout(() => dismiss(id), undo ? 6000 : 3000);
    },
    [dismiss],
  );

  const celebrate = useCallback((title: string, subtitle?: string) => {
    const id = ++counter.current;
    setCelebration({ id, title, subtitle });
    window.setTimeout(() => setCelebration(c => (c?.id === id ? null : c)), 2200);
  }, []);

  const confirm = useCallback(
    (opts: Omit<ConfirmRequest, 'resolve'>) => new Promise<boolean>(resolve => setConfirmRequest({ ...opts, resolve })),
    [],
  );

  const closeConfirm = (ok: boolean) => {
    confirmRequest?.resolve(ok);
    setConfirmRequest(null);
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab]);

  const value = useMemo<UIContextType>(
    () => ({
      tab,
      setTab,
      toast,
      celebrate,
      confirm,
      editMission: mission => setMissionFormTarget(mission ?? null),
      missionFormTarget,
      closeMissionForm: () => setMissionFormTarget(undefined),
    }),
    [tab, toast, celebrate, confirm, missionFormTarget],
  );

  return (
    <UIContext.Provider value={value}>
      {children}

      <div className="fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-3 max-w-md w-full bg-cream text-bg-deep rounded-2xl pl-4 pr-2 py-2 shadow-xl animate-toast-in">
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            {t.undo && (
              <button
                className="btn btn-sm text-pink font-bold hover:bg-black/5"
                onClick={() => {
                  restore(t.undo!);
                  dismiss(t.id);
                }}
              >
                Deshacer
              </button>
            )}
          </div>
        ))}
      </div>

      {celebration && (
        <div key={celebration.id} className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center overflow-hidden" aria-live="assertive">
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={
                {
                  left: `${(i * 37) % 100}%`,
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  animationDelay: `${(i % 7) * 0.05}s`,
                  '--drift': `${((i * 53) % 120) - 60}px`,
                } as React.CSSProperties
              }
            />
          ))}
          <div className="text-center px-6 animate-pop">
            <p className="title-display text-5xl sm:text-7xl sunset-text drop-shadow-[0_4px_24px_rgba(18,9,20,0.8)]">{celebration.title}</p>
            {celebration.subtitle && <p className="mt-2 text-lg font-semibold text-cream drop-shadow-[0_2px_8px_rgba(18,9,20,0.9)]">{celebration.subtitle}</p>}
          </div>
        </div>
      )}

      <Sheet
        open={!!confirmRequest}
        onClose={() => closeConfirm(false)}
        title={confirmRequest?.title ?? ''}
        size="sm"
        footer={
          <div className="flex gap-2">
            <button className="btn btn-secondary flex-1" onClick={() => closeConfirm(false)}>
              Cancelar
            </button>
            <button className={`btn flex-1 ${confirmRequest?.danger ? 'bg-danger text-bg-deep' : 'btn-primary'}`} onClick={() => closeConfirm(true)}>
              {confirmRequest?.confirmLabel}
            </button>
          </div>
        }
      >
        <p className="text-cream-dim">{confirmRequest?.message}</p>
      </Sheet>
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
}
