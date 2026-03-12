# Product Requirements Document (PRD)

## 1. Product overview

**Working name:** PolyBash

PolyBash is a standalone desktop system for creating **retro low-poly game assets** in the visual range of PS1, N64, and PS2-era content.

It is not trying to replace Blender.
It is trying to become the **best retro asset pipeline** between lightweight toy builders and full 3D DCCs:
- more flexible than Asset Forge
- higher-fidelity than Blockbench
- simpler and more guided than Blender

The product is aimed at people who want to ship real assets, not just assemble demos.
Its standard is not "technically interesting." Its standard is:
- a working asset pipeline
- useful editing
- assets good enough to ship a game

PolyBash is built around **module-first authoring**:
- browse reusable modules
- assemble assets from compatible parts
- edit metadata and constrained shape parameters
- validate the result
- export clean GLB

The system is intentionally opinionated.
It favors constrained, explainable, game-ready workflows over unrestricted mesh editing.

## 2. Product positioning

### Category

PolyBash is a **low-poly game asset content creation system**.

It sits between:
- **Asset Forge** style assembly tools, which are fast but limited
- **Blockbench** style lightweight editors, which are approachable but lower-fidelity
- **Blender**, which is powerful but too broad and too expensive cognitively for the target workflow

### Competitive promise

PolyBash should win on:
- speed of building retro assets from reusable content
- clarity of the content pipeline
- visible, understandable editing affordances
- validation and export readiness
- reuse of modules, style packs, and tagged content libraries

It should not try to win on:
- unrestricted modeling power
- animation authoring
- UV editing
- deep shader authoring

## 3. Target users

### Primary users

- solo indie developers shipping stylized retro games
- small teams that need a fast asset pipeline for low-poly production

### Secondary users

- technical artists building reusable kits, modules, and style packs
- designers who need to generate many asset variants quickly without living in Blender

### Tertiary users

- hobbyists who want a simpler path into game-ready 3D asset creation

## 4. Asset scope

### First-class asset classes

- characters
- props
- weapons

### Serious but secondary for the first real release

- environment pieces
- modular world chunks
- prefab-like scene kits

### Explicit direction

Characters are the flagship workflow.
Environment and world chunk workflows must still be real, not token support, but they do not define the first shipping release.

## 5. Product goals

### Product goals

- Let a user create retro game-ready assets without needing Blender for every edit.
- Provide a reusable module and style-pack pipeline instead of one-off asset assembly.
- Make the product usable enough that a small team could ship game assets made with it.
- Keep the workflow visually understandable and operationally safe.
- Preserve a clean handoff to Blender where Blender remains the better tool.

### Workflow goals

- Fast module browsing and placement
- Clear connector and snap behavior
- Real undo/redo and editing recovery
- Understandable transform and orientation aids
- Reusable content library workflows
- Deterministic validation and export

### Engineering goals

- Preserve Rust as the deterministic source of truth for contracts, domain rules, validation, preview/apply, and export.
- Keep the desktop shell focused on UI, native integration, and orchestration.
- Keep critical paths testable in headless CI.
- Keep the project buildable and honest during autonomous long-run implementation.

## 6. Non-goals

PolyBash near-term scope is **not**:
- a full DCC replacement
- a low-level mesh editor with vertex, edge, or face workflows
- an in-app UV unwrap editor
- an animation authoring package
- a skinning or weight-painting tool
- a sculpting tool
- a shader graph editor
- a multiplayer collaboration product
- a marketplace platform

These may exist as later opportunities, but they are not part of the product contract for the near-term system.

## 7. Product principles

### 7.1 Guided, not unrestricted

PolyBash should present high-level, understandable controls:
- module placement
- constrained parameters
- connectors
- style-pack-aware materials

It should not default to low-level topology manipulation.

### 7.2 Real pipeline over toy delight

The product should optimize for:
- reusable content
- exportable output
- predictable validation
- team-readable asset structure

Not just quick screenshots.

### 7.3 Blender is a partner, not the enemy

PolyBash deliberately relies on Blender for:
- custom source mesh authoring
- UV unwrap/editing
- skinning
- animation
- heavier baking workflows

