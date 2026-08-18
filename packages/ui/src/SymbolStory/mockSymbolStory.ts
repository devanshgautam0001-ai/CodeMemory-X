export interface SymbolStoryData {
  symbol: {
    name: string;
    kind: string;
    language: string;
    filePath: string;
    lineRange: string;
  };
  birth: {
    commitHash: string;
    author: string;
    authorAvatar: string;
    date: string;
    reason: string;
  };
  evolution: Array<{
    id: string;
    type: 'Added' | 'Renamed' | 'Moved' | 'Refactored' | 'Deprecated' | 'Restored';
    date: string;
    commitHash: string;
    author: string;
    description: string;
  }>;
  contributors: Array<{
    name: string;
    avatar: string;
    contributionPercentage: number;
    lastEdit: string;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    rationale: string;
    date: string;
    author: string;
  }>;
  bugs: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved';
    resolvedAt?: string;
  }>;
  dependencies: {
    nodes: Array<{ id: string; name: string; type: 'caller' | 'target' | 'self' }>;
    edges: Array<{ from: string; to: string; label: string }>;
  };
  metrics: {
    complexityScore: number;
    totalChanges: number;
    activeSessions: number;
    riskScore: number;
    confidenceScore: number;
  };
}

export const MOCK_SYMBOL_STORY: SymbolStoryData = {
  symbol: {
    name: 'MemoryEngine',
    kind: 'Class',
    language: 'TypeScript',
    filePath: 'packages/memory-engine/src/engine/MemoryEngine.ts',
    lineRange: 'L12-L78',
  },
  birth: {
    commitHash: '7a8f912c',
    author: 'Devan',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    date: '2026-08-07 10:30 UTC',
    reason: 'Created core orchestration engine to reconstruct developer memory models from immutable event store replays.',
  },
  evolution: [
    {
      id: 'evo_1',
      type: 'Added',
      date: '2026-08-07 10:30',
      commitHash: '7a8f912c',
      author: 'Devan',
      description: 'Initial implementation of MemoryEngine with rebuild() support.',
    },
    {
      id: 'evo_2',
      type: 'Refactored',
      date: '2026-08-07 11:45',
      commitHash: '9b2c3d4e',
      author: 'Antigravity',
      description: 'Decoupled MemoryEngine from direct AST parser references to enforce event sourcing isolation.',
    },
    {
      id: 'evo_3',
      type: 'Moved',
      date: '2026-08-07 12:15',
      commitHash: '3e4f5a6b',
      author: 'Devan',
      description: 'Moved engine source into package @codememory/memory-engine root namespace.',
    },
    {
      id: 'evo_4',
      type: 'Refactored',
      date: '2026-08-07 14:00',
      commitHash: '5f6a7b8c',
      author: 'Antigravity',
      description: 'Added IEventBus publisher integration for MEMORY_UPDATED broadcasting.',
    },
  ],
  contributors: [
    {
      name: 'Devan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      contributionPercentage: 55,
      lastEdit: '10 mins ago',
    },
    {
      name: 'Antigravity AI',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      contributionPercentage: 45,
      lastEdit: '2 mins ago',
    },
  ],
  decisions: [
    {
      id: 'dec_1',
      title: 'Hexagonal Event-Store Isolation',
      rationale: 'MemoryEngine strictly consumes events from EventStore without direct AST or Git calls.',
      date: '2026-08-07',
      author: 'Antigravity',
    },
    {
      id: 'dec_2',
      title: 'Deterministic Memory Keys',
      rationale: 'All derived memory IDs use SHA-256 hashes to guarantee reproducible replay state from zero.',
      date: '2026-08-07',
      author: 'Devan',
    },
  ],
  bugs: [
    {
      id: 'bug_1',
      description: 'Native node-gyp prebuild timeout on Windows host',
      severity: 'critical',
      status: 'resolved',
      resolvedAt: '2026-08-07 16:30',
    },
  ],
  dependencies: {
    nodes: [
      { id: 'n1', name: 'EventStore', type: 'caller' },
      { id: 'n2', name: 'MemoryEngine', type: 'self' },
      { id: 'n3', name: 'MemoryRepository', type: 'target' },
      { id: 'n4', name: 'EventBus', type: 'target' },
    ],
    edges: [
      { from: 'n1', to: 'n2', label: 'REPLAYS' },
      { from: 'n2', to: 'n3', label: 'DELEGATES' },
      { from: 'n2', to: 'n4', label: 'PUBLISHES' },
    ],
  },
  metrics: {
    complexityScore: 0.28,
    totalChanges: 4,
    activeSessions: 6,
    riskScore: 0.12,
    confidenceScore: 0.96,
  },
};
