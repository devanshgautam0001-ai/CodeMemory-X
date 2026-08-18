import { SessionFile } from '../types/SessionFile.js';
import { SessionSymbol } from '../types/SessionSymbol.js';

export class FocusClassifier {
  public classifyFocus(
    files: SessionFile[],
    symbols: SessionSymbol[]
  ): { topFiles: string[]; topSymbols: string[] } {
    const sortedFiles = [...files].sort(
      (a, b) => b.editCount * 0.5 + b.importance * 0.5 - (a.editCount * 0.5 + a.importance * 0.5)
    );

    const sortedSymbols = [...symbols].sort(
      (a, b) => b.touchCount * 0.5 + b.impactScore * 0.5 - (a.touchCount * 0.5 + a.impactScore * 0.5)
    );

    const topFiles = sortedFiles.slice(0, 3).map((f) => f.filePath);
    const topSymbols = sortedSymbols.slice(0, 3).map((s) => s.name);

    return { topFiles, topSymbols };
  }
}