PolyBash should own the structured assembly and game-asset pipeline around that authored content.

### 7.4 High signal UX

Important state must be visible:
- what module is selected
- where connectors are
- what transforms are active
- what can snap
- what changed
- what is invalid

### 7.5 Reuse is a first-class feature

Reusable modules and style packs are part of the product, not hidden implementation details.

## 8. Core product model

### 8.1 Projects

A project is the editable authoring document for an asset or modular scene assembly.

A project should:
- reference one or more enabled style packs
- contain placed module instances
- store transforms and metadata
- store local copy-on-write overrides where needed
- remain deterministic and serializable

### 8.2 Modules

A module is a reusable authored building block.

Modules may contain:
- pivot/origin data
- connectors
- material zones
- deformation regions
- sockets
- parameterized behaviors where supported

Modules are expected to be imported from Blender-authored source in the near-term product.

### 8.3 Style packs

Style packs are first-class content libraries.

A style pack can contain:
- reusable modules
- tags and categories
- palettes and materials
- decals
- connector taxonomy
- rig templates
- validation rules or limits
- starter/example templates

Multiple style packs can be enabled at once.
Users should be able to browse across packs and filter by pack, category, or tags.

### 8.4 Copy-on-write content behavior

Base modules and packs can be locked.
Users can create local overrides through copy-on-write behavior:
- duplicate a style pack
- duplicate a module
- create local modifications instead of mutating the base pack

This is important for real production use and library safety.

## 9. Core workflows

### 9.1 Character workflow

The primary user flow is:
1. start from a character template or empty character-ready project
2. browse modules from one or more enabled style packs
3. place and connect body parts, armor, accessories, and props
4. adjust constrained parameters on selected modules
5. assign materials, fills, decals, and metadata
6. validate budgets and structural correctness
7. export GLB
8. optionally move to Blender for skinning and animation

### 9.2 Prop and weapon workflow

Users should be able to:
- start from example templates or an empty project
- assemble modular parts quickly
- adjust constrained proportions
- preview and validate materials/metadata
- export with minimal ceremony

### 9.3 Environment and world chunk workflow

PolyBash should support:
- modular environment asset creation
- chunk/prefab-style scene assembly
- tagged environment kits
- optional scripted or randomized layout helpers later

The first priority is reusable environment content and chunk assembly.
Shipping a full level editor is not the first product milestone.

### 9.4 Content pipeline workflow

The reusable content pipeline is critical:
1. author source module mesh in Blender
2. bring it into PolyBash through an import contract
3. define pivots, connectors, material zones, deformation regions, and sockets
4. save it as reusable module/style-pack content
5. assemble downstream assets from that content

Without this workflow, PolyBash remains a shell around fixed demo content.

## 10. Blender boundary

### Blender remains responsible for

- custom mesh modeling for new source modules
- UV unwrap/editing
- skinning
- animation
- heavier baking and DCC-heavy polish

### PolyBash remains responsible for

- module import
- connector authoring
- pivot/origin handling
- material-zone metadata
- deformation-region metadata
- socket metadata
- module browsing and assembly
- style-pack and content-library usage
- validation
- structured preview/apply behavior
- export

### Near-term import expectation

The near-term product does **not** require a Blender addon.
An explicit import contract and supported source format are enough initially.

## 11. Surface, materials, and texturing

PolyBash near-term surface workflow should support:
- material zones
- palette/material assignment
- fills
- decals
- a small set of preview/authoring slots such as:
  - albedo
  - metallic-roughness

PolyBash should **not** become a full texture painting or UV editing package in the first real release.

The product must make the boundary explicit:
- UV unwrap/editing stays in Blender
- PolyBash owns material assignment, preview, and limited surface-layer workflows

## 12. Viewport and UX requirements

A real product version of PolyBash needs:
- module preview/browser clarity
- visible undo/redo
- transform gizmos
- orientation cube or equivalent world-orientation aid
- visible connector points and snap targets
- automatic/intelligent snapping by default
- manual fallback controls when automatic snapping is not enough
- clear edit history

