import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Skeleton } from '../Skeleton.js';

const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Line: Story = {
  args: {
    width: '100%',
    height: '1rem',
  },
};

export const CardSkeleton: Story = {
  args: {
    width: '100%',
    height: '6rem',
  },
};
