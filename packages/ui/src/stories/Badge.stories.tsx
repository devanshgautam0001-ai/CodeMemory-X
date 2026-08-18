import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Badge } from '../Badge.js';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'v0.1.0-alpha',
  },
};

export const Accent: Story = {
  args: {
    variant: 'accent',
    children: 'AST Lineage',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Passed',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: '1 Boundary Note',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'High Regression',
  },
};
