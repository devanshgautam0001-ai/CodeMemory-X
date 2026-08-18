import { ToolAnalyticsFilter } from '../types/ToolAnalyticsFilter.js';

export const MAX_ANALYTICS_RANGE_MS = 30 * 86_400_000; // 30 days in ms

/**
 * normalizeAnalyticsFilter
 *
 * Centralized deterministic filter normalization utility used across Timeline,
 * Analytics, Visualization, Drill-Down, CSV, JSON, and Report JSON exports.
 *
 * Guarantees:
 * - Trims string criteria and converts empty string or 'ALL' to undefined.
 * - Rejects non-numeric, NaN, Infinity, and negative timestamps.
 * - Swaps reversed timestamps (fromTimestamp > toTimestamp).
 * - Enforces 30-day maximum time range ceiling.
 */
export function normalizeAnalyticsFilter(filter?: ToolAnalyticsFilter): ToolAnalyticsFilter {
  if (!filter) return {};

  const cleanString = (val?: string): string | undefined => {
    if (!val) return undefined;
    const trimmed = val.trim();
    if (!trimmed || trimmed.toUpperCase() === 'ALL') return undefined;
    return trimmed;
  };

  const cleanTimestamp = (ts?: unknown): number | undefined => {
    if (typeof ts !== 'number' || Number.isNaN(ts) || !Number.isFinite(ts) || ts < 0) {
      return undefined;
    }
    return Math.floor(ts);
  };

  const conversationId = cleanString(filter.conversationId);
  const toolName = cleanString(filter.toolName);
  const status = cleanString(filter.status);
  const errorCode = cleanString(filter.errorCode);
  const approvalState = cleanString(filter.approvalState);

  let fromTimestamp = cleanTimestamp(filter.fromTimestamp);
  let toTimestamp = cleanTimestamp(filter.toTimestamp);

  // Swap reversed timestamps
  if (fromTimestamp !== undefined && toTimestamp !== undefined && fromTimestamp > toTimestamp) {
    const temp = fromTimestamp;
    fromTimestamp = toTimestamp;
    toTimestamp = temp;
  }

  // Enforce 30-day maximum range limit if toTimestamp is present
  if (toTimestamp !== undefined) {
    if (fromTimestamp === undefined || toTimestamp - fromTimestamp > MAX_ANALYTICS_RANGE_MS) {
      fromTimestamp = Math.max(0, toTimestamp - MAX_ANALYTICS_RANGE_MS);
    }
  } else if (fromTimestamp !== undefined) {
    const now = Date.now();
    if (now - fromTimestamp > MAX_ANALYTICS_RANGE_MS) {
      fromTimestamp = Math.max(0, now - MAX_ANALYTICS_RANGE_MS);
    }
  }

  return {
    conversationId,
    toolName,
    status: status as any,
    errorCode,
    approvalState,
    fromTimestamp,
    toTimestamp,
  };
}
