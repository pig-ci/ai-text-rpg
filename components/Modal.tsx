import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onConfirm,
  confirmText = '確認',
  onCancel,
  cancelText = '取消',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 rounded-lg border border-slate-700 shadow-2xl shadow-cyan-500/10 w-full max-w-md m-4 p-6 text-center animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <h2 className="text-2xl font-bold text-cyan-300 mb-4">{title}</h2>
        <div className="text-slate-200 mb-8">{children}</div>
        <div className="flex justify-center gap-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-8 rounded-full transition-all"
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full transition-all"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
