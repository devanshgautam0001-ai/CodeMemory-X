import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StoryView } from '../SymbolStory/StoryView.js';
import { MOCK_SYMBOL_STORY } from '../SymbolStory/mockSymbolStory.js';

describe('SymbolStory Inspector UI Component Suite', () => {
  it('should render static markup for StoryView with mock symbol data', () => {
    const html = renderToStaticMarkup(<StoryView story={MOCK_SYMBOL_STORY} />);

    expect(html).toContain('Symbol Story Inspector');
    expect(html).toContain('MemoryEngine');
    expect(html).toContain('Birth Story');
    expect(html).toContain('Evolution Timeline');
    expect(html).toContain('Authors &amp; Contributors');
    expect(html).toContain('Hexagonal Event-Store Isolation');
    expect(html).toContain('Dependency Graph Preview');
    expect(html).toContain('Cognitive Symbol Metrics');
    expect(html).toContain('AI Impact &amp; Evolutionary Prediction');
  });
});
