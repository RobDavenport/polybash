import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  buildRigDetail,
  buildModuleLibrary,
  buildModuleCards,
  buildSelectedModuleDetail,
  resolveSelectedModuleId
} from "./documentInspector";
import {
  ensureProjectSavePath,
  resolveDialogPath,
  suggestProjectSavePath
} from "./documentPaths";
import { captureUndoSnapshot, restoreUndoSnapshot } from "./historyState";
import { buildProxyScene } from "./sceneProjection";
import "./styles.css";
import type {
  DesktopCommandPreview,
  DesktopDocument,
  DesktopExportBundle,
  DesktopPaths,
  DesktopUndoSnapshot,
  EditCommand,
  TransformField,
  ValidationReport
} from "./types";
import { mountViewport } from "./viewportController";

type PendingMaterialPreview = {
  instanceId: string;
  zone: string;
  materialId: string;
  command: Extract<EditCommand, { op: "assign_material_zone" }>;
  preview: DesktopCommandPreview;
};

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
  socketName: string;
  socketBone: string;
  decalDraftId: string;
  selectedModuleId?: string;
  undoSnapshot?: DesktopUndoSnapshot;
  pendingMaterialPreview?: PendingMaterialPreview;
};

const state: ViewState = {
  status: "Idle",
  projectId: "fighter_template_01",
  projectPath: "fixtures/projects/valid/fighter_basic.zxmodel.json",
  stylePackPath: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
  savePath: "out/desktop/fighter_basic_saved.zxmodel.json",
  socketName: "weapon_r",
  socketBone: "hand_r",
  decalDraftId: "dragon_01"
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
  const library = loadedDocument ? buildModuleLibrary(loadedDocument) : [];
  const rigDetail = loadedDocument ? buildRigDetail(loadedDocument) : undefined;
  const selectedDetail = loadedDocument
    ? buildSelectedModuleDetail(loadedDocument, selectedModuleId)
    : undefined;
  const pendingMaterialPreview =
    selectedDetail && state.pendingMaterialPreview?.instanceId === selectedDetail.instanceId
      ? state.pendingMaterialPreview
      : undefined;
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
        </div>
        <div class="actions">
          <button id="create-template">New Fighter</button>
          <button id="load">Load Paths</button>
          <button id="load-canonical">Load Canonical Fighter</button>
          <button id="save" ${loadedDocument ? "" : "disabled"}>Save Project</button>
          <button id="save-as" ${loadedDocument ? "" : "disabled"}>Save As</button>
          <button id="undo" class="secondary-button" ${state.undoSnapshot ? "" : "disabled"}>Undo</button>
          <button id="validate" ${loadedDocument ? "" : "disabled"}>Validate</button>
          <button id="export" ${loadedDocument ? "" : "disabled"}>Export Preview</button>
        </div>
        <div class="status">
          <span>Status</span>
          <strong>${escapeHtml(state.status)}</strong>
          ${state.error ? `<p class="status-error">${escapeHtml(state.error)}</p>` : ""}
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
                        "0.05"
                      )}
                      ${renderTransformInputs(
                        selectedDetail.instanceId,
                        "rotation",
                        "Rotation",
                        selectedDetail.rotation,
                        "1"
                      )}
                      ${renderTransformInputs(
                        selectedDetail.instanceId,
                        "scale",
                        "Scale",
                        selectedDetail.scale,
                        "0.05",
                        "0.01"
                      )}
                    </div>
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
                                        resolveMaterialSelectionValue(
                                          pendingMaterialPreview,
                                          material.zone,
                                          material.materialId
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
                        ? renderMaterialPreviewCard(pendingMaterialPreview)
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
                                        value="${region.current}"
                                      />
                                      <span>${region.current.toFixed(2)} (${Math.round(region.utilization * 100)}%)</span>
                                    </div>
                                  </li>
                                `
                              )
                              .join("")
                          : `<li><strong>No authored regions</strong><span>This module does not expose constrained deformation inputs.</span></li>`
                      }
                    </ul>
                  </div>
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
                                        <option value="">Unattached</option>
                                        ${connector.compatibleTargets
                                          .map((option) => {
                                            const value = `${option.instanceId}::${option.connectorId}`;
                                            const isSelected =
                                              connector.attachment?.targetInstanceId === option.instanceId &&
                                              connector.attachment?.targetConnector === option.connectorId;

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
                  </div>
                `
                : `<p class="empty-note">Selection appears here once a project is loaded.</p>`
            }
          </section>
          <section class="panel">
            <p class="eyebrow">Module Library</p>
            <h2>${loadedDocument ? `${library.length} style modules` : "Load a Document"}</h2>
            <ul class="detail-list">
              ${
                loadedDocument
                  ? library
                      .map(
                        (entry) => `
                          <li class="library-item">
                            <div>
                              <strong>${escapeHtml(entry.moduleId)}</strong>
                              <span>${escapeHtml(entry.assetType)} | ${entry.connectorCount} connectors | ${entry.regionCount} regions</span>
                            </div>
                            <button class="library-add" data-module-id="${escapeHtml(entry.moduleId)}">Add</button>
                          </li>
                        `
                      )
                      .join("")
                  : `<li><strong>No style pack</strong><span>Create or load a project first.</span></li>`
              }
            </ul>
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
                              template.id === rigDetail.templateId ? "selected" : ""
                            }>
                              ${escapeHtml(template.id)}
                            </option>
                          `
                        )
                        .join("")}
                    </select>
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
                        rigDetail.sockets.length > 0
                          ? rigDetail.sockets
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
    .querySelector<HTMLButtonElement>("#undo")
    ?.addEventListener("click", undoLastAction);
  globalThis.document
    .querySelector<HTMLSelectElement>("#rig-template-select")
    ?.addEventListener("change", (event) => {
      const templateId = (event.target as HTMLSelectElement).value;
      if (templateId) {
        void applyEditCommand(
          {
            op: "assign_rig_template",
            templateId
          },
          `Assigned ${templateId}`
        );
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
      state.pendingMaterialPreview = undefined;
      render();
    })
  );
  globalThis.document.querySelectorAll<HTMLButtonElement>(".library-add").forEach((element) =>
    element.addEventListener("click", () => {
      const moduleId = element.dataset.moduleId;
      if (moduleId) {
        void addModule(moduleId);
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
    .querySelector<HTMLButtonElement>("#apply-material-preview")
    ?.addEventListener("click", applyPendingMaterialPreview);
  globalThis.document
    .querySelector<HTMLButtonElement>("#cancel-material-preview")
    ?.addEventListener("click", cancelPendingMaterialPreview);
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
        void applyEditCommand(
          {
            op: "set_region_param",
            instanceId,
            region,
            value: Number(element.value)
          },
          `Updated ${region}`
        );
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

      void applyEditCommand(
        {
          op: "set_transform",
          instanceId,
          field,
          value: nextTransform
        },
        `Updated ${field}`
      );
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
        void clearConnectorAttachment(instanceId, localConnector);
        return;
      }

      const [targetInstanceId, targetConnector] = element.value.split("::");
      if (targetInstanceId && targetConnector) {
        void setConnectorAttachment(instanceId, localConnector, targetInstanceId, targetConnector);
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
      state.selectedModuleId = resolveSelectedModuleId(state.document);
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
      state.selectedModuleId = resolveSelectedModuleId(state.document);
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
      state.selectedModuleId = resolveSelectedModuleId(state.document);
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Loaded ${state.document.project.id}`;
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

