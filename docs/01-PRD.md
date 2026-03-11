# Product Requirements Document (PRD)

## 1. Product overview

**Working name:** PolyBash

PolyBash is a beginner-friendly retro 3D asset builder focused on creating game-ready meshes that sit between Asset Forge and Blender.

It is intended to support:
- props
- weapons
- characters
- vehicles
- modular environment chunks

The tool is built around:
- module-driven kitbashing
- constrained shaping instead of full freeform modeling
- palette/material assignment and lightweight painting
- rig templates and rig metadata
- strict export validation
- clean GLB export
- an optional LLM-assisted structured editing layer

The output target is a pipeline suitable for Nethercore ZX-style games and similar retro 3D engines.

## 2. Problem statement

General-purpose DCCs are powerful but hostile to beginners and slow for constrained retro asset production. Simple kitbash tools are fast, but too limiting for expressive characters, weapons, vehicles, and reusable game assets.

The gap:
- beginners need structure
- technical users need speed
- game developers need export-ready assets
- retro aesthetics benefit from explicit constraints and validation

## 3. Product vision

Create a constrained 3D asset builder that:
- feels approachable to non-expert modelers
- still produces usable, game-ready meshes
- preserves style consistency through style packs
- avoids “mini-Blender” scope creep
- can hand off to Blender for advanced animation when needed

## 4. Target users

### Primary
Solo and small-team indie game developers making retro 3D games.

### Secondary
Technical artists or designers who want to author variations quickly without deep modeling knowledge.

### Tertiary
Writers/designers using LLM assistance to propose characters or props that can then be turned into structured editable assets.

## 5. Primary use cases

1. Create a fighter character from a template, swap parts, adjust silhouette, assign palette/material zones, export to GLB, and continue animation in Blender.
2. Create a weapon or prop by assembling modules and adjusting a few guided deformation controls.
3. Create modular environment chunks using connectors and a style pack with enforced texture and mesh budgets.
4. Use natural language to request structured edits, preview them, and apply them safely.

## 6. Goals

### Product goals
- Enable a novice to produce a usable retro asset quickly.
- Keep assets within style-pack and engine budget constraints.
- Export deterministic game-ready GLB files.
- Preserve an editable authoring format.
- Support a direct path to Blender for animation and polish.
- Make validation a first-class feature rather than an afterthought.

### Engineering goals
- Maintain a strict separation between UI/host logic and deterministic core logic.
- Drive development with TDD.
- Make contracts explicit and versioned.
- Make all critical paths testable in headless CI.

## 7. Non-goals

PolyBash v1 is **not**:
- a full DCC replacement
- a sculpting tool
- a node material editor
- a full animation package
- a cloth/hair simulation tool
- a procedural modeling graph tool
- a marketplace platform
- an unconstrained text-to-mesh generator

## 8. UX principles

1. **Guided over open-ended**  
   Prefer templates, constrained edits, and high-signal controls.

2. **Game-ready by default**  
   Export, budgets, and validation are always visible.

3. **Beginner-friendly, not toy-like**  
   The system should feel approachable without preventing professional output.

4. **Visual edits should map to clear data**  
   Every user action should correspond to structured project data.

5. **Safe LLM assistance**  
   Natural-language input should produce reversible structured edits.

## 9. Product scope

## 9.1 Overnight target (P0 walking skeleton)

The overnight target is the smallest end-to-end product slice that proves the architecture:

- create/open/save `.zxmodel`
- load a style pack
- load module descriptors
- browse modules by category
- place modules in a scene
- connect modules using snap/connect rules
- apply constrained deformations to authored regions
- assign material zones from a palette/material preset
- assign a rig template and socket metadata
- export `.glb`
- run validation and emit a report
- provide example fixtures and tests

## 9.2 V1 scope

### Asset authoring
- templates for fighter, prop, weapon, vehicle, room chunk
- part library with category filters and tags
- symmetry and mirroring support
- connector-driven placement
- transform gizmo integration
- constrained silhouette controls

### Surface workflow
- material slot assignment
- palette presets
- texture atlas generation/management
- decals and basic paint layers
- texture import/export

