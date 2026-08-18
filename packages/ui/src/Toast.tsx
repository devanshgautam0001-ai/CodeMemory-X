import React from 'react';

export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const typeStyles = {
    info: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  };

  return (
    <div className={`flex items-center justify-between border rounded-lg px-4 py-2.5 shadow-lg text-xs font-mono ${typeStyles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-3 hover:opacity-75">
          ✕
        </button>
      )}
    </div>
  );
};
