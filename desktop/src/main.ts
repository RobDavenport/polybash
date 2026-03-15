import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  buildAddModuleAndSnapRequest,
  buildPrimarySuggestedPlacementRequest,
  buildSuggestedPlacementAlternativeSummary,
  buildModuleLibrarySelectionFeedback,
  buildRigDetail,
  buildModuleLibrary,
  buildModuleLibraryAddActionHint,
  buildModuleLibraryAddActionLabel,
  buildModuleLibraryPreview,
  buildModuleLibrarySummary,
  buildModuleCards,
  buildSelectedModuleDetail,
  buildSelectedModuleValidationDetail,
  filterModuleLibrary,
  searchModuleLibrary,
  buildSuggestedPlacementGroups,
  resolveSelectedModuleId,
  type ModuleLibraryEntry,
  type ModuleLibraryFilter
} from "./documentInspector";
import {
  ensureProjectSavePath,
  ensureStylePackSavePath,
  resolveDialogPath,
  suggestProjectSavePath,
  suggestStylePackSavePath
} from "./documentPaths";
import {
  buildVisibleHistoryEntries,
  createHistoryState,
  pushHistoryEntry,
  redoHistory,
  undoHistory
} from "./historyState";
import {
  addReusableModuleDraftRegion,
  applyReusableModuleDraft,
  duplicateReusableModule,
  createReusableModuleDraft,
  deleteReusableModule,
  renameReusableModule,
  suggestDuplicateReusableModuleId,
  type ReusableModuleDraft,
  setReusableModuleDraftMaterialZones,
  updateReusableModuleDraftConnector
} from "./moduleDraft";
import {
  parseReusableModuleMaterialZones,
  validateReusableModuleRegionDraft
} from "./moduleDraftForm";
import {
  resolveConnectorSelectValue,
  resolveMaterialSelectValue,
  resolveRegionSliderValue,
  resolveRigTemplateValue,
  resolveTransformInputValue,
  resolveVisibleSockets,
  type PendingEditPreview,
  type PendingMaterialPreview
} from "./materialPreviewState";
import { buildProxyScene } from "./sceneProjection";
import "./styles.css";
import type {
  DesktopCommandPreview,
  DesktopDocument,
  DesktopExportBundle,
  DesktopHistoryState,
  DesktopPaths,
  DesktopUndoSnapshot,
  EditCommand,
  TransformField,
  ValidationReport
} from "./types";
import { mountViewport } from "./viewportController";

type ViewState = {
  document?: DesktopDocument;
  report?: ValidationReport;
  exportBundle?: DesktopExportBundle;
  status: string;
  error?: string;
  projectId: string;
  projectPath: string;
  stylePackPath: string;
  savePath: string;
  moduleImportPath: string;
  socketName: string;
  socketBone: string;
  decalDraftId: string;
  selectedModuleId?: string;
  selectedLibraryModuleId?: string;
  libraryFilter: ModuleLibraryFilter;
  librarySearch: string;
  authoredModuleIds: string[];
  reusableModuleDraft?: ReusableModuleDraft;
  reusableModuleMaterialZonesInput: string;
  reusableModuleRegionId: string;
  reusableModuleRegionMin: string;
  reusableModuleRegionMax: string;
  history: DesktopHistoryState;
  pendingEditPreview?: PendingEditPreview;
};

const state: ViewState = {
  status: "Idle",
  projectId: "fighter_template_01",
  projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
  stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
  savePath: "out/desktop/fighter_basic_saved.zxmodel.json",
  moduleImportPath: "fixtures/imports/valid/prop_crate_round_a.moduleimport.json",
  history: createHistoryState(),
  socketName: "weapon_r",
  socketBone: "hand_r",
  decalDraftId: "dragon_01",
  reusableModuleMaterialZonesInput: "",
  reusableModuleRegionId: "",
  reusableModuleRegionMin: "",
  reusableModuleRegionMax: "",
  libraryFilter: "all",
  librarySearch: "",
  authoredModuleIds: []
};

