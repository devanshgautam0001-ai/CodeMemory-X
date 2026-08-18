import { describe, it, expect } from 'vitest';
import React from 'react';
import { Button } from '../Button.js';
import { Badge } from '../Badge.js';
import { Card } from '../Card.js';
import { Progress } from '../Progress.js';
import { Skeleton } from '../Skeleton.js';
import { Tooltip } from '../Tooltip.js';

describe('UI Component Library', () => {
  it('should instantiate Button component without crashing', () => {
    const btn = <Button variant="primary">Memory HUD</Button>;
    expect(btn.props.variant).toBe('primary');
  });

  it('should instantiate Badge component with variant props', () => {
    const badge = <Badge variant="accent">V1 Active</Badge>;
    expect(badge.props.variant).toBe('accent');
  });

  it('should instantiate Card component with title and children', () => {
    const card = <Card title="Temporal Graph">Graph Content</Card>;
    expect(card.props.title).toBe('Temporal Graph');
  });

  it('should instantiate Progress component with percentage value', () => {
    const prog = <Progress value={98} label="Memory Health" />;
    expect(prog.props.value).toBe(98);
  });

  it('should instantiate Skeleton component', () => {
    const sk = <Skeleton height="2rem" />;
    expect(sk.props.height).toBe('2rem');
  });

  it('should instantiate Tooltip component', () => {
    const tt = <Tooltip content="Hover info"><span>Target</span></Tooltip>;
    expect(tt.props.content).toBe('Hover info');
  });
});
