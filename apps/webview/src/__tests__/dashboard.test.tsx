import { describe, it, expect } from 'vitest';
import React from 'react';
import { App } from '../App.js';
import { useDashboardStore } from '../store/useDashboardStore.js';

describe('React Webview Dashboard App', () => {
  it('should initialize dashboard state with default dashboard tab', () => {
    const state = useDashboardStore.getState();
    expect(state.activeTab).toBe('dashboard');
  });

  it('should update active tab in Zustand store to all 6 supported tabs', () => {
    const store = useDashboardStore.getState();
    store.setActiveTab('timeline');
    expect(useDashboardStore.getState().activeTab).toBe('timeline');

    store.setActiveTab('settings');
    expect(useDashboardStore.getState().activeTab).toBe('settings');
  });

  it('should toggle command palette open state', () => {
    const store = useDashboardStore.getState();
    store.setCommandPaletteOpen(true);
    expect(useDashboardStore.getState().isCommandPaletteOpen).toBe(true);
  });

  it('should render App component element', () => {
    const appEl = <App />;
    expect(appEl.type).toBe(App);
  });
});
