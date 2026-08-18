import React from 'react';

export interface SessionPanelViewProps {
  sessionId: string;
  workspace: string;
  startTime: string;
  durationMs: number;
  activityLevel: 'IDLE' | 'LOW' | 'ACTIVE' | 'HIGH';
  state: 'EXPLORING' | 'IMPLEMENTING' | 'REFACTORING' | 'DEBUGGING' | 'OPTIMIZING' | 'DOCUMENTING' | 'TESTING' | 'MIXED' | 'UNKNOWN';
  confidence: number;
  activeFiles: { filePath: string; editCount: number }[];
  activeSymbols: { name: string; touchCount: number; isPrimaryFocus: boolean }[];
  detectedIntents: { type: string; confidence: number; description: string }[];
  impactSummary?: { totalAffectedEntities: number; overallImpactScore: number };
  architecturalRisks?: { id: string; severity: string; title: string }[];
}

export interface SessionPanelProps {
  session?: SessionPanelViewProps;
  onOpenTimeline?: () => void;
  onOpenGraph?: () => void;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({
  session,
  onOpenTimeline,
  onOpenGraph,
}) => {
  if (!session) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 text-xs">
        <div className="flex items-center space-x-2 font-semibold mb-1 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>No Active Developer Session</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Open a workspace or modify files to initiate deterministic session intelligence tracking.
        </p>
      </div>
    );
  }

  const hours = Math.floor(session.durationMs / (1000 * 60 * 60));
  const mins = Math.floor((session.durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const primaryFocusFiles = session.activeFiles.slice(0, 3).map((f) => f.filePath.split('/').pop() ?? f.filePath);
  const primaryFocusSymbols = session.activeSymbols.filter((s) => s.isPrimaryFocus).map((s) => s.name);
  const primaryFocusItems = [...primaryFocusSymbols, ...primaryFocusFiles].slice(0, 3);

  const dominantIntent = session.detectedIntents[0];

  return (
    <div className="space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span>🧠 CURRENT SESSION</span>
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">Active for {durationText}</span>
      </div>

      <div className="p-3.5 bg-slate-900/80 backdrop-blur border border-violet-500/30 rounded-lg space-y-3 shadow-lg text-slate-200">
        {/* State */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Session State</span>
            <span className="font-bold text-sm text-violet-300 uppercase tracking-wide">
              {session.state}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Confidence</span>
            <span className="font-bold text-xs text-slate-200">
              {(session.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Primary Focus */}
        {primaryFocusItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              PRIMARY FOCUS
            </span>
            <ul className="space-y-0.5 font-mono text-[11px] text-cyan-300">
              {primaryFocusItems.map((item, idx) => (
                <li key={idx} className="truncate">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Intent */}
        {dominantIntent && (
          <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Dominant Intent</span>
              <span className="font-semibold text-slate-100">{dominantIntent.type}</span>
            </div>
            <span className="text-[11px] text-violet-400 font-bold">
              {(dominantIntent.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}

        {/* Changes & Impact */}
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Changes</span>
            <div className="text-slate-200 font-bold mt-0.5">
              {session.activeFiles.length} files / {session.activeSymbols.length} symbols
            </div>
          </div>
          <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Impact</span>
            <div className="text-cyan-300 font-bold mt-0.5">
              {session.impactSummary ? `${session.impactSummary.totalAffectedEntities} entities` : 'None'}
            </div>
          </div>
        </div>

        {/* Architectural Risks */}
        {session.architecturalRisks && session.architecturalRisks.length > 0 && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase">ARCHITECTURAL RISKS</span>
            <span className="text-xs font-bold text-amber-300">
              {session.architecturalRisks.length} {session.architecturalRisks[0].severity}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          {onOpenTimeline && (
            <button
              onClick={onOpenTimeline}
              className="px-2.5 py-1 bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 rounded transition-colors text-[11px]"
            >
              Open Timeline
            </button>
          )}
          {onOpenGraph && (
            <button
              onClick={onOpenGraph}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded transition-colors text-[11px]"
            >
              Open Graph
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
