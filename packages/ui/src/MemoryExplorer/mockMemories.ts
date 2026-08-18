export interface MemoryItem {
  id: string;
  type: 'file' | 'symbol' | 'decision' | 'bug' | 'refactor' | 'intent' | 'session';
  title: string;
  summary: string;
  confidence: number;
  importance: number;
  recency: string;
  sourceEvents: string[];
  relationships: Array<{ targetMemoryId: string; type: string; targetTitle: string }>;
  details?: {
    filePath?: string;
    editCount?: number;
    authors?: string[];
    symbolName?: string;
    symbolKind?: string;
    decisionTitle?: string;
    rationale?: string;
    author?: string;
    boundSymbols?: string[];
    bugDescription?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'open' | 'investigating' | 'resolved';
    refactorScope?: string;
    affectedFiles?: string[];
    sessionId?: string;
    modifiedFilesCount?: number;
  };
}

export const MOCK_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_dec_01',
    type: 'decision',
    title: 'Adopt WASM SQLite EventStore',
    summary: 'Decided to use sql.js for cross-platform zero-compilation event sourcing in VS Code extension host.',
    confidence: 0.98,
    importance: 0.95,
    recency: '10 mins ago',
    sourceEvents: ['evt_wal_01', 'evt_mig_02'],
    relationships: [
      { targetMemoryId: 'mem_file_01', type: 'BOUND_TO', targetTitle: 'DatabaseProvider.ts' },
      { targetMemoryId: 'mem_sym_01', type: 'AFFECTS', targetTitle: 'EventStore' },
    ],
    details: {
      decisionTitle: 'Adopt WASM SQLite EventStore',
      rationale: 'Eliminates native Visual C++ compilation errors on Windows host environments while maintaining fast SQLite performance.',
      author: 'Antigravity Team',
      boundSymbols: ['DatabaseProvider', 'EventRepository', 'EventStore'],
    },
  },
  {
    id: 'mem_file_01',
    type: 'file',
    title: 'DatabaseProvider.ts',
    summary: 'Configures WASM SQLite database engine with foreign keys and WAL mode compatibility.',
    confidence: 0.92,
    importance: 0.88,
    recency: '15 mins ago',
    sourceEvents: ['evt_mod_101', 'evt_mod_102'],
    relationships: [
      { targetMemoryId: 'mem_dec_01', type: 'CAUSED_BY', targetTitle: 'Adopt WASM SQLite EventStore' },
    ],
    details: {
      filePath: 'packages/event-store/src/database/DatabaseProvider.ts',
      editCount: 6,
      authors: ['Devan', 'Antigravity'],
    },
  },
  {
    id: 'mem_bug_01',
    type: 'bug',
    title: 'Native node-gyp prebuild timeout on Windows',
    summary: 'better-sqlite3 failed to build precompiled binary on Node v24 environment without MSVC toolchain.',
    confidence: 0.95,
    importance: 0.9,
    recency: '1 hour ago',
    sourceEvents: ['evt_err_901'],
    relationships: [
      { targetMemoryId: 'mem_dec_01', type: 'RESOLVED_BY', targetTitle: 'Adopt WASM SQLite EventStore' },
    ],
    details: {
      bugDescription: 'Prebuild download timed out, falling back to node-gyp rebuild which failed due to missing Visual Studio 2017+ C++ build tools.',
      severity: 'critical',
      status: 'resolved',
    },
  },
  {
    id: 'mem_sym_01',
    type: 'symbol',
    title: 'MemoryEngine',
    summary: 'Core orchestration engine deriving developer memories from event store replays.',
    confidence: 0.89,
    importance: 0.85,
    recency: '2 hours ago',
    sourceEvents: ['evt_sym_301'],
    relationships: [
      { targetMemoryId: 'mem_ref_01', type: 'REFACTORED_FROM', targetTitle: 'LegacyMemoryManager' },
    ],
    details: {
      symbolName: 'MemoryEngine',
      symbolKind: 'class',
      filePath: 'packages/memory-engine/src/engine/MemoryEngine.ts',
    },
  },
  {
    id: 'mem_ref_01',
    type: 'refactor',
    title: 'Decouple Memory Engine from AST Parsers',
    summary: 'Refactored Memory Engine to strictly consume events from EventStore without direct AST parser dependencies.',
    confidence: 0.94,
    importance: 0.92,
    recency: '3 hours ago',
    sourceEvents: ['evt_ref_201'],
    relationships: [
      { targetMemoryId: 'mem_sym_01', type: 'AFFECTS', targetTitle: 'MemoryEngine' },
    ],
    details: {
      refactorScope: 'Architecture Boundary Refactoring',
      affectedFiles: [
        'packages/memory-engine/src/engine/MemoryEngine.ts',
        'packages/memory-engine/src/builder/MemoryBuilder.ts',
      ],
      rationale: 'Hexagonal isolation guarantees deterministic event sourcing without direct AST coupling.',
    },
  },
  {
    id: 'mem_sess_01',
    type: 'session',
    title: 'Sprint 2 Engine Architecture Session',
    summary: 'Development session covering Task-010 through Task-016 implementation.',
    confidence: 1.0,
    importance: 0.75,
    recency: '4 hours ago',
    sourceEvents: ['evt_sess_01', 'evt_sess_02'],
    relationships: [],
    details: {
      sessionId: 'session_sprint_2_arch',
      modifiedFilesCount: 42,
    },
  },
];
