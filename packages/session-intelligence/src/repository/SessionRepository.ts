import { DeveloperSession } from '../types/DeveloperSession.js';

export class SessionRepository {
  private sessions: Map<string, DeveloperSession> = new Map();
  private currentSessionId?: string;

  public save(session: DeveloperSession): void {
    this.sessions.set(session.sessionId, session);
    if (this.sessions.size > 200) {
      for (const [id] of this.sessions.entries()) {
        if (id !== this.currentSessionId) {
          this.sessions.delete(id);
          break;
        }
      }
    }
  }

  public getById(sessionId: string): DeveloperSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getCurrent(): DeveloperSession | undefined {
    if (!this.currentSessionId) return undefined;
    return this.sessions.get(this.currentSessionId);
  }

  public setCurrentId(sessionId: string | undefined): void {
    this.currentSessionId = sessionId;
  }

  public getAll(): DeveloperSession[] {
    return Array.from(this.sessions.values()).sort((a, b) =>
      b.startTime.localeCompare(a.startTime)
    );
  }

  public clear(): void {
    this.sessions.clear();
    this.currentSessionId = undefined;
  }
}
