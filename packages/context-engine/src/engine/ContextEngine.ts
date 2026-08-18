import { MemoryQueryEngine } from '@codememory/memory-query';
import { ContextBuilder } from '../builder/ContextBuilder.js';
import { DeveloperFocus } from '../types/DeveloperFocus.js';
import { AIContext } from '../types/AIContext.js';
import { PromptContext } from '../models/PromptContext.js';
import { ContextSnapshot } from '../models/ContextSnapshot.js';
import { ILogger } from '@codememory/logging';

export class ContextEngine {
  private builder: ContextBuilder;

  constructor(
    private readonly queryEngine: MemoryQueryEngine,
    private readonly logger?: ILogger
  ) {
    this.builder = new ContextBuilder(this.queryEngine, this.logger);
  }

  public buildContext(focus: DeveloperFocus): AIContext {
    this.logger?.info('[ContextEngine] Building AI context package from developer focus', { focus });
    return this.builder.buildContext(focus);
  }

  public createPromptContext(focus: DeveloperFocus): PromptContext {
    const aiContext = this.buildContext(focus);
    return new PromptContext(focus, aiContext);
  }

  public createSnapshot(focus: DeveloperFocus): ContextSnapshot {
    const aiContext = this.buildContext(focus);
    return new ContextSnapshot({
      id: `snap_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      context: aiContext,
    });
  }
}
