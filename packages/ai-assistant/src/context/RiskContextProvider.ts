import { DriftSentinel } from '@codememory/drift-sentinel';
import { AssistantRequest } from '../types/AssistantRequest.js';

export class RiskContextProvider {
  constructor(private readonly driftSentinel?: DriftSentinel) {}

  public async getRiskFindings(_request: AssistantRequest): Promise<any[]> {
    if (!this.driftSentinel) return [];
    try {
      return this.driftSentinel.analyze({});
    } catch {
      return [];
    }
  }
}
