import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Modal } from '../Modal.js';

const meta: Meta<typeof Modal> = {
  title: 'Design System/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Open: Story = {
  args: {
    isOpen: true,
    title: 'Record Architectural Decision (ADR)',
    onClose: () => {},
    children: (
      <div className="space-y-3 text-xs text-text-secondary">
        <p>Document the rationale behind this structural code mutation.</p>
        <textarea
          placeholder="e.g. Switched to JWT validation with rate limiting guard..."
          className="w-full bg-input-bg border border-border rounded p-2 text-text-primary text-xs focus:outline-none focus:border-accent"
        />
      </div>
    ),
  },
};
