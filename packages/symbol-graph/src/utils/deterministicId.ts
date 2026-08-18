import { createHash } from 'node:crypto';
import { LocationInfo } from '@codememory/parser-sdk';

export interface DeterministicIdInput {
  language: string;
  filePath: string;
  symbolType: string;
  symbolName: string;
  location?: LocationInfo;
}

export function generateDeterministicSymbolId(input: DeterministicIdInput): string {
  const line = input.location ? input.location.startLine : 0;
  const col = input.location ? input.location.startColumn : 0;
  const rawKey = `${input.language}:${input.filePath.toLowerCase()}:${input.symbolType}:${input.symbolName}:${line}:${col}`;

  const hash = createHash('sha256').update(rawKey).digest('hex').substring(0, 16);
  return `sym_${hash}`;
}
