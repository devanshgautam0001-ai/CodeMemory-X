import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryExplorer } from '../MemoryExplorer/MemoryExplorer.js';
import { MOCK_MEMORIES } from '../MemoryExplorer/mockMemories.js';

describe('MemoryExplorer Component Render Suite', () => {
  it('should render static markup for MemoryExplorer with mock memories', () => {
    const html = renderToStaticMarkup(<MemoryExplorer initialMemories={MOCK_MEMORIES} />);

    expect(html).toContain('CodeMemory X');
    expect(html).toContain('Memory Explorer');
    expect(html).toContain('Adopt WASM SQLite EventStore');
    expect(html).toContain('DatabaseProvider.ts');
  });

  it('should include filter type tags in rendered markup', () => {
    const html = renderToStaticMarkup(<MemoryExplorer initialMemories={MOCK_MEMORIES} />);

    expect(html).toContain('Search memories');
    expect(html).toContain('Memories');
  });
});