let disposeViewport: (() => void) | undefined;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function render(): void {
  const app = globalThis.document.querySelector<HTMLDivElement>("#app");
  if (!app) {
    return;
  }

  disposeViewport?.();
  disposeViewport = undefined;

  const loadedDocument = state.document;
  const report = state.report;
  const exportBundle = state.exportBundle;
  const selectedModuleId = loadedDocument
    ? resolveSelectedModuleId(loadedDocument, state.selectedModuleId)
    : undefined;
  const cards = loadedDocument ? buildModuleCards(loadedDocument, selectedModuleId) : [];
  const library = loadedDocument ? buildModuleLibrary(loadedDocument, state.authoredModuleIds) : [];
  const librarySummary = buildModuleLibrarySummary(library);
  const visibleLibrary = searchModuleLibrary(filterModuleLibrary(library, state.libraryFilter), state.librarySearch);
  const selectedLibraryModuleId = loadedDocument
    ? resolveSelectedLibraryModuleId(visibleLibrary, state.selectedLibraryModuleId)
    : undefined;
  const selectedLibraryPreview = loadedDocument && selectedLibraryModuleId
    ? buildModuleLibraryPreview(loadedDocument, selectedLibraryModuleId, state.authoredModuleIds)
    : undefined;
  const suggestedPlacementGroups = buildSuggestedPlacementGroups(selectedLibraryPreview);
  const suggestedPlacementAlternativeSummary = buildSuggestedPlacementAlternativeSummary(selectedLibraryPreview);
  const primarySuggestedPlacementRequest = selectedLibraryModuleId
    ? buildPrimarySuggestedPlacementRequest(selectedLibraryModuleId, selectedLibraryPreview)
    : undefined;
  const libraryAddActionLabel = buildModuleLibraryAddActionLabel(selectedLibraryPreview);
  const libraryAddActionHint = buildModuleLibraryAddActionHint(selectedLibraryPreview);
  const reusableModuleDraft =
    state.reusableModuleDraft?.id === selectedLibraryModuleId ? state.reusableModuleDraft : undefined;
  const rigDetail = loadedDocument ? buildRigDetail(loadedDocument) : undefined;
  const selectedDetail = loadedDocument
    ? buildSelectedModuleDetail(loadedDocument, selectedModuleId)
    : undefined;
  const selectedLibraryPlacementFeedback = buildModuleLibrarySelectionFeedback(selectedLibraryPreview, selectedDetail);
  const selectedValidationDetail = loadedDocument
    ? buildSelectedModuleValidationDetail(report, loadedDocument, selectedModuleId)
    : undefined;
  const pendingMaterialPreview: PendingMaterialPreview | undefined =
    selectedDetail && state.pendingEditPreview?.kind === "material" && state.pendingEditPreview.instanceId === selectedDetail.instanceId
      ? state.pendingEditPreview
      : undefined;
  const pendingTransformPreview =
    selectedDetail && state.pendingEditPreview?.kind === "transform" && state.pendingEditPreview.instanceId === selectedDetail.instanceId
      ? state.pendingEditPreview
      : undefined;
  const pendingRegionPreview =
    selectedDetail && state.pendingEditPreview?.kind === "region" && state.pendingEditPreview.instanceId === selectedDetail.instanceId
      ? state.pendingEditPreview
      : undefined;
  const pendingConnectorPreview =
    selectedDetail && state.pendingEditPreview?.kind === "connector" && state.pendingEditPreview.instanceId === selectedDetail.instanceId
      ? state.pendingEditPreview
      : undefined;
  const pendingRigTemplatePreview = state.pendingEditPreview?.kind === "rig_template"
    ? state.pendingEditPreview
    : undefined;
  const pendingSocketPreview = state.pendingEditPreview?.kind === "socket"
    ? state.pendingEditPreview
    : undefined;
  const visibleRigSockets = rigDetail
    ? resolveVisibleSockets(rigDetail.sockets, pendingSocketPreview)
    : [];
  const visibleHistoryEntries = buildVisibleHistoryEntries(state.history);
  const selectedDecalDraftId = selectedDetail?.paint.availableDecalIds.includes(state.decalDraftId)
    ? state.decalDraftId
    : (selectedDetail?.paint.availableDecalIds[0] ?? "");
  const viewportHint = !loadedDocument
    ? undefined
    : selectedDetail
      ? `Selected ${selectedDetail.instanceId}. Drag to translate it, hold Shift while dragging to scale uniformly, or hold Alt while dragging to rotate around Z.`
      : "Select a module chip, then drag in the viewport to translate it, hold Shift while dragging to scale uniformly, or hold Alt while dragging to rotate around Z.";

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <p class="eyebrow">Standalone Low-Poly Builder</p>
        <h1>PolyBash Desktop</h1>
        <p class="lede">
          Guided kitbashing, validation-first workflows, and deterministic export without the old plugin host.
        </p>
        <div class="path-form">
          <label>
            <span>Template Project Id</span>
            <input id="project-id" value="${escapeHtml(state.projectId)}" />
          </label>
          <label>
            <span>Project Path</span>
            <div class="path-input-row">
              <input id="project-path" value="${escapeHtml(state.projectPath)}" />
              <button id="browse-project" class="secondary-button" type="button">Browse</button>
            </div>
          </label>
          <label>
            <span>Style Pack Path</span>
            <div class="path-input-row">
              <input id="stylepack-path" value="${escapeHtml(state.stylePackPath)}" />
              <button id="browse-stylepack" class="secondary-button" type="button">Browse</button>
            </div>
          </label>
          <label>
            <span>Save Path</span>
            <div class="path-input-row">
              <input id="save-path" value="${escapeHtml(state.savePath)}" />
              <button id="browse-save" class="secondary-button" type="button" ${
                loadedDocument ? "" : "disabled"
              }>Save As</button>
            </div>
          </label>
          <label>
            <span>Module Import Path</span>
            <input id="module-import-path" value="${escapeHtml(state.moduleImportPath)}" />
          </label>
        </div>
        <div class="actions">
          <button id="create-template">New Fighter</button>
          <button id="load">Load Paths</button>
          <button id="load-canonical">Load Canonical Fighter</button>
          <button id="save" ${loadedDocument ? "" : "disabled"}>Save Project</button>
          <button id="save-as" ${loadedDocument ? "" : "disabled"}>Save As</button>
          <button id="save-stylepack-as" class="secondary-button" ${loadedDocument ? "" : "disabled"}>Save Style Pack As</button>
          <button id="import-module" class="secondary-button" ${loadedDocument ? "" : "disabled"}>Import Module Contract</button>
          <button id="undo" class="secondary-button" ${state.history.past.length > 0 ? "" : "disabled"}>Undo</button>
          <button id="redo" class="secondary-button" ${state.history.future.length > 0 ? "" : "disabled"}>Redo</button>
          <button id="validate" ${loadedDocument ? "" : "disabled"}>Validate</button>
          <button id="export" ${loadedDocument ? "" : "disabled"}>Export Preview</button>
        </div>
        <div class="status">
          <span>Status</span>
          <strong>${escapeHtml(state.status)}</strong>
          ${state.error ? `<p class="status-error">${escapeHtml(state.error)}</p>` : ""}
        </div>
        <div class="history-panel">
          <span class="history-heading">Action History</span>
          <strong>${state.history.past.length} undo / ${state.history.future.length} redo</strong>
          <ul class="history-list">
            ${visibleHistoryEntries.length > 0
              ? visibleHistoryEntries
                  .map(
                    (entry) => `
                      <li class="history-item history-item-${entry.direction}">
                        <span>${entry.direction === "undo" ? "Undo" : "Redo"}</span>
                        <strong>${escapeHtml(entry.label)}</strong>
                      </li>
                    `
                  )
                  .join("")
              : `<li class="history-item history-item-empty"><span>No edits yet.</span></li>`}
          </ul>
        </div>
      </aside>
      <main class="workspace">
        <section class="viewport-card">
          <div class="viewport-copy">
            <div>
              <p class="eyebrow">Viewport</p>
              <h2>${loadedDocument ? escapeHtml(loadedDocument.project.id) : "No Document Loaded"}</h2>
            </div>
            <p class="viewport-summary">
              ${
                loadedDocument
                  ? `${loadedDocument.project.modules.length} modules, ${loadedDocument.stylePack.modules.length} style modules, ${loadedDocument.stylePack.palettes.length} palettes`
                  : "Create a fighter or load a project and style pack to inspect the standalone shell path."
              }
            </p>
          </div>
          <div class="viewport-stage" id="viewport-stage">
            ${
              loadedDocument
                ? ""
                : `<div class="viewport-empty"><strong>No scene yet.</strong><span>Load a project to render a live 3D proxy preview.</span></div>`
            }
          </div>
          ${viewportHint ? `<p class="viewport-hint">${escapeHtml(viewportHint)}</p>` : ""}
          <div class="module-strip">
            ${cards
              .map(
                (card) => `
                  <button
                    class="module-chip ${card.selected ? "selected" : ""}"
                    data-instance-id="${escapeHtml(card.instanceId)}"
                  >
                    <strong>${escapeHtml(card.instanceId)}</strong>
                    <span>${escapeHtml(card.moduleId)}</span>
                  </button>
                `
              )
              .join("")}
          </div>
        </section>
        <div class="workspace-side">
          <section class="panel inspector-panel">
            <p class="eyebrow">Inspector</p>
            <h2>${selectedDetail ? escapeHtml(selectedDetail.instanceId) : "No Module Selected"}</h2>
            ${
              selectedDetail
                ? `
                  <div class="inspector-actions">
                    <button id="mirror-module" class="secondary-button" type="button">Mirror Module</button>
                    <button id="remove-module" class="danger-button">Remove Module</button>
                  </div>
                  <div class="detail-grid">
                    <div>
                      <span class="detail-label">Module</span>
                      <strong>${escapeHtml(selectedDetail.moduleId)}</strong>
                    </div>
                    <div>
                      <span class="detail-label">Asset Type</span>
                      <strong>${escapeHtml(selectedDetail.assetType)}</strong>
                    </div>
                    <div>
                      <span class="detail-label">Position</span>
                      <strong>${formatVec3(selectedDetail.position)}</strong>
                    </div>
                    <div>
                      <span class="detail-label">Rotation</span>
                      <strong>${formatVec3(selectedDetail.rotation)}</strong>
                    </div>
                  </div>
                  <div class="inspector-block">
                    <h3>Transform</h3>
                    <div class="transform-grid">
                      ${renderTransformInputs(
                        selectedDetail.instanceId,
                        "position",
                        "Position",
                        selectedDetail.position,
                        pendingTransformPreview,
                        "0.05"
                      )}
                      ${renderTransformInputs(
                        selectedDetail.instanceId,
                        "rotation",
                        "Rotation",
                        selectedDetail.rotation,
                        pendingTransformPreview,
                        "1"
                      )}
                      ${renderTransformInputs(
                        selectedDetail.instanceId,
                        "scale",
                        "Scale",
                        selectedDetail.scale,
                        pendingTransformPreview,
                        "0.05",
                        "0.01"
                      )}
                    </div>
                    ${
                      pendingTransformPreview
                        ? renderEditPreviewCard(pendingTransformPreview)
                        : ""
                    }
                  </div>
                  <div class="inspector-block">
                    <h3>Materials</h3>
                    <ul class="detail-list">
                      ${selectedDetail.materials
                        .map(
                          (material) => `
                            <li>
                              <strong>${escapeHtml(material.zone)}</strong>
                              <select
                                class="material-select"
                                data-instance-id="${escapeHtml(selectedDetail.instanceId)}"
                                data-zone="${escapeHtml(material.zone)}"
                              >
                                ${material.availableMaterialIds
                                  .map(
                                    (materialId) => `
                                      <option value="${escapeHtml(materialId)}" ${
                                        materialId ===
                                        resolveMaterialSelectValue(
                                          selectedDetail.instanceId,
                                          material.zone,
                                          material.materialId,
                                          pendingMaterialPreview
                                        )
                                          ? "selected"
                                          : ""
                                      }>
                                        ${escapeHtml(materialId)}
                                      </option>
                                    `
                                  )
                                  .join("")}
                              </select>
                            </li>
                          `
                        )
                        .join("")}
                    </ul>
                    ${
                      pendingMaterialPreview
                        ? renderEditPreviewCard(pendingMaterialPreview)
                        : ""
                    }
                  </div>
                  ${renderPaintInspector(selectedDetail.instanceId, selectedDetail.paint, selectedDecalDraftId)}
                  <div class="inspector-block">
                    <h3>Regions</h3>
                    <ul class="detail-list">
                      ${
                        selectedDetail.regions.length > 0
                          ? selectedDetail.regions
                              .map(
                                (region) => `
                                  <li>
                                    <strong>${escapeHtml(region.id)}</strong>
                                    <div class="region-control">
                                      <input
                                        class="region-slider"
                                        data-instance-id="${escapeHtml(selectedDetail.instanceId)}"
                                        data-region="${escapeHtml(region.id)}"
                                        type="range"
                                        min="${region.min}"
                                        max="${region.max}"
                                        step="0.01"
                                        value="${resolveRegionSliderValue(selectedDetail.instanceId, region.id, region.current, pendingRegionPreview)}"
                                      />
                                      <span>${resolveRegionSliderValue(selectedDetail.instanceId, region.id, region.current, pendingRegionPreview).toFixed(2)} (${Math.round(region.utilization * 100)}%)</span>
                                    </div>
                                  </li>
                                `
                              )
                              .join("")
                          : `<li><strong>No authored regions</strong><span>This module does not expose constrained deformation inputs.</span></li>`
                      }
                    </ul>
                    ${
                      pendingRegionPreview
                        ? renderEditPreviewCard(pendingRegionPreview)
                        : ""
                    }
                  </div>
                  ${renderSelectedModuleValidationInspector(selectedValidationDetail)}
                  <div class="inspector-block">
                    <h3>Connectors</h3>
                    <ul class="detail-list">
                      ${
                        selectedDetail.connectors.length > 0
                          ? selectedDetail.connectors
                              .map(
                                (connector) => `
                                  <li>
                                    <strong>${escapeHtml(connector.id)}</strong>
                                    <div class="connector-control">
                                      <span>${escapeHtml(connector.kind)}</span>
                                      <select
                                        class="connector-select"
                                        data-instance-id="${escapeHtml(selectedDetail.instanceId)}"
                                        data-local-connector="${escapeHtml(connector.id)}"
                                      >
                                        <option value="" ${
                                          resolveConnectorSelectValue(
                                            selectedDetail.instanceId,
                                            connector.id,
                                            connector.attachment,
                                            pendingConnectorPreview
                                          ) === ""
                                            ? "selected"
                                            : ""
                                        }>Unattached</option>
                                        ${connector.compatibleTargets
                                          .map((option) => {
                                            const value = `${option.instanceId}::${option.connectorId}`;
                                            const isSelected =
                                              resolveConnectorSelectValue(
                                                selectedDetail.instanceId,
                                                connector.id,
                                                connector.attachment,
                                                pendingConnectorPreview
                                              ) === value;

                                            return `
                                              <option value="${escapeHtml(value)}" ${
                                                isSelected ? "selected" : ""
                                              }>
                                                ${escapeHtml(option.instanceId)} -> ${escapeHtml(option.connectorId)}
                                              </option>
                                            `;
                                          })
                                          .join("")}
                                      </select>
                                      ${
                                        connector.snapTarget
                                          ? `
                                              <button
                                                class="secondary-button connector-snap"
                                                type="button"
                                                data-instance-id="${escapeHtml(selectedDetail.instanceId)}"
                                                data-local-connector="${escapeHtml(connector.snapTarget.localConnector)}"
                                                data-target-instance-id="${escapeHtml(connector.snapTarget.targetInstanceId)}"
                                                data-target-connector="${escapeHtml(connector.snapTarget.targetConnector)}"
                                              >
                                                Snap to ${escapeHtml(connector.snapTarget.label)}
                                              </button>
                                            `
                                          : `
                                              <button class="secondary-button connector-snap" type="button" disabled>
                                                No snap target
                                              </button>
                                            `
                                      }
                                    </div>
                                  </li>
                                `
                              )
                              .join("")
                          : `<li><strong>No connectors</strong><span>This module is terminal in the current style pack.</span></li>`
                      }
                    </ul>
                    ${
                      pendingConnectorPreview
                        ? renderEditPreviewCard(pendingConnectorPreview)
                        : ""
                    }
                  </div>
                `
                : `<p class="empty-note">Selection appears here once a project is loaded.</p>`
            }
          </section>
          <section class="panel">
            <p class="eyebrow">Module Browser</p>
            <h2>${loadedDocument ? `${visibleLibrary.length} of ${librarySummary.total} style modules` : "Load a Document"}</h2>
            ${
              loadedDocument
                ? `
                    <div class="library-browser">
                      <div class="library-toolbar">
                        <div class="library-filters">
                          <button class="secondary-button library-filter ${state.libraryFilter === "all" ? "active" : ""}" data-library-filter="all" type="button">All (${librarySummary.total})</button>
                          <button class="secondary-button library-filter ${state.libraryFilter === "stylePack" ? "active" : ""}" data-library-filter="stylePack" type="button">Style Pack (${librarySummary.stylePack})</button>
                          <button class="secondary-button library-filter ${state.libraryFilter === "imported" ? "active" : ""}" data-library-filter="imported" type="button">Imported (${librarySummary.imported})</button>
                          <button class="secondary-button library-filter ${state.libraryFilter === "authored" ? "active" : ""}" data-library-filter="authored" type="button">Authored (${librarySummary.authored})</button>
                          <button class="secondary-button library-filter ${state.libraryFilter === "inUse" ? "active" : ""}" data-library-filter="inUse" type="button">In Use (${librarySummary.inUse})</button>
                        </div>
                        <label class="library-search">
                          <span class="detail-label">Search Library</span>
                          <input id="library-search" value="${escapeHtml(state.librarySearch)}" placeholder="Search id, source, connectors, zones, assets, or usage" />
                        </label>
                      </div>
                      <div class="library-grid">
                        ${visibleLibrary
                          .map(
                            (entry) => `
                              <button
                                class="library-card ${entry.moduleId === selectedLibraryModuleId ? "selected" : ""}"
                                data-library-module-id="${escapeHtml(entry.moduleId)}"
                                type="button"
                              >
                                <div class="library-card-meta">
                                  <span class="library-card-type">${escapeHtml(entry.assetType)}</span>
                                  <span class="library-card-origin library-card-origin-${escapeHtml(entry.source)}">${entry.source === "imported" ? "Imported" : entry.source === "authored" ? "Authored" : "Style Pack"}</span>
                                </div>
                                <strong>${escapeHtml(entry.moduleId)}</strong>
                                <span>${entry.connectorCount} connectors | ${entry.regionCount} regions | ${entry.materialZoneCount} zones | ${entry.placementCount} placed</span>
                              </button>
                            `
                          )
                          .join("")}
                      </div>
                      ${
                        selectedLibraryPreview
                          ? `
                              <div class="library-preview">
                                <div>
                                  <p class="detail-label">Selected Preview</p>
                                  <h3>${escapeHtml(selectedLibraryPreview.moduleId)}</h3>
                                  <p class="path-note">${selectedLibraryPreview.source === "imported" ? "Imported reusable module" : selectedLibraryPreview.source === "authored" ? "Authored reusable module" : "Style-pack reusable module"}</p>
                                  <p class="path-note">${selectedLibraryPreview.placementCount} placed instance${selectedLibraryPreview.placementCount === 1 ? "" : "s"}</p>
                                  <p class="path-note">${escapeHtml(selectedLibraryPreview.placementHint)}</p>
                                  ${
                                    selectedLibraryPlacementFeedback
                                      ? `<p class="path-note">${escapeHtml(selectedLibraryPlacementFeedback)}</p>`
                                      : ""
                                  }
                                </div>
                                <div class="library-preview-stage">
                                  <div class="library-preview-bars">
                                    <span class="library-preview-bar library-preview-bar-width" style="height: ${Math.max(selectedLibraryPreview.silhouette.width * 96, 18)}px"></span>
                                    <span class="library-preview-bar library-preview-bar-height" style="height: ${Math.max(selectedLibraryPreview.silhouette.height * 96, 18)}px"></span>
                                    <span class="library-preview-bar library-preview-bar-depth" style="height: ${Math.max(selectedLibraryPreview.silhouette.depth * 96, 18)}px"></span>
                                  </div>
                                  <p class="path-note">Dominant axis: ${escapeHtml(selectedLibraryPreview.silhouette.dominantAxis.toUpperCase())}</p>
                                </div>
                                <div class="library-preview-meta">
                                  <div>
                                    <span class="detail-label">Connectors</span>
                                    <div class="library-badges">
                                      ${selectedLibraryPreview.connectors
                                        .map(
                                          (connector) => `<span class="library-badge">${escapeHtml(connector.id)} | ${escapeHtml(connector.kind)}</span>`
                                        )
                                        .join("")}
                                    </div>
                                  </div>
                                  <div>
                                    <span class="detail-label">Regions</span>
                                    <div class="library-badges">
                                      ${
                                        selectedLibraryPreview.regionIds.length > 0
                                          ? selectedLibraryPreview.regionIds
                                              .map((regionId) => `<span class="library-badge">${escapeHtml(regionId)}</span>`)
                                              .join("")
                                          : `<span class="library-badge">No authored regions</span>`
                                      }
                                    </div>
                                  </div>
                                  <div>
                                    <span class="detail-label">Material Zones</span>
                                    <div class="library-badges">
                                      ${selectedLibraryPreview.materialZones
                                        .map((zone) => `<span class="library-badge">${escapeHtml(zone)}</span>`)
                                        .join("")}
                                    </div>
                                  </div>
                                  <div>
                                    <span class="detail-label">Suggested Placements</span>
                                    <div class="library-badges">
                                      ${
                                        selectedLibraryPreview.suggestedPlacements.length > 0
                                          ? selectedLibraryPreview.suggestedPlacements
                                              .map((placement) => `<span class="library-badge">${escapeHtml(placement.label)}</span>` )
                                              .join("")
                                          : `<span class="library-badge">No compatible live targets</span>` 
                                      }
                                    </div>
                                  </div>
                                  <div>
                                    <span class="detail-label">Placed Instances</span>
                                    <div class="library-badges">
                                      ${
                                        selectedLibraryPreview.placedInstanceIds.length > 0
                                          ? selectedLibraryPreview.placedInstanceIds
                                              .map((instanceId) => `<span class="library-badge">${escapeHtml(instanceId)}</span>`)
                                              .join("")
                                          : `<span class="library-badge">Not placed</span>`
                                      }
                                    </div>
                                  </div>
                                  ${
                                    selectedLibraryPreview.sourceAsset
                                      ? `
                                          <div>
                                            <span class="detail-label">Source Asset</span>
                                            <p class="path-note">${escapeHtml(selectedLibraryPreview.sourceAsset.path)} (${escapeHtml(selectedLibraryPreview.sourceAsset.format.toUpperCase())})</p>
                                          </div>
                                        `
                                      : ""
                                  }
                                </div>
                                ${
                                  libraryAddActionHint
                                    ? `<p class="path-note">${escapeHtml(libraryAddActionHint)}</p>`
                                    : ""
                                }
                                <div class="inspector-actions">
                                  <button class="library-preview-add" data-module-id="${escapeHtml(selectedLibraryPreview.moduleId)}" type="button">${escapeHtml(libraryAddActionLabel)}</button>
                                  ${
                                    primarySuggestedPlacementRequest
                                      ? `<button class="library-preview-add-snap" data-module-id="${escapeHtml(primarySuggestedPlacementRequest.moduleId)}" data-local-connector="${escapeHtml(primarySuggestedPlacementRequest.localConnector)}" data-target-instance-id="${escapeHtml(primarySuggestedPlacementRequest.targetInstanceId)}" data-target-connector="${escapeHtml(primarySuggestedPlacementRequest.targetConnector)}" type="button">Recommended: ${escapeHtml(`Add and Snap to ${primarySuggestedPlacementRequest.targetInstanceId}::${primarySuggestedPlacementRequest.targetConnector}`)}</button>`
                                      : ""
                                  }
                                  ${
                                    suggestedPlacementAlternativeSummary
                                      ? `<p class="path-note">${escapeHtml(suggestedPlacementAlternativeSummary.label)}</p>`
                                      : ""
                                  }
                                  ${suggestedPlacementGroups
                                    .map(
                                      (group) => `
                                        <div class="suggested-placement-group">
                                          <span class="detail-label">${escapeHtml(group.localConnector)} | ${escapeHtml(group.localKind)}</span>
                                          <div class="inspector-actions suggested-placement-actions">
                                            ${group.actions
                                              .map(
                                                (action) => { const request = buildAddModuleAndSnapRequest(selectedLibraryPreview.moduleId, action); return `<button class="library-preview-add-snap secondary-button" data-module-id="${escapeHtml(request.moduleId)}" data-local-connector="${escapeHtml(request.localConnector)}" data-target-instance-id="${escapeHtml(request.targetInstanceId)}" data-target-connector="${escapeHtml(request.targetConnector)}" type="button">${escapeHtml(action.label)}</button>`; }
                                              )
                                              .join("")}
                                          </div>
                                        </div>
                                      `
                                    )
                                    .join("")}
                                  <button id="duplicate-library-module" class="secondary-button" type="button">Duplicate as Authored</button>
                                  ${
                                    selectedLibraryPreview.source === "authored"
                                      ? [
                                          `<button id="rename-library-module" class="secondary-button" type="button">Rename Authored Copy</button>`,
                                          `<button id="delete-library-module" class="secondary-button" type="button">Delete Authored Copy</button>`
                                        ].join("")
                                      : ""
                                  }
                                  ${
                                    reusableModuleDraft
                                      ? ""
                                      : `<button id="start-module-draft" class="secondary-button" type="button">Edit Metadata</button>`
                                  }
                                </div>
                                ${
                                  reusableModuleDraft
                                    ? renderReusableModuleDraftEditor(reusableModuleDraft)
                                    : `<p class="path-note">Start a reusable metadata draft to author connectors, regions, and material zones for this module.</p>`
                                }
                              </div>
                            `
                          : ""
                      }
                    </div>
                  `
                : `<p class="empty-note">Create or load a project first.</p>`
            }
          </section>
          <section class="panel">
            <p class="eyebrow">Rig</p>
            <h2>${rigDetail?.templateId ? escapeHtml(rigDetail.templateId) : "No Rig Template"}</h2>
            ${
              rigDetail
                ? `
                  <div class="inspector-block">
                    <h3>Template</h3>
                    <select id="rig-template-select">
                      ${rigDetail.availableTemplates
                        .map(
                          (template) => `
                            <option value="${escapeHtml(template.id)}" ${
                              template.id === resolveRigTemplateValue(rigDetail.templateId, pendingRigTemplatePreview) ? "selected" : ""
                            }>
                              ${escapeHtml(template.id)}
                            </option>
                          `
                        )
                        .join("")}
                    </select>
                    ${
                      pendingRigTemplatePreview
                        ? renderEditPreviewCard(pendingRigTemplatePreview)
                        : ""
                    }
                  </div>
                  <div class="inspector-block">
                    <h3>Socket Draft</h3>
                    <div class="socket-form">
                      <label>
                        <span class="detail-label">Socket Name</span>
                        <input id="socket-name" value="${escapeHtml(state.socketName)}" />
                      </label>
                      <label>
                        <span class="detail-label">Bone</span>
                        <input id="socket-bone" value="${escapeHtml(state.socketBone)}" />
                      </label>
                      <button id="add-socket" type="button">Attach Socket</button>
                    </div>
                  </div>
                  <div class="inspector-block">
                    <h3>Current Sockets</h3>
                    <ul class="detail-list">
                      ${
                        visibleRigSockets.length > 0
                          ? visibleRigSockets
                              .map(
                                (socket) => `
                                  <li>
                                    <strong>${escapeHtml(socket.name)}</strong>
                                    <span>${escapeHtml(socket.bone)}</span>
                                  </li>
                                `
                              )
                              .join("")
                          : `<li><strong>No sockets</strong><span>Attach a socket to expose export metadata.</span></li>`
                      }
                    </ul>
                    ${
                      pendingSocketPreview
                        ? renderEditPreviewCard(pendingSocketPreview)
                        : ""
                    }
                  </div>
                `
                : `<p class="empty-note">Rig metadata becomes available once a document is loaded.</p>`
            }
          </section>
          <section class="panel">
            <p class="eyebrow">Validation</p>
            <h2>${report ? report.status.toUpperCase() : "No Report Yet"}</h2>
            <p>${report ? `${report.stats.moduleCount} modules, ${report.issues.length} issues` : "Run validation to inspect budget and metadata state."}</p>
            <ul class="issue-list">
              ${(report?.issues ?? [])
                .map(
                  (issue) => `
                    <li>
                      <strong>${escapeHtml(issue.code)}</strong>
                      <span>${escapeHtml(issue.summary)}</span>
                    </li>
                  `
                )
                .join("")}
            </ul>
          </section>
          <section class="panel">
            <p class="eyebrow">Export</p>
            <h2>${exportBundle ? "Bundle Ready" : "Awaiting Export"}</h2>
            <p>${exportBundle ? `GLB preview payload: ${Math.floor(exportBundle.glbBytesBase64.length / 4) * 3} bytes` : "Run export to confirm the desktop shell can reach the Rust exporter."}</p>
            <p class="path-note">${loadedDocument ? `Save target: ${escapeHtml(state.savePath)}` : "No save target selected yet."}</p>
          </section>
        </div>
      </main>
    </div>
  `;

  bindInputs();
  bindActions();

  if (loadedDocument) {
    const stage = globalThis.document.querySelector<HTMLElement>("#viewport-stage");
    if (stage) {
      const proxyScene = buildProxyScene(loadedDocument, selectedModuleId);
      disposeViewport = mountViewport(stage, proxyScene, {
        onSelect(instanceId) {
          if (instanceId !== state.selectedModuleId) {
            state.selectedModuleId = instanceId;
            render();
          }
        },
        onTranslateCommit(commit) {
          void applyEditCommand(commit.command, `Moved ${commit.instanceId}`);
        },
        onScaleCommit(commit) {
          void applyEditCommand(commit.command, `Scaled ${commit.instanceId}`);
        },
        onRotateCommit(commit) {
          void applyEditCommand(commit.command, `Rotated ${commit.instanceId}`);
        }
      });
    }
  }
}

function bindInputs(): void {
  globalThis.document
    .querySelector<HTMLInputElement>("#project-id")
    ?.addEventListener("input", (event) => {
      state.projectId = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#project-path")
    ?.addEventListener("input", (event) => {
      state.projectPath = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#stylepack-path")
    ?.addEventListener("input", (event) => {
      state.stylePackPath = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#save-path")
    ?.addEventListener("input", (event) => {
      state.savePath = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#module-import-path")
    ?.addEventListener("input", (event) => {
      state.moduleImportPath = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#socket-name")
    ?.addEventListener("input", (event) => {
      state.socketName = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#socket-bone")
    ?.addEventListener("input", (event) => {
      state.socketBone = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLSelectElement>("#decal-draft")
    ?.addEventListener("change", (event) => {
      state.decalDraftId = (event.target as HTMLSelectElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#module-draft-material-zones")
    ?.addEventListener("input", (event) => {
      state.reusableModuleMaterialZonesInput = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#module-draft-region-id")
    ?.addEventListener("input", (event) => {
      state.reusableModuleRegionId = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#module-draft-region-min")
    ?.addEventListener("input", (event) => {
      state.reusableModuleRegionMin = (event.target as HTMLInputElement).value;
    });
  globalThis.document
    .querySelector<HTMLInputElement>("#module-draft-region-max")
    ?.addEventListener("input", (event) => {
      state.reusableModuleRegionMax = (event.target as HTMLInputElement).value;
    });
}

function bindActions(): void {
  globalThis.document
    .querySelector<HTMLButtonElement>("#browse-project")
    ?.addEventListener("click", browseProjectPath);
  globalThis.document
    .querySelector<HTMLButtonElement>("#browse-stylepack")
    ?.addEventListener("click", browseStylePackPath);
  globalThis.document
    .querySelector<HTMLButtonElement>("#browse-save")
    ?.addEventListener("click", saveProjectAs);
  globalThis.document
    .querySelector<HTMLButtonElement>("#create-template")
    ?.addEventListener("click", createFighter);
  globalThis.document
    .querySelector<HTMLButtonElement>("#load")
    ?.addEventListener("click", loadFromPaths);
  globalThis.document
    .querySelector<HTMLButtonElement>("#load-canonical")
    ?.addEventListener("click", loadCanonical);
  globalThis.document
    .querySelector<HTMLButtonElement>("#save")
    ?.addEventListener("click", saveCurrentProject);
  globalThis.document
    .querySelector<HTMLButtonElement>("#save-as")
    ?.addEventListener("click", saveProjectAs);
  globalThis.document
    .querySelector<HTMLButtonElement>("#save-stylepack-as")
    ?.addEventListener("click", saveStylePackAs);
  globalThis.document
    .querySelector<HTMLButtonElement>("#import-module")
    ?.addEventListener("click", () => {
      void importModuleContract();
    });
  globalThis.document
    .querySelector<HTMLButtonElement>("#undo")
    ?.addEventListener("click", undoLastAction);
  globalThis.document
    .querySelector<HTMLButtonElement>("#redo")
    ?.addEventListener("click", redoLastAction);
  globalThis.document
    .querySelector<HTMLSelectElement>("#rig-template-select")
    ?.addEventListener("change", (event) => {
      const templateId = (event.target as HTMLSelectElement).value;
      if (templateId) {
        void previewRigTemplateAssignment(templateId);
      }
    });
  globalThis.document
    .querySelector<HTMLButtonElement>("#add-socket")
    ?.addEventListener("click", attachSocket);
  globalThis.document
    .querySelector<HTMLButtonElement>("#validate")
    ?.addEventListener("click", runValidation);
  globalThis.document
    .querySelector<HTMLButtonElement>("#export")
    ?.addEventListener("click", runExport);
  globalThis.document
    .querySelector<HTMLButtonElement>("#mirror-module")
    ?.addEventListener("click", mirrorSelectedModule);
  globalThis.document
    .querySelector<HTMLButtonElement>("#remove-module")
    ?.addEventListener("click", removeSelectedModule);
  globalThis.document.querySelectorAll<HTMLButtonElement>(".module-chip").forEach((element) =>
    element.addEventListener("click", () => {
      state.selectedModuleId = element.dataset.instanceId;
      state.pendingEditPreview = undefined;
      render();
    })
  );
  globalThis.document.querySelectorAll<HTMLButtonElement>(".library-card").forEach((element) =>
    element.addEventListener("click", () => {
      const moduleId = element.dataset.libraryModuleId;
      if (moduleId && moduleId !== state.selectedLibraryModuleId) {
        state.selectedLibraryModuleId = moduleId;
        clearReusableModuleDraftState();
        render();
      }
    })
  );

  globalThis.document
    .querySelector<HTMLInputElement>("#library-search")
    ?.addEventListener("input", (event) => {
      const target = event.currentTarget as HTMLInputElement;
      if (target.value !== state.librarySearch) {
        state.librarySearch = target.value;
        clearReusableModuleDraftState();
        render();
      }
    });

  globalThis.document.querySelectorAll<HTMLButtonElement>(".library-filter").forEach((element) =>
    element.addEventListener("click", () => {
      const nextFilter = element.dataset.libraryFilter as ModuleLibraryFilter | undefined;
      if (!nextFilter || nextFilter === state.libraryFilter) {
        return;
      }

      state.libraryFilter = nextFilter;
      clearReusableModuleDraftState();
      render();
    })
  );
  globalThis.document.querySelectorAll<HTMLButtonElement>(".library-preview-add").forEach((element) =>
    element.addEventListener("click", () => {
      const moduleId = element.dataset.moduleId;
      if (moduleId) {
        void addModule(moduleId);
      }
    })
  );
  globalThis.document.querySelectorAll<HTMLButtonElement>(".library-preview-add-snap").forEach((element) =>
    element.addEventListener("click", () => {
      const moduleId = element.dataset.moduleId;
      const localConnector = element.dataset.localConnector;
      const targetInstanceId = element.dataset.targetInstanceId;
      const targetConnector = element.dataset.targetConnector;
      if (moduleId && localConnector && targetInstanceId && targetConnector) {
        void addModuleAndSnap(moduleId, localConnector, targetInstanceId, targetConnector);
      }
    })
  );
  globalThis.document
    .querySelector<HTMLButtonElement>("#duplicate-library-module")
    ?.addEventListener("click", duplicateSelectedLibraryModule);
  globalThis.document
    .querySelector<HTMLButtonElement>("#rename-library-module")
    ?.addEventListener("click", renameSelectedLibraryModule);
  globalThis.document
    .querySelector<HTMLButtonElement>("#delete-library-module")
    ?.addEventListener("click", deleteSelectedLibraryModule);
  globalThis.document
    .querySelector<HTMLButtonElement>("#start-module-draft")
    ?.addEventListener("click", startReusableModuleDraft);
  globalThis.document
    .querySelector<HTMLButtonElement>("#sync-module-material-zones")
    ?.addEventListener("click", syncReusableModuleMaterialZones);
  globalThis.document
    .querySelector<HTMLButtonElement>("#add-module-region")
    ?.addEventListener("click", addReusableModuleRegionFromDraft);
  globalThis.document
    .querySelector<HTMLButtonElement>("#apply-module-draft")
    ?.addEventListener("click", () => {
      void applyReusableModuleMetadataDraft();
    });
  globalThis.document
    .querySelector<HTMLButtonElement>("#cancel-module-draft")
    ?.addEventListener("click", cancelReusableModuleDraft);
  globalThis.document.querySelectorAll<HTMLInputElement>(".module-draft-connector-id").forEach((element) =>
    element.addEventListener("change", () => {
      const connectorId = element.dataset.connectorId;
      if (connectorId) {
        updateReusableModuleConnectorDraft(connectorId, { id: element.value });
      }
    })
  );
  globalThis.document.querySelectorAll<HTMLInputElement>(".module-draft-connector-kind").forEach((element) =>
    element.addEventListener("change", () => {
      const connectorId = element.dataset.connectorId;
      if (connectorId) {
        updateReusableModuleConnectorDraft(connectorId, { kind: element.value });
      }
    })
  );
  globalThis.document.querySelectorAll<HTMLSelectElement>(".material-select").forEach((element) =>
    element.addEventListener("change", () => {
      const instanceId = element.dataset.instanceId;
      const zone = element.dataset.zone;
      if (instanceId && zone) {
        void previewMaterialAssignment(instanceId, zone, element.value);
      }
    })
  );
  globalThis.document
    .querySelector<HTMLButtonElement>("#apply-edit-preview")
    ?.addEventListener("click", applyPendingEditPreview);
  globalThis.document
    .querySelector<HTMLButtonElement>("#cancel-edit-preview")
    ?.addEventListener("click", cancelPendingEditPreview);
  globalThis.document.querySelectorAll<HTMLSelectElement>(".paint-fill-select").forEach((element) =>
    element.addEventListener("change", () => {
      const zone = element.dataset.zone;
      if (zone) {
        void updateFillLayer(zone, element.value || undefined);
      }
    })
  );
  globalThis.document
    .querySelector<HTMLButtonElement>("#add-decal")
    ?.addEventListener("click", addDecalToSelectedModule);
  globalThis.document.querySelectorAll<HTMLButtonElement>(".remove-decal").forEach((element) =>
    element.addEventListener("click", () => {
      const decalId = element.dataset.decalId;
      if (decalId) {
        void removeDecalFromSelectedModule(decalId);
      }
    })
  );
  globalThis.document.querySelectorAll<HTMLInputElement>(".region-slider").forEach((element) =>
    element.addEventListener("change", () => {
      const instanceId = element.dataset.instanceId;
      const region = element.dataset.region;
      if (instanceId && region) {
        void previewRegionEdit(instanceId, region, Number(element.value));
      }
    })
  );
  globalThis.document.querySelectorAll<HTMLInputElement>(".transform-input").forEach((element) =>
    element.addEventListener("change", () => {
      const instanceId = element.dataset.instanceId;
      const field = element.dataset.field as TransformField | undefined;
      const axis = element.dataset.axis;
      if (!instanceId || !field || !axis) {
        return;
      }

      const current = readTransformValue(instanceId, field);
      const axisIndex = axisToIndex(axis);
      const nextValue = Number(element.value);
      if (!current || axisIndex === undefined || Number.isNaN(nextValue)) {
        return;
      }

      if (field === "scale" && nextValue <= 0) {
        state.status = "Update scale failed";
        state.error = "Scale components must be greater than zero.";
        render();
        return;
      }

      const nextTransform = [...current] as [number, number, number];
      nextTransform[axisIndex] = nextValue;

      void previewTransformEdit(instanceId, field, nextTransform);
    })
  );
  globalThis.document.querySelectorAll<HTMLSelectElement>(".connector-select").forEach((element) =>
    element.addEventListener("change", () => {
      const instanceId = element.dataset.instanceId;
      const localConnector = element.dataset.localConnector;
      if (!instanceId || !localConnector) {
        return;
      }

      if (!element.value) {
        void previewClearConnectorAttachment(instanceId, localConnector);
        return;
      }

      const [targetInstanceId, targetConnector] = element.value.split("::");
      if (targetInstanceId && targetConnector) {
        void previewConnectorAttachment(instanceId, localConnector, targetInstanceId, targetConnector);
      }
    })
  );
  globalThis.document.querySelectorAll<HTMLButtonElement>(".connector-snap").forEach((element) =>
    element.addEventListener("click", () => {
      const instanceId = element.dataset.instanceId;
      const localConnector = element.dataset.localConnector;
      const targetInstanceId = element.dataset.targetInstanceId;
      const targetConnector = element.dataset.targetConnector;
      if (instanceId && localConnector && targetInstanceId && targetConnector) {
        void snapConnector(instanceId, localConnector, targetInstanceId, targetConnector);
      }
    })
  );
}

async function createFighter(): Promise<void> {
  await runAction(
    "Creating fighter template",
    async () => {
      state.document = await invoke<DesktopDocument>("create_fighter_template_command", {
        projectId: state.projectId,
        stylePackPath: state.stylePackPath
      });
      syncLoadedDocumentPaths(state.document.paths);
      state.authoredModuleIds = [];
      state.selectedModuleId = resolveSelectedModuleId(state.document);
      state.selectedLibraryModuleId = resolveSelectedLibraryModuleId(buildModuleLibrary(state.document, state.authoredModuleIds));
      clearReusableModuleDraftState();
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Created ${state.document.project.id}`;
    },
    { captureUndo: true }
  );
}

