import {
  ILanguageParser,
  LanguageId,
  ParserCapabilities,
  ParseResult,
} from '@codememory/parser-sdk';
import { Result, ok, fail } from '@codememory/shared';
import { ASTNodeMapper, ASTSyntaxNode } from '../mapper/ASTNodeMapper.js';
import { ILogger } from '@codememory/logging';

export class TreeSitterParser implements ILanguageParser {
  public readonly capabilities: ParserCapabilities;
  private mapper: ASTNodeMapper;

  constructor(
    public readonly languageId: LanguageId,
    capabilities?: Partial<ParserCapabilities>,
    private readonly logger?: ILogger
  ) {
    this.capabilities = {
      supportsClasses: true,
      supportsInterfaces: languageId === 'typescript',
      supportsEnums: languageId === 'typescript',
      supportsNamespaces: true,
      supportsImports: true,
      supportsExports: true,
      supportsDecorators: languageId === 'typescript' || languageId === 'python',
      supportsGenerics: languageId === 'typescript' || languageId === 'java' || languageId === 'cpp',
      supportsAnnotations: languageId === 'java',
      supportsMacros: languageId === 'rust',
      ...capabilities,
    };
    this.mapper = new ASTNodeMapper();
  }

  public async parse(sourceCode: string, filePath: string): Promise<Result<ParseResult>> {
    const startTime = Date.now();
    try {
      this.logger?.info(`[TreeSitterParser] Parsing ${filePath} (${this.languageId})`);

      // Extract AST syntax nodes from source code using regex / pattern rules
      const mockRoot = this.buildASTTree(sourceCode);
      const durationMs = Math.max(1, Date.now() - startTime);

      const parseResult = this.mapper.mapToParseResult(
        this.languageId,
        filePath,
        mockRoot,
        durationMs
      );

      return ok(parseResult);
    } catch (error) {
      this.logger?.error(`Failed to parse source file: ${filePath}`, error as Error);
      return fail(error as Error);
    }
  }

  private buildASTTree(sourceCode: string): ASTSyntaxNode {
    const lines = sourceCode.split('\n');
    const children: ASTSyntaxNode[] = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // Detect imports
      if (trimmed.startsWith('import ')) {
        const match = trimmed.match(/import\s+(?:\{([^}]+)\}|\* as (\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/);
        children.push({
          type: 'import_statement',
          startLine: lineNum,
          endLine: lineNum,
          startColumn: 1,
          endColumn: line.length,
          sourcePath: match ? match[4] : '',
          importedSymbols: match ? (match[1] || match[2] || match[3] || '').split(',').map((s) => s.trim()) : [],
        });
      }

      // Detect exports
      if (trimmed.startsWith('export ')) {
        const match = trimmed.match(/export\s+(?:default\s+)?(?:class|function|const|var|let|interface|enum)\s+(\w+)/);
        children.push({
          type: 'export_statement',
          startLine: lineNum,
          endLine: lineNum,
          startColumn: 1,
          endColumn: line.length,
          exportedName: match ? match[1] : 'default',
          modifiers: trimmed.includes('default') ? ['default'] : [],
        });
      }

      // Detect class declarations
      if (trimmed.includes('class ')) {
        const match = trimmed.match(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/);
        if (match) {
          children.push({
            type: 'class_declaration',
            name: match[1],
            startLine: lineNum,
            endLine: lineNum + 5,
            startColumn: 1,
            endColumn: line.length,
            superClass: match[2],
            modifiers: trimmed.includes('abstract') ? ['abstract'] : [],
          });
        }
      }

      // Detect function declarations / methods
      if (trimmed.includes('function ') || (trimmed.includes('(') && trimmed.includes(')') && (trimmed.includes('public') || trimmed.includes('private') || trimmed.includes('async')))) {
        const match = trimmed.match(/(?:async\s+)?(?:function\s+)?(\w+)\s*\(/);
        if (match && match[1] !== 'if' && match[1] !== 'for' && match[1] !== 'while' && match[1] !== 'switch') {
          children.push({
            type: trimmed.includes('function ') ? 'function_declaration' : 'method_definition',
            name: match[1],
            startLine: lineNum,
            endLine: lineNum + 3,
            startColumn: 1,
            endColumn: line.length,
            modifiers: [
              ...(trimmed.includes('async') ? ['async'] : []),
              ...(trimmed.includes('static') ? ['static'] : []),
            ],
            text: trimmed,
          });
        }
      }

      // Detect namespace / module declarations
      if (trimmed.startsWith('namespace ') || trimmed.startsWith('module ')) {
        const match = trimmed.match(/(?:namespace|module)\s+(\w+)/);
        if (match) {
          children.push({
            type: 'namespace_declaration',
            name: match[1],
            startLine: lineNum,
            endLine: lineNum + 10,
            startColumn: 1,
            endColumn: line.length,
          });
        }
      }

      // Detect function call expressions
      if (trimmed.includes('(') && !trimmed.startsWith('function') && !trimmed.startsWith('class')) {
        const match = trimmed.match(/(\w+)\s*\(/);
        if (match && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
          children.push({
            type: 'call_expression',
            name: match[1],
            startLine: lineNum,
            endLine: lineNum,
            startColumn: 1,
            endColumn: line.length,
          });
        }
      }
    });

    return {
      type: 'program',
      startLine: 1,
      endLine: lines.length,
      startColumn: 1,
      endColumn: lines[lines.length - 1]?.length || 1,
      children,
    };
  }
}
