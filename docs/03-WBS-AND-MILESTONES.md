# Work Breakdown Structure (WBS) and Milestones

## 1. Overview

This WBS is designed for two horizons:

- **Overnight horizon:** deliver the P0 walking skeleton
- **V1 horizon:** expand the walking skeleton into the broader product described in the PRD

## 2. Milestones

### M0 - Planning complete

Done when:
- PRD exists
- architecture exists
- acceptance matrix exists
- prompt pack exists

### M1 - Walking skeleton complete (overnight target)

Done when:
- repo scaffold exists
- contracts compile
- desktop shell builds
- native document flow works
- example projects validate
- GLB export works on the canonical fighter fixture
- report generation works
- CI is green

### M2 - Authoring MVP

Done when:
- assembly workflow works across fighter, weapon, and prop
- style packs and module browsing are usable
- material zones and basic paint layers work
- rig templates and sockets are present
- connector attach and detach workflows are usable from the desktop shell

### M3 - V1 complete

Done when:
- characters, props, vehicles, and chunks are all supported
- hybrid rigging exists
- basic LLM-assisted structured editing exists
- documentation and release packaging are complete

## 3. Work packages

| ID | Work package | Outputs | Depends on | Lane | Priority |
|---|---|---|---|---|---|
| WP-00 | Program setup | repo, taskboard, CI skeleton | none | trunk | P0 |
| WP-01 | Contracts and schemas | Rust contracts, JSON Schema, TS bindings | WP-00 | contracts | P0 |
| WP-02 | Example fixtures | `.zxmodel`, style pack, report examples | WP-01 | contracts | P0 |
| WP-03 | Rust domain core | normalized project logic, command application | WP-01 | core | P0 |
| WP-04 | Geometry ops | connector math, transforms, region params | WP-03 | core | P0 |
| WP-05 | Validator | typed validation pipeline and report | WP-03, WP-04 | core | P0 |
| WP-06 | Exporter | GLB export bundle | WP-03, WP-05 | core | P0 |
| WP-07 | CLI | validate and export commands | WP-05, WP-06 | core | P0 |
| WP-08 | Desktop bridge | Tauri command surface and typed desktop payloads | WP-03, WP-05, WP-06 | bridge | P0 |
| WP-09 | Desktop shell | buildable desktop app, state model, adapter seams | WP-00, WP-01, WP-08 | desktop | P0 |
| WP-10 | Project workflow | create, open, save, style pack loading, native dialogs | WP-09 | desktop | P0 |
| WP-11 | Assembly workflow | browse, add, remove, attach, and detach modules | WP-08, WP-09 | desktop | P0 |
| WP-12 | Deformation workflow | region parameter editing | WP-08, WP-11 | desktop | P0 |
| WP-13 | Material workflow | zone assignment and basic layer model | WP-08, WP-11 | desktop | P0 |
| WP-14 | Rig metadata workflow | rig template and sockets | WP-08, WP-10 | desktop | P0 |
| WP-15 | CI and quality gates | build, test, lint, and coverage pipeline | WP-00 | qa | P0 |
| WP-16 | Acceptance harness | fixture-driven acceptance suite | WP-05, WP-06, WP-10..WP-14 | qa | P0 |
| WP-17 | Release docs | README, usage notes, examples | WP-15, WP-16 | trunk | P0 |
| WP-18 | Viewport and gizmo hardening | direct manipulation, transform gizmos, mirror polish | WP-11, WP-12 | desktop | P1 |
| WP-19 | Hybrid rigging | weighting modes and richer export | WP-14, WP-06 | core/desktop | P1 |
| WP-20 | LLM command integration | prompt -> DSL -> preview/apply | WP-03, WP-08 | core/desktop | P1 |
| WP-21 | Secondary delivery surfaces | optional WASM or web embedding parity | M1 | bridge | P2 |

## 4. Detailed task decomposition

## WP-00 Program setup

Tasks:
- create monorepo layout
- choose package manager and Rust workspace structure
- configure formatting and linting
- establish CI workflow skeleton
- add AGENTS and docs structure

Done criteria:
- `cargo test --workspace` runs
- `pnpm test` runs
- CI starts on push and PR
- docs folder wired in

## WP-01 Contracts and schemas

Tasks:
- define ids, enums, and types in Rust
- define version block
- generate JSON Schema
- define report types
- generate TS type bindings or runtime validators

Done criteria:
- valid examples deserialize
- invalid examples fail
- schema generation is reproducible
- contract tests are green

## WP-02 Example fixtures

Tasks:
- canonical fighter project
- canonical style pack
- canonical validation report
- canonical command DSL examples

Done criteria:
- examples are used in tests
- examples match docs
- examples validate under schema

## WP-03 Rust domain core

Tasks:
- load and save model
- normalize project
- apply edit commands
- maintain invariants
- prepare export-ready scene model

Done criteria:
- domain round-trip tests pass
- invariant failures are typed
- command application can preview and apply

## WP-04 Geometry ops

Tasks:
- connector compatibility logic
- transform compose and decompose helpers
- region parameter math
- metrics helpers

Done criteria:
- property tests exist
- golden tests exist for representative cases
- deterministic math paths are documented

