import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Toast } from '../Toast.js';

const meta: Meta<typeof Toast> = {
  title: 'Design System/Toast',
  component: Toast,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Info: Story = {
  args: {
    message: 'Memory Atom persisted to Write-Ahead Log',
    type: 'info',
  },
};

export const Success: Story = {
  args: {
    message: 'ADR-003 successfully bound to AuthService.validateToken()',
    type: 'success',
  },
};

export const Warning: Story = {
  args: {
    message: 'Architectural boundary warning: UI module directly importing DB adapter',
    type: 'warning',
  },
};

export const ErrorState: Story = {
  args: {
    message: 'SQLite storage write failed (Disk Quota Exceeded)',
    type: 'error',
  },
};
