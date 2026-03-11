# PolyBash — Start Here

This pack is designed to make an agentic build practical, not magical.

The package contains:
- a product requirements document
- a technical architecture
- a work breakdown structure
- TDD and validation rules
- an acceptance test matrix
- a risk register
- a repository blueprint
- a Codex runbook and prompt pack
- canonical example fixtures

## What this pack is optimized for

It is optimized for an **overnight end-to-end vertical slice**, not the entire long-term product in one pass.

The overnight target is:

1. initialize the monorepo
2. implement the contracts and schemas
3. implement the Rust validation/export core
4. implement the TypeScript Blockbench plugin shell
5. support loading/saving `.zxmodel`
6. support module placement and snap/connect logic
7. support constrained deformation on authored regions
8. support material zone assignment
9. support rig template metadata assignment
10. export `.glb`
11. produce a validator report
12. leave the repo green with CI and tests

If all of that lands cleanly, the next pass can extend painting, rigging fidelity, and LLM integration.

## How to use this with Codex

### Option A — give Codex one file
Use `MASTER_SPEC.md` plus `AGENTS.md`.

### Option B — give Codex the full pack
Give Codex the entire folder. This is better.

### Recommended execution order

1. Read:
   - `AGENTS.md`
   - `MASTER_SPEC.md`
   - `codex/00-OVERNIGHT-RUNBOOK.md`

2. Start the trunk/bootstrap task:
   - `codex/prompts/00-MASTER-ORCHESTRATOR.md`

3. Once the skeleton exists, split parallel tasks:
   - `codex/prompts/01-BOOTSTRAP.md`
   - `codex/prompts/02-CONTRACTS-SCHEMAS.md`
   - `codex/prompts/03-RUST-CORE-VALIDATOR.md`
   - `codex/prompts/04-PLUGIN-SHELL.md`
   - `codex/prompts/05-ASSEMBLY-DEFORMATION.md`

4. After those land, run:
   - `codex/prompts/06-PAINTING.md`
   - `codex/prompts/07-RIGGING-EXPORT.md`
   - `codex/prompts/08-LLM-COMMANDS.md`

5. Finish with:
   - `codex/prompts/09-HARDENING-RELEASE.md`
   - `codex/prompts/10-MERGE-REVIEW.md`
   - `codex/prompts/11-RECOVERY-LOOP.md` if red

## What “complete” means here

A “complete overnight run” means:
- the walking skeleton is implemented end to end
- tests are present and green
- acceptance coverage exists for every P0 requirement
- the repo builds in a clean environment
- known gaps are clearly documented
- no critical path is hand-waved

It does **not** mean:
- every long-term feature in the PRD is production-polished
- every UI interaction is host-integrated and manually smoke tested
- every future asset category is fully supported

## Recommended human review the next morning

1. Open the gap report.
2. Verify the examples load and export.
3. Review CI logs.
4. Review the validator output format.
5. Confirm that any remaining gaps are in non-critical areas.
6. Only then decide whether to keep iterating or branch into polish.

## Contents

- `docs/01-PRD.md`
- `docs/02-TECHNICAL-ARCHITECTURE.md`
- `docs/03-WBS-AND-MILESTONES.md`
- `docs/04-TDD-QUALITY-GATES.md`
- `docs/05-ACCEPTANCE-TEST-MATRIX.md`
- `docs/06-RISK-REGISTER.md`
- `docs/07-REPO-BLUEPRINT.md`
- `codex/00-OVERNIGHT-RUNBOOK.md`
- `codex/taskboard.yaml`
- `codex/prompts/*.md`
- `examples/*.json`
