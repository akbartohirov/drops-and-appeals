import React, { useEffect, useRef } from 'react';

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  ariaLabel,
  maxWidthClass = 'max-w-2xl',
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    // Fallback for browsers without native <dialog closedby="any"> support
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (isDialogContent) return;

      dialog.close();
    };

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-label={ariaLabel}
      className={`m-auto p-0 bg-transparent border-0 outline-none text-slate-100 w-[calc(100%-2rem)] ${maxWidthClass}`}
    >
      {children}
    </dialog>
  );
};
