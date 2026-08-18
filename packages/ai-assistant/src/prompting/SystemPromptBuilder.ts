import { AssistantContext } from '../types/AssistantContext.js';

export class SystemPromptBuilder {
  constructor(private readonly customPrefix?: string) {}

  public buildSystemPrompt(context: AssistantContext): string {
    const lines: string[] = [];
    const scores = context.evidenceScores ?? {};

    lines.push(
      this.customPrefix ??
        'You are CodeMemory X AI Assistant, an expert deterministic AI coding assistant.'
    );
    lines.push('You have full access to workspace intelligence and developer memory context.');
    lines.push('Answer the developer accurately and concisely based on empirical context.\n');

    if (context.sessionSummary) {
      lines.push('### Active Developer Session Context');
      lines.push(`Session ID: ${context.sessionSummary.sessionId ?? 'active'}`);
      lines.push(`Activity State: ${context.sessionSummary.state ?? 'ACTIVE'}`);
      if (context.sessionSummary.activeFiles?.length) {
        const fileNames = context.sessionSummary.activeFiles.map((f: any) =>
          typeof f === 'string' ? f : (f.filePath ?? String(f))
        );
        lines.push(`Active Files: ${fileNames.join(', ')}`);
      }
      lines.push('');
    }

    if (context.symbolStory) {
      lines.push('### Active Symbol Evolution Story');
      lines.push(`Symbol Name: ${context.symbolStory.symbolName ?? 'unknown'}`);
      lines.push(`Birth Commit: ${context.symbolStory.birth?.commitHash ?? 'observed'}`);
      if (context.symbolStory.milestones?.length) {
        lines.push(`Milestone Count: ${context.symbolStory.milestones.length}`);
      }
      lines.push('');
    }

    if (context.decisions && context.decisions.length > 0) {
      lines.push('### Architectural Decision Records (ADRs)');
      context.decisions.slice(0, 5).forEach((d: any, idx: number) => {
        const meta = scores[d.id];
        const prefix = meta ? `[${meta.priority} | Score ${meta.score}] ` : '';
        lines.push(`${idx + 1}. ${prefix}[${d.summary ?? d.title ?? 'Decision'}] ${d.rationale ?? ''}`);
      });
      lines.push('');
    }

    if (context.driftFindings && context.driftFindings.length > 0) {
      lines.push('### Architectural Drift Sentinel Warnings');
      context.driftFindings.slice(0, 5).forEach((f: any, idx: number) => {
        const meta = scores[f.id];
        const prefix = meta ? `[${meta.priority} | Score ${meta.score}] ` : '';
        lines.push(`${idx + 1}. ${prefix}[${f.severity ?? 'WARNING'}] ${f.description ?? f.type}`);
      });
      lines.push('');
    }

    if (context.changeImpact) {
      lines.push('### Structural Change Impact');
      lines.push(`Impact Score: ${context.changeImpact.impactScore ?? 0}`);
      lines.push('');
    }

    if (context.memories && context.memories.length > 0) {
      lines.push('### Relevant Developer Memories');
      context.memories.slice(0, 5).forEach((m: any, idx: number) => {
        const memObj = m.memory ?? m;
        const meta = scores[m.id] ?? scores[memObj.id];
        const prefix = meta ? `[${meta.priority} | Score ${meta.score}] ` : '';
        lines.push(`${idx + 1}. ${prefix}[${memObj.type ?? 'memory'}] ${memObj.summary ?? memObj.content ?? ''}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}
