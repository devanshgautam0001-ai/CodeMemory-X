import { describe, it, expect, vi } from 'vitest';
import { SessionContextProvider } from '../context/SessionContextProvider.js';
import { SessionIntelligenceEngine } from '@codememory/session-intelligence';

describe('SessionContextProvider Unit Tests', () => {
  it('retrieves active developer session context', async () => {
    const mockSessionEngine = {
      getCurrentSession: vi.fn().mockReturnValue({ sessionId: 'sess_1', state: 'ACTIVE' }),
    } as unknown as SessionIntelligenceEngine;

    const provider = new SessionContextProvider(mockSessionEngine);
    const summary = await provider.getSessionSummary({ requestId: 'r1', prompt: 'hi' });

    expect(summary).toBeDefined();
    expect(summary?.sessionId).toBe('sess_1');
  });

  it('handles missing engine or exception gracefully', async () => {
    const providerEmpty = new SessionContextProvider(undefined);
    expect(await providerEmpty.getSessionSummary({ requestId: 'r2', prompt: 'hi' })).toBeUndefined();

    const mockThrowing = {
      getCurrentSession: vi.fn().mockImplementation(() => { throw new Error('Session error'); }),
    } as unknown as SessionIntelligenceEngine;
    const providerThrowing = new SessionContextProvider(mockThrowing);
    expect(await providerThrowing.getSessionSummary({ requestId: 'r3', prompt: 'hi' })).toBeUndefined();
  });
});
