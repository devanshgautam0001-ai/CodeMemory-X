import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Header } from '../Header.js';
import { Button } from '../Button.js';

const meta: Meta<typeof Header> = {
  title: 'Design System/Header',
  component: Header,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    title: 'Memory Dashboard',
    subtitle: 'Explore cognitive history, decisions, and symbol lineage',
    actions: <Button variant="primary" size="sm">Record Decision</Button>,
  },
};
