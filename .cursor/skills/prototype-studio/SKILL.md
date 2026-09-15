---
name: prototype-studio
description: Build the harness UI around an interactive prototype — the tool that houses the thing being designed. Use whenever creating a prototype, playground, motion study, parameter explorer, or "let me tune this" tool. Produces a Figma/Framer-style design tool with shadcn components, a live parameter inspector, a beat timeline, and dark + light themes. The chrome stays neutral; brand lives inside the artboard. Triggers on: prototype, playground, motion study, animation harness, tuning tool, design tool, parameter explorer, "let me test this", "make me a tool to".
---

# Prototype Studio

A prototype needs two things: **the artifact** (the screen, the animation, the
component) and **the harness** around it (the thing that lets you feel it and tune
it). This skill is the harness. Build it every time — a prototype with no controls
is a screenshot.

The harness is a **design tool**, not a web page.

---

## 1. The chrome is neutral. The artboard carries the brand.

**Do not brand the harness.** It is a generic tool, and a neutral shell is what lets
the thing being designed read truthfully. If the prototype is for a specific brand,
invoke that brand's skills and apply them **inside the device only**.

> **Trap:** give the artboard its own font tokens (`--font-brand`, `--font-display`)
> separate from the chrome's `--font-sans`. If the device's body text reads
> `var(--font-sans)` and you later point that at Inter for the chrome, the prototype
> silently loses its brand face and nothing errors.

---

## 2. Three control surfaces, not one

The single most common source of "the active state looks wrong". A panel has
**three** distinct control surfaces, and conflating any two makes a control vanish:

| Surface | Relationship to the panel | Used by |
|---|---|---|
| **well** | recessed *below* the panel | segmented-control background |
| **track** | a groove that must stay visible | slider rails |
| **raised** | clearly *above* the well | the active pill inside a well |
| **active** | above the *panel* | a toggled control sitting directly on a panel |

Two traps that will bite:

- **In a dark theme there is no luminance room below the panel.** A slider track at
  `#151515` on a `#1e1e1e` panel is 1.05:1 — invisible. Dark-theme grooves go
  *lighter* than the panel (`#333`), the way Figma's do. Only the segmented well goes
  darker.
- **In a light theme the active pill is white**, which is also the panel colour. A
  toggled icon button on a white panel therefore needs `--active` (a grey), not
  `--raised` (white). Same token, two jobs, one invisible control.

---

## 3. Theming: `@theme inline`

Raw values live as plain CSS vars in `:root` / `:root.light`; `@theme inline` maps
them to Tailwind utilities **by reference**. A plain `@theme` bakes the hex into
every utility and cannot be themed at runtime.

```css
:root       { --panel: #1e1e1e; --fg: #ffffff; /* … */ }
:root.light { --panel: #ffffff; --fg: #1a1a1a; /* … */ }

@theme inline {
  --color-surface: var(--panel);
  --color-foreground: var(--fg);
}
```

Shadows must be tokens too — **light-theme shadows have to be far softer or they
read as dirt.** Dark: `0 8px 32px rgba(0,0,0,.45)`. Light:
`0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08)`.

Theme lives as a class on `<html>`, defaults to the OS preference, persists to
`localStorage`. Do not hardcode `class="dark"` in `index.html` — let the hook own it,
or the first paint fights the stored choice.

**Two accents.** A bright one (`#0d99ff`) for fills, tracks, playheads and
indicators; a **darker** one (`#0a72c6`) for accent *surfaces that carry text*. White
on `#0d99ff` is only 2.99:1 and fails WCAG AA for a button label.

A working dark/light pair:

| Token | Dark | Light |
|---|---|---|
| field | `#131313` | `#eeeeee` |
| panel | `#1e1e1e` | `#ffffff` |
| well | `#141414` | `#dcdcdc` |
| track | `#333333` | `#d8d8d8` |
| raised (pill) | `#3d3d3d` | `#ffffff` |
| active (on panel) | `#333333` | `#e2e2e2` |
| fg / muted / faint | `#fff` / `#a1a1a1` / `#6e6e6e` | `#1a1a1a` / `#616161` / `#808080` |
| line / hover | 7% / 4.5% white | 8% / 4% black |
| accent / accent-strong | `#0d99ff` / `#0a72c6` | `#0b84e0` / `#0a6fc0` |

---

## 4. What separates a modern tool from Photoshop 2010

The dated version is: flat grey panels, a hard 1px border on every edge, uppercase
micro-caps with wide tracking, uniform always-on rows, zero radius, no depth.

- **Radius and shadow replace borders.** Panels get 12px radius and a soft shadow.
  Where a boundary is genuinely needed it is a 1px line at 6–8% white — never a solid
  grey rule, and never on all four edges.
