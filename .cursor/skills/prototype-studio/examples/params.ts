/**
 * Single source of truth for every tunable in the prototype.
 *
 * The inspector UI, the keyboard shortcuts, the reset action and the
 * copy-as-JSON export are all generated from this table — so adding a knob
 * means adding one row here and nothing else.
 */

export type ParamDef = {
  key: string
  label: string
  min: number
  max: number
  step: number
  value: number
  /** formats the numeric readout shown beside the slider */
  fmt?: (v: number) => string
  /** one-line explanation surfaced on hover */
  hint?: string
}

export type ParamGroup = {
  id: string
  label: string
  /** collapsed by default keeps the inspector scannable */
  defaultOpen?: boolean
  params: ParamDef[]
}

const px = (v: number) => `${Math.round(v)}px`
const ms = (v: number) => `${Math.round(v)}ms`
const x2 = (v: number) => v.toFixed(2)
const x1 = (v: number) => v.toFixed(1)

export const PARAM_GROUPS: ParamGroup[] = [
  {
    id: 'scroll',
    label: 'Scroll & collapse',
    defaultOpen: true,
    params: [
      { key: 'hmin', label: 'Collapsed', min: 120, max: 400, step: 4, value: 200, fmt: px,
        hint: 'Header height once fully collapsed. Figma’s own collapsed header is 211px.' },
      { key: 'plx', label: 'Parallax rate', min: 0, max: 1.6, step: 0.02, value: 1, fmt: x2,
        hint: 'At 1.00 the ring centre lands exactly mid-bar. The headline rides the same lift.' },
      { key: 'grow', label: 'Ring growth', min: 0, max: 1.2, step: 0.02, value: 0.4, fmt: x2,
        hint: 'Rings expand as the header collapses.' },
      { key: 'lg', label: 'Length growth', min: 0, max: 18, step: 0.5, value: 6,
        fmt: (v) => `+${v.toFixed(1)}`,
        hint: 'Marks lengthen on scroll. The void clamp spends it growing outward.' },
      { key: 'svel', label: 'Scroll → surge', min: 0, max: 3, step: 0.05, value: 1.2, fmt: x2,
        hint: 'Flick velocity feeds a decaying pool that surges wave amplitude.' },
      { key: 'sph', label: 'Scroll → phase', min: 0, max: 0.02, step: 0.0005, value: 0.006,
        fmt: (v) => v.toFixed(4),
        hint: 'Scroll position advances the wave phase, so scrubbing drives the ripple.' },
      { key: 'scrim', label: 'Top scrim', min: 0, max: 1, step: 0.02, value: 0.9, fmt: x2,
        hint: 'Gradient behind the status bar and close button once content scrolls under.' },
      { key: 'hfade', label: 'Copy fade floor', min: 0.2, max: 1, step: 0.02, value: 0.4, fmt: x2,
        hint: 'Headline softens on scroll but never disappears — bottoms out here.' },
      { key: 'cdim', label: 'Copy dim start', min: 0.3, max: 1, step: 0.02, value: 0.66, fmt: x2,
        hint: 'Resting brightness before the returning light lifts the copy.' },
    ],
  },
  {
    id: 'geometry',
    label: 'Geometry',
    defaultOpen: true,
    params: [
      { key: 'sq', label: 'Squash', min: 0.35, max: 1, step: 0.001, value: 0.638,
        fmt: (v) => v.toFixed(3),
        hint: 'Measured off Figma’s Texture_Dots ellipses (0.638).' },
      { key: 'pk', label: 'Perspective', min: 0, max: 0.42, step: 0.005, value: 0.17, fmt: x2,
        hint: 'Near rings render larger — a true perspective divide, not a squash.' },
      { key: 'vd', label: 'Centre void', min: 0, max: 190, step: 1, value: 102, fmt: px,
        hint: 'Inner radius kept clear for the headline. Mark inner ends clamp to it.' },
      { key: 'rn', label: 'Ring count', min: 4, max: 36, step: 1, value: 22,
        fmt: (v) => String(Math.round(v)),
        hint: 'Needs ≥18 to reach the screen corners at this spacing.' },
      { key: 'rs', label: 'Ring spacing', min: 18, max: 48, step: 0.5, value: 29.8, fmt: x1,
        hint: 'Figma’s rings sit 29.8px apart.' },
      { key: 'md', label: 'Mark spacing', min: 5, max: 26, step: 0.5, value: 11, fmt: px,
        hint: 'Arc length between marks. Constant density, so outer rings don’t thin out.' },
      { key: 'df', label: 'Depth falloff', min: 0, max: 0.6, step: 0.02, value: 0, fmt: x2,
        hint: 'Dims far rings. 0 keeps every ring exactly #30363A.' },
    ],
  },
  {
    id: 'wave',
    label: 'Wave',
    defaultOpen: true,
    params: [
      { key: 'amp', label: 'Intro swell', min: 0, max: 26, step: 0.5, value: 13, fmt: x1,
        hint: 'Transient amplitude as each ring arrives.' },
      { key: 'idl', label: 'Idle amp', min: 0, max: 1, step: 0.02, value: 0.3, fmt: x2,
        hint: 'Sustained amplitude — never reaches zero, so the field never stills.' },
      { key: 'isp', label: 'Idle speed', min: 0, max: 2.5, step: 0.05, value: 0.85, fmt: x2,
        hint: 'How fast the idle wave travels outward.' },
      { key: 'rl', label: 'Base length', min: 0.6, max: 12, step: 0.1, value: 4, fmt: x1,
        hint: 'Resting mark length — how thick each ring reads as a band.' },
      { key: 'sw', label: 'Stroke weight', min: 0.6, max: 3, step: 0.05, value: 1.3, fmt: x2,
        hint: 'Literal line thickness. Never scales, so it stays crisp at any zoom.' },
      { key: 'rd', label: 'Rhythm depth', min: 0, max: 0.5, step: 0.01, value: 0.17, fmt: x2,
        hint: 'Shared breathing that itself travels outward, tying the rings together.' },
    ],
  },
  {
    id: 'timing',
    label: 'Timing',
    defaultOpen: false,
    params: [
      { key: 'dur', label: 'Duration', min: 900, max: 2600, step: 50, value: 1450,
        fmt: (v) => `${(v / 1000).toFixed(2)}s` },
      { key: 'stg', label: 'Ring stagger', min: 4, max: 90, step: 1, value: 22, fmt: ms,
        hint: 'Delay between each ring lighting up — this is what makes the sweep travel.' },
      { key: 'rtn', label: 'Return sweep', min: 0, max: 1.5, step: 0.05, value: 0.8, fmt: x2,
        hint: 'Strength of the light sweeping back inward. 0 disables it.' },
      { key: 'rdel', label: 'Return delay', min: 0, max: 700, step: 10, value: 120, fmt: ms,
        hint: 'Pause between the outward and return sweeps.' },
      { key: 'rstg', label: 'Return stagger', min: 4, max: 60, step: 1, value: 14, fmt: ms },
      { key: 'z0', label: 'Zoom from', min: 1, max: 2, step: 0.01, value: 1.38,
        fmt: (v) => `${v.toFixed(2)}×` },
    ],
  },
]

export const FORMATIONS = ['Harmonic', 'Pulse', 'Chorus', 'Sparse'] as const
export const COPY_MODES = ['Off', 'Ramp', 'Flash', 'Linked'] as const

export type Params = Record<string, number>

export const DEFAULTS: Params = Object.fromEntries(
  PARAM_GROUPS.flatMap((g) => g.params.map((p) => [p.key, p.value]))
)

export const PARAM_INDEX: Record<string, ParamDef> = Object.fromEntries(
  PARAM_GROUPS.flatMap((g) => g.params.map((p) => [p.key, p]))
)

export function formatParam(key: string, v: number) {
  const d = PARAM_INDEX[key]
  return d?.fmt ? d.fmt(v) : String(v)
}
