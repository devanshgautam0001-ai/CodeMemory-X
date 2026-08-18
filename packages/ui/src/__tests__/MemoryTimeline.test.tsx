import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TimelineView } from '../MemoryTimeline/TimelineView.js';
import { MOCK_TIMELINE_DATA } from '../MemoryTimeline/mockTimeline.js';

describe('MemoryTimeline Cognitive Evolution Suite', () => {
  it('should render static markup for TimelineView with mock session data', () => {
    const html = renderToStaticMarkup(<TimelineView data={MOCK_TIMELINE_DATA} />);

    expect(html).toContain('Cognitive Timeline');
    expect(html).toContain('CodeMemory X');
    expect(html).toContain('Session 18: Engine &amp; Store Architecture');
    expect(html).toContain('Adopt WASM SQLite EventStore');
    expect(html).toContain('Cognitive Activity Heatmap');
    expect(html).toContain('Memories Created');
  });
});
