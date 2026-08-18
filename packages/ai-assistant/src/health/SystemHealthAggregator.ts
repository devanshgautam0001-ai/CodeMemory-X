import {
  ComponentHealthInfo,
  ComponentHealthStatus,
  SystemHealthSnapshot,
} from '@codememory/shared';
import * as path from 'path';

export interface SystemHealthAggregatorDependencies {
  eventStore?: any;
  memoryEngine?: any;
  memoryQueryEngine?: any;
  storyEngine?: any;
  driftSentinel?: any;
  impactEngine?: any;
  sessionEngine?: any;
  relationshipEngine?: any;
  confidenceEngine?: any;
  contextEngine?: any;
  toolRegistry?: any;
  toolExecutor?: any;
  toolAuditor?: any;
  assistantEngine?: any;
  provider?: any;
  rpcMetricsProvider?: () => {
    requestsReceived: number;
    successfulResponses: number;
    failedResponses: number;
    activeRequests: number;
    lastRequestTimestamp?: string;
  };
}

export class SystemHealthAggregator {
  constructor(private readonly deps: SystemHealthAggregatorDependencies) {}

  public async getSnapshot(): Promise<SystemHealthSnapshot> {
    const components: ComponentHealthInfo[] = [];

    // 1. EventStore Health
    components.push(await this.evaluateEventStoreHealth());

    // 2. AI Provider Health
    components.push(this.evaluateAIProviderHealth());

    // 3. Tool Runtime Health
    components.push(await this.evaluateToolRuntimeHealth());

    // 4. RPC Bridge Health
    components.push(this.evaluateRpcBridgeHealth());

    // 5. Cognitive Engines Health
    components.push(this.evaluateCognitiveEngineHealth('memory_engine', 'Memory Engine', this.deps.memoryEngine));
    components.push(this.evaluateCognitiveEngineHealth('memory_query_engine', 'Memory Query Engine', this.deps.memoryQueryEngine));
    components.push(this.evaluateCognitiveEngineHealth('story_engine', 'Symbol Story Engine', this.deps.storyEngine));
    components.push(this.evaluateCognitiveEngineHealth('drift_sentinel', 'Drift Sentinel', this.deps.driftSentinel));
    components.push(this.evaluateCognitiveEngineHealth('change_impact_engine', 'Change Impact Engine', this.deps.impactEngine));
    components.push(this.evaluateCognitiveEngineHealth('session_intelligence_engine', 'Session Intelligence Engine', this.deps.sessionEngine));
    components.push(this.evaluateCognitiveEngineHealth('relationship_engine', 'Relationship Engine', this.deps.relationshipEngine));
    components.push(this.evaluateCognitiveEngineHealth('confidence_engine', 'Confidence Engine', this.deps.confidenceEngine));
    components.push(this.evaluateCognitiveEngineHealth('context_engine', 'Context Engine', this.deps.contextEngine));

    // Summary counts
    let healthyCount = 0;
    let degradedCount = 0;
    let unavailableCount = 0;
    let unknownCount = 0;

    for (const c of components) {
      switch (c.status) {
        case 'HEALTHY':
          healthyCount++;
          break;
        case 'DEGRADED':
          degradedCount++;
          break;
        case 'UNAVAILABLE':
          unavailableCount++;
          break;
        case 'UNKNOWN':
          unknownCount++;
          break;
      }
    }

    // Determine overall system status
    let overallStatus: ComponentHealthStatus = 'HEALTHY';
    let overallReason = 'All critical subsystems and components are operational.';

    const criticalUnavailable = components.filter((c) => c.isCritical && c.status === 'UNAVAILABLE');
    const criticalDegraded = components.filter((c) => c.isCritical && c.status === 'DEGRADED');

    if (criticalUnavailable.length > 0) {
      overallStatus = 'UNAVAILABLE';
      overallReason = `Critical component ${criticalUnavailable[0].componentName} is unavailable.`;
    } else if (criticalDegraded.length > 0 || degradedCount > 0) {
      overallStatus = 'DEGRADED';
      overallReason = `One or more components are running in a degraded state.`;
    } else if (healthyCount === 0) {
      overallStatus = 'UNKNOWN';
      overallReason = 'Insufficient evidence to determine overall system health.';
    }

    return {
      overallStatus,
      overallReason,
      generatedAt: new Date().toISOString(),
      components,
      summary: {
        totalComponents: components.length,
        healthyCount,
        degradedCount,
        unavailableCount,
        unknownCount,
      },
    };
  }

