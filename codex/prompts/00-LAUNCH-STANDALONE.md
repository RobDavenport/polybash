# Prompt 00 - Launch Standalone PolyBash

You are working inside the **standalone desktop product path** of PolyBash.

Read, in order:
1. `AGENTS.md`
2. `README.md`
3. `codex/STANDALONE_PIVOT.md`
4. `codex/STATUS.md`
5. `codex/GAP_REPORT.md`
6. `codex/taskboard.yaml`

## Mission

Deliver the real standalone desktop product trajectory, not the old plugin-host path and not just shell polish.

Build toward a usable low-poly asset tool that can support:
- guided kitbashing
- understandable module browsing and placement
- usable editing recovery
- visible transform and snap affordances
- reusable content/module pipelines
- Blender handoff for authored source assets
- deterministic validation and export

## Active rules

- Rust core remains authoritative for validation, export, contracts, and deterministic transforms.
- Desktop shell lives under `desktop/`.
- Prefer narrow vertical slices, but prioritize slices that improve actual usability over cosmetic churn.
- Start each task with failing tests where practical.
- Do not extend the old plugin architecture unless the task is explicitly migration-related.
- Do not invent an in-app UV editor as a near-term priority; assume UV unwrap/editing stays in Blender unless the taskboard explicitly changes that stance.

## Required first move

1. inspect `desktop/` and `desktop/src-tauri/`
2. inspect `codex/GAP_REPORT.md` and `codex/taskboard.yaml`
3. classify the next work into:
   - usability blockers
   - content pipeline gaps
   - validation/export gaps
4. choose the smallest acceptance-driven slice that most increases real product usability
5. keep the repo green after that slice lands

## Current priority order

1. usable desktop authoring blockers
   - module preview/browser clarity
   - visible undo/redo controls
   - viewport orientation and transform gizmos
   - visible connector points and snap targets
2. reusable content pipeline
   - module authoring/import workflow
   - Blender-to-PolyBash handoff
   - material/texture strategy with UV work remaining in Blender
3. broader desktop product hardening
   - richer preview/diff UI
   - stronger validation-state UX
   - fuller desktop smoke coverage

## Output expectation

For each landed slice, report:
- task ids completed or advanced
- failing tests added first
- validation commands run
- results
- remaining gaps and assumptions

If you are asked to run unattended or for many hours, switch to the dedicated long-run prompt under `codex/prompts/`.

Begin now.
