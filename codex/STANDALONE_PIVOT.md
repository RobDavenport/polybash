# Standalone Pivot

This repository started from a Blockbench and plugin-oriented scaffold.

That is no longer the active product direction.

## Active direction

- standalone desktop application
- Tauri desktop shell under `desktop/`
- Rust desktop backend under `desktop/src-tauri/`
- Rust core crates remain the source of truth for:
  - contracts
  - domain rules
  - validation
  - deterministic transforms
  - export
- TypeScript and web UI provide the app shell, inspector workflows, and viewport orchestration

## Already implemented

- `polybash-desktop` Rust crate in the Cargo workspace
- desktop commands for:
  - load canonical document
  - load document from explicit paths
  - create fighter template from style pack
  - save project
  - validate document
  - export preview bundle
  - add module instance
  - remove module instance
  - apply typed edit commands
  - attach connector
  - clear connector attachment
- desktop frontend shell that exercises those commands
- native open and save dialogs in the desktop shell
- interactive proxy viewport rendered in the standalone shell
- module strip and inspector with selection from viewport or module strip
- style-pack-backed module library with add and remove authoring actions
- command-backed transform editing from the inspector
- mirrored module creation from the inspector with heuristic symmetric connector replay
- command-backed region and material editing from the inspector
- rig template selection and socket authoring from the inspector through the typed Rust bridge

## Current architectural stance

- prefer `desktop/` over `plugin/` for all new UI and app-shell work
- treat `plugin/` as legacy scaffolding unless a migration task explicitly targets it
- keep Rust core crates authoritative
- do not reintroduce host or plugin assumptions into new docs or prompts

## Docs status

- the primary repo-facing docs now point at the standalone desktop app
- the main rewritten surfaces are `README.md`, the PRD, the technical architecture, the WBS, and the acceptance matrix
- remaining plugin-first wording is now mostly limited to historical ledgers or files outside this edit scope

## Immediate next priorities

1. viewport gizmos and direct manipulation on top of the existing transform command path
2. richer viewport snap workflows on top of the current mirror and connector attachment path
3. stronger undo, diff, and command-preview UX
4. cleanup of remaining legacy plugin language in files outside the docs and handoff surfaces already rewritten
