# Work Breakdown Structure (WBS) and Milestones

## 1. Overview

This WBS is organized around the actual product direction:

- **M1:** finish the standalone walking skeleton
- **M2:** make PolyBash a genuinely usable character-and-prop authoring MVP
- **M3:** extend the same product into a broader retro asset production system with environment workflows and reusable content pipelines

The product is intentionally **not** a general 3D DCC.
It is a **module-first, high-level, retro asset creation system** that sits between Asset Forge and Blender:

- more flexible and metadata-aware than Asset Forge
- higher fidelity and broader content workflows than Blockbench
- much simpler than Blender

Near-term scope remains explicit:

- no in-app UV unwrap or UV editing
- no animation authoring
- no skinning/weight painting authoring
- no low-level face/edge/vertex modeling workflow

For M2 and the first serious release, **Blender remains the owner of mesh authoring, UVs, skinning, and animation**, while **PolyBash owns module import, metadata authoring, assembly, validation, and export**.

## 2. Milestones

### M0 - Planning and launch pack complete

Done when:
- PRD exists and matches the real product direction
- architecture exists and matches the standalone desktop path
- acceptance matrix exists
- prompt pack and handoff docs exist
- taskboard and runloop prompts are aligned

### M1 - Walking skeleton complete

Done when:
- repo scaffold exists
- contracts compile
- standalone desktop shell builds
- native document flow works
- style packs load
- assembly, deformation, material, and rig metadata paths exist
- example projects validate
- GLB export works on the canonical fighter fixture
- report generation works
- CI is green

### M2 - Authoring MVP complete

This is the first milestone where the product should stop feeling like a toy.

Done when:
- character and prop workflows are genuinely usable
- module browsing is understandable and visual
- visible undo/redo and action-history UX exist
- visible transform/orientation aids exist in the viewport
- visible connector and snap affordances exist
- reusable module metadata authoring exists
- Blender-authored modules can be imported and reused
- multiple style packs can be enabled and browsed together
- copy-on-write overrides for modules/materials/style-pack content exist
- material/basic paint workflows are usable within a Blender-owned UV pipeline
- validation/export UX is usable enough for real asset production

### M3 - Production-ready retro asset system

Done when:
- character and prop workflows are stable and fast
- environment/world chunk workflows are serious and reusable
- style-pack and module library workflows are robust
- scripting/randomization exists for layout and parameter generation
- content pipeline from Blender to PolyBash to GLB is well documented and repeatable
- release packaging, docs, and onboarding are polished

## 3. Work packages

