/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--vscode-editor-background)',
        'sidebar-bg': 'var(--vscode-sideBar-background)',
        'card-bg': 'var(--vscode-editorWidget-background, var(--vscode-editor-background))',
        'input-bg': 'var(--vscode-input-background)',
        border: 'var(--vscode-widget-border, var(--vscode-panel-border))',
        hover: 'var(--vscode-list-hoverBackground)',
        accent: 'var(--vscode-focusBorder, #6366f1)',
        'text-primary': 'var(--vscode-foreground)',
        'text-secondary': 'var(--vscode-descriptionForeground)',
        'button-primary': 'var(--vscode-button-background)',
        'button-primary-hover': 'var(--vscode-button-hoverBackground)',
        'button-primary-text': 'var(--vscode-button-foreground)',
        'button-secondary': 'var(--vscode-button-secondaryBackground)',
        'button-secondary-hover': 'var(--vscode-button-secondaryHoverBackground)',
        'button-secondary-text': 'var(--vscode-button-secondaryForeground)',
        danger: 'var(--vscode-errorForeground, #ef4444)',
      },
    },
  },
  plugins: [],
};