async function loadCanonical(): Promise<void> {
  await runAction(
    "Loading canonical fighter",
    async () => {
      state.document = await invoke<DesktopDocument>("load_canonical_document_command");
      syncLoadedDocumentPaths(state.document.paths);
      state.authoredModuleIds = [];
      state.selectedModuleId = resolveSelectedModuleId(state.document);
      state.selectedLibraryModuleId = resolveSelectedLibraryModuleId(buildModuleLibrary(state.document, state.authoredModuleIds));
      clearReusableModuleDraftState();
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Loaded ${state.document.project.id}`;
    },
    { captureUndo: true }
  );
}

async function loadFromPaths(): Promise<void> {
  await runAction(
    "Loading document from paths",
    async () => {
      state.document = await invoke<DesktopDocument>("load_document_command", {
        projectPath: state.projectPath,
        stylePackPath: state.stylePackPath
      });
      state.document.paths.savePath = state.savePath;
      state.authoredModuleIds = [];
      state.selectedModuleId = resolveSelectedModuleId(state.document);
      state.selectedLibraryModuleId = resolveSelectedLibraryModuleId(buildModuleLibrary(state.document, state.authoredModuleIds));
      clearReusableModuleDraftState();
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Loaded ${state.document.project.id}`;
    },
    { captureUndo: true }
  );
}

