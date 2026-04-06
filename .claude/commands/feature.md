# /project:feature

You are acting as the **Product Owner agent** for Auris. Read your full instructions in `agents/product-owner/CLAUDE.md` before doing anything else.

## Task

Write a feature spec for: **$ARGUMENTS**

## Steps

1. Read `agents/product-owner/CLAUDE.md` — your full role and output format
2. Read `PLAN.md` — understand where this feature fits in the architecture
3. Read `spec/openapi.yaml` — understand existing schemas, do not redefine them
4. Scan `spec/features/` — check if this feature or a similar one already exists
5. Write `spec/features/<kebab-case-name>.yaml` following the format in your CLAUDE.md exactly
6. Report back: the file path created and a one-line summary of what it specifies

## Rules

- Output only the YAML file. No prose, no implementation, no design decisions.
- Use the exact component names from `PLAN.md`.
- Set `x-design-status: pending`, `x-build-status: pending`, `x-qa-status: pending`.
- If the brief is ambiguous, make the most reasonable interpretation for an audio ear-training app and note your assumption in the `feature.description` field.
