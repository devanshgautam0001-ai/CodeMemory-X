import React from 'react';

export interface SearchBoxProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = 'Search memory atoms, decisions, bugs...',
  value,
  onChange,
}) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-input-bg border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
      />
      <span className="absolute left-3 top-2 text-text-secondary text-xs">🔍</span>
    </div>
  );
};
