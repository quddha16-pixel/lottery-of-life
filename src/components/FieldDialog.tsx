import { useEffect, useId, useRef, type ReactNode } from "react";
export function FieldDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const d = ref.current!,
      previous = document.activeElement as HTMLElement | null;
    d.showModal();
    return () => {
      d.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="field-dialog"
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="field-dialog-body">
        <header>
          <h2 id={id}>{title}</h2>
          <button onClick={onClose} aria-label="Close details">
            ×
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
