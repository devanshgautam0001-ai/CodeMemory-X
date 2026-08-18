import React from 'react';

export interface LoadingProps {
  label?: string;
}

export const Loading: React.FC<LoadingProps> = ({ label = 'Syncing Memory Engine...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-text-secondary font-mono">{label}</span>
    </div>
  );
};
