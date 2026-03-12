# Risk Register and Descoping Strategy

## 1. Purpose

This document exists to prevent the project from quietly turning into a DCC clone or an incoherent agent-built codebase.

## 2. Key risks

| ID | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R-01 | Scope explodes toward mini-Blender | severe | high | keep module/region workflow; reject freeform feature creep |
| R-02 | Desktop shell and viewport integration slow progress | high | medium | keep core headless and the desktop shell thin; use adapters, projections, and mocks |
| R-03 | Rust/WASM boundary becomes brittle | medium | medium | keep payloads small, versioned, and fixture-tested |
| R-04 | GLB export complexity stalls overnight progress | high | medium | keep exporter minimal and focused on canonical fixture path first |
| R-05 | Painting scope balloons | medium | high | ship material zones and decals before advanced brush tooling |
| R-06 | Rigging scope balloons | medium | high | ship rig metadata and templates before advanced weighting UI |
| R-07 | LLM feature becomes gimmicky or unsafe | medium | high | use structured command DSL only; no direct opaque mesh edits |
| R-08 | Validation becomes an afterthought | severe | medium | validator lives in core and blocks export on fatal errors |
| R-09 | CI/headless coverage misses desktop-shell issues | medium | medium | keep thin manual smoke checklist and clear separation of concerns |
| R-10 | Asset taxonomy becomes inconsistent | medium | medium | centralize style packs, connector taxonomy, and module descriptors |

## 3. Descoping order

When time runs out or implementation reality hits, remove work in this order:

1. advanced freehand painting
2. smooth skin weighting UI
3. additional asset categories beyond fighter + weapon + prop
4. live LLM integration
5. GUI polish
6. non-essential editor conveniences

Do **not** remove:
- `.zxmodel`
- style packs
- validation
- GLB export
- tests
- report generation
- fighter vertical slice

## 4. Kill criteria for specific sub-features

### Painting
If painting cannot be implemented cleanly in the overnight pass:
- keep material zones
- keep fill/decal data model
- defer rich brush tooling

### Rigging
If rigging becomes too large:
- keep rig template metadata
- keep socket metadata
- defer advanced weighting UI

### LLM
If LLM integration introduces uncertainty:
- ship the command DSL only
- ship example command fixtures
- defer live provider integration

### Desktop integration
If desktop shell behavior is unstable:
- keep the desktop shell buildable
- maximize controller, projection, and adapter tests
- defer richer in-app polish

## 5. Technical debt policy

Allowed temporary debt:
- thin UI placeholders
- minimal styling
- limited editor affordances
- clearly labeled stretch tasks

Forbidden debt:
- undocumented schema changes
- bypassed validation
- hidden TODOs on critical path
- skipped acceptance tests without task ids
- duplicate competing source formats

## 6. Recovery strategy if overnight run ends partial

If the overnight run is incomplete, the morning triage order is:

1. green up the repository
2. restore export/validate path
3. restore project round-trip
4. restore acceptance fixture integrity
5. review desktop shell last

This keeps the codebase salvageable.

## 7. Risks to watch during human review

Red flags that indicate the implementation drifted:
- exporter is desktop-shell-only and not in Rust
- validation lives mostly in desktop UI code
- direct mesh editing supersedes module/region workflow
- GLB export only works on one handcrafted example and is not tested
- LLM path applies edits without preview
- docs and code disagree on contracts
