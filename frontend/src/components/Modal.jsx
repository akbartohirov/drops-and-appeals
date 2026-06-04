import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  const modalRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle outside click
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={handleOutsideClick}
      className="fixed inset-0 bg-primary/45 backdrop-blur-md z-[99999] flex justify-center items-start overflow-y-auto p-4 md:p-6 transition-all duration-300"
    >
      <div
        ref={modalRef}
        className={`bg-white w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 animate-slide-up my-4 md:my-10`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low flex-shrink-0">
          <h3 className="text-headline-sm font-semibold text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1.5 rounded-full transition-colors active:scale-90"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with dynamic max-height and custom scrollbar */}
        <div className="p-6 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

