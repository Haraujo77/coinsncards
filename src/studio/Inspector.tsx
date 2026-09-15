import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/cn';
import { formatParam, getPath, PARAM_GROUPS, type ParamDef } from './params';

type Props = {
  state: any;
  tick: number;
  defaults: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onResetGroup: (id: string) => void;
};

function isChanged(key: string, value: any, defaults: Record<string, any>) {
  if (!(key in defaults)) return false;
  const d = defaults[key];
  if (typeof value === 'number' && typeof d === 'number') return Math.abs(value - d) > 1e-6;
  return value !== d;
}

function clamp(def: ParamDef, n: number) {
  const min = def.min ?? -Infinity;
  const max = def.max ?? Infinity;
  const step = def.step ?? 0.01;
  const snapped = Math.round(n / step) * step;
  const decimals = step >= 1 ? 0 : Math.min(8, (String(step).split('.')[1] ?? '').length);
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(decimals));
}

function editString(def: ParamDef, v: number) {
  if (Number.isInteger(def.step) && (def.step ?? 1) >= 1) return String(Math.round(v));
  const step = def.step ?? 0.01;
  const decimals = Math.min(8, (String(step).split('.')[1] ?? '00').length);
  return Number(v.toFixed(decimals)).toString();
}

function ValueField({
  def,
  value,
  changed,
  onChange,
}: {
  def: ParamDef;
  value: number;
  changed: boolean;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const drag = useRef<{ x: number; v: number; moved: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const step = def.step ?? 0.01;

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  function commit(raw: string) {
    const n = parseFloat(raw.replace(/[^\d.eE+-]/g, ''));
    if (!Number.isFinite(n)) {
      setEditing(false);
      return;
    }
    onChange(clamp(def, n));
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        aria-label={`Edit ${def.label}`}
        className="tabular w-14 shrink-0 bg-transparent text-right text-[11px] text-foreground outline-none"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setEditing(false);
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const dir = e.key === 'ArrowUp' ? 1 : -1;
            const mul = e.shiftKey ? 10 : 1;
            const parsed = parseFloat(draft);
            const base = Number.isFinite(parsed) ? parsed : value;
            const next = clamp(def, base + dir * step * mul);
            setDraft(editString(def, next));
            onChange(next);
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      role="textbox"
      aria-label={def.label}
      className={cn(
        'tabular w-14 shrink-0 cursor-text text-right text-[11px]',
        changed ? 'text-foreground' : 'text-inactive',
      )}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, v: value, moved: false };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 3) drag.current.moved = true;
        if (!drag.current.moved) return;
        const fine = e.shiftKey ? 0.1 : 1;
        onChange(clamp(def, drag.current.v + dx * step * fine));
      }}
      onPointerUp={() => {
        if (drag.current && !drag.current.moved) {
          setDraft(editString(def, value));
          setEditing(true);
        }
        drag.current = null;
      }}
    >
      {formatParam(def, value)}
    </span>
  );
}

function HexField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit(raw: string) {
    const hex = raw.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) onChange(hex);
    else setDraft(value);
  }

  return (
    <>
      <input
        aria-label={`${label} hex`}
        className="tabular ml-auto h-5 w-[72px] bg-transparent text-right text-[11px] text-foreground outline-none"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <input
        type="color"
        className="h-5 w-8 cursor-pointer rounded-sm border-0 bg-transparent p-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
}

function Row({
  def,
  state,
  defaults,
  onChange,
}: {
  def: ParamDef;
  state: any;
  defaults: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) {
  if (def.show && !def.show(state)) return null;
  const value = def.key === 'preset' ? state.preset : getPath(state, def.key);
  const kind = def.kind ?? 'number';
  const changed = isChanged(def.key, value, defaults);

  const label = (
    <span className={cn('w-[92px] shrink-0 truncate text-[11.5px]', changed ? 'text-foreground' : 'text-muted-foreground')}>
      {def.label}
    </span>
  );

  const labeled = def.hint ? (
    <Tooltip>
      <TooltipTrigger asChild>
        {label}
      </TooltipTrigger>
      <TooltipContent>{def.hint}</TooltipContent>
    </Tooltip>
  ) : (
    label
  );

  return (
    <div className="group flex h-7 items-center gap-2 px-2">
      {labeled}
      {kind === 'number' && (
        <>
          <Slider
            min={def.min}
            max={def.max}
            step={def.step}
            value={[Number(value ?? 0)]}
            onValueChange={([v]) => onChange(def.key, v)}
            className="min-w-0 flex-1"
          />
          <ValueField
            def={def}
            value={Number(value ?? 0)}
            changed={changed}
            onChange={(v) => onChange(def.key, v)}
          />
        </>
      )}
      {kind === 'boolean' && (
        <button
          type="button"
          onClick={() => onChange(def.key, !value)}
          className={cn(
            'ml-auto h-5 rounded-md px-2 text-[11px]',
            value ? 'bg-surface-active text-foreground' : 'text-inactive hover:bg-hover',
          )}
        >
          {value ? 'On' : 'Off'}
        </button>
      )}
      {kind === 'color' && (
        <HexField
          label={def.label}
          value={typeof value === 'string' ? value : '#000000'}
          onChange={(hex) => onChange(def.key, hex)}
        />
      )}
      {kind === 'select' && def.options && def.options.length <= 4 && (
        <ToggleGroup
          type="single"
          value={String(value ?? '')}
          onValueChange={(v) => v && onChange(def.key, v)}
          className="ml-auto"
        >
          {def.options.map((o) => (
            <ToggleGroupItem key={o.value} value={o.value}>
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {kind === 'select' && def.options && def.options.length > 4 && (
        <select
          className="ml-auto h-6 max-w-[148px] rounded-md bg-well px-1.5 text-[11px] text-foreground"
          value={String(value ?? '')}
          onChange={(e) => onChange(def.key, e.target.value)}
        >
          {def.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function Inspector({ state, tick, defaults, onChange, onResetGroup }: Props) {
  void tick;
  return (
    <aside
      className="relative z-10 flex h-full shrink-0 flex-col overflow-hidden rounded-xl"
      style={{ width: 284, flex: '0 0 284px', background: 'var(--panel)', boxShadow: 'var(--shadow-panel)' }}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="py-1">
          {PARAM_GROUPS.map((group) => {
            const visible = group.params.filter((p) => !p.show || p.show(state));
            if (visible.length === 0) return null;
            return (
              <details key={group.id} open={group.defaultOpen} className="group/g border-b border-border last:border-b-0">
                <summary className="flex h-8 cursor-pointer list-none items-center px-2 text-[11px] text-inactive marker:content-none">
                  <span className="flex-1">{group.label}</span>
                  <button
                    type="button"
                    className="opacity-0 transition-opacity group-hover/g:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      onResetGroup(group.id);
                    }}
                    aria-label={`Reset ${group.label}`}
                  >
                    <RotateCcw className="size-[14px]" strokeWidth={1.5} />
                  </button>
                </summary>
                <div className="pb-1">
                  {visible.map((p) => (
                    <Row key={p.key} def={p} state={state} defaults={defaults} onChange={onChange} />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