- **Separate surfaces with a luminance step**, not a line. ~5% field to panel.
- **Panels float as islands** with a gutter. No edge-to-edge bordered docks. The
  canvas is allowed to be mostly nothing.
- **Sentence case, never micro-caps.** Single biggest fix.
- **Hierarchy via opacity tiers at one type size** (~100% / 63% / 43%), not by mixing
  weights and sizes.
- **One accent, only on state** — filled slider portion, playhead, selected segment.
  Nothing decorative is accented.
- **Toolbar as 2–3 detached pill clusters.** Secondary actions are bare low-opacity
  glyphs; only the primary action gets a filled container. One of those glyphs
  shows/hides the inspector — the artboard has to be able to go full-bleed.
- **Hover reveals.** Reset icons, slider thumbs and value-chip backgrounds appear on
  hover. A column of 20 always-on controls reads as noise; the same column with
  hidden thumbs reads as data.
- **Style the native scrollbar.** Browsers render it light on dark UI and it shows up
  as a bright slab against the canvas. Thin, translucent, inset with
  `border: 3px solid transparent; background-clip: content-box`.
- **Icons 14px at 1.5px stroke** (lucide), never larger in chrome.

### Give the gutter a single owner

If the toolbar centres its content in a tall bar *and* the inspector adds its own top
padding, the vertical gap ends up larger than the horizontal one and reads as a
mistake. Put the gutter on the shell and make every island flush:

```tsx
<div className="flex h-full flex-col gap-3 p-3">   {/* the only gutter */}
  <Toolbar />                                      {/* h-9, no padding */}
  <div className="flex min-h-0 flex-1 gap-3">
    <main className="flex-1" /> <Inspector />       {/* no own margins */}
  </div>
  <Timeline />
</div>
```

Verify it: `aside.top - header.bottom` must equal `aside.left - main.right`.

Type scale — smaller than product UI:

```
section heads   11px   / sentence case / no tracking / faint tier
labels          11.5px / muted tier
numeric values  11px   / tabular-nums
buttons         12px   / medium
title           13-16px / display face
```

Always `font-variant-numeric: tabular-nums` on live numbers, or the inspector jitters
while dragging.

---

## 5. Layout

```
┌──────────────────────────────────────────────┬────────────┐
│ toolbar — detached pill clusters, no border  │            │
├──────────────────────────────────────────────┤ inspector  │
│   workspace — just the field;                │  ~284px    │
│   the artboard is an island in it            │  scrollable│
├──────────────────────────────────────────────┴────────────┤
│ timeline — floating card, ruler + lanes + playhead        │
└───────────────────────────────────────────────────────────┘
```

- **Workspace** — no dock, no dot grid. A generous gutter, the artboard centred with
  a deep shadow and a 1px 5%-white ring. Zoom via `transform: scale()` on a wrapper
  whose own box is `size * zoom`, so layout reflows correctly.
- **Inspector** — a floating rounded card, **togglable**. A toolbar glyph (and `I`)
  shows/hides it so the artboard can go full-bleed. Persist the choice. Groups
  collapsible with a hover-revealed reset. Every row is a 28px lane: label · slider
  · value.
  - Values differing from the default render at full contrast; untouched ones faint.
    **That diff cue is the single most useful thing in the panel.**
  - Make the value a **typed field that also scrubs**. Click the number to type an
    exact value (Enter commits, Escape cancels, ↑/↓ nudges by step, Shift for 10×).
    Drag horizontally to scrub, Shift for fine. A slider-only inspector cannot hit
    precise numbers — typing is not optional.
  - Modes get segmented controls, not dropdowns.
- **Timeline** — floating card, labelled ruler (ticks 250ms, labels 500ms), rounded
  lane bars, playhead hairline with a handle. **Collapsible** — it is the first thing
  in the way when the artboard is tall. Derive every value from *the same functions
  that drive the render*, never a hand-maintained list, or it silently drifts.

---

## 6. Stack

Vite + React + TS + Tailwind v4 + shadcn. Tailwind v4 is CSS-first — no
`tailwind.config.js`.

```bash
npm i react react-dom
npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom \
         tailwindcss @tailwindcss/vite
npm i class-variance-authority clsx tailwind-merge lucide-react \
      @radix-ui/react-slider @radix-ui/react-tooltip @radix-ui/react-slot \
      @radix-ui/react-scroll-area @radix-ui/react-toggle-group
```

`npx shadcn init` is interactive and will hang. **Write the component files
directly** — they're just source. Map shadcn's semantic names onto the theme vars in
`@theme inline` so components inherit the scale for free.

**Prefer the real Radix component over hand-rolling.** A hand-rolled segmented
control loses keyboard navigation and `role="radio"` semantics for nothing. If you
hand-roll anyway you'll end up with dead component files and unused deps — audit for
them (§8) and either wire them up or delete them.

