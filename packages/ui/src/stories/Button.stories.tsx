import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Button } from '../Button.js';
import { Sparkles } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    variant: 'primary',
    children: 'Record Decision',
  },
};

export const PrimaryWithIcon: Story = {
  args: {
    variant: 'primary',
    children: (
      <>
        <Sparkles size={14} className="mr-2 inline" />
        <span>Analyze Lineage</span>
      </>
    ),
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'View Symbol Story',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Dismiss',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Purge Local Memory',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Memory Engine Offline',
  },
};