async function importModuleContract(): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction(
    "Importing module contract",
    async () => {
      const knownModuleIds = new Set(state.document!.stylePack.modules.map((module) => module.id));
      state.document = await invoke<DesktopDocument>("import_module_contract_command", {
        document: state.document,
        importPath: state.moduleImportPath
      });
      const importedModuleId = state.document.stylePack.modules.find(
        (module) => !knownModuleIds.has(module.id)
      )?.id;
      state.selectedLibraryModuleId = importedModuleId ?? state.selectedLibraryModuleId;
      clearReusableModuleDraftState();
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = importedModuleId
        ? `Imported ${importedModuleId}`
        : "Imported module contract";
    },
    { captureUndo: true }
  );
}

async function saveCurrentProject(): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction("Saving project", async () => {
    await invoke<string>("save_project_command", {
      project: state.document,
      projectPath: state.savePath
    });
    state.document!.paths.savePath = state.savePath;
    state.projectPath = state.savePath;
    state.status = `Saved ${state.savePath}`;
  });
}

async function browseProjectPath(): Promise<void> {
  const selection = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "ZX Model", extensions: ["json"] }]
  });
  const projectPath = resolveDialogPath(selection);
  if (!projectPath) {
    return;
  }

  state.projectPath = projectPath;
  if (!state.document) {
    state.savePath = ensureProjectSavePath(projectPath);
  }

  if (state.stylePackPath.trim()) {
    await loadFromPaths();
  } else {
    render();
  }
}

