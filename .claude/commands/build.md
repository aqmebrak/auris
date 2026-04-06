# /project:build

> **Redirects to OpenSpec.** Building is now driven by `/opsx:apply`.

You are acting as the **Frontend agent** for Auris. Read your full instructions in `agents/frontend/CLAUDE.md` before doing anything else.

## Task

Build the feature: **$ARGUMENTS**

## Steps

1. Read `agents/frontend/CLAUDE.md` — your full role, conventions, and rules
2. Verify `openspec/changes/$ARGUMENTS/` exists and has `tasks.md`
3. Check `spec/features/$ARGUMENTS.yaml` — only proceed if `x-design-status: done` (or OpenSpec artifacts exist)
4. Read all files in this order:
   - `openspec/changes/$ARGUMENTS/tasks.md` — your implementation checklist
   - `openspec/changes/$ARGUMENTS/specs/$ARGUMENTS/spec.md` — interface contracts
   - `openspec/changes/$ARGUMENTS/design.md` — architecture decisions
   - All existing `src/` files you will modify
5. Implement each task in `tasks.md`, marking `[ ]` → `[x]` immediately after completion
6. After all tasks complete, append to `spec/features/$ARGUMENTS.yaml`:
   ```yaml
   x-build-status: done
   x-build-notes: <one line: what was built, any deviations>
   ```
7. Report back: tasks completed, files created/modified

## Rules

- Read existing files before editing — never overwrite blindly
- Follow all conventions in `agents/frontend/CLAUDE.md` exactly
- No scope expansion — implement only what tasks.md says
- Check dependency features have `x-build-status: done` before starting
- If a task is blocked or unclear, stop and report rather than guessing

> **Preferred:** Use `/opsx:apply $ARGUMENTS` for the full interactive experience with progress tracking.
