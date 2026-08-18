import type { Meta, StoryObj } from '@storybook/react';
import { KnowledgeGraphView } from '../KnowledgeGraph/KnowledgeGraphView.js';
import { MOCK_KNOWLEDGE_GRAPH } from '../KnowledgeGraph/mockKnowledgeGraph.js';

const meta: Meta<typeof KnowledgeGraphView> = {
  title: 'KnowledgeGraph/KnowledgeGraphView',
  component: KnowledgeGraphView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof KnowledgeGraphView>;

export const Default: Story = {
  args: {
    dataset: MOCK_KNOWLEDGE_GRAPH,
  },
  render: (args) => (
    <div className="w-[850px] h-[750px] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      <KnowledgeGraphView {...args} />
    </div>
  ),
};

export const DarkTheme: Story = {
  args: {
    dataset: MOCK_KNOWLEDGE_GRAPH,
  },
  render: (args) => (
    <div className="dark w-[850px] h-[750px] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl bg-zinc-950">
      <KnowledgeGraphView {...args} />
    </div>
  ),
};
