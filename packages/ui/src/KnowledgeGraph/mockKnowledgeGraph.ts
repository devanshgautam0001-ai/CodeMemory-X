export type GraphNodeType =
  | 'File'
  | 'Class'
  | 'Function'
  | 'Interface'
  | 'Enum'
  | 'Namespace'
  | 'Package'
  | 'Bug'
  | 'ADR'
  | 'Refactor'
  | 'Session'
  | 'Developer';

export type GraphEdgeType =
  | 'CALLS'
  | 'IMPORTS'
  | 'EXPORTS'
  | 'IMPLEMENTS'
  | 'EXTENDS'
  | 'DEPENDS_ON'
  | 'REFERENCES'
  | 'CREATED_BY'
  | 'FIXED_BY'
  | 'RELATED_TO';

export interface GraphNodeData {
  id: string;
  label: string;
  type: GraphNodeType;
  x: number; // 0..800
  y: number; // 0..600
  importance: number; // 0.0 - 1.0
  confidence: number; // 0.0 - 1.0
  health: 'healthy' | 'warning' | 'critical';
  summary: string;
  lastModified: string;
  riskScore: number;
  changesCount: number;
  details?: {
    filePath?: string;
    lineRange?: string;
    author?: string;
    rationale?: string;
    severity?: string;
  };
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label: string;
}

export interface GraphDataset {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgConnections: number;
    hotspots: number;
    isolatedNodes: number;
  };
}

