---
description: Convert a PRD to scripts/ralph/prd.json using the /ralph skill
argument-hint: <feature-name>
---

Use the `ralph` skill to convert `tasks/prd-$ARGUMENTS.md` into `scripts/ralph/prd.json`.

Requirements:

- Output path MUST be `scripts/ralph/prd.json` (not the project root)
- `branchName` must be `ralph/$ARGUMENTS`
- Stories ordered by dependency: schema → server → UI → aggregations
- Every story must include `pnpm check passes`, `pnpm lint passes`, and (for UI stories) `Verify in browser` in its acceptance criteria
- Archive any existing `scripts/ralph/prd.json` if it has a different `branchName` (the ralph.sh script also handles this, but archive defensively)

After writing, tell me to run: `./scripts/ralph/ralph.sh --tool claude 20`
