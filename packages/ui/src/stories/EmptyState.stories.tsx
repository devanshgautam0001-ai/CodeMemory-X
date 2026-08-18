import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { EmptyState } from '../EmptyState.js';
import { Button } from '../Button.js';
import { Clock } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Design System/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: <Clock size={24} />,
    title: 'No Memory Atoms Captured Yet',
    description: 'Edit code or run terminal commands to begin recording micro-edits into your local Write-Ahead Log.',
    action: <Button variant="primary" size="sm">Record Decision</Button>,
  },
};
