import type { Preview } from '@storybook/react';
import '../../../apps/webview/src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f1117' },
        { name: 'light', value: '#ffffff' },
        { name: 'high-contrast', value: '#000000' },
      ],
    },
  },
};

export default preview;
