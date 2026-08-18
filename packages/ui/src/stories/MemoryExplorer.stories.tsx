import type { Meta, StoryObj } from '@storybook/react';
import { MemoryExplorer } from '../MemoryExplorer/MemoryExplorer.js';
import { MOCK_MEMORIES } from '../MemoryExplorer/mockMemories.js';

const meta: Meta<typeof MemoryExplorer> = {
  title: 'MemoryExplorer/MemoryExplorer',
  component: MemoryExplorer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MemoryExplorer>;

export const Default: Story = {
  args: {
    initialMemories: MOCK_MEMORIES,
  },
  render: (args) => (
    <div className="w-[380px] h-[600px] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <MemoryExplorer {...args} />
    </div>
  ),
};

export const DarkTheme: Story = {
  args: {
    initialMemories: MOCK_MEMORIES,
  },
  render: (args) => (
    <div className="dark w-[380px] h-[650px] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-zinc-950">
      <MemoryExplorer {...args} />
    </div>
  ),
};
