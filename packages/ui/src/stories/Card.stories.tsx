import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card } from '../Card.js';
import { Badge } from '../Badge.js';
import { Button } from '../Button.js';

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    title: 'Memory Index Topology',
    subtitle: 'SQLite transactional WAL status',
    children: '1,248 Memory Atoms indexed cleanly.',
  },
};

export const WithActionBadge: Story = {
  args: {
    title: 'Active Repository',
    subtitle: 'feature/auth-refactor',
    action: <Badge variant="accent">WAL Active</Badge>,
    children: 'Head commit a7f8b9d • 2m ago',
  },
};