| ID | Work package | Outputs | Depends on | Lane | Priority |
|---|---|---|---|---|---|
| WP-00 | Program setup | repo, taskboard, CI skeleton | none | trunk | P0 |
| WP-01 | Contracts and schemas | Rust contracts, JSON Schema, TS bindings | WP-00 | contracts | P0 |
| WP-02 | Example fixtures | `.zxmodel`, style pack, report examples | WP-01 | contracts | P0 |
| WP-03 | Rust domain core | normalized project logic, command application, preview/apply | WP-01 | core | P0 |
| WP-04 | Geometry ops | connector math, transforms, region params | WP-03 | core | P0 |
| WP-05 | Validator | typed validation pipeline and report | WP-03, WP-04 | core | P0 |
| WP-06 | Exporter | GLB export bundle | WP-03, WP-05 | core | P0 |
| WP-07 | CLI | validate and export commands | WP-05, WP-06 | core | P0 |
| WP-08 | Desktop bridge | Tauri command surface and typed payloads | WP-03, WP-05, WP-06 | bridge | P0 |
| WP-09 | Desktop shell | buildable desktop app, state model, adapter seams | WP-00, WP-01, WP-08 | desktop | P0 |
| WP-10 | Project workflow | create, open, save, style-pack loading, native dialogs | WP-09 | desktop | P0 |
| WP-11 | Assembly workflow | browse, add, remove, attach, detach, mirror modules | WP-08, WP-09 | desktop | P0 |
| WP-12 | Deformation workflow | region parameter editing | WP-08, WP-11 | desktop | P0 |
| WP-13 | Material workflow | zone assignment, fill/decal model, material preview/apply | WP-08, WP-11 | desktop | P0 |
| WP-14 | Rig metadata workflow | rig template and sockets | WP-08, WP-10 | desktop | P0 |
| WP-15 | CI and quality gates | build, test, lint, coverage pipeline | WP-00 | qa | P0 |
| WP-16 | Acceptance harness | fixture-driven acceptance suite | WP-05, WP-06, WP-10..WP-14 | qa | P0 |
| WP-17 | Release docs and handoff | README, usage notes, gap/status docs | WP-15, WP-16 | trunk | P0 |
| WP-18 | Module preview/browser | visual module browser, previews, category/tag browsing | WP-11 | desktop | P1 |
| WP-19 | Undo/redo and history UX | visible undo, redo, history model and action stack | WP-11, WP-12, WP-13 | desktop | P1 |
| WP-20 | Viewport gizmos and orientation | move/rotate/scale gizmos, orientation cube, clearer transform affordances | WP-11, WP-12 | desktop | P1 |
| WP-21 | Connector visibility and snap UX | visible connector points, snap targets, stronger snap flows | WP-11, WP-20 | desktop | P1 |
| WP-22 | Module metadata authoring | pivots, connectors, material zones, regions, sockets on reusable modules | WP-11, WP-13, WP-14 | desktop/core | P1 |
| WP-23 | Blender handoff and module import | import pipeline for Blender-authored modules, handoff contract, canonical imported fixtures | WP-10, WP-11, WP-22 | pipeline | P1 |
| WP-24 | Style-pack and reusable library workflow | multi-pack browsing, enable/disable packs, tagging, copy-on-write overrides, duplicated packs | WP-18, WP-22, WP-23 | desktop/pipeline | P1 |
| WP-25 | Material strategy and texture boundary | material slot model, preview slots, Blender-owned UV contract, fixture/docs coverage | WP-13, WP-23 | desktop/core | P1 |
| WP-26 | Character and prop production workflow | integrated first-class workflow for shipping characters, props, and weapons | WP-18..WP-25 | desktop/pipeline | P1 |
| WP-27 | Environment and world chunk workflow | modular chunk assembly, prefab-oriented environment workflow, scene/chunk authoring | WP-18, WP-21, WP-24 | desktop | P2 |
| WP-28 | Validation and export UX hardening | issue navigation, actionable report UX, export affordances, clearer production feedback | WP-05, WP-06, WP-16 | desktop/core | P1 |
| WP-29 | Scripting and randomization layer | scatter/variant helpers, later Lua-style scripting, persistence of generated results | WP-24, WP-27 | desktop/core | P2 |

## 4. Detailed work decomposition

### WP-18 Module preview/browser

Tasks:
- add a dedicated module preview/browser panel
- show thumbnail or proxy previews
- show names, categories, and tags
- support multiple enabled style packs
- make placement understandable before the user commits

Done criteria:
- users can understand a module before placing it
- preview browsing is covered in desktop tests
- browser supports category/tag-based discovery

### WP-19 Undo/redo and history UX

Tasks:
- surface visible undo and redo controls
- show actual edit history, not just hidden snapshot state
- support multi-step recovery
- keep preview/apply flows consistent with history

Done criteria:
- multi-step undo/redo is covered in desktop tests
- common editing mistakes can be recovered from without reload
- history labels are understandable to users

### WP-20 Viewport gizmos and orientation

Tasks:
- add world orientation widget
- add visible move, rotate, and scale gizmos
- support clearer transform affordances than hidden modifier drags
- preserve deterministic command-backed transforms

Done criteria:
- gizmo-driven transforms are covered in tests where practical
- users can discover transform tools without prior knowledge of hidden shortcuts

### WP-21 Connector visibility and snap UX

Tasks:
- render connector points in the viewport
- render visible snap targets and connector highlights
- allow toggled visibility for connectors
- improve automatic snapping while preserving manual fallback

Done criteria:
- users can inspect snap/connect locations directly
- automatic snapping works for common cases
- manual fallback exists when automatic choice is wrong

### WP-22 Module metadata authoring

Tasks:
- author and edit pivots
- author and edit connectors
- author material zones
- author deformation regions
- author sockets

Done criteria:
- reusable modules can be annotated inside PolyBash
- metadata persists in reusable module/style-pack content
- metadata authoring is validated and test-covered

### WP-23 Blender handoff and module import

Tasks:
- define import contract for Blender-authored source meshes
- import modules from Blender-friendly interchange formats
- preserve pivots/origin and expected metadata seams
- provide canonical imported-module fixtures
- document the handoff path

