import { useEffect, useRef, useState } from 'react';
import { boot } from '@/app/boot.js';
import { hydrateShippedDefaults } from '@/app/presetDefaults.js';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Inspector } from './Inspector';
import { PARAM_GROUPS, getPath, setPath } from './params';
import { Timeline } from './Timeline';
import { Toolbar } from './Toolbar';
import { useTheme } from './useTheme';

const ORBIT_DURATION = 4;

export function Studio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<any>(null);
  const live = useRef({ playing: false, t: 0, rate: 1, t0: 0, az0: 0 });
  const [tick, setTick] = useState(0);
  const [theme, setTheme] = useTheme();
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [defaults, setDefaults] = useState<Record<string, any>>({});
  const [state, setState] = useState<any>(null);
  const [inspectorOpen, setInspectorOpen] = useState(() => {
    try {
      return localStorage.getItem('studio-inspector') !== '0';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: any;
    let cancelled = false;
    (async () => {
      await hydrateShippedDefaults();
      if (cancelled) return;
      engine = boot({
        canvas,
        toastEl: toastRef.current,
        onUiSync: () => setTick((n) => n + 1),
      });
      engineRef.current = engine;
      setState(engine.state);
      setDefaults(snapshotParams(engine.state));
      setTick((n) => n + 1);
    })();
    return () => {
      cancelled = true;
      engine?.dispose?.();
    };
  }, []);

  useEffect(() => {
    live.current.playing = playing;
  }, [playing]);

  useEffect(() => {
    try {
      localStorage.setItem('studio-inspector', inspectorOpen ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [inspectorOpen]);

  useEffect(() => {
    let id = 0;
    let lastReadout = 0;
    const loop = (now: number) => {
      const L = live.current;
      if (L.playing) {
        if (!L.t0) L.t0 = now;
        const t = ((now - L.t0) / 1000) * L.rate;
        const wrapped = t % ORBIT_DURATION;
        L.t = wrapped;
        const engine = engineRef.current;
        if (engine?.state?.camera) {
          engine.setCameraAzimuth(((L.az0 + (wrapped / ORBIT_DURATION) * 360 + 540) % 360) - 180);
        }
        if (now - lastReadout > 66) {
          lastReadout = now;
          setTime(wrapped);
        }
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Enter') {
        live.current.t0 = 0;
        live.current.t = 0;
        live.current.az0 = engineRef.current?.state?.camera?.azimuthDeg ?? 0;
        engineRef.current?.setOrbitLock(true);
        setPlaying(true);
      } else if (e.key === 's' || e.key === 'S') {
        live.current.rate = live.current.rate === 1 ? 0.25 : 1;
      } else if (e.key === 't' || e.key === 'T') {
        setTheme((th) => (th === 'dark' ? 'light' : 'dark'));
      } else if (e.key === 'i' || e.key === 'I') {
        setInspectorOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setTheme]);

  const bump = () => setTick((n) => n + 1);

  function handleChange(key: string, value: any) {
    const engine = engineRef.current;
    if (!engine) return;
    if (key === 'preset') {
      engine.applyPreset(value);
      setDefaults(snapshotParams(engine.state));
      bump();
      return;
    }
    setPath(engine.state, key, value);
    if (key.startsWith('camera.')) engine.applyInspectorCamera();
    else engine.setDirty();
    bump();
  }

  function handleResetGroup(id: string) {
    const engine = engineRef.current;
    if (!engine) return;
    const group = PARAM_GROUPS.find((g) => g.id === id);
    if (!group) return;
    for (const p of group.params) {
      if (p.key === 'preset') continue;
      if (p.key in defaults) setPath(engine.state, p.key, defaults[p.key]);
    }
    if (id === 'camera') engine.applyInspectorCamera();
    else engine.setDirty();
    bump();
  }

  function copyJson() {
    const engine = engineRef.current;
    if (!engine) return;
    navigator.clipboard.writeText(JSON.stringify(engine.state, null, 2));
    engineRef.current = engine;
  }

  function setPlayingGate(next: boolean) {
        if (next) {
          live.current.t0 = 0;
          live.current.az0 = engineRef.current?.state?.camera?.azimuthDeg ?? 0;
          engineRef.current?.setOrbitLock(true);
        } else {
          engineRef.current?.setOrbitLock(false);
        }
        setPlaying(next);
  }

  return (
    <TooltipProvider>
      <div className="no-select flex h-full flex-col gap-3 p-3">
        <Toolbar
          preset={state?.preset ?? ''}
          theme={theme}
          inspectorOpen={inspectorOpen}
          hasOverride={!!engineRef.current?.hasOverride?.()}
          onPreset={(name) => handleChange('preset', name)}
          onExport={() => engineRef.current?.exportPng()}
          onSave={() => engineRef.current?.savePreset()}
          onLoad={() => engineRef.current?.loadPreset()}
          onCopy={copyJson}
          onTheme={() => setTheme((th) => (th === 'dark' ? 'light' : 'dark'))}
          onInspector={() => setInspectorOpen((open) => !open)}
          onSaveDefault={async ({ restore } = {}) => {
            const engine = engineRef.current;
            if (!engine) return;
            if (restore) await engine.restoreFactory();
            else await engine.saveAsDefault();
            setDefaults(snapshotParams(engine.state));
            bump();
          }}
        />
        <div className="flex min-h-0 flex-1 gap-3">
          <main className="relative min-w-0 flex-1">
            <div
              className="absolute inset-0 overflow-hidden rounded-xl"
              style={{ boxShadow: 'var(--shadow-artboard)', outline: '1px solid var(--artboard-ring)' }}
            >
              <canvas ref={canvasRef} className="block h-full w-full touch-none" />
            </div>
            <div
              ref={toastRef}
              className="pointer-events-none absolute bottom-3 left-3 rounded-lg px-2.5 py-1.5 text-[12px] text-foreground panel"
              style={{ display: 'none' }}
            />
          </main>
          {state && inspectorOpen && (
            <Inspector
              state={state}
              tick={tick}
              defaults={defaults}
              onChange={handleChange}
              onResetGroup={handleResetGroup}
            />
          )}
        </div>
        <Timeline
          open={timelineOpen}
          onOpen={setTimelineOpen}
          playing={playing}
          onPlaying={setPlayingGate}
          t={time}
          duration={ORBIT_DURATION}
        />
      </div>
    </TooltipProvider>
  );
}

function snapshotParams(state: any) {
  const out: Record<string, any> = { preset: state.preset };
  for (const g of PARAM_GROUPS) {
    for (const p of g.params) {
      out[p.key] = p.key === 'preset' ? state.preset : getPath(state, p.key);
    }
  }
  return out;
}