async function browseStylePackPath(): Promise<void> {
  const selection = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "Style Pack", extensions: ["json"] }]
  });
  const stylePackPath = resolveDialogPath(selection);
  if (!stylePackPath) {
    return;
  }

  state.stylePackPath = stylePackPath;

  if (state.projectPath.trim()) {
    await loadFromPaths();
  } else {
    render();
  }
}

async function saveProjectAs(): Promise<void> {
  if (!state.document) {
    return;
  }

  const selection = await save({
    defaultPath: suggestProjectSavePath(state.document),
    filters: [{ name: "ZX Model", extensions: ["json"] }]
  });
  const savePath = resolveDialogPath(selection);
  if (!savePath) {
    return;
  }

  state.savePath = ensureProjectSavePath(savePath);
  await saveCurrentProject();
}

async function saveStylePackAs(): Promise<void> {
  if (!state.document) {
    return;
  }

  const selection = await save({
    defaultPath: suggestStylePackSavePath(state.document),
    filters: [{ name: "Style Pack", extensions: ["json"] }]
  });
  const stylePackPath = resolveDialogPath(selection);
  if (!stylePackPath) {
    return;
  }

  state.stylePackPath = ensureStylePackSavePath(stylePackPath);
  await runAction("Saving style pack", async () => {
    await invoke<string>("save_style_pack_command", {
      document: state.document,
      stylePackPath: state.stylePackPath
    });
    state.document!.paths.stylePackPath = state.stylePackPath;
    state.status = `Saved style pack ${state.stylePackPath}`;
  });
}

async function attachSocket(): Promise<void> {
  if (!state.document) {
    return;
  }

  const name = state.socketName.trim();
  const bone = state.socketBone.trim();

  if (!name || !bone) {
    state.error = "Socket name and bone are both required.";
    state.status = "Attach socket failed";
    render();
    return;
  }

  const command: Extract<EditCommand, { op: "attach_socket" }> = {
    op: "attach_socket",
    name,
    bone
  };

  await runAction(`Previewing ${name}`, async () => {
    const preview = await invoke<DesktopCommandPreview>("preview_edit_command_command", {
      document: state.document,
      command
    });
    state.pendingEditPreview = {
      kind: "socket",
      name,
      bone,
      successLabel: `Attached ${name}`,
      command,
      preview
    };
    state.status = `Previewed ${name}`;
  });
}

async function snapConnector(
  instanceId: string,
  localConnector: string,
  targetInstanceId: string,
  targetConnector: string
): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction(
    `Snapped ${localConnector}`,
    async () => {
      state.document = await invoke<DesktopDocument>("snap_module_instance_command", {
        document: state.document,
        instanceId,
        localConnector,
        targetInstanceId,
        targetConnector
      });
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Snapped ${localConnector}`;
    },
    { captureUndo: true }
  );
}

async function previewConnectorAttachment(
  instanceId: string,
  localConnector: string,
  targetInstanceId: string,
  targetConnector: string
): Promise<void> {
  if (!state.document) {
    return;
  }

  const command: Extract<EditCommand, { op: "set_connector_attachment" }> = {
    op: "set_connector_attachment",
    instanceId,
    localConnector,
    targetInstanceId,
    targetConnector
  };

  await runAction(`Previewing ${localConnector}`, async () => {
    const preview = await invoke<DesktopCommandPreview>("preview_edit_command_command", {
      document: state.document,
      command
    });
    state.pendingEditPreview = {
      kind: "connector",
      instanceId,
      localConnector,
      targetInstanceId,
      targetConnector,
      successLabel: `Attached ${localConnector}`,
      command,
      preview
    };
    state.status = `Previewed ${localConnector}`;
  });
}

async function previewClearConnectorAttachment(
  instanceId: string,
  localConnector: string
): Promise<void> {
  if (!state.document) {
    return;
  }

  const command: Extract<EditCommand, { op: "clear_connector_attachment" }> = {
    op: "clear_connector_attachment",
    instanceId,
    localConnector
  };

  await runAction(`Previewing ${localConnector}`, async () => {
    const preview = await invoke<DesktopCommandPreview>("preview_edit_command_command", {
      document: state.document,
      command
    });
    state.pendingEditPreview = {
      kind: "connector",
      instanceId,
      localConnector,
      successLabel: `Cleared ${localConnector}`,
      command,
      preview
    };
    state.status = `Previewed ${localConnector}`;
  });
}

async function runValidation(): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction("Validating", async () => {
    state.report = await invoke<ValidationReport>("validate_document_command", {
      document: state.document
    });
    state.status = `Validation ${state.report.status}`;
  });
}

async function runExport(): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction("Exporting preview", async () => {
    state.exportBundle = await invoke<DesktopExportBundle>("export_document_command", {
      document: state.document
    });
    state.report = state.exportBundle.report;
    state.status = "Export bundle ready";
  });
}

async function addModule(moduleId: string): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction(
    `Adding ${moduleId}`,
    async () => {
      const previousCount = state.document!.project.modules.length;
      state.document = await invoke<DesktopDocument>("add_module_instance_command", {
        document: state.document,
        moduleId
      });
      state.selectedModuleId = state.document.project.modules[previousCount]?.instanceId;
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Added ${moduleId}`;
    },
    { captureUndo: true }
  );
}


