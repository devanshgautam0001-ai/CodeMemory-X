import React from 'react';
import { GraphEdgeData, GraphNodeData } from './mockKnowledgeGraph.js';

export interface GraphEdgeProps {
  edge: GraphEdgeData;
  sourceNode: GraphNodeData;
  targetNode: GraphNodeData;
}

export const GraphEdge: React.FC<GraphEdgeProps> = ({ edge, sourceNode, targetNode }) => {
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;

  return (
    <g className="pointer-events-none">
      {/* Background Line */}
      <line
        x1={sourceNode.x}
        y1={sourceNode.y}
        x2={targetNode.x}
        y2={targetNode.y}
        stroke="rgba(129, 140, 248, 0.35)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />

      {/* Animated Flow Circle */}
      <circle r="2.5" fill="#818cf8">
        <animateMotion
          path={`M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`}
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Edge Type Label */}
      <foreignObject x={midX - 35} y={midY - 10} width="70" height="20">
        <div className="flex items-center justify-center">
          <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold uppercase rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md">
            {edge.type}
          </span>
        </div>
      </foreignObject>
    </g>
  );
};