async function attachSocket(): Promise<void> {
  if (!state.socketName.trim() || !state.socketBone.trim()) {
    state.error = "Socket name and bone are both required.";
    state.status = "Attach socket failed";
    render();
    return;
  }

  await applyEditCommand(
    {
      op: "attach_socket",
      name: state.socketName.trim(),
      bone: state.socketBone.trim()
    },
    `Attached ${state.socketName.trim()}`
  );
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

async function setConnectorAttachment(
  instanceId: string,
  localConnector: string,
  targetInstanceId: string,
  targetConnector: string
): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction(
    `Attached ${localConnector}`,
    async () => {
      state.document = await invoke<DesktopDocument>("set_connector_attachment_command", {
        document: state.document,
        instanceId,
        localConnector,
        targetInstanceId,
        targetConnector
      });
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Attached ${localConnector}`;
    },
    { captureUndo: true }
  );
}

async function clearConnectorAttachment(
  instanceId: string,
  localConnector: string
): Promise<void> {
  if (!state.document) {
    return;
  }

  await runAction(
    `Cleared ${localConnector}`,
    async () => {
      state.document = await invoke<DesktopDocument>("clear_connector_attachment_command", {
        document: state.document,
        instanceId,
        localConnector
      });
      state.report = undefined;
      state.exportBundle = undefined;
      state.status = `Cleared ${localConnector}`;
    },
    { captureUndo: true }
  );
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
    state.pendingMaterialPreview = {
      instanceId,
      zone,
      materialId,
      command,
      preview
    };
    state.status = `Previewed ${zone}`;
  });
}

async function applyPendingMaterialPreview(): Promise<void> {
  const pendingMaterialPreview = state.pendingMaterialPreview;
  if (!pendingMaterialPreview) {
    return;
  }

  await applyEditCommand(pendingMaterialPreview.command, `Updated ${pendingMaterialPreview.zone}`);
  state.pendingMaterialPreview = undefined;
  render();
}

function cancelPendingMaterialPreview(): void {
  if (!state.pendingMaterialPreview) {
    return;
  }

  state.pendingMaterialPreview = undefined;
  state.status = "Canceled material preview";
  state.error = undefined;
  render();
}

async function undoLastAction(): Promise<void> {
  const snapshot = restoreUndoSnapshot(state.undoSnapshot);
  if (!snapshot) {
    return;
  }

  state.projectId = snapshot.projectId;
  state.projectPath = snapshot.projectPath;
  state.stylePackPath = snapshot.stylePackPath;
  state.savePath = snapshot.savePath;
  state.selectedModuleId = snapshot.selectedModuleId;
  state.document = snapshot.document;
  state.report = snapshot.report;
  state.exportBundle = snapshot.exportBundle;
  state.undoSnapshot = undefined;
  state.pendingMaterialPreview = undefined;
  state.status = "Undid last action";
  state.error = undefined;
  render();
}

async function runAction(
  label: string,
  action: () => Promise<void>,
  options?: { captureUndo?: boolean }
): Promise<void> {
  const undoSnapshot = options?.captureUndo ? captureUndoSnapshot(buildUndoSnapshot()) : undefined;
  state.pendingMaterialPreview = undefined;
  state.status = label;
  state.error = undefined;
  render();

  try {
    await action();
    if (undoSnapshot) {
      state.undoSnapshot = undoSnapshot;
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
    document: state.document,
    report: state.report,
    exportBundle: state.exportBundle
  };
}

function resolveMaterialSelectionValue(
  pendingMaterialPreview: PendingMaterialPreview | undefined,
  zone: string,
  materialId: string
): string {
  if (pendingMaterialPreview?.zone === zone) {
    return pendingMaterialPreview.materialId;
  }

  return materialId;
}

function renderMaterialPreviewCard(pendingMaterialPreview: PendingMaterialPreview): string {
  return `
    <div class="preview-card">
      <p class="detail-label">Pending Material Preview</p>
      <strong>${escapeHtml(pendingMaterialPreview.zone)} -> ${escapeHtml(pendingMaterialPreview.materialId)}</strong>
      <ul class="detail-list">
        ${pendingMaterialPreview.preview.diff.changes
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
        <button id="apply-material-preview" type="button">Apply</button>
        <button id="cancel-material-preview" class="secondary-button" type="button">Cancel</button>
      </div>
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
                  value="${vector[index]}"
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










