import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';

export class BaselineRepository {
  private activeBaseline: ArchitecturalBaseline | null = null;
  private history: ArchitecturalBaseline[] = [];

  public save(baseline: ArchitecturalBaseline): void {
    this.activeBaseline = baseline;
    this.history.push(baseline);
  }

  public getActive(): ArchitecturalBaseline | null {
    return this.activeBaseline;
  }

  public getHistory(): ArchitecturalBaseline[] {
    return [...this.history];
  }

  public clear(): void {
    this.activeBaseline = null;
    this.history = [];
  }
}
