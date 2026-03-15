# Prompt 10 - Launch Unattended Product Run

You are the master orchestrator for a long unattended PolyBash build run.

This is a subagent-first execution mode.
Do not default to implementing large features yourself.
Your job is to:
- split work into disjoint lanes
- dispatch workers
- validate after each landed wave
- relaunch stalled lanes smaller
- keep the repo, worklog, and handoff docs truthful

## Read first

Read these files in order:
1. `AGENTS.md`
2. `README.md`
3. `docs/01-PRD.md`
4. `docs/03-WBS-AND-MILESTONES.md`
5. `codex/taskboard.yaml`
6. `codex/GAP_REPORT.md`
7. `codex/STATUS.md`
8. `codex/ACCEPTANCE_SUMMARY.md`
9. `codex/STANDALONE_PIVOT.md`
10. `codex/00-OVERNIGHT-RUNBOOK.md`
11. `codex/prompts/09-24H-AUTONOMOUS-RUNLOOP.md`

## Mission

Move PolyBash toward a **real usable standalone retro asset creation system** for PS1, N64, and PS2-era quality assets.

This is not a shell-polish run.
This is not a generic infrastructure run.
This is not a return to the old plugin-host product path.

The product should become:
- more flexible than Asset Forge
- higher-fidelity than Blockbench
- simpler and more guided than Blender

Characters and props are the first release focus.
Environments and world chunks are serious secondary workflows.

## Optimization target

Optimize for **maximum validated backlog closure per unattended run**, not for elegance of individual slices.

That means:
- prefer closing task ids and acceptance gaps over polishing already-usable flows
- prefer larger blocker-clearing waves over a long chain of tiny safe refinements
- treat narrow polish work as lower priority unless it directly unlocks an acceptance item or another blocked lane

The default question for every next move is:
- does this close a task
- does this materially advance an acceptance criterion
- does this unblock a larger lane

If the answer is no, do not spend the run on it.

## Autonomy contract

Run continuously without asking the user for routine feedback, confirmation, or prioritization once the run has started.

Assume the priority order in this file is authoritative unless:
- a hard blocker makes progress unsafe
- the repository can no longer be kept green
- a true product contradiction is discovered in the source-of-truth docs

Do not pause to ask "what next" between waves.
Do not stop after a single completed slice if more queued work remains.
Do not hand control back just because one worker stalls; rescope and continue.

Only interrupt the unattended run for:
- a hard blocker requiring a real product decision
- missing external dependency or credential that cannot be worked around
- a state where continuing would likely damage the repository or violate the product boundary

Do not confuse "keep going unattended" with "keep polishing the current task family."
Unattended mode means:
- continue across waves automatically
- reprioritize aggressively when current work is low-leverage
- maximize total completed backlog, not just local cleanliness

## Product boundary

### PolyBash owns

- module browsing and reusable content workflows
- module import and metadata authoring
- pivots, connectors, material zones, deformation regions, and sockets
- module-first kitbash assembly
- constrained shaping and high-level editing
- style-pack/library browsing and copy-on-write overrides
- validation, preview/apply, and export

### Blender owns

- custom source mesh creation
- UV unwrap/editing
- skinning
- animation
- heavier baking workflows

Do not spend this run building a low-level mesh editor, UV editor, or animation tool.

## Mandatory first move

Before assigning any feature lane:
1. run the preflight checks from `codex/00-OVERNIGHT-RUNBOOK.md`
2. confirm the repo baseline is green
3. if the baseline is red, repair trunk first
4. publish a wave roster before dispatching implementation workers

## Execution model

Use subagents for implementation whenever file ownership can be separated.

For each wave:
1. choose 2 to 4 tasks with disjoint file scopes when parallel work is available
2. assign one worker per scope
3. require failing tests first where practical
4. land the smallest slice that materially improves the real product **only if** it is the fastest path to closing the task or acceptance blocker
5. validate the wave
6. update handoff docs
7. queue the next wave

At the start of every wave, rank work explicitly:
1. biggest remaining acceptance blocker
2. second biggest remaining blocker
3. only then smaller unblockers or polish

Do not spend multiple consecutive waves on the same task family unless it is actively closing that task.

## Throughput guardrails

The following rules are mandatory for unattended runs:

- if two landed slices in a row hit the same task id without closing it, either:
  - close it in the next wave, or
  - switch to a different blocker and record why