async function addModuleAndSnap(
  moduleId: string,
  localConnector: string,
  targetInstanceId: string,
  targetConnector: string
): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction(
    `Added and snapped ${moduleId}`,
    async () => {
      const previousCount = state.document!.project.modules.length;
      state.document = await invoke<DesktopDocument>("add_module_and_snap_command", {
        document: state.document,
        moduleId,
        localConnector,
        targetInstanceId,
        targetConnector
      });
      const addedInstanceId = state.document.project.modules[previousCount]?.instanceId;
      if (!addedInstanceId) {
        throw new Error(`Unable to resolve new module instance for ${moduleId}.`);
      }

      state.selectedModuleId = addedInstanceId;
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Added and snapped ${moduleId}`;
    },
    { captureUndo: true }
  );
}
async function removeSelectedModule(): Promise<void> {
  if (!state.document || !state.selectedModuleId) {
    return;
  }

  const selectedModuleId = state.selectedModuleId;
  await runAction(
    `Removing ${selectedModuleId}`,
    async () => {
      state.document = await invoke<DesktopDocument>("remove_module_instance_command", {
        document: state.document,
        instanceId: selectedModuleId
      });
      state.selectedModuleId = resolveSelectedModuleId(state.document, state.selectedModuleId);
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Removed ${selectedModuleId}`;
    },
    { captureUndo: true }
  );
}

async function mirrorSelectedModule(): Promise<void> {
  if (!state.document || !state.selectedModuleId) {
    return;
  }

  const selectedModuleId = state.selectedModuleId;
  await runAction(
    `Mirroring ${selectedModuleId}`,
    async () => {
      const existingIds = new Set(state.document!.project.modules.map((module) => module.instanceId));
      state.document = await invoke<DesktopDocument>("mirror_module_instance_command", {
        document: state.document,
        instanceId: selectedModuleId
      });
      state.selectedModuleId = state.document.project.modules.find(
        (module) => !existingIds.has(module.instanceId)
      )?.instanceId;
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Mirrored ${selectedModuleId}`;
    },
    { captureUndo: true }
  );
}

async function updateFillLayer(zone: string, paletteId?: string): Promise<void> {
  if (!state.document) {
    return;
  }

  const label = paletteId ? `Updated ${zone} fill` : `Cleared ${zone} fill`;
  await runAction(
    label,
    async () => {
      state.document = await invoke<DesktopDocument>("set_fill_layer_palette_command", {
        document: state.document,
        zone,
        paletteId: paletteId ?? null
      });
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = label;
    },
    { captureUndo: true }
  );
}

async function addDecalToSelectedModule(): Promise<void> {
  if (!state.document || !state.selectedModuleId || !state.decalDraftId) {
    return;
  }

  const decalId = state.decalDraftId;
  const instanceId = state.selectedModuleId;
  await runAction(
    `Added ${decalId}`,
    async () => {
      state.document = await invoke<DesktopDocument>("add_module_decal_layer_command", {
        document: state.document,
        instanceId,
        decalId
      });
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Added ${decalId}`;
    },
    { captureUndo: true }
  );
}

async function removeDecalFromSelectedModule(decalId: string): Promise<void> {
  if (!state.document || !state.selectedModuleId) {
    return;
  }

  const instanceId = state.selectedModuleId;
  await runAction(
    `Removed ${decalId}`,
    async () => {
      state.document = await invoke<DesktopDocument>("remove_module_decal_layer_command", {
        document: state.document,
        instanceId,
        decalId
      });
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Removed ${decalId}`;
    },
    { captureUndo: true }
  );
}

async function applyEditCommand(command: EditCommand, successLabel: string): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction(
    successLabel,
    async () => {
      state.document = await invoke<DesktopDocument>("apply_edit_command_command", {
        document: state.document,
        command
      });
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = successLabel;
    },
    { captureUndo: true }
  );
}

async function previewMaterialAssignment(
  instanceId: string,
  zone: string,
  materialId: string
): Promise<void> {
  if (!state.document) {
    return;
  }

  const command: Extract<EditCommand, { op: "assign_material_zone" }> = {
    op: "assign_material_zone",
    instanceId,
    zone,
    materialId
  };

  await runAction(`Previewing ${zone}`, async () => {
    const preview = await invoke<DesktopCommandPreview>("preview_edit_command_command", {
      document: state.document,
      command
    });
    state.pendingEditPreview = {
      kind: "material",
      instanceId,
      zone,
      materialId,
      successLabel: `Updated ${zone}`,
      command,
      preview
    };
    state.status = `Previewed ${zone}`;
  });
}

async function previewRigTemplateAssignment(templateId: string): Promise<void> {
  if (!state.document) {
    return;
  }

  const command: Extract<EditCommand, { op: "assign_rig_template" }> = {
    op: "assign_rig_template",
    templateId
  };

  await runAction(`Previewing ${templateId}`, async () => {
    const preview = await invoke<DesktopCommandPreview>("preview_edit_command_command", {
      document: state.document,
      command
    });
    state.pendingEditPreview = {
      kind: "rig_template",
      templateId,
      successLabel: `Assigned ${templateId}`,
      command,
      preview
    };
    state.status = `Previewed ${templateId}`;
  });
}
async function previewRegionEdit(
  instanceId: string,
  region: string,
  value: number
): Promise<void> {
  if (!state.document) {
    return;
  }

  const command: Extract<EditCommand, { op: "set_region_param" }> = {
    op: "set_region_param",
    instanceId,
    region,
    value
  };

  await runAction(`Previewing ${region}`, async () => {
    const preview = await invoke<DesktopCommandPreview>("preview_edit_command_command", {
      document: state.document,
      command
    });
    state.pendingEditPreview = {
      kind: "region",
      instanceId,
      region,
      value,
      successLabel: `Updated ${region}`,
      command,
      preview
    };
    state.status = `Previewed ${region}`;
  });
}
async function previewTransformEdit(
  instanceId: string,
  field: TransformField,
  value: [number, number, number]
): Promise<void> {
  if (!state.document) {
    return;
  }

  const command: Extract<EditCommand, { op: "set_transform" }> = {
    op: "set_transform",
    instanceId,
    field,
    value
  };

  await runAction(`Previewing ${field}`, async () => {
    const preview = await invoke<DesktopCommandPreview>("preview_edit_command_command", {
      document: state.document,
      command
    });
    state.pendingEditPreview = {
      kind: "transform",
      instanceId,
      field,
      value,
      successLabel: `Updated ${field}`,
      command,
      preview
    };
    state.status = `Previewed ${field}`;
  });
}

async function applyPendingEditPreview(): Promise<void> {
  const pendingEditPreview = state.pendingEditPreview;
  if (!pendingEditPreview) {
    return;
  }

  await applyEditCommand(pendingEditPreview.command, pendingEditPreview.successLabel);
  state.pendingEditPreview = undefined;
  render();
}

function cancelPendingEditPreview(): void {
  if (!state.pendingEditPreview) {
    return;
  }

  state.pendingEditPreview = undefined;
  state.status = "Canceled edit preview";
  state.error = undefined;
  render();
}

async function undoLastAction(): Promise<void> {
  const result = undoHistory(state.history, buildUndoSnapshot());
  if (!result.snapshot) {
    return;
  }

  state.history = result.history;
  restoreViewState(result.snapshot);
  state.pendingEditPreview = undefined;
  state.status = result.label ? `Undid ${result.label}` : "Undid last action";
  state.error = undefined;
  render();
}

async function redoLastAction(): Promise<void> {
  const result = redoHistory(state.history, buildUndoSnapshot());
  if (!result.snapshot) {
    return;
  }

  state.history = result.history;
  restoreViewState(result.snapshot);
  state.pendingEditPreview = undefined;
  state.status = result.label ? `Redid ${result.label.replace(/^Redo /, "")}` : "Redid last action";
  state.error = undefined;
  render();
}

async function runAction(
  label: string,
  action: () => Promise<void>,
  options?: { captureUndo?: boolean }
): Promise<void> {
  const historySnapshot = options?.captureUndo ? buildUndoSnapshot() : undefined;
  state.pendingEditPreview = undefined;
  state.status = label;
  state.error = undefined;
  render();

  try {
    await action();
    if (historySnapshot) {
      state.history = pushHistoryEntry(state.history, state.status, historySnapshot);
    }
  } catch (error) {
    state.status = `${label} failed`;
    state.error = error instanceof Error ? error.message : String(error);
  }

  render();
}

function syncLoadedDocumentPaths(paths: DesktopPaths): void {
  state.projectPath = paths.projectPath;
  state.stylePackPath = paths.stylePackPath;
  state.savePath = paths.savePath ?? state.savePath;
}

function buildUndoSnapshot(): DesktopUndoSnapshot {
  return {
    projectId: state.projectId,
    projectPath: state.projectPath,
    stylePackPath: state.stylePackPath,
    savePath: state.savePath,
    selectedModuleId: state.selectedModuleId,
    selectedLibraryModuleId: state.selectedLibraryModuleId,
    authoredModuleIds: [...state.authoredModuleIds],
    moduleImportPath: state.moduleImportPath,
    document: state.document,
    report: state.report,
    exportBundle: state.exportBundle
  };
}

function restoreViewState(snapshot: DesktopUndoSnapshot): void {
  state.projectId = snapshot.projectId;
  state.projectPath = snapshot.projectPath;
  state.stylePackPath = snapshot.stylePackPath;
  state.savePath = snapshot.savePath;
  state.selectedModuleId = snapshot.selectedModuleId;
  state.selectedLibraryModuleId = snapshot.selectedLibraryModuleId;
  state.authoredModuleIds = snapshot.authoredModuleIds ? [...snapshot.authoredModuleIds] : [];
  state.moduleImportPath = snapshot.moduleImportPath ?? state.moduleImportPath;
  state.document = snapshot.document;
  state.report = snapshot.report;
  state.exportBundle = snapshot.exportBundle;
  clearReusableModuleDraftState();
}

function renderReusableModuleDraftEditor(draft: ReusableModuleDraft): string {
  return `
    <div class="module-draft-editor">
      <div class="inspector-block">
        <h3>Metadata Draft</h3>
        <p class="path-note">Changes stay local until you apply this reusable module draft back into the style pack.</p>
      </div>
      <div class="inspector-block">
        <h3>Connectors</h3>
        <ul class="detail-list">
          ${
            draft.connectors.length > 0
              ? draft.connectors
                  .map(
                    (connector) => `
                      <li>
                        <strong>${escapeHtml(connector.id)}</strong>
                        <div class="module-draft-grid">
                          <label>
                            <span class="detail-label">Connector Id</span>
                            <input
                              class="module-draft-connector-id"
                              data-connector-id="${escapeHtml(connector.id)}"
                              value="${escapeHtml(connector.id)}"
                            />
                          </label>
                          <label>
                            <span class="detail-label">Connector Kind</span>
                            <input
                              class="module-draft-connector-kind"
                              data-connector-id="${escapeHtml(connector.id)}"
                              value="${escapeHtml(connector.kind)}"
                            />
                          </label>
                        </div>
                      </li>
                    `
                  )
                  .join("")
              : `<li><strong>No connectors</strong><span>Add connector metadata through the style pack source if this module needs new snap points.</span></li>`
          }
        </ul>
      </div>
      <div class="inspector-block">
        <h3>Material Zones</h3>
        <div class="module-draft-inline">
          <input
            id="module-draft-material-zones"
            value="${escapeHtml(state.reusableModuleMaterialZonesInput)}"
            placeholder="skin, trim, accent"
          />
          <button id="sync-module-material-zones" class="secondary-button" type="button">Sync Zones</button>
        </div>
      </div>
      <div class="inspector-block">
        <h3>Regions</h3>
        <ul class="detail-list">
          ${draft.regions
            .map(
              (region) => `
                <li>
                  <strong>${escapeHtml(region.id)}</strong>
                  <span>${region.min.toFixed(2)} to ${region.max.toFixed(2)}</span>
                </li>
              `
            )
            .join("")}
        </ul>
        <div class="module-draft-grid">
          <label>
            <span class="detail-label">New Region Id</span>
            <input id="module-draft-region-id" value="${escapeHtml(state.reusableModuleRegionId)}" />
          </label>
          <label>
            <span class="detail-label">Min</span>
            <input id="module-draft-region-min" type="number" step="0.01" value="${escapeHtml(state.reusableModuleRegionMin)}" />
          </label>
          <label>
            <span class="detail-label">Max</span>
            <input id="module-draft-region-max" type="number" step="0.01" value="${escapeHtml(state.reusableModuleRegionMax)}" />
          </label>
        </div>
        <div class="inspector-actions">
          <button id="add-module-region" class="secondary-button" type="button">Add Region</button>
        </div>
      </div>
      <div class="inspector-actions">
        <button id="apply-module-draft" type="button">Apply Metadata Draft</button>
        <button id="cancel-module-draft" class="secondary-button" type="button">Cancel Draft</button>
      </div>
    </div>
  `;
}

function duplicateSelectedLibraryModule(): void {
  if (!state.document) {
    return;
  }

  const moduleId = resolveSelectedLibraryModuleId(
    buildModuleLibrary(state.document, state.authoredModuleIds),
    state.selectedLibraryModuleId
  );
  if (!moduleId) {
    return;
  }

  const suggestedModuleId = suggestDuplicateReusableModuleId(state.document, moduleId);
  if (!suggestedModuleId) {
    state.status = "Duplicate reusable module failed";
    state.error = `Unable to suggest an authored id for reusable module ${moduleId}.`;
    render();
    return;
  }

  const requestedModuleId = globalThis.prompt?.("Duplicate reusable module as authored", suggestedModuleId);
  if (requestedModuleId === undefined || requestedModuleId === null) {
    return;
  }

  const duplicated = duplicateReusableModule(state.document, moduleId, requestedModuleId);
  if (!duplicated) {
    state.status = "Duplicate reusable module failed";
    state.error = `Unable to duplicate reusable module ${moduleId}. Pick a non-empty id that does not already exist.`;
    render();
    return;
  }

  void runAction(
    `Duplicated ${duplicated.duplicateId}`,
    async () => {
      state.document = duplicated.document;
      state.selectedLibraryModuleId = duplicated.duplicateId;
      state.authoredModuleIds = Array.from(
        new Set([...state.authoredModuleIds, duplicated.duplicateId])
      ).sort();
      clearReusableModuleDraftState();
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Duplicated ${duplicated.duplicateId}`;
    },
    { captureUndo: true }
  );
}

