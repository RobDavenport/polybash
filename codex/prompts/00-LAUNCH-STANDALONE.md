# Prompt 00 - Launch Standalone PolyBash

You are working inside the **standalone desktop pivot** of PolyBash.

Read, in order:
1. `AGENTS.md`
2. `README.md`
3. `codex/STANDALONE_PIVOT.md`
4. `codex/STATUS.md`
5. `codex/GAP_REPORT.md`

## Mission

Deliver the standalone desktop application, not the old plugin-host path.

## Active rules

- Rust core remains authoritative for validation/export/domain rules
- desktop shell lives under `desktop/`
- prefer narrow vertical slices
- start each task with failing tests where practical
- do not extend the old plugin architecture unless the task is explicitly migration-related

## Required first move

1. inspect `desktop/` and `desktop/src-tauri/`
2. identify the next smallest missing desktop workflow
3. check `codex/GAP_REPORT.md`
4. implement the next acceptance-driven standalone slice

## Current likely priorities

- viewport/editor surface
- richer document open/save workflow
- desktop-first acceptance coverage
- replacement of plugin-first docs and prompts

Begin now.
