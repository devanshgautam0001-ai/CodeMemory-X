import { MemoryModel, FileMemory, SymbolMemory, SessionMemory } from '../types/MemoryTypes.js';

export class MemoryIndex {
  private byId: Map<string, MemoryModel> = new Map();
  private byType: Map<string, Set<string>> = new Map();
  private fileIndex: Map<string, string> = new Map(); // filePath -> memoryId
  private symbolIndex: Map<string, Set<string>> = new Map(); // symbolName -> memoryIds
  private sessionIndex: Map<string, string> = new Map(); // sessionId -> memoryId

  public index(memory: MemoryModel): void {
    this.byId.set(memory.id, memory);

    // Index by Type
    const typeSet = this.byType.get(memory.type) || new Set();
    typeSet.add(memory.id);
    this.byType.set(memory.type, typeSet);

    // Index by File
    if (memory.type === 'file') {
      const fileMem = memory as FileMemory;
      this.fileIndex.set(fileMem.filePath.toLowerCase(), fileMem.id);
    }

    // Index by Symbol
    if (memory.type === 'symbol') {
      const symMem = memory as SymbolMemory;
      const symSet = this.symbolIndex.get(symMem.symbolName.toLowerCase()) || new Set();
      symSet.add(symMem.id);
      this.symbolIndex.set(symMem.symbolName.toLowerCase(), symSet);
    }

    // Index by Session
    if (memory.type === 'session') {
      const sessMem = memory as SessionMemory;
      this.sessionIndex.set(sessMem.sessionId, sessMem.id);
    }
  }

  public get(id: string): MemoryModel | undefined {
    return this.byId.get(id);
  }

  public getByFile(filePath: string): FileMemory | undefined {
    const id = this.fileIndex.get(filePath.toLowerCase());
    return id ? (this.byId.get(id) as FileMemory) : undefined;
  }

  public getBySymbol(symbolName: string): SymbolMemory[] {
    const ids = this.symbolIndex.get(symbolName.toLowerCase());
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.byId.get(id) as SymbolMemory)
      .filter(Boolean);
  }

  public getBySession(sessionId: string): SessionMemory | undefined {
    const id = this.sessionIndex.get(sessionId);
    return id ? (this.byId.get(id) as SessionMemory) : undefined;
  }

  public search(query: string): MemoryModel[] {
    const q = query.toLowerCase();
    return Array.from(this.byId.values()).filter((mem) => {
      return (
        mem.summary.toLowerCase().includes(q) ||
        mem.id.toLowerCase().includes(q) ||
        (mem.type === 'file' && (mem as FileMemory).filePath.toLowerCase().includes(q)) ||
        (mem.type === 'symbol' && (mem as SymbolMemory).symbolName.toLowerCase().includes(q))
      );
    });
  }

  public getAll(): MemoryModel[] {
    return Array.from(this.byId.values());
  }

  public clear(): void {
    this.byId.clear();
    this.byType.clear();
    this.fileIndex.clear();
    this.symbolIndex.clear();
    this.sessionIndex.clear();
  }
}
