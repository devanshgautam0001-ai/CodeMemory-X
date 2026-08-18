import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Loading } from '../Loading.js';

const meta: Meta<typeof Loading> = {
  title: 'Design System/Loading',
  component: Loading,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const Default: Story = {
  args: {
    label: 'Syncing Memory Engine...',
  },
};
