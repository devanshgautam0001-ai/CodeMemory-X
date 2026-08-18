import { SymbolStory } from '../types/SymbolStory.js';

export class StoryRepository {
  private storiesBySymbolId: Map<string, SymbolStory> = new Map();
  private storiesByFilePath: Map<string, SymbolStory[]> = new Map();
  private storiesByName: Map<string, SymbolStory[]> = new Map();

  public save(story: SymbolStory): void {
    // Snapshot freeze (shallow immutability)
    const immutableSnapshot: SymbolStory = Object.freeze({ ...story });

    this.storiesBySymbolId.set(story.symbolId, immutableSnapshot);
    if (this.storiesBySymbolId.size > 1000) {
      const oldestSymbolId = this.storiesBySymbolId.keys().next().value;
      if (oldestSymbolId) {
        this.invalidate(oldestSymbolId);
      }
    }

    const pathList = this.storiesByFilePath.get(story.filePath) ?? [];
    if (!pathList.some((s) => s.symbolId === story.symbolId)) {
      pathList.push(immutableSnapshot);
      this.storiesByFilePath.set(story.filePath, pathList);
    }

    const nameList = this.storiesByName.get(story.name) ?? [];
    if (!nameList.some((s) => s.symbolId === story.symbolId)) {
      nameList.push(immutableSnapshot);
      this.storiesByName.set(story.name, nameList);
    }
  }

  public getBySymbolId(symbolId: string): SymbolStory | undefined {
    return this.storiesBySymbolId.get(symbolId);
  }

  public getByFilePath(filePath: string): SymbolStory[] {
    return this.storiesByFilePath.get(filePath) ?? [];
  }

  public getByName(name: string): SymbolStory[] {
    return this.storiesByName.get(name) ?? [];
  }

  public invalidate(symbolId: string): void {
    const story = this.storiesBySymbolId.get(symbolId);
    if (!story) return;

    this.storiesBySymbolId.delete(symbolId);

    const pathList = this.storiesByFilePath.get(story.filePath);
    if (pathList) {
      this.storiesByFilePath.set(
        story.filePath,
        pathList.filter((s) => s.symbolId !== symbolId)
      );
    }

    const nameList = this.storiesByName.get(story.name);
    if (nameList) {
      this.storiesByName.set(
        story.name,
        nameList.filter((s) => s.symbolId !== symbolId)
      );
    }
  }

  public invalidateByFilePath(filePath: string): void {
    const stories = this.getByFilePath(filePath);
    for (const story of stories) {
      this.invalidate(story.symbolId);
    }
  }

  public clear(): void {
    this.storiesBySymbolId.clear();
    this.storiesByFilePath.clear();
    this.storiesByName.clear();
  }
}
