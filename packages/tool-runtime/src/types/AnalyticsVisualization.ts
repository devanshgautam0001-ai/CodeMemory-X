/**
 * AnalyticsSeriesPoint
 * Single timestamp-value data point within a visualization series.
 */
export interface AnalyticsSeriesPoint {
  timestamp: number;
  value: number;
}

/**
 * AnalyticsSeriesId
 * Supported deterministic time-series metrics.
 */
export type AnalyticsSeriesId =
  | 'total'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'denied'
  | 'expired'
  | 'avgLatency'
  | 'minLatency'
  | 'maxLatency'
  | 'successRate';

/**
 * AnalyticsSeries
 * Named series of data points over uniform time buckets.
 */
export interface AnalyticsSeries {
  id: AnalyticsSeriesId;
  label: string;
  points: AnalyticsSeriesPoint[];
}

/**
 * AnalyticsChartData
 *
 * Hardened, deterministic time-series data structure representing tool execution throughput,
 * latency, and status breakdown over uniform time buckets.
 *
 * Calculated 100% deterministically from observable ToolExecutionAudit records.
 * Guarantees zero-value empty bucket preservation and a maximum 500-point upper limit.
 */
export interface AnalyticsChartData {
  fromTimestamp: number;
  toTimestamp: number;
  bucketSizeMs: number;
  totalExecutions: number;
  successRate: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  deniedCount: number;
  expiredCount: number;
  series: AnalyticsSeries[];
}
