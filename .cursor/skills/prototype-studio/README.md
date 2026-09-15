# prototype-studio

A Claude Code / Claude Desktop **skill** for building the harness UI around an
interactive prototype — the tool that houses the thing you're designing.

It produces a Figma/Framer-style design tool: neutral dark + light chrome, shadcn
components, a live parameter inspector with draggable numeric scrubbers, and a beat
timeline. The chrome deliberately stays neutral so whatever brand you're prototyping
reads truthfully inside the artboard.

## Install

**Claude Code** — drop the folder in either location:

```bash
# available in every project
mkdir -p ~/.claude/skills && cp -R prototype-studio ~/.claude/skills/

# or scoped to one repo
mkdir -p .claude/skills && cp -R prototype-studio .claude/skills/
```

Restart Claude Code. Confirm with `/skills`, or just ask for a prototype — the
description auto-triggers on "prototype", "playground", "motion study", "tuning
tool", "make me a tool to…".

**Claude Desktop / Cursor** — upload `SKILL.md` as a skill, or paste it into your
project instructions.

## What's inside

`SKILL.md` is the whole skill. It covers:

- **Three control surfaces** (well / track / raised / active) — the token bug that
  makes active states invisible, and why it presents differently in each theme
- **Theming with `@theme inline`** so Tailwind v4 utilities stay runtime-switchable
- **What separates a modern tool from Photoshop 2010** — radius and shadow instead of
  borders, sentence case, opacity tiers, one accent on state only, hover reveals
- **Giving the gutter a single owner** so vertical and horizontal spacing agree
- **A copy-paste contrast audit** that checks every surface pair and text pair across
  both themes and prints failures
- **Architecture** — one parameter table driving the whole inspector; pure render
  function plus refs so slider drags don't tear down your animation loop
- **A gotchas table**, all encountered for real
- **Figma sourcing** — why `get_design_context` silently gives you hidden layers

`examples/` has the theme file and parameter table from the reference build.

## Credit

Extracted from a Robinhood Offers Hub motion study. Brand specifics were
deliberately removed — the chrome is brand-neutral by design.