Fonts: copy `.woff` files to `public/fonts/` and `@font-face` them. Serving matters —
Chrome blocks `@font-face` over `file://` and silently falls back.

---

## 7. Patterns that carry their weight

### One parameter table drives everything

```ts
export const PARAM_GROUPS: ParamGroup[] = [
  { id: 'geometry', label: 'Geometry', defaultOpen: true, params: [
    { key: 'vd', label: 'Centre void', min: 0, max: 190, step: 1, value: 102,
      fmt: px, hint: 'Inner radius kept clear for the headline.' },
  ]},
]
```

Inspector rows, defaults, per-group reset, the changed-from-default cue and the JSON
export all generate from it. Adding a knob is one row and nothing else.

Give every param a `hint` — six months later nobody remembers what "Perspective"
meant; the tooltip is the documentation. Keep labels short enough not to truncate at
your label width, and check truncation explicitly.

### Keep the render pure, drive it with refs

Split into a pure `draw(ctx, params, state) → derived` plus a thin React shell. Pure
means you can call it from the console at any timestamp and measure the result, which
is how you verify motion.

**The one that will bite you:** never put live values in the rAF effect's dep array.

```tsx
// WRONG — every slider drag tears down the loop, re-inits the canvas,
// and re-runs scrollTop = 0, snapping the artifact back mid-drag
useEffect(() => { /* rAF loop */ }, [params, mode])

// RIGHT — mount once, read live values from a ref
const live = useRef({ params, mode })
live.current = { params, mode }
useEffect(() => { /* loop reads live.current */ }, [])
```

Keep the playhead (`{t, rate, offset, t0}`) in a ref too, so ticking never re-renders
React. Throttle any time readout to ~15fps before putting it in state.

### Mode switches should replay

When a control only shows its effect during the intro, reset the playhead on change.
Otherwise the user clicks an option and sees nothing.

---

## 8. QA — measure, don't look

Screenshots confirm layout. They do **not** confirm colour, contrast, timing or
geometry. After any restyle, run this in the console. It catches the whole class of
"the active state looks wrong" bugs before the user sees them.

```js
// Contrast audit across BOTH themes. Adjust pairs to your token names.
const root = document.documentElement
const V = n => getComputedStyle(root).getPropertyValue(n).trim()
const parse = c => { const d = document.createElement('div'); d.style.color = c
  document.body.appendChild(d)
  const m = getComputedStyle(d).color.match(/[\d.]+/g).map(Number); d.remove(); return m }
const lum = r => { const f = r.slice(0,3).map(v => { v /= 255
  return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4) })
  return 0.2126*f[0] + 0.7152*f[1] + 0.0722*f[2] }
const ratio = (a,b) =>
  +(((Math.max(lum(a),lum(b))+0.05)/(Math.min(lum(a),lum(b))+0.05))).toFixed(2)

const fails = []
for (const theme of ['dark','light']) {
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark',  theme === 'dark')
  const g = n => parse(V(n)), panel = g('--panel')
  ;[['well/panel',              g('--well'),      panel,            1.08],
    ['track/panel',             g('--track'),     panel,            1.15],
    ['ACTIVE PILL raised/well', g('--raised'),    g('--well'),      1.35],
    ['active/panel',            g('--active'),    panel,            1.15],
    ['button label (WCAG AA)',  g('--accent-fg'), g('--accent-strong'), 4.5],
    ['accent fill/panel',       g('--accent'),    panel,            3],
    ['fg-faint/panel',          g('--fg-faint'),  panel,            3],
    ['fg-muted/panel',          g('--fg-muted'),  panel,            4.5],
    ['fg/panel',                g('--fg'),        panel,            7],
  ].forEach(([n,a,b,min]) => { const r = ratio(a,b)
    if (r < min) fails.push(`${theme}: ${n} ${r} < ${min}`) })
}
fails.length ? fails : 'ALL PASS (both themes)'
```

