import React from 'react';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4 bg-background/50 backdrop-blur-md">
      <div>
        <h1 className="text-lg font-bold text-text-primary tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </header>
  );
};
