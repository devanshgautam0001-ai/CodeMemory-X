import { SymbolGraph } from '@codememory/symbol-graph';
import { ParseResult } from '@codememory/parser-sdk';
import { PipelineMetrics } from './PipelineMetrics.js';

export interface IntelligenceResult {
  symbolGraph?: SymbolGraph;
  parseResults: ParseResult[];
  metrics: PipelineMetrics;
  errors: string[];
  warnings: string[];
}
