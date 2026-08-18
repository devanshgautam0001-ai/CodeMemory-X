import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Tooltip } from '../Tooltip.js';
import { Button } from '../Button.js';

const meta: Meta<typeof Tooltip> = {
  title: 'Design System/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: 'Reconstruct symbol evolutionary lineage',
    position: 'top',
    children: <Button variant="secondary" size="sm">Symbol Story</Button>,
  },
};
