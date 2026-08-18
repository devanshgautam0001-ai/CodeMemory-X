import { IntentObject, SupportedIntentType } from '../types/IntentTypes.js';

export class CommentIntentExtractor {
  public extractFromCode(code: string, filePath: string): IntentObject[] {
    const intents: IntentObject[] = [];
    const lines = code.split('\n');

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const lineNum = idx + 1;

      // Rule 1: FIXME / BUG / DEPRECATED -> Bug Fix or Technical Debt
      if (/\/\/\s*(FIXME|BUG|BROKEN):/i.test(trimmed) || /\/\*\s*(FIXME|BUG):/i.test(trimmed)) {
        const text = trimmed.replace(/.*(FIXME|BUG|BROKEN):\s*/i, '');
        intents.push({
          id: `intent_comment_${Date.now()}_${lineNum}`,
          type: 'Bug Fix',
          confidence: 0.95,
          reason: `Code comment tag on L${lineNum}: "${text || trimmed}"`,
          affectedFiles: [filePath],
          affectedSymbols: [],
          timestamp: new Date().toISOString(),
        });
      }

      // Rule 2: TODO -> Feature or Refactor
      if (/\/\/\s*TODO:/i.test(trimmed) || /\/\*\s*TODO:/i.test(trimmed)) {
        const text = trimmed.replace(/.*TODO:\s*/i, '');
        const isRefactorKeyword = /refactor|clean|structure|rename/i.test(text);
        intents.push({
          id: `intent_comment_${Date.now()}_${lineNum}`,
          type: isRefactorKeyword ? 'Refactor' : 'Feature',
          confidence: 0.90,
          reason: `TODO comment on L${lineNum}: "${text || trimmed}"`,
          affectedFiles: [filePath],
          affectedSymbols: [],
          timestamp: new Date().toISOString(),
        });
      }

      // Rule 3: HACK / TEMP / WORKAROUND -> Temporary Workaround / Technical Debt
      if (/\/\/\s*(HACK|TEMP|WORKAROUND|KLUDGE):/i.test(trimmed) || /\/\*\s*(HACK|TEMP|WORKAROUND):/i.test(trimmed)) {
        const text = trimmed.replace(/.*(HACK|TEMP|WORKAROUND|KLUDGE):\s*/i, '');
        intents.push({
          id: `intent_comment_${Date.now()}_${lineNum}`,
          type: 'Temporary Workaround',
          confidence: 0.98,
          reason: `Workaround comment tag on L${lineNum}: "${text || trimmed}"`,
          affectedFiles: [filePath],
          affectedSymbols: [],
          timestamp: new Date().toISOString(),
        });
      }

      // Rule 4: OPTIMIZE / PERF / SPEED -> Optimization
      if (/\/\/\s*(OPTIMIZE|PERF|FAST|SPEED):/i.test(trimmed) || /\/\*\s*(OPTIMIZE|PERF):/i.test(trimmed)) {
        const text = trimmed.replace(/.*(OPTIMIZE|PERF|FAST|SPEED):\s*/i, '');
        intents.push({
          id: `intent_comment_${Date.now()}_${lineNum}`,
          type: 'Optimization',
          confidence: 0.92,
          reason: `Performance comment tag on L${lineNum}: "${text || trimmed}"`,
          affectedFiles: [filePath],
          affectedSymbols: [],
          timestamp: new Date().toISOString(),
        });
      }

      // Rule 5: REFACTOR / CLEAN -> Refactor / Cleanup
      if (/\/\/\s*(REFACTOR|CLEANUP|CLEAN):/i.test(trimmed) || /\/\*\s*(REFACTOR|CLEANUP):/i.test(trimmed)) {
        const text = trimmed.replace(/.*(REFACTOR|CLEANUP|CLEAN):\s*/i, '');
        intents.push({
          id: `intent_comment_${Date.now()}_${lineNum}`,
          type: trimmed.toUpperCase().includes('CLEAN') ? 'Cleanup' : 'Refactor',
          confidence: 0.90,
          reason: `Refactor comment tag on L${lineNum}: "${text || trimmed}"`,
          affectedFiles: [filePath],
          affectedSymbols: [],
          timestamp: new Date().toISOString(),
        });
      }

      // Rule 6: ARCH / ARCHITECTURE -> Architecture
      if (/\/\/\s*(ARCH|ARCHITECTURE|DESIGN):/i.test(trimmed) || /\/\*\s*(ARCH|ARCHITECTURE):/i.test(trimmed)) {
        const text = trimmed.replace(/.*(ARCH|ARCHITECTURE|DESIGN):\s*/i, '');
        intents.push({
          id: `intent_comment_${Date.now()}_${lineNum}`,
          type: 'Architecture',
          confidence: 0.92,
          reason: `Architecture comment tag on L${lineNum}: "${text || trimmed}"`,
          affectedFiles: [filePath],
          affectedSymbols: [],
          timestamp: new Date().toISOString(),
        });
      }

      // Rule 7: DOCS / DOCUMENTATION -> Documentation
      if (/\/\/\s*(DOCS|DOCUMENTATION|NOTE):/i.test(trimmed) || /\/\*\s*(DOCS|NOTE):/i.test(trimmed)) {
        const text = trimmed.replace(/.*(DOCS|DOCUMENTATION|NOTE):\s*/i, '');
        intents.push({
          id: `intent_comment_${Date.now()}_${lineNum}`,
          type: 'Documentation',
          confidence: 0.88,
          reason: `Documentation comment on L${lineNum}: "${text || trimmed}"`,
          affectedFiles: [filePath],
          affectedSymbols: [],
          timestamp: new Date().toISOString(),
        });
      }
    });

    return intents;
  }
}
