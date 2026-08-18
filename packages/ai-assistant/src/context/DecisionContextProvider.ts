import { MemoryQueryEngine } from '@codememory/memory-query';
import { AssistantRequest } from '../types/AssistantRequest.js';

export class DecisionContextProvider {
  constructor(private readonly queryEngine?: MemoryQueryEngine) {}

  public async getDecisions(_request: AssistantRequest): Promise<any[]> {
    if (!this.queryEngine) return [];
    try {
      const res = this.queryEngine.findRecent(20);
      return res.filter((m: any) => m.type === 'decision' || m.type === 'decision_record');
    } catch {
      return [];
    }
  }
}
