# Blender Handoff Contract

## Purpose

This document makes the current PolyBash Blender handoff boundary explicit.

It describes the supported import shapes for reusable modules, what Blender owns, what PolyBash owns, and what the current validator guarantees. It is intentionally narrow: the current walking-skeleton and M2 work stop at a metadata-first contract around a referenced `.glb` source asset, and that narrow boundary is the intended product stance until a future task explicitly expands it.

## Ownership Boundary

### Blender owns

- mesh authoring and topology changes
- pivot placement in the authored source asset
- UV unwrap and UV edits
- material slot and texture authoring before import
- exporting the reusable source `.glb`

### PolyBash owns

- the reusable-module import contract file
- connector metadata
- deformation region metadata
- declared material zones used by PolyBash fills and decals
- style-pack compatibility checks
- in-app assembly, validation, and downstream export

## Supported Import Shapes

PolyBash currently accepts two reusable-module import shapes through the same desktop command seam:

1. `.moduleimport.json`
   - versioned handoff contract for Blender-authored modules
2. `.module.json`
   - descriptor-style fallback for narrower or already-normalized module descriptors

Both file shapes end up at the same reusable-module validation boundary inside the desktop Rust bridge, and both now have positive desktop coverage through import, placement, validation, and export.

## Required Fields

Imported reusable modules must declare:

- `id`
- `assetType`
- `sourceAsset`
- `connectors`
- `regions`
- `materialZones`

`sourceAsset` must provide:

- `path`
- `format`

## Current Validation Guarantees

The current desktop import validator guarantees that imported reusable modules:

- reference a `sourceAsset.format` of `glb`
- point at a `sourceAsset.path` that exists on disk
- use an `assetType` supported by the active style pack
- declare at least one material zone
- do not use blank or whitespace-only material-zone ids
- do not duplicate material-zone ids
- do not duplicate connector ids
- do not duplicate region ids
- use connector kinds known to the active style pack taxonomy
- do not declare regions where `min > max`

These checks currently apply to both `.moduleimport.json` and descriptor-style `.module.json` imports.

## What PolyBash Does Not Validate Yet

The current contract does not deeply inspect:

- UV topology or UV layout quality
- mesh manifoldness or geometry quality
- pivot correctness inside the referenced `.glb`
- material-slot naming inside the `.glb`
- texture contents or atlas structure

That is intentional for this slice. PolyBash validates the declared metadata seam around the imported `.glb`; Blender remains the source of truth for deeper mesh and UV work.

## Canonical Fixtures

### Valid

- `fixtures/imports/valid/prop_crate_round_a.moduleimport.json`
- `fixtures/imports/valid/fighter_shoulder_guard_a.module.json`

### Invalid

- `fixtures/imports/invalid/prop_crate_bad.moduleimport.json`
- `fixtures/imports/invalid/prop_crate_no_materials.moduleimport.json`
- `fixtures/imports/invalid/prop_crate_duplicate_materials.moduleimport.json`
- `fixtures/imports/invalid/prop_crate_blank_zone.moduleimport.json`
- `fixtures/imports/invalid/fighter_shoulder_guard_no_materials.module.json`
- `fixtures/imports/invalid/fighter_shoulder_guard_duplicate_materials.module.json`
- `fixtures/imports/invalid/fighter_shoulder_guard_blank_zone.module.json`

## Recommended Authoring Flow

1. Author or refine the reusable mesh and UVs in Blender.
2. Export a source `.glb`.
3. Author the PolyBash import contract beside that asset.
4. Import it through the desktop shell.
5. Inspect source-asset, connector, region, and material-zone metadata in the module browser.
6. Save the resulting authored or imported library changes back to style-pack JSON with `Save Style Pack As` when you want them to persist.

## Non-Goals For This Slice

- in-app UV editing
- direct mesh inspection as part of import
- automatic topology healing
- material-slot inference from raw mesh data
- turning PolyBash into a Blender replacement