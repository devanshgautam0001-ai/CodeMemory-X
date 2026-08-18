import { AIContext } from '../types/AIContext.js';
import { DeveloperFocus } from '../types/DeveloperFocus.js';

export class PromptContext {
  constructor(
    public readonly focus: DeveloperFocus,
    public readonly context: AIContext
  ) {}

  public toSystemPromptChunk(): string {
    return `[CodeMemory X Context Package]\n${this.context.formattedText}`;
  }
}
