import { DriftFinding } from '../types/DriftFinding.js';
import { DriftType, DriftSeverity } from '../types/DriftTypes.js';

export class DriftRepository {
  private findingsMap: Map<string, DriftFinding> = new Map();

  public save(finding: DriftFinding): void {
    this.findingsMap.set(finding.id, finding);
    if (this.findingsMap.size > 500) {
      const oldestKey = this.findingsMap.keys().next().value;
      if (oldestKey) this.findingsMap.delete(oldestKey);
    }
  }

  public saveAll(findings: DriftFinding[]): void {
    findings.forEach((f) => this.save(f));
  }

  public getById(id: string): DriftFinding | undefined {
    return this.findingsMap.get(id);
  }

  public getAll(): DriftFinding[] {
    return Array.from(this.findingsMap.values());
  }

  public getBySeverity(severity: DriftSeverity): DriftFinding[] {
    return this.getAll().filter((f) => f.severity === severity);
  }

  public getByType(type: DriftType): DriftFinding[] {
    return this.getAll().filter((f) => f.type === type);
  }

  public getForFile(filePath: string): DriftFinding[] {
    return this.getAll().filter((f) => f.affectedFiles.includes(filePath));
  }

  public getForSymbol(symbolId: string): DriftFinding[] {
    return this.getAll().filter((f) => f.affectedSymbols.includes(symbolId));
  }

  public getForPackage(packageName: string): DriftFinding[] {
    return this.getAll().filter((f) => f.affectedPackages.includes(packageName));
  }

  public acknowledge(id: string): boolean {
    const finding = this.findingsMap.get(id);
    if (finding) {
      finding.acknowledged = true;
      return true;
    }
    return false;
  }

  public clear(): void {
    this.findingsMap.clear();
  }
}
