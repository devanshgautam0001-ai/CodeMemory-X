import { DecisionObject } from '../types/DecisionTypes.js';

export class AdrDecisionExtractor {
  public extractFromAdrFile(markdownContent: string, filePath: string): DecisionObject | null {
    const isAdrFile =
      filePath.toLowerCase().includes('adr') ||
      markdownContent.includes('# ADR') ||
      markdownContent.includes('Architecture Decision') ||
      markdownContent.includes('Context and Problem Statement');

    if (!isAdrFile) return null;

    const lines = markdownContent.split('\n');
    let title = 'Architecture Decision Record';
    let status: 'proposed' | 'accepted' | 'deprecated' | 'superseded' = 'accepted';
    let contextText = '';
    let decisionText = '';

    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Extract Title from first H1 header
      if (trimmed.startsWith('# ') && title === 'Architecture Decision Record') {
        title = trimmed.replace(/^#\s+/, '').replace(/^ADR\s*\d*:\s*/i, '');
      }

      // Extract Status
      if (/Status:\s*Accepted/i.test(trimmed)) status = 'accepted';
      else if (/Status:\s*Proposed/i.test(trimmed)) status = 'proposed';
      else if (/Status:\s*Deprecated/i.test(trimmed)) status = 'deprecated';
      else if (/Status:\s*Superseded/i.test(trimmed)) status = 'superseded';

      // Section Headings
      if (/^##?\s*Context/i.test(trimmed)) {
        currentSection = 'context';
        continue;
      } else if (/^##?\s*Decision/i.test(trimmed)) {
        currentSection = 'decision';
        continue;
      } else if (/^##?\s*/.test(trimmed)) {
        currentSection = 'other';
        continue;
      }

      if (currentSection === 'context' && trimmed) {
        contextText += (contextText ? ' ' : '') + trimmed;
      } else if (currentSection === 'decision' && trimmed) {
        decisionText += (decisionText ? ' ' : '') + trimmed;
      }
    }

    return {
      id: `dec_adr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      description: decisionText.substring(0, 300) || title,
      reason: contextText.substring(0, 300) || 'Architectural decision documented in ADR markdown',
      confidence: 1.0,
      timestamp: new Date().toISOString(),
      relatedSymbols: [],
      relatedFiles: [filePath],
      relatedIntents: [],
      relatedSessions: [],
      status,
      metadata: { source: 'adr-markdown' },
    };
  }
}
