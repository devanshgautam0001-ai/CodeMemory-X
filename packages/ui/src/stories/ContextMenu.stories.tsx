import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ContextMenu } from '../ContextMenu.js';

const meta: Meta<typeof ContextMenu> = {
  title: 'Design System/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Open: Story = {
  args: {
    isOpen: true,
    x: 100,
    y: 100,
    onClose: () => {},
    items: [
      { id: '1', label: 'Reconstruct Story Lineage', action: () => {} },
      { id: '2', label: 'Bind Architectural Decision', action: () => {} },
      { id: '3', label: 'Purge Symbol Memory', action: () => {}, danger: true },
    ],
  },
};