export const MOCK_KNOWLEDGE_GRAPH: GraphDataset = {
  stats: {
    totalNodes: 12,
    totalEdges: 14,
    avgConnections: 2.3,
    hotspots: 3,
    isolatedNodes: 0,
  },
  nodes: [
    {
      id: 'n_event_store',
      label: 'EventStore',
      type: 'Class',
      x: 400,
      y: 120,
      importance: 0.95,
      confidence: 0.98,
      health: 'healthy',
      summary: 'Persistent append-only event store backed by WASM SQLite.',
      lastModified: '15 mins ago',
      riskScore: 0.1,
      changesCount: 6,
      details: {
        filePath: 'packages/event-store/src/store/EventStore.ts',
        lineRange: 'L10-L95',
        author: 'Antigravity',
      },
    },
    {
      id: 'n_db_provider',
      label: 'DatabaseProvider',
      type: 'Class',
      x: 220,
      y: 200,
      importance: 0.9,
      confidence: 0.95,
      health: 'healthy',
      summary: 'WASM SQLite provider supporting foreign keys and WAL mode.',
      lastModified: '20 mins ago',
      riskScore: 0.15,
      changesCount: 4,
      details: {
        filePath: 'packages/event-store/src/database/DatabaseProvider.ts',
        author: 'Devan',
      },
    },
    {
      id: 'n_mem_engine',
      label: 'MemoryEngine',
      type: 'Class',
      x: 400,
      y: 300,
      importance: 0.98,
      confidence: 0.96,
      health: 'healthy',
      summary: 'Core orchestration engine reconstructing memory models from events.',
      lastModified: '30 mins ago',
      riskScore: 0.12,
      changesCount: 8,
      details: {
        filePath: 'packages/memory-engine/src/engine/MemoryEngine.ts',
        author: 'Antigravity',
      },
    },
    {
      id: 'n_query_engine',
      label: 'MemoryQueryEngine',
      type: 'Class',
      x: 580,
      y: 300,
      importance: 0.92,
      confidence: 0.94,
      health: 'healthy',
      summary: 'Multi-factor ranking query engine over derived memories.',
      lastModified: '45 mins ago',
      riskScore: 0.08,
      changesCount: 5,
      details: {
        filePath: 'packages/memory-query/src/engine/MemoryQueryEngine.ts',
        author: 'Devan',
      },
    },
    {
      id: 'n_context_engine',
      label: 'ContextEngine',
      type: 'Class',
      x: 580,
      y: 450,
      importance: 0.88,
      confidence: 0.92,
      health: 'healthy',
      summary: 'Converts developer intent into token-budgeted AIContext packages.',
      lastModified: '1 hour ago',
      riskScore: 0.14,
      changesCount: 3,
      details: {
        filePath: 'packages/context-engine/src/engine/ContextEngine.ts',
        author: 'Antigravity',
      },
    },
    {
      id: 'n_ai_provider',
      label: 'AIProviderFactory',
      type: 'Class',
      x: 350,
      y: 480,
      importance: 0.85,
      confidence: 0.9,
      health: 'healthy',
      summary: 'Vendor-agnostic LLM provider factory isolating 10 adapters.',
      lastModified: '1.5 hours ago',
      riskScore: 0.05,
      changesCount: 2,
      details: {
        filePath: 'packages/ai-provider/src/factory/AIProviderFactory.ts',
        author: 'Devan',
      },
    },
    {
      id: 'n_adr_sqlite',
      label: 'ADR: WASM SQLite',
      type: 'ADR',
      x: 180,
      y: 100,
      importance: 0.95,
      confidence: 1.0,
      health: 'healthy',
      summary: 'Architectural decision adopting WASM sql.js for cross-platform stability.',
      lastModified: '2 hours ago',
      riskScore: 0.0,
      changesCount: 1,
      details: {
        rationale: 'Avoids MSVC C++ toolchain build failures on Windows.',
        author: 'Antigravity',
      },
    },
    {
      id: 'n_bug_node_gyp',
      label: 'Bug: node-gyp prebuild',
      type: 'Bug',
      x: 180,
      y: 320,
      importance: 0.9,
      confidence: 0.95,
      health: 'healthy',
      summary: 'Native prebuild timeout error on Node v24 environment.',
      lastModified: '2.5 hours ago',
      riskScore: 0.8,
      changesCount: 2,
      details: {
        severity: 'critical',
        author: 'Devan',
      },
    },
    {
      id: 'n_pkg_store',
      label: '@codememory/event-store',
      type: 'Package',
      x: 280,
      y: 30,
      importance: 0.8,
      confidence: 0.95,
      health: 'healthy',
      summary: 'Event Sourcing persistent storage workspace package.',
      lastModified: '3 hours ago',
      riskScore: 0.05,
      changesCount: 10,
    },
    {
      id: 'n_sess_arch',
      label: 'Session: Engine Architecture',
      type: 'Session',
      x: 650,
      y: 120,
      importance: 0.75,
      confidence: 1.0,
      health: 'healthy',
      summary: 'Development session covering Task-010 to Task-019.',
      lastModified: '4 hours ago',
      riskScore: 0.0,
      changesCount: 25,
    },
    {
      id: 'n_dev_devan',
      label: 'Devan',
      type: 'Developer',
      x: 720,
      y: 220,
      importance: 0.9,
      confidence: 1.0,
      health: 'healthy',
      summary: 'Core Developer & System Architect',
      lastModified: 'Active now',
      riskScore: 0.0,
      changesCount: 140,
    },
    {
      id: 'n_ref_decouple',
      label: 'Refactor: AST Isolation',
      type: 'Refactor',
      x: 350,
      y: 220,
      importance: 0.88,
      confidence: 0.94,
      health: 'healthy',
      summary: 'Hexagonal refactoring isolating MemoryEngine from AST parsers.',
      lastModified: '5 hours ago',
      riskScore: 0.15,
      changesCount: 5,
    },
  ],
  edges: [
    { id: 'e1', source: 'n_db_provider', target: 'n_event_store', type: 'IMPLEMENTS', label: 'PROVIDES' },
    { id: 'e2', source: 'n_event_store', target: 'n_mem_engine', type: 'CALLS', label: 'REPLAYS' },
    { id: 'e3', source: 'n_mem_engine', target: 'n_query_engine', type: 'DEPENDS_ON', label: 'QUERIED_BY' },
    { id: 'e4', source: 'n_query_engine', target: 'n_context_engine', type: 'DEPENDS_ON', label: 'FEEDS' },
    { id: 'e5', source: 'n_adr_sqlite', target: 'n_db_provider', type: 'RELATED_TO', label: 'BOUND_TO' },
    { id: 'e6', source: 'n_bug_node_gyp', target: 'n_adr_sqlite', type: 'FIXED_BY', label: 'RESOLVED_BY' },
    { id: 'e7', source: 'n_pkg_store', target: 'n_event_store', type: 'IMPORTS', label: 'CONTAINS' },
    { id: 'e8', source: 'n_dev_devan', target: 'n_event_store', type: 'CREATED_BY', label: 'AUTHORED' },
    { id: 'e9', source: 'n_dev_devan', target: 'n_mem_engine', type: 'CREATED_BY', label: 'AUTHORED' },
    { id: 'e10', source: 'n_sess_arch', target: 'n_mem_engine', type: 'RELATED_TO', label: 'TRACKED' },
    { id: 'e11', source: 'n_ref_decouple', target: 'n_mem_engine', type: 'RELATED_TO', label: 'AFFECTS' },
    { id: 'e12', source: 'n_ai_provider', target: 'n_context_engine', type: 'DEPENDS_ON', label: 'PROVIDES_LLM' },
    { id: 'e13', source: 'n_pkg_store', target: 'n_db_provider', type: 'IMPORTS', label: 'CONTAINS' },
    { id: 'e14', source: 'n_event_store', target: 'n_adr_sqlite', type: 'RELATED_TO', label: 'JUSTIFIED_BY' },
  ],
};
