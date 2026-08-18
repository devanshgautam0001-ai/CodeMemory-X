import { WorkspaceEvent } from '@codememory/workspace-watcher';
import { GitRepository, GitFileChange } from '@codememory/git-engine';
import { ILanguageParser, ParseResult } from '@codememory/parser-sdk';
import { SymbolGraph } from '@codememory/symbol-graph';
import { PipelineMetrics } from '../types/PipelineMetrics.js';

export interface PipelineContextProps {
  event?: WorkspaceEvent;
  workspacePath?: string;
  repository?: GitRepository;
  changedFiles?: GitFileChange[];
  selectedParsers?: Map<string, ILanguageParser>; // filePath -> parser
  parseResults?: ParseResult[];
  symbolGraph?: SymbolGraph;
  errors?: string[];
  warnings?: string[];
  metrics?: PipelineMetrics;
}

export class PipelineContext {
  public event?: WorkspaceEvent;
  public workspacePath: string;
  public repository?: GitRepository;
  public changedFiles: GitFileChange[];
  public selectedParsers: Map<string, ILanguageParser>;
  public parseResults: ParseResult[];
  public symbolGraph?: SymbolGraph;
  public errors: string[];
  public warnings: string[];
  public metrics: PipelineMetrics;

  constructor(props: PipelineContextProps = {}) {
    this.event = props.event;
    this.workspacePath = props.workspacePath || props.event?.workspace || '';
    this.repository = props.repository;
    this.changedFiles = props.changedFiles || [];
    this.selectedParsers = props.selectedParsers || new Map();
    this.parseResults = props.parseResults || [];
    this.symbolGraph = props.symbolGraph;
    this.errors = props.errors || [];
    this.warnings = props.warnings || [];
    this.metrics = props.metrics || {
      totalDurationMs: 0,
      stageDurations: [],
      filesProcessed: 0,
      symbolsDiscovered: 0,
      graphNodes: 0,
      graphEdges: 0,
      errorCount: 0,
      warningCount: 0,
    };
  }

  public addError(error: string): void {
    this.errors.push(error);
    this.metrics.errorCount = this.errors.length;
  }

  public addWarning(warning: string): void {
    this.warnings.push(warning);
    this.metrics.warningCount = this.warnings.length;
  }
}
