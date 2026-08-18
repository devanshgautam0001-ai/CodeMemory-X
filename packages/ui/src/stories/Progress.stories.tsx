import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Progress } from '../Progress.js';

const meta: Meta<typeof Progress> = {
  title: 'Design System/Progress',
  component: Progress,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 75,
    label: 'Index Sync Progress',
    variant: 'accent',
  },
};

export const Success: Story = {
  args: {
    value: 98,
    label: 'Memory Integrity',
    variant: 'success',
  },
};

export const Danger: Story = {
  args: {
    value: 20,
    label: 'Storage Quota Used',
    variant: 'danger',
  },
};
