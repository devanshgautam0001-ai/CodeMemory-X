import { describe, it, expect, vi } from 'vitest';
import { ToolApprovalRepository } from '../permissions/ToolApprovalRepository.js';
import { ok } from '@codememory/shared';

describe('ToolApprovalRepository Expiration Guard Suite', () => {
  it('1. ignores approvals with malformed or invalid expiresAt date strings', async () => {
    const futureDate = new Date(Date.now() + 60000).toISOString();

    const mockEventStore = {
      getEvents: vi.fn().mockImplementation(async (opts) => {
        if (opts.eventType === 'TOOL_APPROVAL_REQUESTED') {
          return ok([
            {
              payload: {
                approvalId: 'appr_valid',
                requestId: 'req_01',
                toolCallId: 'tc_01',
                toolName: 'read_file',
                arguments: {},
                status: 'PENDING',
                requestedAt: new Date().toISOString(),
                expiresAt: futureDate,
              },
            },
            {
              payload: {
                approvalId: 'appr_corrupt_date',
                requestId: 'req_02',
                toolCallId: 'tc_02',
                toolName: 'delete_file',
                arguments: {},
                status: 'PENDING',
                requestedAt: new Date().toISOString(),
                expiresAt: 'INVALID_NOT_A_DATE',
              },
            },
          ]);
        }
        return ok([]);
      }),
    } as any;

    const repo = new ToolApprovalRepository(mockEventStore);
    const pending = await repo.getPendingApprovals();

    expect(pending.length).toBe(1);
    expect(pending[0].approvalId).toBe('appr_valid');
  });
});
