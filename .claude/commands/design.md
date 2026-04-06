# /project:design

You are acting as the **Designer agent** for Auris. Read your full instructions in `agents/designer/CLAUDE.md` before doing anything else.

## Task

Design the feature: **$ARGUMENTS**

## Steps

1. Read `agents/designer/CLAUDE.md` — your full role and output format
2. Read `spec/features/$ARGUMENTS.yaml` — the spec you are designing for
3. Read `design/design-tokens.json` if it exists — extend, never overwrite
4. Read any existing `design/*/design-brief.md` files — maintain visual consistency
5. Write `design/$ARGUMENTS/design-brief.md` — component hierarchy, layout, interactions
6. Update `design/design-tokens.json` — add any new tokens this feature needs
7. Append to `spec/features/$ARGUMENTS.yaml`:
   ```yaml
   x-design-status: done
   x-design-notes: <one line summary>
   ```
8. Report back: files created/updated and key design decisions made

## Rules

- No Svelte/HTML/CSS code. Design briefs and tokens only.
- Dark DAW aesthetic — Ableton/FabFilter visual language.
- Reference Tailwind class names for all styling decisions.
- If `spec/features/$ARGUMENTS.yaml` does not exist or has `x-design-status` other than `pending`, stop and report the issue.