function renameSelectedLibraryModule(): void {
  if (!state.document) {
    return;
  }

  const moduleId = resolveSelectedLibraryModuleId(
    buildModuleLibrary(state.document, state.authoredModuleIds),
    state.selectedLibraryModuleId
  );
  if (!moduleId || !state.authoredModuleIds.includes(moduleId)) {
    state.status = "Rename reusable module failed";
    state.error = "Only authored reusable modules can be renamed in the current browser flow.";
    render();
    return;
  }

  const requestedModuleId = globalThis.prompt?.("Rename authored reusable module", moduleId);
  if (requestedModuleId === undefined || requestedModuleId === null) {
    return;
  }

  const renamed = renameReusableModule(state.document, moduleId, requestedModuleId);
  if (!renamed) {
    state.status = "Rename reusable module failed";
    state.error = `Unable to rename reusable module ${moduleId}. Pick a non-empty id that does not already exist.`;
    render();
    return;
  }

  void runAction(
    `Renamed ${moduleId} to ${renamed.renamedId}`,
    async () => {
      state.document = renamed.document;
      state.selectedLibraryModuleId = renamed.renamedId;
      state.authoredModuleIds = Array.from(
        new Set(
          state.authoredModuleIds.map((authoredModuleId) =>
            authoredModuleId === moduleId ? renamed.renamedId : authoredModuleId
          )
        )
      ).sort();
      clearReusableModuleDraftState();
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Renamed ${moduleId} to ${renamed.renamedId}`;
    },
    { captureUndo: true }
  );
}

function deleteSelectedLibraryModule(): void {
  if (!state.document) {
    return;
  }

  const moduleId = resolveSelectedLibraryModuleId(
    buildModuleLibrary(state.document, state.authoredModuleIds),
    state.selectedLibraryModuleId
  );
  if (!moduleId || !state.authoredModuleIds.includes(moduleId)) {
    state.status = "Delete reusable module failed";
    state.error = "Only authored reusable modules can be deleted in the current browser flow.";
    render();
    return;
  }

  if (globalThis.confirm && !globalThis.confirm(`Delete authored reusable module ${moduleId}?`)) {
    return;
  }

  const deleted = deleteReusableModule(state.document, moduleId);
  if (!deleted) {
    state.status = "Delete reusable module failed";
    state.error = `Unable to delete reusable module ${moduleId}.`;
    render();
    return;
  }

  void runAction(
    `Deleted ${moduleId}`,
    async () => {
      state.document = deleted.document;
      state.authoredModuleIds = state.authoredModuleIds.filter((authoredModuleId) => authoredModuleId !== moduleId);
      state.selectedLibraryModuleId = resolveSelectedLibraryModuleId(
        buildModuleLibrary(deleted.document, state.authoredModuleIds),
        state.selectedLibraryModuleId === moduleId ? undefined : state.selectedLibraryModuleId
      );
      state.selectedModuleId = resolveSelectedModuleId(deleted.document, state.selectedModuleId);
      clearReusableModuleDraftState();
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = deleted.removedInstanceIds.length > 0
        ? `Deleted ${moduleId} and pruned ${deleted.removedInstanceIds.length} placed instance${deleted.removedInstanceIds.length === 1 ? "" : "s"}`
        : `Deleted ${moduleId}`;
    },
    { captureUndo: true }
  );
}

function startReusableModuleDraft(): void {
  if (!state.document) {
    return;
  }

  const moduleId = resolveSelectedLibraryModuleId(buildModuleLibrary(state.document, state.authoredModuleIds), state.selectedLibraryModuleId);
  if (!moduleId) {
    return;
  }

  state.selectedLibraryModuleId = moduleId;
  const draft = createReusableModuleDraft(state.document, moduleId);
  if (!draft) {
    state.status = "Reusable module draft failed";
    state.error = `Unable to open reusable module ${state.selectedLibraryModuleId}.`;
    render();
    return;
  }

  state.reusableModuleDraft = draft;
  syncReusableModuleDraftInputs(draft);
  state.status = `Editing ${draft.id}`;
  state.error = undefined;
  render();
}

function cancelReusableModuleDraft(): void {
  clearReusableModuleDraftState();
  state.status = "Canceled reusable module draft";
  state.error = undefined;
  render();
}

function syncReusableModuleDraftInputs(draft?: ReusableModuleDraft): void {
  state.reusableModuleMaterialZonesInput = draft ? draft.materialZones.join(", ") : "";
  state.reusableModuleRegionId = "";
  state.reusableModuleRegionMin = "";
  state.reusableModuleRegionMax = "";
}

function clearReusableModuleDraftState(): void {
  state.reusableModuleDraft = undefined;
  syncReusableModuleDraftInputs();
}

function updateReusableModuleConnectorDraft(
  connectorId: string,
  patch: { id?: string; kind?: string }
): void {
  if (!state.reusableModuleDraft) {
    return;
  }

  const nextId = patch.id?.trim();
  const nextKind = patch.kind?.trim();
  if ((patch.id !== undefined && !nextId) || (patch.kind !== undefined && !nextKind)) {
    state.status = "Reusable module draft failed";
    state.error = "Connector id and kind are both required.";
    render();
    return;
  }

  if (
    nextId &&
    state.reusableModuleDraft.connectors.some(
      (connector) => connector.id === nextId && connector.id !== connectorId
    )
  ) {
    state.status = "Reusable module draft failed";
    state.error = `Connector ${nextId} already exists on this reusable module.`;
    render();
    return;
  }

  state.reusableModuleDraft = updateReusableModuleDraftConnector(state.reusableModuleDraft, connectorId, {
    id: nextId,
    kind: nextKind
  });
  state.status = `Updated ${connectorId}`;
  state.error = undefined;
  render();
}

function syncReusableModuleMaterialZones(): void {
  if (!state.reusableModuleDraft) {
    return;
  }

  const materialZones = parseReusableModuleMaterialZones(state.reusableModuleMaterialZonesInput);
  if (materialZones.length === 0) {
    state.status = "Reusable module draft failed";
    state.error = "At least one material zone is required.";
    render();
    return;
  }

  state.reusableModuleDraft = setReusableModuleDraftMaterialZones(
    state.reusableModuleDraft,
    materialZones
  );
  state.reusableModuleMaterialZonesInput = materialZones.join(", ");
  state.status = `Updated ${state.reusableModuleDraft.id} zones`;
  state.error = undefined;
  render();
}

function addReusableModuleRegionFromDraft(): void {
  if (!state.reusableModuleDraft) {
    return;
  }

  const result = validateReusableModuleRegionDraft(
    state.reusableModuleRegionId,
    state.reusableModuleRegionMin,
    state.reusableModuleRegionMax
  );
  if (!result.ok) {
    state.status = "Reusable module draft failed";
    state.error = result.error;
    render();
    return;
  }

  if (state.reusableModuleDraft.regions.some((region) => region.id === result.region.id)) {
    state.status = "Reusable module draft failed";
    state.error = `Region ${result.region.id} already exists on this reusable module.`;
    render();
    return;
  }

  state.reusableModuleDraft = addReusableModuleDraftRegion(state.reusableModuleDraft, result.region);
  state.reusableModuleRegionId = "";
  state.reusableModuleRegionMin = "";
  state.reusableModuleRegionMax = "";
  state.status = `Added ${result.region.id}`;
  state.error = undefined;
  render();
}

async function applyReusableModuleMetadataDraft(): Promise<void> {
  if (!state.document || !state.reusableModuleDraft) {
    return;
  }

  const draft = state.reusableModuleDraft;
  await runAction(
    `Updated reusable module ${draft.id}`,
    async () => {
      state.document = applyReusableModuleDraft(state.document!, draft);
      if (!draft.sourceAsset) {
        state.authoredModuleIds = Array.from(new Set([...state.authoredModuleIds, draft.id])).sort();
      } else {
        state.authoredModuleIds = state.authoredModuleIds.filter((moduleId) => moduleId !== draft.id);
      }
      state.report = undefined;
      state.exportBundle = undefined;
      clearReusableModuleDraftState();
      state.status = `Updated reusable module ${draft.id}`;
    },
    { captureUndo: true }
  );
}

function renderEditPreviewCard(pendingPreview: PendingEditPreview): string {
  return `
    <div class="preview-card">
      <p class="detail-label">${escapeHtml(
        pendingPreview.kind === "material"
          ? "Pending Material Preview"
          : pendingPreview.kind === "region"
            ? "Pending Region Preview"
            : pendingPreview.kind === "rig_template"
              ? "Pending Rig Template Preview"
              : pendingPreview.kind === "connector"
                ? "Pending Connector Preview"
                : pendingPreview.kind === "socket"
                  ? "Pending Socket Preview"
                  : "Pending Transform Preview"
      )}</p>
      <strong>${escapeHtml(
        pendingPreview.kind === "material"
          ? `${pendingPreview.zone} -> ${pendingPreview.materialId}`
          : pendingPreview.kind === "region"
            ? `${pendingPreview.region} -> ${pendingPreview.value.toFixed(2)}`
            : pendingPreview.kind === "rig_template"
              ? `template -> ${pendingPreview.templateId}`
              : pendingPreview.kind === "connector"
                ? pendingPreview.targetInstanceId && pendingPreview.targetConnector
                  ? `${pendingPreview.localConnector} -> ${pendingPreview.targetInstanceId}::${pendingPreview.targetConnector}`
                  : `${pendingPreview.localConnector} -> unattached`
                : pendingPreview.kind === "socket"
                  ? `${pendingPreview.name} -> ${pendingPreview.bone}`
                  : `${pendingPreview.field} -> ${formatVec3(pendingPreview.value)}`
      )}</strong>
      <ul class="detail-list">
        ${pendingPreview.preview.diff.changes
          .map(
            (change) => `
              <li>
                <strong>${escapeHtml(change.path)}</strong>
                <span>${escapeHtml(formatPreviewValue(change.before))} -> ${escapeHtml(
                  formatPreviewValue(change.after)
                )}</span>
              </li>
            `
          )
          .join("")}
      </ul>
      <div class="inspector-actions">
        <button id="apply-edit-preview" type="button">Apply</button>
        <button id="cancel-edit-preview" class="secondary-button" type="button">Cancel</button>
      </div>
    </div>
  `;
}

function renderSelectedModuleValidationInspector(
  validationDetail: ReturnType<typeof buildSelectedModuleValidationDetail>
): string {
  if (!validationDetail) {
    return "";
  }

  return `
    <div class="inspector-block">
      <h3>Validation for This Module</h3>
      <p class="path-note">${escapeHtml(String(validationDetail.issues.length))} module issues, ${escapeHtml(String(validationDetail.projectIssues.length))} project-level issues still affect export readiness.</p>
      <ul class="validation-list">
        ${validationDetail.issues.length > 0
          ? validationDetail.issues
              .map(
                (issue) => `
                  <li class="validation-item validation-item-${escapeHtml(issue.severity.toLowerCase())}">
                    <strong>${escapeHtml(issue.code)}</strong>
                    <span>${escapeHtml(issue.summary)}</span>
                    ${issue.suggestedFix ? `<span class="validation-fix">Suggested fix: ${escapeHtml(issue.suggestedFix)}</span>` : ""}
                  </li>
                `
              )
              .join("")
          : `<li class="validation-item validation-item-ok"><strong>No module-specific issues</strong><span>This module is clear in the current report.</span></li>`}
      </ul>
      ${validationDetail.projectIssues.length > 0
        ? `
            <div class="validation-summary">
              <span class="detail-label">Project-Level Blockers</span>
              <ul class="validation-list">
                ${validationDetail.projectIssues
                  .map(
                    (issue) => `
                      <li class="validation-item validation-item-${escapeHtml(issue.severity.toLowerCase())}">
                        <strong>${escapeHtml(issue.code)}</strong>
                        <span>${escapeHtml(issue.summary)}</span>
                        ${issue.suggestedFix ? `<span class="validation-fix">Suggested fix: ${escapeHtml(issue.suggestedFix)}</span>` : ""}
                      </li>
                    `
                  )
                  .join("")}
              </ul>
            </div>
          `
        : ""}
    </div>
  `;
}
function renderPaintInspector(
  instanceId: string,
  paint: NonNullable<ReturnType<typeof buildSelectedModuleDetail>>["paint"],
  decalDraftId: string
): string {
  return `
    <div class="inspector-block">
      <h3>Paint & Decals</h3>
      <p class="path-note">Fill layers apply project-wide by material zone. Decals target only this module.</p>
      <ul class="detail-list">
        ${paint.fills
          .map(
            (fill) => `
              <li>
                <strong>${escapeHtml(fill.zone)}</strong>
                <select class="paint-fill-select" data-zone="${escapeHtml(fill.zone)}">
                  <option value="" ${fill.paletteId ? "" : "selected"}>No fill</option>
                  ${fill.availablePaletteIds
                    .map(
                      (paletteId) => `
                        <option value="${escapeHtml(paletteId)}" ${
                          paletteId === fill.paletteId ? "selected" : ""
                        }>
                          ${escapeHtml(paletteId)}
                        </option>
                      `
                    )
                    .join("")}
                </select>
              </li>
            `
          )
          .join("")}
      </ul>
      <div class="socket-form">
        <label>
          <span class="detail-label">Decal Draft</span>
          <select id="decal-draft">
            ${paint.availableDecalIds
              .map(
                (availableDecalId) => `
                  <option value="${escapeHtml(availableDecalId)}" ${
                    availableDecalId === decalDraftId ? "selected" : ""
                  }>
                    ${escapeHtml(availableDecalId)}
                  </option>
                `
              )
              .join("")}
          </select>
        </label>
        <button id="add-decal" type="button" ${paint.availableDecalIds.length > 0 ? "" : "disabled"}>Add Decal</button>
      </div>
      <ul class="detail-list">
        ${
          paint.decals.length > 0
            ? paint.decals
                .map(
                  (decal) => `
                    <li>
                      <strong>${escapeHtml(decal.decalId)}</strong>
                      <button
                        class="secondary-button remove-decal"
                        type="button"
                        data-instance-id="${escapeHtml(instanceId)}"
                        data-decal-id="${escapeHtml(decal.decalId)}"
                      >
                        Remove
                      </button>
                    </li>
                  `
                )
                .join("")
            : `<li><strong>No decals</strong><span>Add one style-pack decal to this module.</span></li>`
        }
      </ul>
    </div>
  `;
}

function renderTransformInputs(
  instanceId: string,
  field: TransformField,
  label: string,
  vector: [number, number, number],
  pendingPreview: PendingEditPreview | undefined,
  step: string,
  min?: string
): string {
  return `
    <div class="transform-row">
      <span class="detail-label">${escapeHtml(label)}</span>
      <div class="transform-inputs">
        ${(["x", "y", "z"] as const)
          .map((axis, index) => {
            const minAttribute = min ? `min="${min}"` : "";

            return `
              <label class="transform-axis">
                <span>${axis.toUpperCase()}</span>
                <input
                  class="transform-input"
                  type="number"
                  step="${step}"
                  ${minAttribute}
                  data-instance-id="${escapeHtml(instanceId)}"
                  data-field="${field}"
                  data-axis="${axis}"
                  value="${resolveTransformInputValue(instanceId, field, axis, vector[index], pendingPreview)}"
                />
              </label>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function readTransformValue(
  instanceId: string,
  field: TransformField
): [number, number, number] | undefined {
  const instance = state.document?.project.modules.find((module) => module.instanceId === instanceId);
  if (!instance) {
    return undefined;
  }

  return instance.transform[field];
}

function axisToIndex(axis: string): 0 | 1 | 2 | undefined {
  if (axis === "x") {
    return 0;
  }

  if (axis === "y") {
    return 1;
  }

  if (axis === "z") {
    return 2;
  }

  return undefined;
}

function formatVec3(vector: [number, number, number]): string {
  return vector.map((value) => value.toFixed(2)).join(", ");
}

function resolveSelectedLibraryModuleId(
  library: ModuleLibraryEntry[],
  selectedLibraryModuleId?: string
): string | undefined {
  if (selectedLibraryModuleId && library.some((entry) => entry.moduleId === selectedLibraryModuleId)) {
    return selectedLibraryModuleId;
  }

  return library[0]?.moduleId;
}

function formatPreviewValue(value: DesktopCommandPreview["diff"]["changes"][number]["before"]): string {
  switch (value.kind) {
    case "vector3":
      return formatVec3(value.value);
    case "scalar":
      return value.value.toFixed(2);
    case "text":
      return value.value;
    case "missing":
      return "missing";
  }
}

render();


















