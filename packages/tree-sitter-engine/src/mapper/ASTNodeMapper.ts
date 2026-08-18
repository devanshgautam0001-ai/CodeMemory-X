import {
  ParseResult,
  SymbolInfo,
  FunctionInfo,
  ClassInfo,
  ImportInfo,
  ExportInfo,
  NamespaceInfo,
  ReferenceInfo,
  LocationInfo,
} from '@codememory/parser-sdk';

export interface ASTSyntaxNode {
  type: string;
  name?: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  children?: ASTSyntaxNode[];
  text?: string;
  modifiers?: string[];
  superClass?: string;
  sourcePath?: string;
  importedSymbols?: string[];
  exportedName?: string;
}

export class ASTNodeMapper {
  public mapToParseResult(
    languageId: string,
    filePath: string,
    rootNode: ASTSyntaxNode,
    durationMs: number
  ): ParseResult {
    const functions: FunctionInfo[] = [];
    const classes: ClassInfo[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const namespaces: NamespaceInfo[] = [];
    const references: ReferenceInfo[] = [];
    const symbols: SymbolInfo[] = [];

    const traverse = (node: ASTSyntaxNode) => {
      const loc: LocationInfo = {
        filePath,
        startLine: node.startLine,
        endLine: node.endLine,
        startColumn: node.startColumn,
        endColumn: node.endColumn,
      };

      if (node.type === 'function_declaration' || node.type === 'method_definition') {
        const fnInfo: FunctionInfo = {
          id: `fn_${node.name || 'anonymous'}_${node.startLine}_${node.startColumn}`,
          name: node.name || 'anonymous',
          kind: node.type === 'method_definition' ? 'method' : 'function',
          location: loc,
          parameters: [],
          isAsync: node.modifiers?.includes('async') || false,
          isStatic: node.modifiers?.includes('static') || false,
          rawSignature: node.text,
        };
        functions.push(fnInfo);
        symbols.push(fnInfo);
      } else if (node.type === 'class_declaration') {
        const classInfo: ClassInfo = {
          id: `cls_${node.name || 'anonymous'}_${node.startLine}_${node.startColumn}`,
          name: node.name || 'anonymous',
          kind: 'class',
          location: loc,
          superClass: node.superClass,
          interfaces: [],
          methods: [],
          fields: [],
          isAbstract: node.modifiers?.includes('abstract') || false,
        };
        classes.push(classInfo);
        symbols.push(classInfo);
      } else if (node.type === 'import_statement') {
        const impInfo: ImportInfo = {
          sourcePath: node.sourcePath || '',
          importedSymbols: node.importedSymbols || [],
          isDefault: false,
          location: loc,
        };
        imports.push(impInfo);
      } else if (node.type === 'export_statement') {
        const expInfo: ExportInfo = {
          exportedSymbolName: node.exportedName || node.name || 'default',
          isDefault: node.modifiers?.includes('default') || false,
          location: loc,
        };
        exports.push(expInfo);
      } else if (node.type === 'namespace_declaration' || node.type === 'module_declaration') {
        const nsInfo: NamespaceInfo = {
          id: `ns_${node.name || 'global'}_${node.startLine}_${node.startColumn}`,
          name: node.name || 'global',
          kind: 'namespace',
          location: loc,
          nestedSymbols: [],
        };
        namespaces.push(nsInfo);
        symbols.push(nsInfo);
      } else if (node.type === 'call_expression') {
        references.push({
          symbolId: `ref_${node.name}_${node.startLine}`,
          targetSymbolId: node.name || '',
          location: loc,
          kind: 'call',
        });
      }

      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(rootNode);

    return {
      languageId,
      sourcePath: filePath,
      symbols,
      references,
      imports,
      exports,
      functions,
      classes,
      interfaces: [],
      enums: [],
      namespaces,
      parseDurationMs: durationMs,
    };
  }
}
