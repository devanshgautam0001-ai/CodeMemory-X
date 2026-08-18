import { ImpactMap } from '../types/ImpactMap.js';

export class ImpactRepository {
  private maps: Map<string, ImpactMap> = new Map();

  public save(impactMap: ImpactMap): void {
    this.maps.set(impactMap.rootId, impactMap);
    if (this.maps.size > 500) {
      const oldestKey = this.maps.keys().next().value;
      if (oldestKey) this.maps.delete(oldestKey);
    }
  }

  public getByRootId(rootId: string): ImpactMap | undefined {
    return this.maps.get(rootId);
  }

  public getAll(): ImpactMap[] {
    return Array.from(this.maps.values());
  }

  public clear(): void {
    this.maps.clear();
  }
}
