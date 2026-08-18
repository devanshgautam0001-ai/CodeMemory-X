import { RegisteredTool } from '../types/ToolRuntimeTypes.js';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { SymbolStoryEngine } from '@codememory/story-engine';
import { ChangeImpactEngine } from '@codememory/change-impact';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { SessionIntelligenceEngine } from '@codememory/session-intelligence';
import { RelationshipEngine } from '@codememory/relationship-engine';

export interface CodeMemoryEngineDependencies {
  memoryQueryEngine?: MemoryQueryEngine;
  storyEngine?: SymbolStoryEngine;
  impactEngine?: ChangeImpactEngine;
  driftEngine?: DriftSentinel;
  sessionEngine?: SessionIntelligenceEngine;
  relationshipEngine?: RelationshipEngine;
}

export function registerBuiltInCodeMemoryTools(
  registry: ToolRegistry,
  deps: CodeMemoryEngineDependencies
): void {
  // 1. search_memories
  const searchMemoriesTool: RegisteredTool = {
    name: 'search_memories',
    description: 'Searches developer memories for files, symbols, and decisions.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or query pattern' },
        workspace: { type: 'string', description: 'Optional workspace path filter' },
      },
      required: ['query'],
    },
    execute: async (args) => {
      if (!deps.memoryQueryEngine) {
        return { success: false, content: { error: 'MemoryQueryEngine is not initialized' } };
      }
      const query = String(args.query ?? '');
      const workspace = args.workspace ? String(args.workspace) : undefined;
      const res = deps.memoryQueryEngine.search({ query, workspace });
      return { success: true, content: res as any };
    },
  };

  // 2. get_symbol_story
  const getSymbolStoryTool: RegisteredTool = {
    name: 'get_symbol_story',
    description: 'Retrieves historical evolution story of a code symbol.',
    parameters: {
      type: 'object',
      properties: {
        symbolName: { type: 'string', description: 'Target code symbol name' },
      },
      required: ['symbolName'],
    },
    execute: async (args) => {
      if (!deps.storyEngine) {
        return { success: false, content: { error: 'SymbolStoryEngine is not initialized' } };
      }
      const symbolName = String(args.symbolName ?? '');
      const res = await deps.storyEngine.getStoryByName(symbolName);
      return { success: true, content: res as any };
    },
  };

  // 3. get_change_impact
  const getChangeImpactTool: RegisteredTool = {
    name: 'get_change_impact',
    description: 'Calculates structural change impact for target files or symbols.',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'File path or symbol name' },
      },
      required: ['target'],
    },
    execute: async (args) => {
      if (!deps.impactEngine) {
        return { success: false, content: { error: 'ChangeImpactEngine is not initialized' } };
      }
      const target = String(args.target ?? '');
      const res = target.includes('/') || target.includes('\\')
        ? deps.impactEngine.analyzeFile(target)
        : deps.impactEngine.analyzeSymbol(target);
      return { success: true, content: res as any };
    },
  };

  // 4. get_architectural_drift
  const getArchitecturalDriftTool: RegisteredTool = {
    name: 'get_architectural_drift',
    description: 'Detects architectural drift findings across the workspace.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      if (!deps.driftEngine) {
        return { success: false, content: { error: 'DriftSentinel is not initialized' } };
      }
      const res = deps.driftEngine.analyze({});
      return { success: true, content: res as any };
    },
  };

  // 5. get_session
  const getSessionTool: RegisteredTool = {
    name: 'get_session',
    description: 'Retrieves developer session intelligence and current activity focus.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      if (!deps.sessionEngine) {
        return { success: false, content: { error: 'SessionIntelligenceEngine is not initialized' } };
      }
      const res = deps.sessionEngine.getCurrentSession();
      return { success: true, content: res as any };
    },
  };

  // 6. get_relationships
  const getRelationshipsTool: RegisteredTool = {
    name: 'get_relationships',
    description: 'Retrieves deterministic entity relationships for a target symbol.',
    parameters: {
      type: 'object',
      properties: {
        symbolName: { type: 'string', description: 'Symbol name' },
      },
      required: ['symbolName'],
    },
    execute: async (args) => {
      if (!deps.relationshipEngine) {
        return { success: false, content: { error: 'RelationshipEngine is not initialized' } };
      }
      const symbolName = String(args.symbolName ?? '');
      const res = deps.relationshipEngine.findRelationships(symbolName);
      return { success: true, content: res as any };
    },
  };

  registry.register(searchMemoriesTool);
  registry.register(getSymbolStoryTool);
  registry.register(getChangeImpactTool);
  registry.register(getArchitecturalDriftTool);
  registry.register(getSessionTool);
  registry.register(getRelationshipsTool);
}
