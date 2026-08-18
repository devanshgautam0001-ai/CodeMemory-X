import { describe, it, expect } from 'vitest';
import { FocusClassifier } from '../classification/FocusClassifier.js';

describe('FocusClassifier', () => {
  const classifier = new FocusClassifier();

  it('determines primary focus files and symbols with explainable ranking', () => {
    const files = [
      { filePath: 'src/A.ts', firstSeen: '', lastSeen: '', editCount: 1, changeCount: 1, isActive: true, relatedSymbols: [], importance: 0.5, confidence: 1 },
      { filePath: 'src/B.ts', firstSeen: '', lastSeen: '', editCount: 10, changeCount: 5, isActive: true, relatedSymbols: [], importance: 0.9, confidence: 1 },
    ];
    const symbols = [
      { symbolId: 's1', name: 'AuthService', filePath: 'src/B.ts', touchCount: 8, changeCount: 4, relationshipCount: 2, impactScore: 0.9, confidence: 1, isPrimaryFocus: false },
    ];

    const focus = classifier.classifyFocus(files, symbols);
    expect(focus.topFiles[0]).toBe('src/B.ts');
    expect(focus.topSymbols[0]).toBe('AuthService');
  });
});
