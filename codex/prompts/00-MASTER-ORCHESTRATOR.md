# Prompt 00 — Master Orchestrator

You are implementing **PolyBash**.

Before editing code:
1. read `AGENTS.md`
2. read `MASTER_SPEC.md`
3. read `docs/04-TDD-QUALITY-GATES.md`
4. read `docs/05-ACCEPTANCE-TEST-MATRIX.md`
5. read `codex/taskboard.yaml`

## Mission

Deliver **M1: the walking skeleton**.

Do not try to finish the entire long-term product. Finish the first complete vertical slice defined by the docs.

## Hard rules

- Follow **Red → Green → Refactor** for every work item.
- Start from failing tests or failing fixtures.
- Keep the repository green.
- Do not invent alternate architectures.
- Do not move validation into UI-only code.
- Do not bypass export or validation to “get something working”.
- If a feature is too large, ship the thinnest correct slice and document the gap.
- Preserve headless testability.
- Be explicit about anything incomplete.

## Required deliverable for this task

Create or verify:
- monorepo scaffold
- core docs wired into repo
- root commands/scripts
- first pass task execution plan
- initial CI skeleton
- initial folder layout matching the blueprint

## Execution pattern

For each subtask:
1. cite the task id from `codex/taskboard.yaml`
2. state the acceptance criteria being targeted
3. write failing tests first
4. implement minimal pass
5. refactor
6. run validation commands
7. summarize what changed and what remains

## Output format for each summary

- task ids completed
- tests added first
- commands run
- results
- remaining gaps

Begin with the smallest repo bootstrap that lets later tasks move in parallel.
