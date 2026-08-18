import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Sidebar } from '../Sidebar.js';

const meta: Meta<typeof Sidebar> = {
  title: 'Design System/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-4 space-y-2 text-xs font-mono text-text-secondary">
        <div className="font-bold text-text-primary">CodeMemory X Sidebar</div>
        <div>Memory Explorer Navigation</div>
      </div>
    ),
  },
};
