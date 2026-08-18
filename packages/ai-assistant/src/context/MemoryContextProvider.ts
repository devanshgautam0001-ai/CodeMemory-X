import { MemoryQueryEngine } from '@codememory/memory-query';
import { AssistantRequest } from '../types/AssistantRequest.js';

export class MemoryContextProvider {
  constructor(private readonly queryEngine?: MemoryQueryEngine) {}

  public async getMemories(request: AssistantRequest): Promise<any[]> {
    if (!this.queryEngine) return [];
    try {
      const res = this.queryEngine.search({ query: request.prompt, workspace: request.workspacePath });
      return res?.items ?? [];
    } catch {
      return [];
    }
  }
}
