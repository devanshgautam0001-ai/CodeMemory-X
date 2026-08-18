import React from 'react';
import { Settings, Moon, Sun, Monitor, Database, Shield } from 'lucide-react';
import { Card, Badge, Button } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useDashboardStore();

  return (
    <div className="space-y-4 max-w-3xl">
      <Card title="Extension Settings & Preferences" subtitle="Customize CodeMemory X behavior">
        <div className="space-y-5 text-xs">
          {/* Theme Selection */}
          <div className="space-y-2">
            <label className="text-text-primary font-semibold block">VS Code Theme Adaptation</label>
            <div className="flex items-center space-x-2">
              <Button
                variant={theme === 'dark' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="space-x-1.5"
              >
                <Moon size={14} />
                <span>VS Code Dark</span>
              </Button>
              <Button
                variant={theme === 'light' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTheme('light')}
                className="space-x-1.5"
              >
                <Sun size={14} />
                <span>VS Code Light</span>
              </Button>
              <Button
                variant={theme === 'high-contrast' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTheme('high-contrast')}
                className="space-x-1.5"
              >
                <Monitor size={14} />
                <span>High Contrast</span>
              </Button>
            </div>
          </div>

          {/* Local Storage Quota */}
          <div className="border-t border-border/40 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary block">SQLite Disk Quota</span>
                <span className="text-text-secondary text-[11px]">Maximum WAL storage before LRU compaction.</span>
              </div>
              <Badge variant="accent">500 MB Max</Badge>
            </div>
          </div>

          {/* Privacy & PII */}
          <div className="border-t border-border/40 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary block">PII & Secret Redaction</span>
                <span className="text-text-secondary text-[11px]">Sanitize passwords and tokens from memory atoms.</span>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
