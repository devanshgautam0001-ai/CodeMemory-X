/**
 * ComponentHealthStatus
 * Deterministic status values for System Health components.
 */
export type ComponentHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';

/**
 * ComponentHealthCategory
 * Structural grouping for system components.
 */
export type ComponentHealthCategory =
  | 'event_store'
  | 'cognitive_engine'
  | 'ai_provider'
  | 'tool_runtime'
  | 'rpc_bridge';

/**
 * ComponentHealthInfo
 * Deterministic operational health snapshot for a single subsystem component.
 * Strictly metadata-only — zero prompts, arguments, API keys, or credentials.
 */
export interface ComponentHealthInfo {
  componentId: string;
  componentName: string;
  category: ComponentHealthCategory;
  status: ComponentHealthStatus;
  statusReason: string;
  isCritical: boolean;
  lastActivityAt?: string;
  eventCount?: number;
  errorCount?: number;
  avgLatencyMs?: number;
  dependencyStatus?: 'OK' | 'DEGRADED' | 'FAILING';
  metrics?: Record<string, string | number | boolean>;
}

/**
 * SystemHealthSnapshot
 * Aggregated operational health snapshot of the entire CodeMemory X system.
 */
export interface SystemHealthSnapshot {
  overallStatus: ComponentHealthStatus;
  overallReason: string;
  generatedAt: string;
  components: ComponentHealthInfo[];
  summary: {
    totalComponents: number;
    healthyCount: number;
    degradedCount: number;
    unavailableCount: number;
    unknownCount: number;
  };
}
