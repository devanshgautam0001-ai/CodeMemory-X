import React from 'react';

export interface ImpactNodeViewProps {
  id: string;
  entityType: 'FILE' | 'SYMBOL' | 'PACKAGE' | 'DECISION' | 'BUG' | 'REFACTOR';
  name: string;
  path?: string;
  impactScore: number;
  confidence: number;
  reasons: { type: string; description: string; strength: number }[];
  distance: number;
}

export interface ImpactMapViewProps {
  rootId: string;
  rootType: string;
  nodes: ImpactNodeViewProps[];
  totalAffectedEntities: number;
  maximumDepth: number;
  overallImpactScore: number;
  overallConfidence: number;
  generatedAt: string;
}

export interface ImpactPanelProps {
  impactMap?: ImpactMapViewProps;
  onOpenGraph?: (nodeId: string) => void;
  onViewStory?: (symbolName: string) => void;
}

export const ImpactPanel: React.FC<ImpactPanelProps> = ({
  impactMap,
  onOpenGraph,
  onViewStory,
}) => {
  if (!impactMap || impactMap.nodes.length === 0) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 text-xs">
        <div className="flex items-center space-x-2 font-semibold mb-1 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>No Active Change Impact Analysis</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Select or edit a file/symbol to compute structural change impact map.
        </p>
      </div>
    );
  }

  const rootName = impactMap.rootId.split('/').pop() ?? impactMap.rootId;
  const highImpactNodes = impactMap.nodes.filter((n) => n.id !== impactMap.rootId && n.impactScore >= 0.70);
  const historicalNodes = impactMap.nodes.filter(
    (n) => n.id !== impactMap.rootId && n.reasons.some((r) => r.type === 'HISTORICAL_COCHANGE')
  );
  const archNodes = impactMap.nodes.filter(
    (n) => n.id !== impactMap.rootId && (n.entityType === 'DECISION' || n.reasons.some((r) => r.type === 'ARCHITECTURAL_IMPACT'))
  );

  return (
    <div className="space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
          <span>⚡ CHANGE IMPACT</span>
        </h3>
        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
          {impactMap.totalAffectedEntities} affected entities
        </span>
      </div>

      <div className="p-3.5 bg-slate-900/80 backdrop-blur border border-cyan-500/30 rounded-lg space-y-3 shadow-lg">
        {/* Header Summary */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Root Entity</span>
            <h4 className="font-bold text-sm text-slate-100 font-mono">{rootName}</h4>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-cyan-400">
              Impact: {(impactMap.overallImpactScore * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-400">
              Confidence: {(impactMap.overallConfidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* High Impact Section */}
        {highImpactNodes.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              HIGH IMPACT
            </span>
            <div className="space-y-1">
              {highImpactNodes.slice(0, 4).map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded border border-slate-800/80 font-mono text-[11px]"
                >
                  <span className="text-slate-200 truncate max-w-[200px]">{node.name}</span>
                  <span className="text-amber-400 font-bold">{(node.impactScore * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historical Section */}
        {historicalNodes.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              HISTORICAL CO-CHANGE
            </span>
            <div className="space-y-1">
              {historicalNodes.slice(0, 3).map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded border border-slate-800/80 font-mono text-[11px]"
                >
                  <span className="text-slate-300 truncate max-w-[200px]">{node.name}</span>
                  <span className="text-purple-300 font-bold">{(node.impactScore * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architectural / Decision Section */}
        {archNodes.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
              ARCHITECTURAL & DECISIONS
            </span>
            <div className="space-y-1">
              {archNodes.slice(0, 3).map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded border border-slate-800/80 font-mono text-[11px]"
                >
                  <span className="text-indigo-200 truncate max-w-[200px]">{node.name}</span>
                  <span className="text-indigo-400 font-bold">{(node.impactScore * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          {onOpenGraph && (
            <button
              onClick={() => onOpenGraph(impactMap.rootId)}
              className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded transition-colors text-[11px]"
            >
              Open Graph
            </button>
          )}
          {onViewStory && (
            <button
              onClick={() => onViewStory(rootName)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded transition-colors text-[11px]"
            >
              View Story
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