### Rigging/export
- biped, mech, and vehicle rig templates
- rigid / hybrid / smooth rig modes
- sockets and engine metadata
- GLB export
- validation report

### LLM assistance
- convert natural language into structured edit suggestions
- preview before apply
- apply with undo support
- validator-aware feedback

## 9.3 Deferred after v1
- advanced paint brushes
- smooth skin paint UI
- animation timeline and editor
- custom shader authoring
- online sharing/distribution
- collaborative editing

## 10. Functional requirements

### FR-01 Project lifecycle
The system must create, open, save, and version `.zxmodel` files.

### FR-02 Template initialization
The system must initialize a new project from a supported template:
- fighter
- prop
- weapon
- vehicle
- modular chunk

### FR-03 Style packs
The system must load a style pack that defines:
- budgets
- palette/material presets
- connector taxonomy
- rig templates
- paint rules
- asset category allowances

### FR-04 Module library
The system must display modules by:
- category
- asset type
- tags
- compatibility with current style pack

### FR-05 Placement
The system must place module instances in the scene with transform metadata.

### FR-06 Snap/connect
The system must support connector-based snapping with validation of compatible connector types.

### FR-07 Symmetry/mirroring
The system must support mirrored placement or mirrored module generation where applicable.

### FR-08 Guided deformation
The system must support constrained deformations on authored regions, including a minimal initial set:
- scale
- taper
- bulge
- bend
- twist

### FR-09 Material zones
The system must allow per-zone material/palette assignments.

### FR-10 Paint layers
The system must support a minimal paint layer model:
- fill
- decal
- optional brush stroke placeholder in first slice

### FR-11 Rig templates
The system must apply rig templates and store rig metadata on the asset.

### FR-12 Socket metadata
The system must support named sockets/hardpoints bound to bones or transforms.

### FR-13 Export
The system must export a GLB file suitable for downstream tools and engine ingestion.

### FR-14 Validation
The system must validate:
- mesh budgets
- texture budgets
- style pack constraints
- connector integrity
- required metadata
- export completeness

### FR-15 Reporting
The system must emit a structured report summarizing statistics, warnings, and errors.

### FR-16 Undoability
Edits must be representable as reversible project operations, at least at the command level.

### FR-17 LLM command layer
The system must define a structured command DSL for natural-language-assisted edits, even if the first overnight slice ships with a mock or stub interpreter.

## 11. Non-functional requirements

### NFR-01 Determinism
The same input project and style pack must produce the same export and report.

### NFR-02 Headless testability
Critical logic must be runnable in CI without a GUI host.

### NFR-03 Performance
Common operations on a typical fighter asset should feel interactive on a normal development machine.

### NFR-04 Safety
Validation and import/export paths must fail explicitly on invalid inputs.

### NFR-05 Compatibility
The system must keep authoring and export contracts versioned and backwards-conscious.

### NFR-06 Observability
Failures must produce actionable errors.

### NFR-07 Coverage
Critical core logic must meet the coverage and test gate requirements defined in the quality doc.

## 12. Success metrics

### Product metrics
- A new user can produce a basic fighter asset in under 20 minutes using a template and modules.
- The export path works on all canonical fixtures.
- Validation catches out-of-budget fixtures before export acceptance.
- The authoring format stays editable after repeated load/save cycles.

### Engineering metrics
- All P0 acceptance criteria are automated except explicitly documented manual smoke checks.
- Core contract/validation/export crates meet coverage targets.
- The plugin bundle builds reproducibly from a clean environment.

## 13. Constraints and assumptions

- The project will avoid building a full standalone DCC in the first implementation.
- Blockbench is the initial editor host for v1.
- Rust is the deterministic core.
- TypeScript is the plugin layer.
- Blender remains the downstream animation tool.
- GLB is the export target.
- `.zxmodel` is the authoring source of truth.

## 14. Open issues intentionally closed by decision

The following are treated as resolved defaults for v1 so implementation can begin without drift:

- animation authoring is downstream, not in-scope for overnight
- style packs own budgets and palettes
- LLM assistance uses structured commands only
- direct freeform mesh editing is not the main workflow
- validation runs both during authoring and export
