export class CoChangeIndex {
  private pairCounts: Map<string, number> = new Map();
  private fileTotalEdits: Map<string, number> = new Map();

  public indexCommit(changedFiles: string[]): void {
    const uniqueFiles = Array.from(new Set(changedFiles));

    uniqueFiles.forEach((file) => {
      this.fileTotalEdits.set(file, (this.fileTotalEdits.get(file) ?? 0) + 1);
    });

    if (this.fileTotalEdits.size > 2000) {
      const oldestKey = this.fileTotalEdits.keys().next().value;
      if (oldestKey) this.fileTotalEdits.delete(oldestKey);
    }

    for (let i = 0; i < uniqueFiles.length; i++) {
      for (let j = i + 1; j < uniqueFiles.length; j++) {
        const key = this.makePairKey(uniqueFiles[i], uniqueFiles[j]);
        this.pairCounts.set(key, (this.pairCounts.get(key) ?? 0) + 1);
      }
    }

    if (this.pairCounts.size > 5000) {
      const oldestKey = this.pairCounts.keys().next().value;
      if (oldestKey) this.pairCounts.delete(oldestKey);
    }
  }

  public getCoChangeStrength(fileA: string, fileB: string): number {
    if (fileA === fileB) return 1.0;
    const key = this.makePairKey(fileA, fileB);
    const occurrences = this.pairCounts.get(key) ?? 0;
    if (occurrences === 0) return 0.0;

    const totalA = this.fileTotalEdits.get(fileA) ?? occurrences;
    const totalB = this.fileTotalEdits.get(fileB) ?? occurrences;
    const totalRelevantChanges = Math.max(1, Math.min(totalA, totalB));

    const ratio = occurrences / totalRelevantChanges;
    return Number(Math.max(0.0, Math.min(1.0, ratio)).toFixed(4));
  }

  public getCoChangedFiles(file: string, minStrength = 0.2): { file: string; strength: number }[] {
    const results: { file: string; strength: number }[] = [];

    for (const otherFile of this.fileTotalEdits.keys()) {
      if (otherFile !== file) {
        const str = this.getCoChangeStrength(file, otherFile);
        if (str >= minStrength) {
          results.push({ file: otherFile, strength: str });
        }
      }
    }

    results.sort((a, b) => b.strength - a.strength);
    return results;
  }

  public clear(): void {
    this.pairCounts.clear();
    this.fileTotalEdits.clear();
  }

  private makePairKey(fileA: string, fileB: string): string {
    return fileA < fileB ? `${fileA}:::${fileB}` : `${fileB}:::${fileA}`;
  }
}
