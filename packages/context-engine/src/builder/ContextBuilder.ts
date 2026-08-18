import { MemoryQueryEngine } from '@codememory/memory-query';
import {
  BaseMemory,
  FileMemory,
  SymbolMemory,
  DecisionMemory,
  BugMemory,
  RefactorMemory,
  SessionMemory,
} from '@codememory/memory-engine';
import { DeveloperFocus } from '../types/DeveloperFocus.js';
import { AIContext } from '../types/AIContext.js';
import { ContextRanker } from '../ranker/ContextRanker.js';
import { ContextCompressor } from '../compressor/ContextCompressor.js';
import { ContextBudgetManager } from '../budget/ContextBudgetManager.js';
import { ILogger } from '@codememory/logging';

export class ContextBuilder {
  private ranker = new ContextRanker();
  private compressor = new ContextCompressor();
  private budgetManager = new ContextBudgetManager();

  constructor(
    private readonly queryEngine: MemoryQueryEngine,
    private readonly logger?: ILogger
  ) {}

  public buildContext(focus: DeveloperFocus): AIContext {
    const budget = Number(focus.tokenBudget || 8192);

    // 1. Fetch Candidate Memories from Query Engine
    const searchRes = this.queryEngine.search({
      query: focus.developerQuestion,
      filePath: focus.selectedFile,
      symbolName: focus.activeSymbol,
      workspace: focus.workspace,
      pageSize: 100,
    });

    const candidateMemories = searchRes.items.map((i) => i.memory);

    // 2. Rank Candidates
    const rankedScored = this.ranker.rankContextMemories(candidateMemories, focus);
    const rankedMemories = rankedScored.map((s) => s.memory);

    // 3. Compress Memories
    const compressedMemories = this.compressor.compressMemories(rankedMemories);

    // 4. Budget Trimming
    const { trimmed, isTrimmed } = this.budgetManager.trimToBudget(compressedMemories, budget);

    // Categorize
    const relevantSymbols = trimmed.filter((m): m is SymbolMemory => m.type === 'symbol');
    const relevantDecisions = trimmed.filter((m): m is DecisionMemory => m.type === 'decision');
    const recentChanges = this.compressor.summarizeFileEdits(
      trimmed.filter((m): m is FileMemory => m.type === 'file')
    );
    const relatedBugs = trimmed.filter((m): m is BugMemory => m.type === 'bug');
    const relatedRefactors = trimmed.filter((m): m is RefactorMemory => m.type === 'refactor');
    const sessionList = trimmed.filter((m): m is SessionMemory => m.type === 'session');
    const currentSession = this.compressor.collapseSessions(sessionList);

    // 5. Format Text Output
    const formattedText = this.formatAIContextText({
      focus,
      relevantSymbols,
      relevantDecisions,
      recentChanges,
      relatedBugs,
      relatedRefactors,
      currentSession,
    });

    const estimatedTokens = this.budgetManager.estimateTokens(formattedText);

    this.logger?.info(`[ContextBuilder] Built AI context package (${estimatedTokens}/${budget} tokens, compressed: ${isTrimmed})`);

    return {
      relevantMemories: trimmed,
      relevantSymbols,
      relevantDecisions,
      recentChanges,
      relatedBugs,
      relatedRefactors,
      currentSession,
      formattedText,
      estimatedTokens,
      tokenBudget: budget,
      compressed: isTrimmed,
    };
  }

  private formatAIContextText(data: {
    focus: DeveloperFocus;
    relevantSymbols: SymbolMemory[];
    relevantDecisions: DecisionMemory[];
    recentChanges: FileMemory[];
    relatedBugs: BugMemory[];
    relatedRefactors: RefactorMemory[];
    currentSession?: SessionMemory;
  }): string {
    const lines: string[] = [];

    if (data.focus.developerQuestion) {
      lines.push(`Question: ${data.focus.developerQuestion}`);
    }
    if (data.focus.selectedFile) {
      lines.push(`Active File: ${data.focus.selectedFile}`);
    }
    if (data.focus.activeSymbol) {
      lines.push(`Active Symbol: ${data.focus.activeSymbol}`);
    }

    if (data.relevantDecisions.length > 0) {
      lines.push('\n[Architectural Decisions]');
      data.relevantDecisions.forEach((d) => {
        lines.push(`- ${d.decisionTitle}: ${d.rationale}`);
      });
    }

    if (data.recentChanges.length > 0) {
      lines.push('\n[Recent File Changes]');
      data.recentChanges.forEach((f) => {
        lines.push(`- ${f.filePath} (${f.editCount} edits, authors: ${f.authors.join(', ')})`);
      });
    }

    if (data.relevantSymbols.length > 0) {
      lines.push('\n[Code Symbols]');
      data.relevantSymbols.forEach((s) => {
        lines.push(`- ${s.symbolName} (${s.symbolKind}) in ${s.filePath}`);
      });
    }

    if (data.currentSession) {
      lines.push(`\n[Session Summary]: ${data.currentSession.summary}`);
    }

    return lines.join('\n');
  }
}
