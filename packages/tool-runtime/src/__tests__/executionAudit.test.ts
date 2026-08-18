import { describe, it, expect } from 'vitest';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { InMemoryEventBus } from '@codememory/event-bus';

describe('ToolExecutionAuditor Unit Tests', () => {
  it('records execution audit events and publishes EventBus events', async () => {
    const eventBus = new InMemoryEventBus();
    const publishedEvents: any[] = [];
    eventBus.subscribe('TOOL_EXECUTION_STARTED', async (e) => { publishedEvents.push(e); });
    eventBus.subscribe('TOOL_EXECUTION_COMPLETED', async (e) => { publishedEvents.push(e); });

    const auditor = new ToolExecutionAuditor(eventBus);
    auditor.recordStart({
      executionId: 'e1',
      requestId: 'r1',
      toolCallId: 'tc1',
      toolName: 'search_memories',
      startedAt: new Date().toISOString(),
      success: false,
    });

    auditor.recordCompletion('e1', 'search_memories', 'tc1', 15, true);

    const repoEvents = auditor.getRepository().listEvents();
    expect(repoEvents).toHaveLength(1);
    expect(repoEvents[0].status).toBe('COMPLETED');
    expect(publishedEvents).toHaveLength(2);
    expect(publishedEvents[0].type).toBe('TOOL_EXECUTION_STARTED');
    expect(publishedEvents[1].type).toBe('TOOL_EXECUTION_COMPLETED');
  });
});
