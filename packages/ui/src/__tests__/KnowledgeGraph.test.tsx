import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KnowledgeGraphView } from '../KnowledgeGraph/KnowledgeGraphView.js';
import { MOCK_KNOWLEDGE_GRAPH } from '../KnowledgeGraph/mockKnowledgeGraph.js';

describe('KnowledgeGraph Hero Explorer Component Suite', () => {
  it('should render static markup for KnowledgeGraphView with mock graph dataset', () => {
    const html = renderToStaticMarkup(<KnowledgeGraphView dataset={MOCK_KNOWLEDGE_GRAPH} />);

    expect(html).toContain('Knowledge Graph Explorer');
    expect(html).toContain('EventStore');
    expect(html).toContain('DatabaseProvider');
    expect(html).toContain('MemoryEngine');
    expect(html).toContain('Total Nodes');
    expect(html).toContain('Total Edges');
    expect(html).toContain('Node Legend');
  });
});
