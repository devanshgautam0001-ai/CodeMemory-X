import React from 'react';

export interface DriftFindingViewProps {
  id: string;
  type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  title: string;
  summary: string;
  affectedFiles: string[];
  affectedSymbols?: string[];
  affectedPackages?: string[];
  confidence: number;
  detectedAt: string;
  acknowledged?: boolean;
}

export interface DriftPanelProps {
  findings?: DriftFindingViewProps[];
  onInspectGraph?: (findingId: string) => void;
  onViewDecision?: (findingId: string) => void;
  onAcknowledge?: (findingId: string) => void;
}

export const DriftPanel: React.FC<DriftPanelProps> = ({
  findings = [],
  onInspectGraph,
  onViewDecision,
  onAcknowledge,
}) => {
  if (findings.length === 0) {
    return (
      <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-emerald-300 text-sm">
        <div className="flex items-center space-x-2 font-semibold mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Architectural Integrity Healthy</span>
        </div>
        <p className="text-xs text-emerald-400/80">
          No architectural drift detected. All dependency boundaries and ADR constraints are satisfied.
        </p>
      </div>
    );
  }

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span>⚠ ARCHITECTURAL DRIFT SENTINEL</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
            {findings.length}
          </span>
        </h3>
      </div>

      {findings.map((finding) => (
        <div
          key={finding.id}
          className="p-3 bg-slate-900/80 backdrop-blur border border-amber-500/30 rounded-lg space-y-2 text-slate-200 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-0.5 font-bold uppercase rounded text-[10px] border ${getSeverityStyle(
                finding.severity
              )}`}
            >
              {finding.severity}
            </span>
            <span className="text-[11px] text-slate-400">
              Confidence: <strong className="text-slate-200">{(finding.confidence * 100).toFixed(0)}%</strong>
            </span>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-slate-100">{finding.title}</h4>
            <p className="text-slate-300 mt-0.5">{finding.summary}</p>
          </div>

          {finding.affectedFiles.length > 0 && (
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Affected Files</span>
              <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-amber-300/90">
                {finding.affectedFiles.map((file, idx) => (
                  <li key={idx} className="truncate">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-800">
            {onInspectGraph && (
              <button
                onClick={() => onInspectGraph(finding.id)}
                className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded transition-colors text-[11px]"
              >
                Inspect Graph
              </button>
            )}
            {onViewDecision && (
              <button
                onClick={() => onViewDecision(finding.id)}
                className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded transition-colors text-[11px]"
              >
                View Decision
              </button>
            )}
            {onAcknowledge && !finding.acknowledged && (
              <button
                onClick={() => onAcknowledge(finding.id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded transition-colors text-[11px]"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
