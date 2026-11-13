import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { lockBody } from "../utils/bodyLock";
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const unlock = lockBody();
    return () => {
      dialog?.close();
      unlock();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close.current();
      }}
    >
      <div className="sheet-body">
        <div className="sheet-handle" />
        <header className="sheet-heading">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Cerrar" onClick={onClose}>
            <X size={21} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}
