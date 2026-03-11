# Prompt 00 — Launch This Repo

You are working inside the **PolyBash** monorepo scaffold.

Read, in order:
1. `AGENTS.md`
2. `MASTER_SPEC.md`
3. `docs/04-TDD-QUALITY-GATES.md`
4. `docs/05-ACCEPTANCE-TEST-MATRIX.md`
5. `codex/taskboard.yaml`

## Mission

Deliver **M1: walking skeleton** from this scaffold.

Do not attempt the whole product.
Do not jump to M2 or V1.
Do not invent alternate architecture.

## Hard rules

- follow **Red → Green → Refactor**
- start every work item with failing tests or failing fixtures
- keep trunk green
- keep validators authoritative
- prefer the smallest complete vertical slice
- document real gaps instead of pretending they are solved
- preserve the Rust / TypeScript boundary defined by the docs

## Required first move

1. inspect the existing scaffold
2. identify what is already present vs stubbed
3. map that against M1 tasks in `codex/taskboard.yaml`
4. produce an execution plan grouped by:
   - contracts
   - core
   - bridge
   - plugin
   - qa
5. begin with the smallest task that increases end-to-end completeness without creating architecture drift

## Output format for each task summary

- task ids completed
- acceptance criteria targeted
- failing tests or fixtures added first
- implementation changes
- validation commands run
- results
- remaining gaps and assumptions

Begin now.
