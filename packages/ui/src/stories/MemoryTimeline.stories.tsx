import type { Meta, StoryObj } from '@storybook/react';
import { TimelineView } from '../MemoryTimeline/TimelineView.js';
import { MOCK_TIMELINE_DATA } from '../MemoryTimeline/mockTimeline.js';

const meta: Meta<typeof TimelineView> = {
  title: 'MemoryTimeline/TimelineView',
  component: TimelineView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TimelineView>;

export const Default: Story = {
  args: {
    data: MOCK_TIMELINE_DATA,
  },
  render: (args) => (
    <div className="w-[500px] h-[750px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      <TimelineView {...args} />
    </div>
  ),
};

export const DarkTheme: Story = {
  args: {
    data: MOCK_TIMELINE_DATA,
  },
  render: (args) => (
    <div className="dark w-[500px] h-[750px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950">
      <TimelineView {...args} />
    </div>
  ),
};
