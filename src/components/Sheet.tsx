import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg';

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-bg-deep/75 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} max-h-[92dvh] flex flex-col bg-surface border border-line rounded-t-[1.5rem] sm:rounded-[1.5rem] shadow-2xl animate-sheet-in outline-none`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <h2 className="title-display text-2xl text-cream">{title}</h2>
          <button className="btn btn-ghost btn-icon btn-sm -mr-2" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 flex-1">{children}</div>
        {footer && <div className="px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-line">{footer}</div>}
      </div>
    </div>
  );
}

export interface MenuAction {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  onSelect: () => void;
  danger?: boolean;
  hidden?: boolean;
}

/** Action list opened from a "⋯" button; always reachable by touch, no hover needed. */
export function ActionSheet({ open, onClose, title, actions }: { open: boolean; onClose: () => void; title: string; actions: MenuAction[] }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-1 -mx-2">
        {actions
          .filter(a => !a.hidden)
          .map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className={`flex items-center gap-3 rounded-xl px-3 min-h-12 text-left font-medium hover:bg-surface-2 ${action.danger ? 'text-danger' : 'text-cream'}`}
                onClick={() => {
                  onClose();
                  action.onSelect();
                }}
              >
                <Icon size={19} />
                {action.label}
              </button>
            );
          })}
      </div>
    </Sheet>
  );
}