## WP-05 Validator

Tasks:
- schema validity checks
- style pack compatibility checks
- budget calculations
- connector integrity
- metadata completeness
- report formatting

Done criteria:
- every validation rule has at least one positive and one negative test
- errors include codes and paths
- reports are stable snapshots

## WP-06 Exporter

Tasks:
- derive normalized scene payload
- build GLB artifact
- attach metadata and extras as needed
- emit export stats

Done criteria:
- fighter example exports
- repeated export is deterministic
- export fails on invalid projects
- exported artifact is referenced by snapshot or fixture tests

## WP-07 CLI

Tasks:
- `validate` command
- `export` command
- `inspect` or `report` command
- fixture runner convenience commands

Done criteria:
- CLI help exists
- CLI commands are integration-tested
- errors are non-cryptic

## WP-08 Desktop bridge

Tasks:
- expose core functions through Tauri commands
- define desktop-safe payloads
- add desktop bridge tests
- wire error translation

Done criteria:
- the desktop shell can validate and export through the bridge in tests
- add, remove, edit, and connector workflows cross the bridge with typed responses
- bridge behavior reuses the same Rust services exercised by the CLI

## WP-09 Desktop shell

Tasks:
- desktop application entry point
- state store
- desktop adapters and bridge clients
- panel layout placeholders
- command dispatch pipeline

Done criteria:
- desktop shell builds
- controller or projection tests pass
- desktop adapter seams are mockable

## WP-10 Project workflow

Tasks:
- new project
- native open and save project flow
- style pack load
- validation panel integration

Done criteria:
- project workflow tested headlessly
- serialized output stable
- validation surfaced in desktop state and inspectors

## WP-11 Assembly workflow

Tasks:
- module browsing
- add and remove modules
- connector attach and detach
- mirror placement

Done criteria:
- can assemble the fighter example from modules
- connector rules are enforced
- removal prunes dependent connector and decal state
- mirrored module instances are handled

## WP-12 Deformation workflow

Tasks:
- region control UI model
- update command generation
- preview and apply
- persistence to project file

Done criteria:
- representative regions are editable
- values clamp by style pack limits
- regression tests cover persistence

## WP-13 Material workflow

Tasks:
- material zone assignment
- palette application
- paint layer model
- basic decal hook

Done criteria:
- zones are assignable
- palette constraints validate
- report includes texture and material usage

## WP-14 Rig metadata workflow

Tasks:
- rig template selection
- socket assignment
- export metadata handoff

Done criteria:
- fighter example can bind a rig template
- socket metadata exports
- validation catches missing required bones or sockets

## WP-15 CI and quality gates

Tasks:
- linting
- formatting
- test jobs
- coverage jobs
- artifact upload

Done criteria:
- failing coverage blocks merge
- both Rust and TS gates run
- examples are checked in CI

## WP-16 Acceptance harness

Tasks:
- implement acceptance scenarios
- link requirements to tests
- create smoke checklist
- add release gate summary

Done criteria:
- every P0 requirement maps to a test or documented manual check
- acceptance report is easy to review

## WP-17 Release docs

Tasks:
- usage notes
- contribution guide
- examples walkthrough
- gap report format

Done criteria:
- newcomer can bootstrap repo
- fixtures are documented
- overnight output is reviewable

## 5. Parallelization guidance

### Parallel lane A - contracts

Work on WP-01 and WP-02 first.

### Parallel lane B - core

Begin WP-03 and WP-04 once core contracts settle.

### Parallel lane C - desktop bridge and shell

Begin WP-08 and WP-09 early using mocked data if necessary, then re-sync after WP-01.

### Parallel lane D - QA

Begin WP-15 immediately, then WP-16 as soon as acceptance scenarios stabilize.

### Merge order

1. trunk and bootstrap
2. contracts
3. core math and domain
4. validator and export
5. desktop bridge and shell
6. workflows and acceptance harness
7. hardening

## 6. Overnight execution sequence

### Phase O1
- WP-00
- WP-01
- WP-15

### Phase O2
- WP-02
- WP-03
- WP-08
- WP-09

### Phase O3
- WP-04
- WP-05
- WP-10
- WP-11

### Phase O4
- WP-06
- WP-07
- WP-12
- WP-13
- WP-14

### Phase O5
- WP-16
- WP-17

## 7. Current implementation notes

The current repository already contains meaningful progress against M1:

- the desktop shell builds
- native document dialogs exist
- module add and remove exists
- typed transform edits exist through the shared command path
- connector attach and detach exists
- material and region edits exist through typed Rust-backed commands
- rig template and socket metadata flows exist
- validation and export are Rust-owned and reachable from the desktop shell

The largest remaining gaps before a stronger standalone MVP are transform gizmos, richer direct manipulation, mirror workflow coverage, and deeper undo and diff semantics.

## 8. Descoping order if time or complexity explodes

Descoping order should preserve the walking skeleton:

1. drop advanced painting before dropping material zones
2. drop smooth rigging before dropping rig metadata
3. drop extra asset categories before dropping the fighter workflow
4. drop live LLM integration before dropping the command DSL
5. drop desktop polish before dropping headless correctness
