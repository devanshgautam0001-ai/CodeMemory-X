import { IntentObject, SupportedIntentType } from '../types/IntentTypes.js';

export class EventIntentExtractor {
  public extractFromEvent(
    eventType: string,
    payload: Record<string, unknown>,
    editFrequency = 1
  ): IntentObject | null {
    const timestamp = new Date().toISOString();
    const filePath = (payload.filePath as string) ?? (payload.file as string) ?? '';
    const affectedFiles = filePath ? [filePath] : [];
    const symbol = (payload.symbolName as string) ?? '';
    const affectedSymbols = symbol ? [symbol] : [];

    // Rule 1: File Rename / Move -> Refactor / Architecture
    if (eventType === 'FILE_RENAMED' || eventType === 'FILE_MOVED') {
      const oldPath = (payload.oldFilePath as string) ?? '';
      return {
        id: `intent_evt_${Date.now()}_rename`,
        type: 'Refactor',
        confidence: 0.95,
        reason: `File renamed/moved from "${oldPath}" to "${filePath}"`,
        affectedFiles: oldPath ? [oldPath, filePath] : affectedFiles,
        affectedSymbols: [],
        timestamp,
      };
    }

    // Rule 2: Symbol Rename / Move -> Refactor
    if (eventType === 'SYMBOL_RENAMED' || eventType === 'SYMBOL_MOVED') {
      const oldSymbol = (payload.oldSymbolName as string) ?? '';
      return {
        id: `intent_evt_${Date.now()}_sym`,
        type: 'Refactor',
        confidence: 0.95,
        reason: `Symbol "${oldSymbol || symbol}" renamed/moved in ${filePath}`,
        affectedFiles,
        affectedSymbols: oldSymbol ? [oldSymbol, symbol] : affectedSymbols,
        timestamp,
      };
    }

    // Rule 3: Repeated Edits in short succession (>5 edits) -> Bug Fix / Refactor hotspot
    if (editFrequency >= 5) {
      return {
        id: `intent_evt_${Date.now()}_freq`,
        type: editFrequency >= 8 ? 'Bug Fix' : 'Refactor',
        confidence: 0.88,
        reason: `High edit frequency detected (${editFrequency} edits) on ${filePath}`,
        affectedFiles,
        affectedSymbols,
        timestamp,
      };
    }

    // Rule 4: Diagnostic error spikes -> Bug Fix
    if (eventType === 'DIAGNOSTIC_ERRORS_DETECTED') {
      const count = (payload.errorCount as number) ?? 1;
      return {
        id: `intent_evt_${Date.now()}_diag`,
        type: 'Bug Fix',
        confidence: 0.92,
        reason: `Compiler/Linter error spike detected (${count} errors) in ${filePath}`,
        affectedFiles,
        affectedSymbols,
        timestamp,
      };
    }

    return null;
  }
}