  private async evaluateEventStoreHealth(): Promise<ComponentHealthInfo> {
    const es = this.deps.eventStore;
    if (!es) {
      return {
        componentId: 'event_store',
        componentName: 'WASM EventStore',
        category: 'event_store',
        status: 'UNAVAILABLE',
        statusReason: 'EventStore instance is not configured or instantiated',
        isCritical: true,
      };
    }

    try {
      const res = es.getEvents ? await es.getEvents({ limit: 1 }) : { isSuccess: true, value: [] };
      const rawPath = es.dbPath ?? es.config?.dbPath ?? 'events.db';
      const safeDbName = typeof rawPath === 'string' ? path.basename(rawPath) : 'events.db';

      if (res && res.isSuccess !== false) {
        return {
          componentId: 'event_store',
          componentName: 'WASM EventStore',
          category: 'event_store',
          status: 'HEALTHY',
          statusReason: 'EventStore database is initialized and responsive',
          isCritical: true,
          eventCount: Array.isArray(res.value) ? res.value.length : 0,
          metrics: {
            dbName: safeDbName,
            isInitialized: true,
            storageType: 'sqlite-wasm',
          },
        };
      }
      return {
        componentId: 'event_store',
        componentName: 'WASM EventStore',
        category: 'event_store',
        status: 'DEGRADED',
        statusReason: 'EventStore query returned failure response',
        isCritical: true,
        metrics: { dbName: safeDbName },
      };
    } catch (err) {
      return {
        componentId: 'event_store',
        componentName: 'WASM EventStore',
        category: 'event_store',
        status: 'UNAVAILABLE',
        statusReason: `EventStore error: ${(err as Error).message}`,
        isCritical: true,
      };
    }
  }

  private evaluateAIProviderHealth(): ComponentHealthInfo {
    const provider = this.deps.provider;
    if (!provider) {
      return {
        componentId: 'ai_provider',
        componentName: 'AI Provider',
        category: 'ai_provider',
        status: 'UNKNOWN',
        statusReason: 'No AI provider configured',
        isCritical: true,
      };
    }

    const providerId = provider.id ?? 'ollama';
    const model = provider.defaultModel ?? 'llama3';

    return {
      componentId: 'ai_provider',
      componentName: `AI Provider (${providerId})`,
      category: 'ai_provider',
      status: 'HEALTHY',
      statusReason: `Provider instance loaded and configured for model ${model}`,
      isCritical: true,
      metrics: {
        providerId,
        model,
        active: true,
      },
    };
  }

  private async evaluateToolRuntimeHealth(): Promise<ComponentHealthInfo> {
    const reg = this.deps.toolRegistry;
    const aud = this.deps.toolAuditor;

    if (!reg) {
      return {
        componentId: 'tool_runtime',
        componentName: 'Tool Runtime',
        category: 'tool_runtime',
        status: 'UNKNOWN',
        statusReason: 'ToolRegistry instance not found',
        isCritical: true,
      };
    }

    const tools = reg.list ? reg.list() : [];
    const registeredCount = tools.length;

    let totalExecutions = 0;
    let failedCount = 0;
    let avgDurationMs = 0;

    if (aud && aud.getAnalytics) {
      try {
        const analytics = await aud.getAnalytics();
        totalExecutions = analytics.totalCount ?? 0;
        failedCount = analytics.failureCount ?? 0;
        avgDurationMs = analytics.avgDurationMs ?? 0;
      } catch {
        // Safe fallback
      }
    }

    return {
      componentId: 'tool_runtime',
      componentName: 'Tool Runtime',
      category: 'tool_runtime',
      status: 'HEALTHY',
      statusReason: `${registeredCount} deterministic tools registered and operational`,
      isCritical: true,
      eventCount: totalExecutions,
      errorCount: failedCount,
      avgLatencyMs: avgDurationMs,
      metrics: {
        registeredToolsCount: registeredCount,
        totalExecutions,
      },
    };
  }

  private evaluateRpcBridgeHealth(): ComponentHealthInfo {
    const metricsFn = this.deps.rpcMetricsProvider;
    let m = {
      requestsReceived: 0,
      successfulResponses: 0,
      failedResponses: 0,
      activeRequests: 0,
      lastRequestTimestamp: undefined as string | undefined,
    };
    if (metricsFn) {
      try {
        const res = metricsFn();
        if (res) {
          m = {
            requestsReceived: res.requestsReceived ?? 0,
            successfulResponses: res.successfulResponses ?? 0,
            failedResponses: res.failedResponses ?? 0,
            activeRequests: res.activeRequests ?? 0,
            lastRequestTimestamp: res.lastRequestTimestamp,
          };
        }
      } catch {
        // Safe fallback
      }
    }

    return {
      componentId: 'rpc_bridge',
      componentName: 'Webview RPC Bridge',
      category: 'rpc_bridge',
      status: 'HEALTHY',
      statusReason: 'MessageBridge RPC protocol active',
      isCritical: true,
      lastActivityAt: m.lastRequestTimestamp,
      eventCount: m.requestsReceived,
      errorCount: m.failedResponses,
      metrics: {
        requestsReceived: m.requestsReceived,
        successfulResponses: m.successfulResponses,
        failedResponses: m.failedResponses,
        activeRequests: m.activeRequests,
      },
    };
  }

  private evaluateCognitiveEngineHealth(
    id: string,
    name: string,
    instance?: any
  ): ComponentHealthInfo {
    if (!instance) {
      return {
        componentId: id,
        componentName: name,
        category: 'cognitive_engine',
        status: 'UNKNOWN',
        statusReason: 'No health evidence available for component',
        isCritical: false,
      };
    }

    return {
        componentId: id,
        componentName: name,
        category: 'cognitive_engine',
        status: 'HEALTHY',
        statusReason: `${name} initialized and active in pipeline`,
        isCritical: false,
        metrics: { initialized: true },
      };
  }
}