Done criteria:
- a Blender-authored module can be imported and used in the desktop shell
- import contract is documented and repeatable
- pipeline does not require a Blender addon to be viable

### WP-24 Style-pack and reusable library workflow

Tasks:
- enable multiple style packs at once
- browse by tags/categories across packs
- support locked base packs/modules
- support copy-on-write local overrides
- support duplicated packs for local customization

Done criteria:
- users can treat style packs as real reusable production libraries
- local overrides do not destroy base content
- library browsing remains understandable at scale

### WP-25 Material strategy and Blender-owned UV boundary

Tasks:
- define supported in-app material slot model
- support a few useful preview/authoring slots
- formalize the Blender-owned UV contract in docs and fixtures
- keep PolyBash focused on material assignment, fill/decal, and preview rather than unwrap editing

Done criteria:
- docs and fixtures make the UV boundary explicit
- material workflow is useful without pretending to be a full UV editor

### WP-26 Character and prop production workflow

Tasks:
- integrate module browser, gizmos, history, connectors, import, and materials into one coherent workflow
- optimize for shipping characters, weapons, and props
- provide showcase/example starter templates without overfitting the product to them

Done criteria:
- a user can make a production-credible character or prop workflow without dropping into low-level mesh editing
- the workflow feels like a real product rather than a shell demo

### WP-27 Environment and world chunk workflow

Tasks:
- support modular environment/chunk assembly
- support prefab-oriented world authoring
- support reusable architectural/environment kits
- reserve full scene-editor ambitions for later hardening

Done criteria:
- environments are serious second-class workflows, not ignored
- environment authoring reuses the same module/library model as characters and props

### WP-28 Validation and export UX hardening

Tasks:
- improve report visibility and navigation
- make export flow clearer and less opaque
- expose production-relevant metrics and validation feedback in the shell

Done criteria:
- validation and export feel production-facing, not like hidden backend calls
- users can understand why an asset is blocked or valid

### WP-29 Scripting and randomization layer

Tasks:
- add light scatter/variant helpers first
- later add scriptable generation hooks
- allow generated results to be persisted back into editable content

Done criteria:
- procedural helpers accelerate production instead of creating opaque non-editable output
- any script-generated result can be saved back into normal editable project/module data

## 5. Parallelization guidance

### Parallel lane A - core and contracts

Work on WP-01 through WP-06 first, then only revisit core when desktop or pipeline work exposes real gaps.

### Parallel lane B - desktop usability

Prioritize:
1. WP-19 undo/redo UX
2. WP-20 viewport gizmos/orientation
3. WP-21 connector visibility and snap UX
4. WP-18 module preview/browser

These are the highest-value lanes for turning the shell into something people can tolerate using.

### Parallel lane C - content pipeline

After the first usability blockers start landing, prioritize:
1. WP-23 Blender handoff and module import
2. WP-22 module metadata authoring
3. WP-24 style-pack/library workflow
4. WP-25 material strategy boundary

### Parallel lane D - workflow integration

Use WP-26 and WP-28 to unify the earlier work into something production-credible.

### Parallel lane E - later growth

Reserve WP-27 and WP-29 for later waves once characters/props and content pipeline are clearly working.

## 6. 24-72 hour autonomous run guidance

### First 24 hours

Target the highest product-usability blockers:

1. WP-19 undo/redo UX
2. WP-20 viewport gizmos/orientation
3. WP-21 connector visibility
4. WP-18 module preview/browser

### 24 to 48 hours

Target the missing production pipeline:

1. WP-23 Blender handoff and module import
2. WP-22 module metadata authoring
3. WP-24 style-pack/library workflow
4. WP-25 material strategy boundary

### 48 to 72 hours

Unify, validate, and harden:

1. WP-26 character/prop production workflow
2. WP-28 validation/export UX
3. docs, examples, acceptance coverage, and honest handoff

## 7. Descoping order if time or complexity explodes

Keep the product useful by dropping in this order:

1. delay environment/world chunk workflow before weakening character/prop workflow
2. delay scripting/randomization before weakening module import and library workflows
3. delay richer paint/texturing before weakening material assignment and preview
4. delay broader preview UX before weakening undo/redo or gizmo discoverability
5. never trade away the Blender-owned UV boundary just to claim broader scope
