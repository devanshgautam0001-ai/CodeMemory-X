import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SearchBox } from '../SearchBox.js';

const meta: Meta<typeof SearchBox> = {
  title: 'Design System/SearchBox',
  component: SearchBox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchBox>;

export const Default: Story = {
  args: {
    placeholder: 'Search memory atoms, decisions, bugs...',
    value: '',
    onChange: () => {},
  },
};

export const WithQuery: Story = {
  args: {
    placeholder: 'Search memory atoms, decisions, bugs...',
    value: 'validateToken',
    onChange: () => {},
  },
};
