import { SessionIntelligenceEngine } from '@codememory/session-intelligence';
import { AssistantRequest } from '../types/AssistantRequest.js';

export class SessionContextProvider {
  constructor(private readonly sessionEngine?: SessionIntelligenceEngine) {}

  public async getSessionSummary(_request: AssistantRequest): Promise<any | undefined> {
    if (!this.sessionEngine) return undefined;
    try {
      return this.sessionEngine.getCurrentSession();
    } catch {
      return undefined;
    }
  }
}
