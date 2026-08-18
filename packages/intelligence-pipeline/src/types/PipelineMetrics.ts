export interface StageMetric {
  stageName: string;
  durationMs: number;
  success: boolean;
}

export interface PipelineMetrics {
  totalDurationMs: number;
  stageDurations: StageMetric[];
  filesProcessed: number;
  symbolsDiscovered: number;
  graphNodes: number;
  graphEdges: number;
  errorCount: number;
  warningCount: number;
}
