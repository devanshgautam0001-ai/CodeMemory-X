import React from 'react';
import { Sparkles, Terminal, FileCode2 } from 'lucide-react';
import { Badge } from '@codememory/ui';

export const WelcomeBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-accent/15 via-purple-500/10 to-transparent border border-accent/30 rounded-xl p-5 mb-6 shadow-sm relative overflow-hidden">
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="accent">Foundation Scaffolding Ready</Badge>
            <span className="text-xs text-text-secondary font-mono">VS Code Monorepo Architecture</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">"Your code remembers everything."</h2>
          <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
            Developers forget <strong className="text-text-primary">WHY</strong> code exists. Git remembers <strong className="text-text-primary">WHAT</strong> changed. CodeMemory X remembers <strong className="text-accent font-semibold">WHY</strong>.
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-accent/80">
          <Sparkles size={32} />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-accent/20 flex items-center space-x-6 text-[11px] font-mono text-text-secondary">
        <span className="flex items-center space-x-1.5">
          <Terminal size={12} className="text-accent" />
          <span>Zero Overhead Engine</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <FileCode2 size={12} className="text-accent" />
          <span>AST Symbol Lineage</span>
        </span>
      </div>
    </div>
  );
};
