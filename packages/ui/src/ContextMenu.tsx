import React from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  danger?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  x: number;
  y: number;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  isOpen,
  onClose,
  x,
  y,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 bg-card-bg border border-border rounded-lg shadow-xl py-1 w-48 text-xs select-none backdrop-blur-md animate-in fade-in zoom-in-95"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-hover transition-colors text-left ${
            item.danger ? 'text-danger hover:bg-danger/10' : 'text-text-primary'
          }`}
        >
          {item.icon && <span className="text-text-secondary">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
