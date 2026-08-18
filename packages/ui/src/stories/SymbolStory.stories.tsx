import type { Meta, StoryObj } from '@storybook/react';
import { StoryView } from '../SymbolStory/StoryView.js';
import { MOCK_SYMBOL_STORY } from '../SymbolStory/mockSymbolStory.js';

const meta: Meta<typeof StoryView> = {
  title: 'SymbolStory/StoryView',
  component: StoryView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StoryView>;

export const Default: Story = {
  args: {
    story: MOCK_SYMBOL_STORY,
  },
  render: (args) => (
    <div className="w-[450px] h-[750px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      <StoryView {...args} />
    </div>
  ),
};

export const DarkTheme: Story = {
  args: {
    story: MOCK_SYMBOL_STORY,
  },
  render: (args) => (
    <div className="dark w-[450px] h-[750px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950">
      <StoryView {...args} />
    </div>
  ),
};
