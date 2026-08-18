import { describe, it, expect } from 'vitest';
import { AIAssistantEngine } from '../engine/AIAssistantEngine.js';

describe('AIAssistantEngine Signal Propagation', () => {
  it('should pass signal to provider generateStream when streaming', async () => {
    let capturedSignal: AbortSignal | undefined = undefined;

    const mockProvider: any = {
      metadata: { id: 'mock', name: 'Mock Provider', isLocal: true },
      capabilities: { streaming: true, toolCalling: false },
      generateStream: (req: any) => {
        capturedSignal = req.signal;
        async function* gen() {
          yield { contentDelta: 'chunk1' };
        }
        return gen();
      },
      generate: async () => ({ isSuccess: true, isFailure: false, value: { content: 'ok' } }),
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });

    const streamGen = engine.stream({
      requestId: 'req_sig_1',
      prompt: 'Hello AI',
    });

    for await (const _chunk of streamGen) {
      // consume
    }

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);
  });
});
