import { ParseResult } from '@codememory/parser-sdk';
import { Result, ok, fail } from '@codememory/shared';
import { GraphNode } from '../models/GraphNode.js';
import { GraphEdge } from '../models/GraphEdge.js';
import { SymbolGraph } from '../models/SymbolGraph.js';
import { generateDeterministicSymbolId } from '../utils/deterministicId.js';
import { ILogger } from '@codememory/logging';
import { createHash } from 'node:crypto';

export class SymbolGraphBuilder {
  constructor(private readonly logger?: ILogger) {}

  public buildFromParseResult(parseResult: ParseResult): Result<SymbolGraph> {
    try {
      this.logger?.info(`[SymbolGraphBuilder] Building graph for file ${parseResult.sourcePath}`);
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      const symbolMapByName = new Map<string, string>(); // Name -> Deterministic ID

      // 1. Process Functions & Methods
      parseResult.functions.forEach((fn) => {
        const nodeId = generateDeterministicSymbolId({
          language: parseResult.languageId,
          filePath: parseResult.sourcePath,
          symbolType: fn.kind,
          symbolName: fn.name,
          location: fn.location,
        });

        const node = new GraphNode({
          id: nodeId,
          name: fn.name,
          kind: fn.kind,
          language: parseResult.languageId,
          location: fn.location,
          rawSymbol: fn,
        });

        nodes.push(node);
        symbolMapByName.set(fn.name, nodeId);
      });

      // 2. Process Classes
      parseResult.classes.forEach((cls) => {
        const classNodeId = generateDeterministicSymbolId({
          language: parseResult.languageId,
          filePath: parseResult.sourcePath,
          symbolType: 'class',
          symbolName: cls.name,
          location: cls.location,
        });

        const classNode = new GraphNode({
          id: classNodeId,
          name: cls.name,
          kind: 'class',
          language: parseResult.languageId,
          location: cls.location,
          rawSymbol: cls,
        });

        nodes.push(classNode);
        symbolMapByName.set(cls.name, classNodeId);

        // Inheritance (EXTENDS)
        if (cls.superClass) {
          const targetId = symbolMapByName.get(cls.superClass) || `ext_${cls.superClass}`;
          edges.push(
            new GraphEdge({
              id: this.generateEdgeId(classNodeId, targetId, 'EXTENDS'),
              fromId: classNodeId,
              toId: targetId,
              type: 'EXTENDS',
            })
          );
        }
      });

      // 3. Process Imports (IMPORTS / DEPENDS_ON)
      parseResult.imports.forEach((imp) => {
        const importNodeId = generateDeterministicSymbolId({
          language: parseResult.languageId,
          filePath: parseResult.sourcePath,
          symbolType: 'import',
          symbolName: imp.sourcePath,
          location: imp.location,
        });

        const importNode = new GraphNode({
          id: importNodeId,
          name: imp.sourcePath,
          kind: 'import',
          language: parseResult.languageId,
          location: imp.location,
        });

        nodes.push(importNode);

        imp.importedSymbols.forEach((symName) => {
          if (symName) {
            const symId = symbolMapByName.get(symName) || `imp_sym_${symName}`;
            edges.push(
              new GraphEdge({
                id: this.generateEdgeId(importNodeId, symId, 'IMPORTS'),
                fromId: importNodeId,
                toId: symId,
                type: 'IMPORTS',
              })
            );
          }
        });
      });

      // 4. Process References & Function Calls (CALLS / USES)
      parseResult.references.forEach((ref) => {
        const targetId = symbolMapByName.get(ref.targetSymbolId) || `target_${ref.targetSymbolId}`;
        const sourceNode = nodes.find((n) => n.name !== ref.targetSymbolId) || nodes[0];

        if (sourceNode) {
          const edgeType = ref.kind === 'call' ? 'CALLS' : 'USES';
          edges.push(
            new GraphEdge({
              id: this.generateEdgeId(sourceNode.id, targetId, edgeType),
              fromId: sourceNode.id,
              toId: targetId,
              type: edgeType,
              location: ref.location,
            })
          );
        }
      });

      return ok(new SymbolGraph(nodes, edges));
    } catch (error) {
      return fail(error as Error);
    }
  }

  private generateEdgeId(fromId: string, toId: string, type: string): string {
    const raw = `${fromId}->${type}->${toId}`;
    return `edge_${createHash('sha256').update(raw).digest('hex').substring(0, 16)}`;
  }
}
