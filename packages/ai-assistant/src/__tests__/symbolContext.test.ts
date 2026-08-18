import { describe, it, expect, vi } from 'vitest';
import { SymbolContextProvider } from '../context/SymbolContextProvider.js';
import { SymbolStoryEngine } from '@codememory/story-engine';

describe('SymbolContextProvider Unit Tests', () => {
  it('retrieves active symbol story when symbol name is specified', async () => {
    const mockStoryEngine = {
      getStoryByName: vi.fn().mockResolvedValue({ symbolName: 'MyClass', milestones: [] }),
    } as unknown as SymbolStoryEngine;

    const provider = new SymbolContextProvider(mockStoryEngine);
    const story = await provider.getSymbolStory({
      requestId: 'r1',
      prompt: 'Explain MyClass',
      activeSymbolName: 'MyClass',
    });

    expect(story).toBeDefined();
    expect(story?.symbolName).toBe('MyClass');
  });

  it('returns undefined when symbol name is missing or engine throws', async () => {
    const providerEmpty = new SymbolContextProvider(undefined);
    expect(await providerEmpty.getSymbolStory({ requestId: 'r2', prompt: 'hi' })).toBeUndefined();

    const mockThrowing = {
      getStoryByName: vi.fn().mockRejectedValue(new Error('Story failed')),
    } as unknown as SymbolStoryEngine;
    const providerThrowing = new SymbolContextProvider(mockThrowing);
    expect(await providerThrowing.getSymbolStory({ requestId: 'r3', prompt: 'hi', activeSymbolName: 'Err' })).toBeUndefined();
  });
});
