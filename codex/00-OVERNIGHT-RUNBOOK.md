# Codex Overnight Runbook

## 1. Objective

Use Codex to deliver the **M1 walking skeleton** of PolyBash overnight.

This runbook assumes:
- the repo can be worked on in parallel lanes
- GUI-dependent behavior should be minimized
- correctness matters more than breadth

## 2. Environment assumptions

Prepare a clean environment with:
- Rust stable
- Node 20+
- pnpm
- Python 3.11 (optional helper scripts)
- GitHub-connected repository if using Codex cloud
- internet only where dependency installation needs it

Do not rely on GUI automation for the first overnight run.

## 3. Recommended task split

### Task A — trunk/bootstrap
Prompt:
- `prompts/00-MASTER-ORCHESTRATOR.md`
- then `prompts/01-BOOTSTRAP.md`

Outputs:
- monorepo skeleton
- CI skeleton
- root scripts
- docs wired in

### Task B — contracts/core foundation
Prompt:
- `prompts/02-CONTRACTS-SCHEMAS.md`
- `prompts/03-RUST-CORE-VALIDATOR.md`

Outputs:
- contracts
- fixtures
- validator
- CLI
- first export path

### Task C — plugin shell
Prompt:
- `prompts/04-PLUGIN-SHELL.md`
- `prompts/05-ASSEMBLY-DEFORMATION.md`

Outputs:
- buildable plugin shell
- controller tests
- assembly and deformation workflows

### Task D — surface/rig/export hardening
Prompt:
- `prompts/06-PAINTING.md`
- `prompts/07-RIGGING-EXPORT.md`

Outputs:
- material zone workflow
- paint layer model
- rig metadata path
- export integration

### Task E — safety and finish
Prompt:
- `prompts/08-LLM-COMMANDS.md`
- `prompts/09-HARDENING-RELEASE.md`
- `prompts/10-MERGE-REVIEW.md`

Outputs:
- command DSL
- acceptance harness
- release docs
- gap report

## 4. Recommended merge order

1. bootstrap
2. contracts
3. core/domain/validator
4. export + CLI
5. plugin shell
6. material/rig/export integration
7. hardening/review

## 5. Ground rules for every task

- read `AGENTS.md` first
- read the relevant docs before editing code
- write failing tests first
- keep summaries explicit
- keep changes scoped
- do not fake completion

## 6. If a task goes red

Use `prompts/11-RECOVERY-LOOP.md`.

Focus order:
1. restore build
2. restore contracts
3. restore validate/export
4. restore plugin tests
5. restore docs/examples parity

## 7. Expected overnight deliverable

By morning, you want:
- a compilable repo
- green tests
- example project fixtures
- working validator CLI
- working GLB export path
- buildable plugin shell
- clear gap report for anything not fully polished

## 8. Morning review checklist

- inspect CI status
- inspect generated examples
- inspect report snapshots
- inspect gap report
- validate that no critical path is missing
