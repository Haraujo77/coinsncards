import type { ReactNode } from 'react';
import { Bookmark, BookmarkCheck, Copy, Download, FolderOpen, Moon, PanelRight, PanelRightClose, Save, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { listPresetNames } from '@/app/presets.js';
import type { Theme } from './useTheme';

type Props = {
  preset: string;
  theme: Theme;
  inspectorOpen: boolean;
  hasOverride: boolean;
  onPreset: (name: string) => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  onCopy: () => void;
  onTheme: () => void;
  onInspector: () => void;
  onSaveDefault: (opts?: { restore?: boolean }) => void | Promise<void>;
};

export function Toolbar({
  preset,
  theme,
  inspectorOpen,
  hasOverride,
  onPreset,
  onExport,
  onSave,
  onLoad,
  onCopy,
  onTheme,
  onInspector,
  onSaveDefault,
}: Props) {
  const presets = listPresetNames();
  return (
    <header className="flex h-9 shrink-0 items-center gap-2">
      <div
        className="flex h-9 items-center gap-3 rounded-xl px-3"
        style={{ background: 'var(--panel)', boxShadow: 'var(--shadow-cluster)' }}
      >
        <span className="text-[13px] font-medium text-foreground">3D Composer</span>
      </div>
      <div
        className="flex h-9 items-center rounded-xl px-1.5"
        style={{ background: 'var(--panel)', boxShadow: 'var(--shadow-cluster)' }}
      >
        <select
          className="h-7 max-w-[220px] bg-transparent px-1.5 text-[12px] text-foreground"
          value={preset}
          onChange={(e) => onPreset(e.target.value)}
        >
          {presets.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div
        className="ml-auto flex h-9 items-center gap-0.5 rounded-xl px-1"
        style={{ background: 'var(--panel)', boxShadow: 'var(--shadow-cluster)' }}
      >
        <Tip label={inspectorOpen ? 'Hide inspector' : 'Show inspector'}>
          <Button variant="icon" size="icon" onClick={onInspector} aria-pressed={inspectorOpen}>
            {inspectorOpen ? (
              <PanelRightClose className="size-[14px]" strokeWidth={1.5} />
            ) : (
              <PanelRight className="size-[14px]" strokeWidth={1.5} />
            )}
          </Button>
        </Tip>
        <Tip label={hasOverride ? 'Saved as this preset default on every machine. Alt-click restores the original.' : 'Save as the default for this preset on every machine'}>
          <Button
            variant="icon"
            size="icon"
            onClick={(e) => onSaveDefault({ restore: e.altKey })}
            aria-pressed={hasOverride}
          >
            {hasOverride ? (
              <BookmarkCheck className="size-[14px]" strokeWidth={1.5} />
            ) : (
              <Bookmark className="size-[14px]" strokeWidth={1.5} />
            )}
          </Button>
        </Tip>
        <Tip label="Export PNG">
          <Button variant="icon" size="icon" onClick={onExport}>
            <Download className="size-[14px]" strokeWidth={1.5} />
          </Button>
        </Tip>
        <Tip label="Save JSON">
          <Button variant="icon" size="icon" onClick={onSave}>
            <Save className="size-[14px]" strokeWidth={1.5} />
          </Button>
        </Tip>
        <Tip label="Load JSON">
          <Button variant="icon" size="icon" onClick={onLoad}>
            <FolderOpen className="size-[14px]" strokeWidth={1.5} />
          </Button>
        </Tip>
        <Tip label="Copy values as JSON">
          <Button variant="icon" size="icon" onClick={onCopy}>
            <Copy className="size-[14px]" strokeWidth={1.5} />
          </Button>
        </Tip>
        <Tip label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
          <Button variant="icon" size="icon" onClick={onTheme}>
            {theme === 'dark' ? (
              <Sun className="size-[14px]" strokeWidth={1.5} />
            ) : (
              <Moon className="size-[14px]" strokeWidth={1.5} />
            )}
          </Button>
        </Tip>
      </div>
    </header>
  );
}

function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
