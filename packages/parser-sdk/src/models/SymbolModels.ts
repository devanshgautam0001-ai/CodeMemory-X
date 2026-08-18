import { LanguageId } from '../types/LanguageId.js';

export type SymbolKind =
  | 'function'
  | 'method'
  | 'class'
  | 'interface'
  | 'enum'
  | 'namespace'
  | 'variable'
  | 'constant'
  | 'import'
  | 'export';

export interface LocationInfo {
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

export interface SymbolInfo {
  id: string;
  name: string;
  kind: SymbolKind;
  location: LocationInfo;
  docstring?: string;
  rawSignature?: string;
}

export interface ReferenceInfo {
  symbolId: string;
  targetSymbolId: string;
  location: LocationInfo;
  kind: 'call' | 'inheritance' | 'type_usage' | 'import_usage';
}

export interface ImportInfo {
  sourcePath: string;
  importedSymbols: string[];
  isDefault: boolean;
  location: LocationInfo;
}

export interface ExportInfo {
  exportedSymbolName: string;
  isDefault: boolean;
  location: LocationInfo;
}

export interface FunctionInfo extends SymbolInfo {
  kind: 'function' | 'method';
  parameters: Array<{ name: string; type?: string }>;
  returnType?: string;
  isAsync: boolean;
  isStatic: boolean;
  visibility?: 'public' | 'protected' | 'private';
}

export interface ClassInfo extends SymbolInfo {
  kind: 'class';
  superClass?: string;
  interfaces: string[];
  methods: FunctionInfo[];
  fields: Array<{ name: string; type?: string; visibility?: string }>;
  isAbstract: boolean;
}

export interface InterfaceInfo extends SymbolInfo {
  kind: 'interface';
  extendsInterfaces: string[];
  methods: Array<{ name: string; rawSignature?: string }>;
  properties: Array<{ name: string; type?: string }>;
}

export interface EnumInfo extends SymbolInfo {
  kind: 'enum';
  members: Array<{ name: string; value?: string | number }>;
}

export interface NamespaceInfo extends SymbolInfo {
  kind: 'namespace';
  nestedSymbols: SymbolInfo[];
}

export interface ParseResult {
  languageId: LanguageId;
  sourcePath: string;
  symbols: SymbolInfo[];
  references: ReferenceInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  enums: EnumInfo[];
  namespaces: NamespaceInfo[];
  parseDurationMs: number;
}