These are product requirements, not polish.

## 13. Randomization and scripting

PolyBash should eventually support two levels of automation:

### Nearer-term

- lightweight scatter
- variants
- simple rule-driven placement helpers

### Later

- heavier scripting, likely via Lua or equivalent
- scripted generation of layouts and module parameter variation

Generated results should be savable back into normal editable project data.

## 14. Functional requirements

### FR-01 Project model

The system must create, open, save, and version project files that reference external module/style-pack content and preserve deterministic authoring state.

### FR-02 Multi-pack browsing

The system must allow multiple style packs to be enabled at once and browsed together.

### FR-03 Tagged content browsing

The system must present modules with:
- thumbnail or preview
- name
- category
- tags
- style-pack attribution

### FR-04 Module placement and assembly

The system must support module-first assembly with stable instance ids, transforms, and connector-aware placement.

### FR-05 Connector visibility and snapping

The system must visualize connector points and support both intelligent default snapping and manual fallback selection.

### FR-06 Constrained module shaping

The system must support high-level constrained parameters and deformation regions rather than low-level topology editing.

### FR-07 Material and surface workflow

The system must support material zones, fills, decals, and limited material slot preview/authoring without owning UV editing.

### FR-08 Reusable content pipeline

The system must support importing Blender-authored module content and attaching PolyBash metadata such as connectors, pivots, material zones, sockets, and deformation regions.

### FR-09 Copy-on-write editing

The system must support safe local overrides or duplication workflows for modules and style packs rather than mutating locked source content directly.

### FR-10 Validation

The system must expose validation that is useful and adjustable rather than purely opinionated preset gating.
Users should be able to see and tune the relevant constraints and inspect resulting asset stats.

### FR-11 Export

The system must export GLB first.
Additional formats may come later if low-cost.

### FR-12 History and recovery

The system must provide real undo/redo behavior and user-visible edit recovery.

### FR-13 Templates and examples

The system must ship example presets and showcase templates for common asset categories.

### FR-14 Environment/chunk support

The system must support modular environment and chunk assembly, even if character/prop workflows remain the first release focus.

## 15. Non-functional requirements

### NFR-01 Deterministic output

The same project and content inputs must produce stable validation and export outputs.

### NFR-02 Headless core validation

Critical import, validation, preview/apply, and export logic must remain testable outside the GUI shell.

### NFR-03 Usable performance

Module browsing, placement, transform edits, validation, and export must feel responsive on a normal development machine for typical retro assets.

### NFR-04 Explicit failure

Import, validation, and export failures must be actionable and typed, not silent.

### NFR-05 Contract clarity

The Blender-owned boundary and PolyBash-owned boundary must remain explicit in docs and implementation.

## 16. Phased scope

### M1: Walking skeleton

The first complete slice proves:
- desktop shell
- Rust core
- project flow
- module assembly
- constrained metadata editing
- validation
- export
- CI

### M2: Authoring MVP

M2 should make the product genuinely usable for character and prop creation:
- usable module browser
- visible undo/redo and transform aids
- visible connector/snap affordances
- real reusable module metadata authoring
- Blender handoff and import workflow
- reusable style-pack/library workflow
- material workflow within the Blender-owned UV boundary

### M3: Production-ready retro asset pipeline

M3 should make the system feel like a serious retro asset production tool:
- stronger environment/chunk workflows
- broader preview/apply coverage
- stronger validation UX
- scripting/randomization support
- packaging and docs polish

## 17. Success criteria

PolyBash is succeeding when:
- a small team can create characters and props through a repeatable pipeline
- reusable module/style-pack content is practical, not theoretical
- users can recover from edits and understand what the viewport is doing
- Blender handoff is clear and low-friction
- exported assets are good enough to ship in a real game

## 18. Explicitly out of scope for the first real release

- in-app UV unwrap/editing
- in-app skinning
- in-app animation authoring
- low-level vertex/edge/face modeling
- multiplayer collaboration
- marketplace/distribution

These are not "forgotten." They are deliberately outside the contract so the product can stay focused and become real.
