import { SymbolStoryEngine } from '@codememory/story-engine';
import { AssistantRequest } from '../types/AssistantRequest.js';

export class SymbolContextProvider {
  constructor(private readonly storyEngine?: SymbolStoryEngine) {}

  public async getSymbolStory(request: AssistantRequest): Promise<any | undefined> {
    if (!this.storyEngine || !request.activeSymbolName) return undefined;
    try {
      return await this.storyEngine.getStoryByName(request.activeSymbolName, request.activeFilePath);
    } catch {
      return undefined;
    }
  }
}
