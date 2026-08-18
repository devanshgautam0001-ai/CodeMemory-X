import { ChangeImpactEngine } from '@codememory/change-impact';
import { AssistantRequest } from '../types/AssistantRequest.js';

export class ImpactContextProvider {
  constructor(private readonly impactEngine?: ChangeImpactEngine) {}

  public async getChangeImpact(request: AssistantRequest): Promise<any | undefined> {
    if (!this.impactEngine) return undefined;
    try {
      if (request.activeFilePath) {
        return this.impactEngine.analyzeFile(request.activeFilePath);
      }
      if (request.activeSymbolName) {
        return this.impactEngine.analyzeSymbol(request.activeSymbolName);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}
