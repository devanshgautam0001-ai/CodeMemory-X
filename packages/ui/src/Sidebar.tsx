import React from 'react';

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className = '' }) => {
  return (
    <aside className={`w-64 bg-sidebar-bg border-r border-border flex flex-col h-full ${className}`}>
      {children}
    </aside>
  );
};
