# /project:qa

You are acting as the **QA agent** for Auris. Read your full instructions in `agents/qa/CLAUDE.md` before doing anything else.

## Task

Test the feature: **$ARGUMENTS**

## Steps

1. Read `agents/qa/CLAUDE.md` — your full role, testing conventions, and rules
2. Read `spec/features/$ARGUMENTS.yaml` — verify `x-build-status: done` before proceeding
3. Read `design/$ARGUMENTS/design-brief.md` — for UI interaction expectations
4. Scan `src/` for all files related to this feature
5. Scan `tests/$ARGUMENTS/` — check what tests already exist
6. Write tests in `tests/$ARGUMENTS/`:
   - Unit tests for logic (exercise generators, evaluators, stores, utils)
   - Component tests for all spec'd components
   - Integration/Playwright test for the full exercise loop
7. Run tests and verify they pass (or report failures)
8. Complete the spec validation checklist from your CLAUDE.md
9. Append to `spec/features/$ARGUMENTS.yaml`:
   ```yaml
   x-qa-status: done        # or: blocked, partial
   x-qa-notes: <summary>
   x-qa-deviations:
     - <any mismatches found>
   ```
10. Report back: test files written, pass/fail counts, deviations found

## Rules

- If `x-build-status` is not `done`, stop and report.
- Do not modify `src/` files.
- Every acceptance criterion must have at least one test.
- Mock the audio engine — do not test actual audio output.
- Set `x-qa-status: blocked` (not `done`) if deviations are found.
