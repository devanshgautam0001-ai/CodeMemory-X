export type TimelineEventType =
  | 'File Created'
  | 'File Modified'
  | 'Symbol Added'
  | 'Symbol Renamed'
  | 'Refactor'
  | 'ADR Recorded'
  | 'Bug Fixed'
  | 'Dependency Added'
  | 'Session Started'
  | 'Session Ended'
  | 'Release'
  | 'Milestone';

export interface TimelineEventItem {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  author: string;
  authorAvatar?: string;
  importance: number; // 0.0 - 1.0
  confidence: number; // 0.0 - 1.0
  tags: string[];
  sessionId?: string;
  workspace?: string;
  branch?: string;
  details?: {
    filesChanged?: string[];
    symbolsTouched?: string[];
    decisionsMade?: string[];
    bugsFixed?: string[];
    commitHash?: string;
    rationale?: string;
  };
}

export interface SessionData {
  sessionId: string;
  title: string;
  duration: string;
  startTime: string;
  endTime: string;
  filesChanged: number;
  symbolsTouched: number;
  decisionsMade: number;
  bugsFixed: number;
  events: TimelineEventItem[];
}

export interface TimelineData {
  projectName: string;
  workspace: string;
  sessionDuration: string;
  currentBranch: string;
  totalMemories: number;
  stats: {
    memoriesCreated: number;
    sessions: number;
    refactors: number;
    adrs: number;
    bugsFixed: number;
    symbolsTracked: number;
  };
  heatmap: Array<{ date: string; count: number }>;
  sessions: SessionData[];
  rawEvents: TimelineEventItem[];
}

export const MOCK_TIMELINE_DATA: TimelineData = {
  projectName: 'CodeMemory X',
  workspace: '/Documents/CodeMemory X',
  sessionDuration: '3h 45m',
  currentBranch: 'main',
  totalMemories: 142,
  stats: {
    memoriesCreated: 142,
    sessions: 18,
    refactors: 12,
    adrs: 8,
    bugsFixed: 5,
    symbolsTracked: 89,
  },
  heatmap: [
    { date: '2026-08-01', count: 4 },
    { date: '2026-08-02', count: 12 },
    { date: '2026-08-03', count: 8 },
    { date: '2026-08-04', count: 15 },
    { date: '2026-08-05', count: 22 },
    { date: '2026-08-06', count: 18 },
    { date: '2026-08-07', count: 35 },
  ],
  sessions: [
    {
      sessionId: 'sess_01',
      title: 'Session 18: Engine & Store Architecture',
      duration: '1h 20m',
      startTime: '15:30',
      endTime: '16:50',
      filesChanged: 12,
      symbolsTouched: 8,
      decisionsMade: 2,
      bugsFixed: 1,
      events: [
        {
          id: 'evt_t1',
          type: 'ADR Recorded',
          title: 'Adopt WASM SQLite EventStore',
          description: 'Decided on sql.js engine for zero native MSVC compilation requirements.',
          timestamp: '16:45',
          author: 'Antigravity',
          importance: 0.95,
          confidence: 0.98,
          tags: ['architecture', 'event-store', 'sqlite'],
          sessionId: 'sess_01',
          workspace: '/Documents/CodeMemory X',
          branch: 'main',
          details: {
            commitHash: '7a8f912c',
            rationale: 'Cross-platform stability on Windows environments.',
            filesChanged: ['packages/event-store/src/database/DatabaseProvider.ts'],
            decisionsMade: ['Adopt WASM SQLite EventStore'],
          },
        },
        {
          id: 'evt_t2',
          type: 'Bug Fixed',
          title: 'Resolved node-gyp prebuild timeout error',
          description: 'Replaced native better-sqlite3 with WASM sql.js adapter.',
          timestamp: '16:30',
          author: 'Devan',
          importance: 0.9,
          confidence: 0.95,
          tags: ['bugfix', 'windows', 'node-gyp'],
          sessionId: 'sess_01',
          workspace: '/Documents/CodeMemory X',
          branch: 'main',
          details: {
            bugsFixed: ['Native node-gyp prebuild timeout'],
            filesChanged: ['packages/event-store/package.json'],
          },
        },
        {
          id: 'evt_t3',
          type: 'Refactor',
          title: 'Decoupled Memory Engine from AST Parsers',
          description: 'Refactored Memory Engine to strictly derive memories from event store replays.',
          timestamp: '15:45',
          author: 'Antigravity',
          importance: 0.92,
          confidence: 0.94,
          tags: ['refactor', 'hexagonal', 'memory-engine'],
          sessionId: 'sess_01',
          workspace: '/Documents/CodeMemory X',
          branch: 'main',
          details: {
            symbolsTouched: ['MemoryEngine', 'MemoryBuilder'],
            filesChanged: ['packages/memory-engine/src/engine/MemoryEngine.ts'],
          },
        },
      ],
    },
    {
      sessionId: 'sess_02',
      title: 'Session 17: Sidebar & Webview UI Foundation',
      duration: '2h 25m',
      startTime: '12:00',
      endTime: '14:25',
      filesChanged: 18,
      symbolsTouched: 15,
      decisionsMade: 1,
      bugsFixed: 0,
      events: [
        {
          id: 'evt_t4',
          type: 'Milestone',
          title: 'Task-016 Memory Explorer Sidebar Complete',
          description: 'Shipped Raycast/Linear-grade glassmorphic sidebar component suite.',
          timestamp: '14:20',
          author: 'Devan',
          importance: 0.98,
          confidence: 1.0,
          tags: ['ui', 'milestone', 'sidebar'],
          sessionId: 'sess_02',
          workspace: '/Documents/CodeMemory X',
          branch: 'main',
        },
        {
          id: 'evt_t5',
          type: 'Symbol Added',
          title: 'Created MemoryDetailsPanel Component',
          description: 'Added tabbed navigation drawer for memory relationships & sessions.',
          timestamp: '13:10',
          author: 'Antigravity',
          importance: 0.85,
          confidence: 0.9,
          tags: ['react', 'ui', 'components'],
          sessionId: 'sess_02',
          workspace: '/Documents/CodeMemory X',
          branch: 'main',
        },
      ],
    },
  ],
  rawEvents: [],
};

// Populate rawEvents flat list
MOCK_TIMELINE_DATA.rawEvents = MOCK_TIMELINE_DATA.sessions.flatMap((s) => s.events);