Surface-to-surface minima are heuristics (WCAG doesn't govern them); the text ones
are real WCAG AA. Both are worth enforcing.

Also assert, in the browser:

- **Interaction** — does dragging a slider preserve the artifact's scroll position?
  Does the scrubber change the value? Does clicking the number let you type an
  exact value? Does `I` hide and restore the inspector? Does the timeline collapse?
- **Geometry invariants**, not appearance. "Is the copy locked to the pattern?" →
  sample the offset at four scroll positions and require it constant.
- **Motion** — sample the same pixel band at several timestamps; equal values mean
  nothing is moving.
- **Negative space** — if something must stay clear, count non-background pixels
  inside its bounding box and require 0.
- **Theme completeness** — flip the class and confirm every panel colour changed. Any
  hardcoded `bg-white` or `rgba(0,0,0,.4)` in the chrome is a theme leak.
- **A11y** — count `[role="radio"]` / `[role="group"]` to confirm you got the real
  Radix primitives rather than divs.

And in the shell:

```bash
# theme leaks — the theme file is the only legal home for a colour
grep -rnoE "#[0-9a-fA-F]{3,8}|rgba?\(" \
  src/App.tsx src/studio/{Toolbar,Inspector,Timeline}.tsx src/components/ui/

# dead modules: anything nobody imports
for f in $(find src -name "*.tsx" -o -name "*.ts"); do
  b=$(basename "$f" | sed 's/\.tsx\{0,1\}$//')
  [ "$b" = main ] && continue
  n=$(grep -rl --include="*.ts" --include="*.tsx" "/$b'" src | grep -v "^$f$" | wc -l)
  [ "$n" -eq 0 ] && echo "DEAD $f"
done

# unused deps, then prove it compiles AND bundles
npx tsc --noEmit && npx vite build
```

Measure the **reference** too. When matching an effect from Figma, export the
rendered node and sample it. That is how a "glass" pill got solved: it turned out to
*darken* a bright backdrop (0.61×) but *brighten* a dark one (2.13×) — a pull toward
mid grey — with edges 0.63× the interior, i.e. a **dark** inner rim and no light
catch. The guessed-first recipe (bevel + top highlight + face gradient) is exactly
what reads as brushed metal instead.

---

## 9. Gotchas, all encountered for real

| Symptom | Cause |
|---|---|
| `rafCallsIn600ms: 0`, nothing animates | `document.hidden` — browsers suspend rAF in a background tab. Environment artifact, not a bug. Don't chase it. |
| Artifact starts mid-scroll on reload | Browsers restore a scroller's offset *asynchronously* after load. Set `history.scrollRestoration = 'manual'` and pin `scrollTop = 0`. |
| A thin bar renders at 0px | It's a column-flex child and content overflowed, so `flex-shrink` ate it. Use `flex: 0 0 <h>`. |
| Whole script dies on init | Duplicate `id` between a control and a DOM node — `getElementById` returns the wrong one. Scope lookups or use refs. |
| Active pill invisible | Its background equals its own well. See §2. |
| Toggled icon button invisible in light theme | Using `--raised` (white) on a white panel instead of `--active`. |
| Vertical gutter bigger than horizontal | Two owners both adding margin. See §4. |
| Light theme looks grubby | Dark-theme shadow opacities carried over. Halve them. |
| `backdrop-filter: blur()` does nothing | Blurring a flat colour returns the same colour. Use `contrast()`/`brightness()` on flat ground. |
| A "flash" is invisible on white text | White can't get whiter. `brightness(1.2)` on `#fff` is a no-op — you need a `text-shadow` bloom. |
| Sliders sticky, text selects while dragging | Put `user-select: none` on the shell. |
| Element reads as metal, not glass | Face gradient + top-light/bottom-dark bevel is the brushed-metal recipe. Glass is an even face plus edge optics. |

---

## 10. Sourcing content from Figma

- **`get_design_context` strips the `visible` flag.** Building from it pulls in hidden
  alternates — dead cards, superseded layouts, old placeholders. Use
  **`get_file_nodes`** (raw REST), which keeps `visible`, and prune the tree. In one
  real file, 34 of 212 nodes were `visible:false`, including three entire hero cards
  and every tile's info tag.
- **Export composited frames, not individual layers.** Rendering the frame gives
  gradients, masks and baked-in effects exactly, and sidesteps guessing which of six
  stacked images is visible. Exports come back at exact multiples of the frame size,
  so `width:100%; height:100%` fits with no cropping maths — and if an effect is
  baked into the export, delete your CSS equivalent or it doubles up.
- Component *instances* often fail to render via the image API; export the inner
  frame instead.
- Pull real numbers — fills, radii, letter-spacing, line-height — rather than
  eyeballing. Then **say where the design diverges from the brand palette** rather
  than silently "fixing" it.

### On sourcing visual reference

Scraping mood-board sites (Cosmos, Pinterest clusters) for *tool UI* has a terrible
hit rate — one attempt returned 411 images containing 2 interfaces. Marketing sites
mostly expose only an `og:image`. If you need tool-chrome reference, go straight to
product screenshots or work from §4. And if a harvest fails, say so plainly rather
than dressing up a thin result.

---

## 11. Ship it runnable

```json
// .claude/launch.json
{ "version": "0.0.1", "configurations": [
  { "name": "studio", "runtimeExecutable": "npm",
    "runtimeArgs": ["--prefix", "studio", "run", "dev"], "port": 5273 }]}
```

Keyboard: `⏎` replay, `S` slow-mo, `T` theme, `I` inspector. A copy-values-as-JSON
button makes a tuning session portable — it is how a designer hands numbers to an
engineer.

Run `tsc --noEmit` **and** a production `vite build` before claiming it works, check
the console, and state plainly what you verified versus what you only looked at.