- if a task family consumes roughly 60 to 90 minutes of run time without closing a task or materially changing acceptance status, force a reprioritization
- if a lane produces only UX wording, layout cleanup, or other polish without acceptance movement, terminate that lane
- do not spend more than one wave on browser or shell polish while higher-priority product blockers remain open
- keep at least one active lane on the largest open blocker whenever the repo is green

## Anti-drift rules

Do not let the unattended run degrade into:
- repeated micro-slices on the same task id
- local craftsmanship work that does not close backlog
- browser polish while viewport, import, validation, or acceptance blockers remain open
- waiting on stalled workers without relaunching or reclaiming the work

If the run starts drifting, correct by:
1. restating the top 3 remaining blockers
2. killing low-leverage lanes
3. launching a new wave against the highest-value blockers

## Worker management rules

- keep a visible wave roster in every progress update:
  - active workers
  - task ids
  - owned files
  - current validation state
  - next queued lanes
- timebox workers
- if a worker has no completion signal after two wait windows, inspect the owned files directly
- if the files are unchanged or inconsistent, mark the lane stalled and relaunch it smaller
- never let two workers write the same file set at once
- do not silently wait forever
- do not use workers only for cosmetic sidecar work while the main rollout also does cosmetic work
- at least one worker lane should always target the biggest currently open blocker when feasible

## Validation policy

After each meaningful desktop wave, run:
- `corepack pnpm --dir desktop typecheck`
- `corepack pnpm --dir desktop test`
- `corepack pnpm --dir desktop build`
- `cargo test --manifest-path desktop/src-tauri/Cargo.toml`

After cross-cutting Rust or content-pipeline waves, also run:
- `cargo test --workspace`
- `cargo fmt --check`

Keep the baseline green before moving to the next risky wave.

Validation is not a substitute for prioritization.
A fully green low-value slice is still a bad unattended wave if it did not move the most important blockers.

## Commit and push policy

- create one commit per validated wave or major product slice
- push after each validated checkpoint that materially improves the repo
- do not wait until the end of the run to push everything

## Documentation policy

After each meaningful wave:
- update `codex/STATUS.md`
- update `codex/GAP_REPORT.md`
- update `codex/ACCEPTANCE_SUMMARY.md` when evidence changes
- update `README.md` when user-facing behavior changes

Keep claims narrow and honest.
Do not describe generalized UX when only a narrow slice has landed.

Wave summaries should emphasize:
- what backlog was actually burned down
- what is now closed vs merely refined
- why the next wave is the highest-value use of unattended time

## Priority order for this run

Execute in this order unless a dependency forces a different sequence:

### Wave group A: immediate usability blockers

1. `T-20` visible undo/redo and action-history UX
2. `T-21` viewport orientation and transform gizmos
3. `T-22` visible connector points and snap targets
4. `T-19` module preview/browser workflow

### Wave group B: real content pipeline

5. `T-24` Blender handoff and module import pipeline
6. `T-23` reusable module metadata authoring workflow
7. `T-25` reusable style-pack and module library workflow
8. `T-26` texture/material strategy with Blender-owned UV contract

### Wave group C: broader product hardening

9. broader preview/diff UI coverage
10. validation/export UX hardening
11. stronger acceptance and smoke coverage

Within each wave group:
- prefer task closure over task refinement
- prefer the most blocked or most user-visible acceptance gap over local polish
- leave nice-to-have browser ergonomics until blocker-heavy lanes are exhausted

## What success looks like

This run is successful if, by the end:
- the editing experience is materially more visible and recoverable
- module browsing and snap/connect behavior are easier to understand
- the Blender-to-PolyBash content pipeline is substantially more real
- the repo remains green
- the docs describe the actual product state without exaggeration

This run is also successful only if it burns down the backlog at a meaningful rate.
Many tiny green refinements on one task family do not count as a strong unattended result if larger blockers remain open.

This run is not successful if it only produces more infrastructure while the app still feels like a toy.

## Stop conditions

Stop only when one of these is true:
- the current wave is validated, documented, and the next wave is clearly queued
- a hard blocker prevents safe progress
- the repo cannot be kept green without user intervention

If none of those conditions are true, continue into the next queued wave automatically.

Before stopping at a checkpoint, verify:
- the just-finished wave was not low-leverage polish
- the next wave is pointed at the largest remaining blocker
- the unattended run would resume with blocker-closing work, not more local refinement

## Required wave summary format

For every landed wave, report:
- task ids completed or advanced
- workers used and owned scopes
- failing tests added first
- validation commands run
- results
- remaining blockers
- next queued lanes

Begin with the preflight checks, then start wave group A with the highest-value unblocked lane.
