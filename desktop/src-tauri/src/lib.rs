use base64::prelude::{Engine as _, BASE64_STANDARD};
use polybash_contracts::{
    parse_project_str, parse_stylepack_str, to_pretty_json, AssetType, DeclaredMetrics,
    EditCommand, ModuleDescriptor, ModuleInstance, PaintLayer, Project, RigAssignment, StylePack,
    Transform, ValidationReport,
};
use polybash_domain::{
    apply_command, preview_command_with_diff, CommandChange, CommandDiff, PreviewValue,
};
use polybash_export::{export_project, ExportError};
use polybash_validate::validate_project;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DesktopPaths {
    #[serde(rename = "projectPath")]
    pub project_path: String,
    #[serde(rename = "stylePackPath")]
    pub style_pack_path: String,
    #[serde(rename = "savePath")]
    pub save_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DesktopDocument {
    pub project: Project,
    #[serde(rename = "stylePack")]
    pub style_pack: StylePack,
    pub paths: DesktopPaths,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DesktopExportBundle {
    pub document: DesktopDocument,
    pub report: ValidationReport,
    #[serde(rename = "glbBytesBase64")]
    pub glb_bytes_base64: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DesktopCommandPreview {
    pub document: DesktopDocument,
    pub diff: DesktopCommandDiff,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DesktopCommandDiff {
    pub op: String,
    pub target: String,
    pub changes: Vec<DesktopCommandChange>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DesktopCommandChange {
    pub path: String,
    pub before: DesktopPreviewValue,
    pub after: DesktopPreviewValue,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", content = "value", rename_all = "camelCase")]
pub enum DesktopPreviewValue {
    Vector3([f32; 3]),
    Scalar(f32),
    Text(String),
    Missing,
}

#[derive(Debug, Error)]
pub enum DesktopError {
    #[error("failed to read '{path}': {message}")]
    ReadPath { path: String, message: String },
    #[error("failed to write '{path}': {message}")]
    WritePath { path: String, message: String },
    #[error("failed to parse project: {0}")]
    ParseProject(String),
    #[error("failed to parse style pack: {0}")]
    ParseStylePack(String),
    #[error("failed to serialize project: {0}")]
    SerializeProject(String),
    #[error("module descriptor not found: {0}")]
    MissingModule(String),
    #[error("module instance not found: {0}")]
    MissingInstance(String),
    #[error("connector not found: {0}")]
    MissingConnector(String),
    #[error("paint target not found: {0}")]
    MissingPaintTarget(String),
    #[error("palette not found: {0}")]
    MissingPalette(String),
    #[error("decal not found: {0}")]
    MissingDecal(String),
    #[error("connector kinds are incompatible: {left_kind} -> {right_kind}")]
    IncompatibleConnectorKinds {
        left_kind: String,
        right_kind: String,
    },
    #[error("failed to apply edit command: {0}")]
    ApplyCommand(String),
    #[error("validation blocked export")]
    ValidationBlocked(ValidationReport),
}

impl From<CommandDiff> for DesktopCommandDiff {
    fn from(value: CommandDiff) -> Self {
        Self {
            op: value.op,
            target: value.target,
            changes: value
                .changes
                .into_iter()
                .map(DesktopCommandChange::from)
                .collect(),
        }
    }
}

impl From<CommandChange> for DesktopCommandChange {
    fn from(value: CommandChange) -> Self {
        Self {
            path: value.path,
            before: DesktopPreviewValue::from(value.before),
            after: DesktopPreviewValue::from(value.after),
        }
    }
}

impl From<PreviewValue> for DesktopPreviewValue {
    fn from(value: PreviewValue) -> Self {
        match value {
            PreviewValue::Vector3(value) => Self::Vector3(value),
            PreviewValue::Scalar(value) => Self::Scalar(value),
            PreviewValue::Text(value) => Self::Text(value),
            PreviewValue::Missing => Self::Missing,
        }
    }
}

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .expect("repo root")
}

fn canonical_paths() -> DesktopPaths {
    DesktopPaths {
        project_path: "fixtures/projects/valid/fighter_basic.zxmodel.json".to_string(),
        style_pack_path: "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json".to_string(),
        save_path: Some("out/desktop/fighter_basic.zxmodel.json".to_string()),
    }
}

fn resolve_input_path(input: &str) -> PathBuf {
    let path = PathBuf::from(input);
    if path.is_absolute() {
        path
    } else {
        repo_root().join(path)
    }
}

fn read_text(path: &Path) -> Result<String, DesktopError> {
    std::fs::read_to_string(path).map_err(|error| DesktopError::ReadPath {
        path: path.display().to_string(),
        message: error.to_string(),
    })
}

fn load_style_pack(style_pack_path: &str) -> Result<StylePack, DesktopError> {
    let resolved_style_pack_path = resolve_input_path(style_pack_path);
    parse_stylepack_str(&read_text(&resolved_style_pack_path)?)
        .map_err(|error| DesktopError::ParseStylePack(error.to_string()))
}

fn next_instance_id(project: &Project, module_id: &str) -> String {
    let prefix = module_id
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect::<String>();

    for index in 1.. {
        let candidate = format!("{prefix}_{index:02}");
        if !project
            .modules
            .iter()
            .any(|instance| instance.instance_id == candidate)
        {
            return candidate;
        }
    }

    unreachable!("instance id space is exhausted")
}

fn next_available_instance_id(project: &Project, prefix: &str) -> String {
    for index in 1.. {
        let candidate = format!("{prefix}_{index:02}");
        if !project
            .modules
            .iter()
            .any(|instance| instance.instance_id == candidate)
        {
            return candidate;
        }
    }

    unreachable!("instance id space is exhausted")
}

fn split_numeric_suffix(value: &str) -> (&str, Option<u32>) {
    match value.rsplit_once('_') {
        Some((prefix, suffix)) => match suffix.parse::<u32>() {
            Ok(parsed) => (prefix, Some(parsed)),
            Err(_) => (value, None),
        },
        None => (value, None),
    }
}

fn swap_side_marker(value: &str) -> Option<String> {
    [
        ("_left_", "_right_"),
        ("_right_", "_left_"),
        ("_left", "_right"),
        ("_right", "_left"),
        ("_l_", "_r_"),
        ("_r_", "_l_"),
        ("_l", "_r"),
        ("_r", "_l"),
    ]
    .iter()
    .find_map(|(from, to)| value.contains(from).then(|| value.replacen(from, to, 1)))
}

fn mirrored_module_id(style_pack: &StylePack, module_id: &str) -> String {
    swap_side_marker(module_id)
        .filter(|candidate| style_pack.module(candidate).is_some())
        .unwrap_or_else(|| module_id.to_string())
}

fn next_mirrored_instance_id(project: &Project, source_instance_id: &str) -> String {
    if let Some(swapped) = swap_side_marker(source_instance_id) {
        if !project
            .modules
            .iter()
            .any(|instance| instance.instance_id == swapped)
        {
            return swapped;
        }

        let (base, has_suffix) = split_numeric_suffix(&swapped);
        return next_available_instance_id(
            project,
            if has_suffix.is_some() { base } else { &swapped },
        );
    }

    let (base, has_suffix) = split_numeric_suffix(source_instance_id);
    let mirror_base = if has_suffix.is_some() {
        format!("{base}_mirror")
    } else {
        format!("{source_instance_id}_mirror")
    };
    next_available_instance_id(project, &mirror_base)
}

fn mirrored_transform(transform: &Transform) -> Transform {
    Transform {
        position: [
            -transform.position[0],
            transform.position[1],
            transform.position[2],
        ],
        rotation: [
            transform.rotation[0],
            -transform.rotation[1],
            -transform.rotation[2],
        ],
        scale: transform.scale,
    }
}

fn mirrored_connector_id(connector_id: &str) -> String {
    swap_side_marker(connector_id).unwrap_or_else(|| connector_id.to_string())
}

fn apply_mirrored_inbound_attachments(
    document: &mut DesktopDocument,
    source_instance: &ModuleInstance,
    mirrored_instance: &ModuleInstance,
) {
    let mirrored_descriptor = match document.style_pack.module(&mirrored_instance.module_id) {
        Some(descriptor) => descriptor,
        None => return,
    };
    let updates = document
        .project
        .modules
        .iter()
        .enumerate()
        .flat_map(|(owner_index, owner)| {
            let owner_descriptor = match document.style_pack.module(&owner.module_id) {
                Some(descriptor) => descriptor,
                None => return Vec::new(),
            };

            owner
                .connector_attachments
                .iter()
                .filter(|attachment| attachment.target_instance_id == source_instance.instance_id)
                .filter_map(|attachment| {
                    let mirrored_local_connector =
                        mirrored_connector_id(&attachment.local_connector);
                    if owner
                        .connector_attachments
                        .iter()
                        .any(|existing| existing.local_connector == mirrored_local_connector)
                    {
                        return None;
                    }

                    let local_descriptor = owner_descriptor.connector(&mirrored_local_connector)?;
                    let mirrored_target_connector =
                        mirrored_connector_id(&attachment.target_connector);
                    let target_descriptor =
                        mirrored_descriptor.connector(&mirrored_target_connector)?;

                    connector_is_compatible(
                        &document.style_pack,
                        &local_descriptor.kind,
                        &target_descriptor.kind,
                    )
                    .then_some((
                        owner_index,
                        polybash_contracts::ConnectorAttachment {
                            local_connector: mirrored_local_connector,
                            target_instance_id: mirrored_instance.instance_id.clone(),
                            target_connector: mirrored_target_connector,
                        },
                    ))
                })
                .collect::<Vec<_>>()
        })
        .collect::<Vec<_>>();

    for (owner_index, attachment) in updates {
        document.project.modules[owner_index]
            .connector_attachments
            .push(attachment);
    }
}

fn default_transform(project: &Project, module_id: &str) -> Transform {
    let module_id = module_id.to_ascii_lowercase();
    if module_id.contains("torso") {
        return Transform {
            position: [0.0, 1.0, 0.0],
            rotation: [0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
        };
    }

    if module_id.contains("head") {
        return Transform {
            position: [0.0, 1.8, 0.0],
            rotation: [0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
        };
    }

    if module_id.contains("arm") && module_id.contains("_l") {
        return Transform {
            position: [-0.6, 1.2, 0.0],
            rotation: [0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
        };
    }

    if module_id.contains("arm") && module_id.contains("_r") {
        return Transform {
            position: [0.6, 1.2, 0.0],
            rotation: [0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
        };
    }

    if module_id.contains("leg") && module_id.contains("_l") {
        return Transform {
            position: [-0.25, 0.3, 0.0],
            rotation: [0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
        };
    }

    if module_id.contains("leg") && module_id.contains("_r") {
        return Transform {
            position: [0.25, 0.3, 0.0],
            rotation: [0.0, 0.0, 0.0],
            scale: [1.0, 1.0, 1.0],
        };
    }

    if module_id.contains("weapon") {
        return Transform {
            position: [0.95, 1.0, 0.0],
            rotation: [0.0, 0.0, 90.0],
            scale: [1.0, 1.0, 1.0],
        };
    }

    Transform {
        position: [project.modules.len() as f32 * 0.45, 1.0, 0.0],
        rotation: [0.0, 0.0, 0.0],
        scale: [1.0, 1.0, 1.0],
    }
}

fn default_material_for_zone(style_pack: &StylePack, zone: &str) -> Option<String> {
    let palette = style_pack.palettes.first()?;
    let preferred_keywords = if zone.contains("skin") {
        ["skin", "cloth", "metal"]
    } else if zone.contains("trim") || zone.contains("blade") {
        ["metal", "cloth", "skin"]
    } else {
        ["cloth", "metal", "skin"]
    };

    for keyword in preferred_keywords {
        if let Some(material_id) = palette
            .materials
            .iter()
            .find(|material_id| material_id.contains(keyword))
        {
            return Some(material_id.clone());
        }
    }

    palette.materials.first().cloned()
}

fn default_material_slots(
    style_pack: &StylePack,
    descriptor: &ModuleDescriptor,
) -> BTreeMap<String, String> {
    descriptor
        .material_zones
        .iter()
        .filter_map(|zone| {
            default_material_for_zone(style_pack, zone)
                .map(|material_id| (zone.clone(), material_id))
        })
        .collect()
}

fn default_region_params(descriptor: &ModuleDescriptor) -> BTreeMap<String, f32> {
    descriptor
        .regions
        .iter()
        .map(|region| (region.id.clone(), 0.0_f32.clamp(region.min, region.max)))
        .collect()
}

fn connector_is_compatible(style_pack: &StylePack, left_kind: &str, right_kind: &str) -> bool {
    style_pack
        .connector_taxonomy
        .get(left_kind)
        .map(|allowed| allowed.iter().any(|kind| kind == right_kind))
        .unwrap_or(false)
        || style_pack
            .connector_taxonomy
            .get(right_kind)
            .map(|allowed| allowed.iter().any(|kind| kind == left_kind))
            .unwrap_or(false)
}

fn project_has_material_zone(project: &Project, zone: &str) -> bool {
    project
        .modules
        .iter()
        .any(|instance| instance.material_slots.contains_key(zone))
}

fn style_pack_has_palette(style_pack: &StylePack, palette_id: &str) -> bool {
    style_pack
        .palettes
        .iter()
        .any(|palette| palette.id == palette_id)
}

fn style_pack_has_decal(style_pack: &StylePack, decal_id: &str) -> bool {
    style_pack
        .decal_ids
        .iter()
        .any(|candidate| candidate == decal_id)
}

fn replace_fill_layer(
    paint_layers: Vec<PaintLayer>,
    zone: &str,
    palette_id: Option<&str>,
) -> Vec<PaintLayer> {
    let mut next = Vec::with_capacity(paint_layers.len() + usize::from(palette_id.is_some()));
    let mut inserted = false;

    for layer in paint_layers {
        match layer {
            PaintLayer::Fill { target, .. } if target == zone => {
                if !inserted {
                    if let Some(palette_id) = palette_id {
                        next.push(PaintLayer::Fill {
                            target: zone.to_string(),
                            palette: palette_id.to_string(),
                        });
                    }
                    inserted = true;
                }
            }
            other => next.push(other),
        }
    }

    if !inserted {
        if let Some(palette_id) = palette_id {
            next.push(PaintLayer::Fill {
                target: zone.to_string(),
                palette: palette_id.to_string(),
            });
        }
    }

    next
}

fn snap_anchor_transform(module_id: &str) -> Transform {
    default_transform(
        &Project {
            version: 1,
            id: String::new(),
            asset_type: AssetType::Character,
            style_pack_id: String::new(),
            skeleton_template: None,
            modules: Vec::new(),
            paint_layers: Vec::new(),
            rig: None,
            declared_metrics: DeclaredMetrics {
                triangles: 0,
                materials: 0,
                textures: 0,
                atlas_width: 0,
                atlas_height: 0,
                bones: 0,
                sockets: 0,
            },
        },
        module_id,
    )
}

fn snapped_transform(
    source_instance: &ModuleInstance,
    target_instance: &ModuleInstance,
) -> Transform {
    let source_anchor = snap_anchor_transform(&source_instance.module_id);
    let target_anchor = snap_anchor_transform(&target_instance.module_id);

    Transform {
        position: [
            target_instance.transform.position[0] + source_anchor.position[0]
                - target_anchor.position[0],
            target_instance.transform.position[1] + source_anchor.position[1]
                - target_anchor.position[1],
            target_instance.transform.position[2] + source_anchor.position[2]
                - target_anchor.position[2],
        ],
        rotation: [
            target_instance.transform.rotation[0] + source_anchor.rotation[0]
                - target_anchor.rotation[0],
            target_instance.transform.rotation[1] + source_anchor.rotation[1]
                - target_anchor.rotation[1],
            target_instance.transform.rotation[2] + source_anchor.rotation[2]
                - target_anchor.rotation[2],
        ],
        scale: source_instance.transform.scale,
    }
}

pub fn create_fighter_template(
    project_id: &str,
    style_pack_path: &str,
) -> Result<DesktopDocument, DesktopError> {
    let style_pack = load_style_pack(style_pack_path)?;
    let rig_template_id = style_pack
        .rig_templates
        .first()
        .map(|template| template.id.clone());
    let save_path = format!("out/desktop/{project_id}.zxmodel.json");

    Ok(DesktopDocument {
        project: Project {
            version: 1,
            id: project_id.to_string(),
            asset_type: AssetType::Character,
            style_pack_id: style_pack.id.clone(),
            skeleton_template: rig_template_id.clone(),
            modules: Vec::new(),
            paint_layers: Vec::new(),
            rig: rig_template_id.map(|template_id| RigAssignment {
                template_id,
                sockets: Vec::new(),
            }),
            declared_metrics: DeclaredMetrics {
                triangles: 0,
                materials: 0,
                textures: 0,
                atlas_width: 0,
                atlas_height: 0,
                bones: 0,
                sockets: 0,
            },
        },
        style_pack,
        paths: DesktopPaths {
            project_path: save_path.clone(),
            style_pack_path: style_pack_path.to_string(),
            save_path: Some(save_path),
        },
    })
}

pub fn load_document(
    project_path: &str,
    style_pack_path: &str,
) -> Result<DesktopDocument, DesktopError> {
    let resolved_project_path = resolve_input_path(project_path);
    let style_pack = load_style_pack(style_pack_path)?;

    let project = parse_project_str(&read_text(&resolved_project_path)?)
        .map_err(|error| DesktopError::ParseProject(error.to_string()))?;

    Ok(DesktopDocument {
        project,
        style_pack,
        paths: DesktopPaths {
            project_path: project_path.to_string(),
            style_pack_path: style_pack_path.to_string(),
            save_path: None,
        },
    })
}

pub fn load_canonical_document() -> Result<DesktopDocument, DesktopError> {
    let paths = canonical_paths();
    let mut document = load_document(&paths.project_path, &paths.style_pack_path)?;
    document.paths.save_path = paths.save_path;
    Ok(document)
}

pub fn add_module_instance(
    mut document: DesktopDocument,
    module_id: &str,
) -> Result<DesktopDocument, DesktopError> {
    let descriptor = document
        .style_pack
        .module(module_id)
        .cloned()
        .ok_or_else(|| DesktopError::MissingModule(module_id.to_string()))?;
    let instance_id = next_instance_id(&document.project, module_id);
    let transform = default_transform(&document.project, module_id);
    let material_slots = default_material_slots(&document.style_pack, &descriptor);
    let region_params = default_region_params(&descriptor);

    document.project.modules.push(ModuleInstance {
        instance_id,
        module_id: descriptor.id,
        transform,
        connector_attachments: Vec::new(),
        material_slots,
        region_params,
    });

    Ok(document)
}

pub fn remove_module_instance(
    mut document: DesktopDocument,
    instance_id: &str,
) -> Result<DesktopDocument, DesktopError> {
    let before = document.project.modules.len();
    document
        .project
        .modules
        .retain(|instance| instance.instance_id != instance_id);

    if document.project.modules.len() == before {
        return Err(DesktopError::MissingInstance(instance_id.to_string()));
    }

    for instance in &mut document.project.modules {
        instance
            .connector_attachments
            .retain(|attachment| attachment.target_instance_id != instance_id);
    }

    document.project.paint_layers.retain(|layer| match layer {
        PaintLayer::Decal { target, .. } => target != instance_id,
        PaintLayer::Fill { .. } => true,
    });

    Ok(document)
}

pub fn set_fill_layer_palette(
    mut document: DesktopDocument,
    zone: &str,
    palette_id: Option<&str>,
) -> Result<DesktopDocument, DesktopError> {
    if !project_has_material_zone(&document.project, zone) {
        return Err(DesktopError::MissingPaintTarget(zone.to_string()));
    }

    if let Some(palette_id) = palette_id {
        if !style_pack_has_palette(&document.style_pack, palette_id) {
            return Err(DesktopError::MissingPalette(palette_id.to_string()));
        }
    }

    document.project.paint_layers =
        replace_fill_layer(document.project.paint_layers, zone, palette_id);

    Ok(document)
}

pub fn add_module_decal_layer(
    mut document: DesktopDocument,
    instance_id: &str,
    decal_id: &str,
) -> Result<DesktopDocument, DesktopError> {
    if !document
        .project
        .modules
        .iter()
        .any(|instance| instance.instance_id == instance_id)
    {
        return Err(DesktopError::MissingInstance(instance_id.to_string()));
    }

    if !style_pack_has_decal(&document.style_pack, decal_id) {
        return Err(DesktopError::MissingDecal(decal_id.to_string()));
    }

    let already_exists = document.project.paint_layers.iter().any(|layer| {
        matches!(
            layer,
            PaintLayer::Decal { target, decal_id: existing }
                if target == instance_id && existing == decal_id
        )
    });
    if already_exists {
        return Ok(document);
    }

    document.project.paint_layers.push(PaintLayer::Decal {
        target: instance_id.to_string(),
        decal_id: decal_id.to_string(),
    });

    Ok(document)
}

pub fn remove_module_decal_layer(
    mut document: DesktopDocument,
    instance_id: &str,
    decal_id: &str,
) -> Result<DesktopDocument, DesktopError> {
    if !document
        .project
        .modules
        .iter()
        .any(|instance| instance.instance_id == instance_id)
    {
        return Err(DesktopError::MissingInstance(instance_id.to_string()));
    }

    document.project.paint_layers.retain(|layer| {
        !matches!(
            layer,
            PaintLayer::Decal { target, decal_id: existing }
                if target == instance_id && existing == decal_id
        )
    });

    Ok(document)
}

pub fn mirror_module_instance(
    mut document: DesktopDocument,
    instance_id: &str,
) -> Result<DesktopDocument, DesktopError> {
    let source = document
        .project
        .modules
        .iter()
        .find(|instance| instance.instance_id == instance_id)
        .cloned()
        .ok_or_else(|| DesktopError::MissingInstance(instance_id.to_string()))?;
    let mirrored_module_id = mirrored_module_id(&document.style_pack, &source.module_id);
    let mirrored_instance_id = next_mirrored_instance_id(&document.project, &source.instance_id);

    let mirrored_instance = ModuleInstance {
        instance_id: mirrored_instance_id,
        module_id: mirrored_module_id,
        transform: mirrored_transform(&source.transform),
        connector_attachments: Vec::new(),
        material_slots: source.material_slots.clone(),
        region_params: source.region_params.clone(),
    };

    document.project.modules.push(mirrored_instance.clone());
    apply_mirrored_inbound_attachments(&mut document, &source, &mirrored_instance);

    Ok(document)
}

pub fn apply_edit_command(
    mut document: DesktopDocument,
    command: EditCommand,
) -> Result<DesktopDocument, DesktopError> {
    apply_command(&mut document.project, &document.style_pack, &command)
        .map_err(|error| DesktopError::ApplyCommand(error.to_string()))?;

    Ok(document)
}

pub fn preview_edit_command(
    document: DesktopDocument,
    command: EditCommand,
) -> Result<DesktopCommandPreview, DesktopError> {
    let preview = preview_command_with_diff(&document.project, &document.style_pack, &command)
        .map_err(|error| DesktopError::ApplyCommand(error.to_string()))?;
    let DesktopDocument {
        style_pack, paths, ..
    } = document;

    Ok(DesktopCommandPreview {
        document: DesktopDocument {
            project: preview.project,
            style_pack,
            paths,
        },
        diff: preview.diff.into(),
    })
}

pub fn set_connector_attachment(
    mut document: DesktopDocument,
    instance_id: &str,
    local_connector: &str,
    target_instance_id: &str,
    target_connector: &str,
) -> Result<DesktopDocument, DesktopError> {
    let source_index = document
        .project
        .modules
        .iter()
        .position(|instance| instance.instance_id == instance_id)
        .ok_or_else(|| DesktopError::MissingInstance(instance_id.to_string()))?;
    let target_instance = document
        .project
        .modules
        .iter()
        .find(|instance| instance.instance_id == target_instance_id)
        .ok_or_else(|| DesktopError::MissingInstance(target_instance_id.to_string()))?;
    let source_module_id = document.project.modules[source_index].module_id.clone();
    let source_descriptor = document
        .style_pack
        .module(&source_module_id)
        .ok_or_else(|| DesktopError::MissingModule(source_module_id.clone()))?;
    let target_descriptor = document
        .style_pack
        .module(&target_instance.module_id)
        .ok_or_else(|| DesktopError::MissingModule(target_instance.module_id.clone()))?;
    let local_descriptor = source_descriptor
        .connector(local_connector)
        .ok_or_else(|| DesktopError::MissingConnector(local_connector.to_string()))?;
    let target_descriptor_connector = target_descriptor
        .connector(target_connector)
        .ok_or_else(|| DesktopError::MissingConnector(target_connector.to_string()))?;

    if !connector_is_compatible(
        &document.style_pack,
        &local_descriptor.kind,
        &target_descriptor_connector.kind,
    ) {
        return Err(DesktopError::IncompatibleConnectorKinds {
            left_kind: local_descriptor.kind.clone(),
            right_kind: target_descriptor_connector.kind.clone(),
        });
    }

    let instance = &mut document.project.modules[source_index];
    instance
        .connector_attachments
        .retain(|attachment| attachment.local_connector != local_connector);
    instance
        .connector_attachments
        .push(polybash_contracts::ConnectorAttachment {
            local_connector: local_connector.to_string(),
            target_instance_id: target_instance_id.to_string(),
            target_connector: target_connector.to_string(),
        });

    Ok(document)
}

pub fn snap_module_instance(
    document: DesktopDocument,
    instance_id: &str,
    local_connector: &str,
    target_instance_id: &str,
    target_connector: &str,
) -> Result<DesktopDocument, DesktopError> {
    let source_index = document
        .project
        .modules
        .iter()
        .position(|instance| instance.instance_id == instance_id)
        .ok_or_else(|| DesktopError::MissingInstance(instance_id.to_string()))?;
    let source_instance = document.project.modules[source_index].clone();
    let target_instance = document
        .project
        .modules
        .iter()
        .find(|instance| instance.instance_id == target_instance_id)
        .cloned()
        .ok_or_else(|| DesktopError::MissingInstance(target_instance_id.to_string()))?;
    let snapped_transform = snapped_transform(&source_instance, &target_instance);
    let mut document = set_connector_attachment(
        document,
        instance_id,
        local_connector,
        target_instance_id,
        target_connector,
    )?;
    document.project.modules[source_index].transform = snapped_transform;

    Ok(document)
}

pub fn clear_connector_attachment(
    mut document: DesktopDocument,
    instance_id: &str,
    local_connector: &str,
) -> Result<DesktopDocument, DesktopError> {
    let instance = document
        .project
        .modules
        .iter_mut()
        .find(|instance| instance.instance_id == instance_id)
        .ok_or_else(|| DesktopError::MissingInstance(instance_id.to_string()))?;

    instance
        .connector_attachments
        .retain(|attachment| attachment.local_connector != local_connector);

    Ok(document)
}

pub fn save_project(project: &Project, project_path: &str) -> Result<String, DesktopError> {
    let resolved_project_path = resolve_input_path(project_path);
    if let Some(parent) = resolved_project_path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| DesktopError::WritePath {
            path: parent.display().to_string(),
            message: error.to_string(),
        })?;
    }

    let json = to_pretty_json(project)
        .map_err(|error| DesktopError::SerializeProject(error.to_string()))?;
    std::fs::write(&resolved_project_path, json).map_err(|error| DesktopError::WritePath {
        path: resolved_project_path.display().to_string(),
        message: error.to_string(),
    })?;

    Ok(project_path.to_string())
}

pub fn validate_document(document: DesktopDocument) -> Result<ValidationReport, DesktopError> {
    Ok(validate_project(&document.project, &document.style_pack))
}

pub fn export_document(document: DesktopDocument) -> Result<DesktopExportBundle, DesktopError> {
    match export_project(&document.project, &document.style_pack) {
        Ok(bundle) => Ok(DesktopExportBundle {
            document,
            report: bundle.report,
            glb_bytes_base64: BASE64_STANDARD.encode(bundle.glb_bytes),
        }),
        Err(ExportError::ValidationBlocked(report)) => Err(DesktopError::ValidationBlocked(report)),
    }
}

pub fn export_canonical_document() -> Result<DesktopExportBundle, DesktopError> {
    export_document(load_canonical_document()?)
}

pub mod commands {
    use super::{
        add_module_decal_layer, add_module_instance, apply_edit_command,
        clear_connector_attachment, create_fighter_template, export_document,
        load_canonical_document, load_document, mirror_module_instance, preview_edit_command,
        remove_module_decal_layer, remove_module_instance, save_project, set_connector_attachment,
        set_fill_layer_palette, snap_module_instance, validate_document, DesktopCommandPreview,
        DesktopDocument, DesktopExportBundle, EditCommand, ValidationReport,
    };

    #[tauri::command]
    pub fn load_canonical_document_command() -> Result<DesktopDocument, String> {
        load_canonical_document().map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn create_fighter_template_command(
        project_id: String,
        style_pack_path: String,
    ) -> Result<DesktopDocument, String> {
        create_fighter_template(&project_id, &style_pack_path).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn load_document_command(
        project_path: String,
        style_pack_path: String,
    ) -> Result<DesktopDocument, String> {
        load_document(&project_path, &style_pack_path).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn add_module_instance_command(
        document: DesktopDocument,
        module_id: String,
    ) -> Result<DesktopDocument, String> {
        add_module_instance(document, &module_id).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn remove_module_instance_command(
        document: DesktopDocument,
        instance_id: String,
    ) -> Result<DesktopDocument, String> {
        remove_module_instance(document, &instance_id).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn mirror_module_instance_command(
        document: DesktopDocument,
        instance_id: String,
    ) -> Result<DesktopDocument, String> {
        mirror_module_instance(document, &instance_id).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn apply_edit_command_command(
        document: DesktopDocument,
        command: EditCommand,
    ) -> Result<DesktopDocument, String> {
        apply_edit_command(document, command).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn preview_edit_command_command(
        document: DesktopDocument,
        command: EditCommand,
    ) -> Result<DesktopCommandPreview, String> {
        preview_edit_command(document, command).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn set_connector_attachment_command(
        document: DesktopDocument,
        instance_id: String,
        local_connector: String,
        target_instance_id: String,
        target_connector: String,
    ) -> Result<DesktopDocument, String> {
        set_connector_attachment(
            document,
            &instance_id,
            &local_connector,
            &target_instance_id,
            &target_connector,
        )
        .map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn clear_connector_attachment_command(
        document: DesktopDocument,
        instance_id: String,
        local_connector: String,
    ) -> Result<DesktopDocument, String> {
        clear_connector_attachment(document, &instance_id, &local_connector)
            .map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn snap_module_instance_command(
        document: DesktopDocument,
        instance_id: String,
        local_connector: String,
        target_instance_id: String,
        target_connector: String,
    ) -> Result<DesktopDocument, String> {
        snap_module_instance(
            document,
            &instance_id,
            &local_connector,
            &target_instance_id,
            &target_connector,
        )
        .map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn set_fill_layer_palette_command(
        document: DesktopDocument,
        zone: String,
        palette_id: Option<String>,
    ) -> Result<DesktopDocument, String> {
        set_fill_layer_palette(document, &zone, palette_id.as_deref())
            .map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn add_module_decal_layer_command(
        document: DesktopDocument,
        instance_id: String,
        decal_id: String,
    ) -> Result<DesktopDocument, String> {
        add_module_decal_layer(document, &instance_id, &decal_id).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn remove_module_decal_layer_command(
        document: DesktopDocument,
        instance_id: String,
        decal_id: String,
    ) -> Result<DesktopDocument, String> {
        remove_module_decal_layer(document, &instance_id, &decal_id)
            .map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn save_project_command(
        project: DesktopDocument,
        project_path: String,
    ) -> Result<String, String> {
        save_project(&project.project, &project_path).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn validate_document_command(
        document: DesktopDocument,
    ) -> Result<ValidationReport, String> {
        validate_document(document).map_err(|error| error.to_string())
    }

    #[tauri::command]
    pub fn export_document_command(
        document: DesktopDocument,
    ) -> Result<DesktopExportBundle, String> {
        export_document(document).map_err(|error| error.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::{
        add_module_decal_layer, add_module_instance, apply_edit_command,
        clear_connector_attachment, create_fighter_template, export_canonical_document,
        load_canonical_document, load_document, mirror_module_instance, preview_edit_command,
        remove_module_decal_layer, remove_module_instance, repo_root, save_project,
        set_connector_attachment, set_fill_layer_palette, snap_module_instance, validate_document,
        DesktopPreviewValue,
    };
    use polybash_contracts::{
        parse_project_str, AssetType, EditCommand, PaintLayer, ReportStatus, TransformField,
    };
    use tempfile::tempdir;

    #[test]
    fn canonical_document_loads_from_workspace_fixtures() {
        let document = load_canonical_document().expect("canonical document");

        assert_eq!(document.project.id, "fighter_basic");
        assert_eq!(document.style_pack.id, "zx_fighter_v1");
    }

    #[test]
    fn fighter_template_is_created_from_style_pack() {
        let document = create_fighter_template(
            "fighter_template_01",
            "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
        )
        .expect("fighter template");

        assert_eq!(document.project.id, "fighter_template_01");
        assert_eq!(document.project.asset_type, AssetType::Character);
        assert_eq!(document.project.style_pack_id, "zx_fighter_v1");
        assert_eq!(
            document.project.skeleton_template.as_deref(),
            Some("biped_fighter_v1")
        );
        assert!(document.project.modules.is_empty());
    }

    #[test]
    fn document_loads_from_explicit_paths() {
        let root = repo_root();
        let document = load_document(
            &root
                .join("fixtures/projects/valid/fighter_basic.zxmodel.json")
                .display()
                .to_string(),
            &root
                .join("fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json")
                .display()
                .to_string(),
        )
        .expect("document from explicit paths");

        assert_eq!(document.project.id, "fighter_basic");
        assert_eq!(document.style_pack.id, "zx_fighter_v1");
    }

    #[test]
    fn module_instance_can_be_added_with_deterministic_defaults() {
        let document = create_fighter_template(
            "fighter_template_01",
            "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
        )
        .expect("fighter template");

        let updated = add_module_instance(document, "fighter_torso_base_a")
            .expect("module instance should be added");
        let added = updated.project.modules.first().expect("module instance");

        assert_eq!(added.instance_id, "fighter_torso_base_a_01");
        assert_eq!(added.transform.position, [0.0, 1.0, 0.0]);
        assert_eq!(
            added.material_slots.get("primary").map(String::as_str),
            Some("cloth_red")
        );
        assert_eq!(
            added.material_slots.get("trim").map(String::as_str),
            Some("metal_dark")
        );
        assert_eq!(added.region_params.get("chest_bulge").copied(), Some(0.0));
    }

    #[test]
    fn removing_module_instance_prunes_related_connectors_and_decals() {
        let document = load_canonical_document().expect("canonical document");

        let updated =
            remove_module_instance(document, "head_01").expect("module instance should be removed");
        let torso = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "torso_01")
            .expect("torso instance");

        assert_eq!(updated.project.modules.len(), 6);
        assert!(!updated
            .project
            .modules
            .iter()
            .any(|instance| instance.instance_id == "head_01"));
        assert_eq!(torso.connector_attachments.len(), 4);
        assert!(updated.project.paint_layers.iter().all(
            |layer| !matches!(layer, PaintLayer::Decal { target, .. } if target == "head_01")
        ));
    }

    #[test]
    fn mirroring_left_module_creates_right_counterpart_when_slot_is_free() {
        let document = load_canonical_document().expect("canonical document");
        let document =
            remove_module_instance(document, "arm_r_01").expect("right arm should be removable");

        let updated =
            mirror_module_instance(document, "arm_l_01").expect("left arm should mirror cleanly");
        let mirrored = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "arm_r_01")
            .expect("mirrored right arm");
        let torso = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "torso_01")
            .expect("torso instance");

        assert_eq!(mirrored.module_id, "fighter_arm_base_r");
        assert_eq!(mirrored.transform.position, [0.6, 1.2, 0.0]);
        assert_eq!(mirrored.transform.rotation, [0.0, -0.0, -0.0]);
        assert!(mirrored.connector_attachments.is_empty());
        assert_eq!(
            mirrored.material_slots.get("primary").map(String::as_str),
            Some("cloth_red")
        );
        assert_eq!(mirrored.region_params.get("arm_width").copied(), Some(0.02));
        assert!(torso.connector_attachments.iter().any(|attachment| {
            attachment.local_connector == "arm_r" && attachment.target_instance_id == "arm_r_01"
        }));
    }

    #[test]
    fn mirroring_uses_next_deterministic_instance_id_when_counterpart_exists() {
        let document = load_canonical_document().expect("canonical document");

        let updated =
            mirror_module_instance(document, "arm_l_01").expect("left arm should mirror cleanly");
        let mirrored = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "arm_r_02")
            .expect("second mirrored right arm");
        let torso = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "torso_01")
            .expect("torso instance");

        assert_eq!(mirrored.module_id, "fighter_arm_base_r");
        assert_eq!(mirrored.transform.position, [0.6, 1.2, 0.0]);
        assert!(torso.connector_attachments.iter().any(|attachment| {
            attachment.local_connector == "arm_r" && attachment.target_instance_id == "arm_r_01"
        }));
    }

    #[test]
    fn edit_command_clamps_region_values_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let updated = apply_edit_command(
            document,
            EditCommand::SetRegionParam {
                instance_id: "head_01".to_string(),
                region: "jaw_width".to_string(),
                value: 99.0,
            },
        )
        .expect("edit command should apply");
        let head = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "head_01")
            .expect("head instance");

        assert_eq!(head.region_params.get("jaw_width").copied(), Some(0.2));
    }

    #[test]
    fn edit_command_updates_transform_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let updated = apply_edit_command(
            document,
            EditCommand::SetTransform {
                instance_id: "weapon_01".to_string(),
                field: TransformField::Rotation,
                value: [0.0, 0.0, 45.0],
            },
        )
        .expect("edit command should apply");
        let weapon = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "weapon_01")
            .expect("weapon instance");

        assert_eq!(weapon.transform.rotation, [0.0, 0.0, 45.0]);
    }

    #[test]
    fn preview_edit_command_returns_diff_payload_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let preview = preview_edit_command(
            document,
            EditCommand::SetTransform {
                instance_id: "weapon_01".to_string(),
                field: TransformField::Rotation,
                value: [0.0, 0.0, 45.0],
            },
        )
        .expect("preview should work");
        let weapon = preview
            .document
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "weapon_01")
            .expect("weapon instance");

        assert_eq!(weapon.transform.rotation, [0.0, 0.0, 45.0]);
        assert_eq!(preview.diff.op, "set_transform");
        assert_eq!(preview.diff.target, "weapon_01");
        assert_eq!(preview.diff.changes.len(), 1);
        assert_eq!(
            preview.diff.changes[0].path,
            "modules.weapon_01.transform.rotation"
        );
        assert_eq!(
            preview.diff.changes[0].before,
            DesktopPreviewValue::Vector3([0.0, 0.0, 90.0])
        );
        assert_eq!(
            preview.diff.changes[0].after,
            DesktopPreviewValue::Vector3([0.0, 0.0, 45.0])
        );
    }

    #[test]
    fn edit_command_updates_material_assignment_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let updated = apply_edit_command(
            document,
            EditCommand::AssignMaterialZone {
                instance_id: "torso_01".to_string(),
                zone: "primary".to_string(),
                material_id: "cloth_blue".to_string(),
            },
        )
        .expect("edit command should apply");
        let torso = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "torso_01")
            .expect("torso instance");

        assert_eq!(
            torso.material_slots.get("primary").map(String::as_str),
            Some("cloth_blue")
        );
    }

    #[test]
    fn edit_command_assigns_rig_template_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let updated = apply_edit_command(
            document,
            EditCommand::AssignRigTemplate {
                template_id: "biped_fighter_v1".to_string(),
            },
        )
        .expect("edit command should apply");

        assert_eq!(
            updated
                .project
                .rig
                .as_ref()
                .map(|rig| rig.template_id.as_str()),
            Some("biped_fighter_v1")
        );
    }

    #[test]
    fn edit_command_attaches_socket_through_desktop_bridge() {
        let document = create_fighter_template(
            "fighter_template_01",
            "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
        )
        .expect("fighter template");

        let updated = apply_edit_command(
            document,
            EditCommand::AttachSocket {
                name: "weapon_r".to_string(),
                bone: "hand_r".to_string(),
            },
        )
        .expect("edit command should apply");

        assert!(updated.project.rig.as_ref().is_some_and(|rig| rig
            .sockets
            .iter()
            .any(|socket| socket.name == "weapon_r" && socket.bone == "hand_r")));
    }

    #[test]
    fn fill_palette_can_be_updated_and_cleared_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let updated =
            set_fill_layer_palette(document, "primary", Some("fighter_b")).expect("fill updated");

        assert!(updated.project.paint_layers.iter().any(|layer| matches!(
            layer,
            PaintLayer::Fill { target, palette }
                if target == "primary" && palette == "fighter_b"
        )));

        let cleared =
            set_fill_layer_palette(updated, "primary", None).expect("fill should clear cleanly");

        assert!(cleared.project.paint_layers.iter().all(|layer| !matches!(
            layer,
            PaintLayer::Fill { target, .. } if target == "primary"
        )));
    }

    #[test]
    fn fill_palette_rejects_unknown_zone_and_palette() {
        let document = load_canonical_document().expect("canonical document");

        let zone_error =
            set_fill_layer_palette(document.clone(), "missing_zone", Some("fighter_a"))
                .expect_err("unknown paint zone should fail");
        assert_eq!(
            zone_error.to_string(),
            "paint target not found: missing_zone"
        );

        let palette_error = set_fill_layer_palette(document, "primary", Some("unknown_palette"))
            .expect_err("unknown palette should fail");
        assert_eq!(
            palette_error.to_string(),
            "palette not found: unknown_palette"
        );
    }

    #[test]
    fn decal_layer_can_be_added_once_and_removed_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let updated = add_module_decal_layer(document, "torso_01", "badge_01")
            .expect("decal should be added");
        let duplicate = add_module_decal_layer(updated.clone(), "torso_01", "badge_01")
            .expect("duplicate decal should be ignored");

        assert_eq!(
            duplicate
                .project
                .paint_layers
                .iter()
                .filter(|layer| matches!(
                    layer,
                    PaintLayer::Decal { target, decal_id }
                        if target == "torso_01" && decal_id == "badge_01"
                ))
                .count(),
            1
        );

        let removed = remove_module_decal_layer(duplicate, "torso_01", "badge_01")
            .expect("decal should be removable");

        assert!(removed.project.paint_layers.iter().all(|layer| !matches!(
            layer,
            PaintLayer::Decal { target, decal_id }
                if target == "torso_01" && decal_id == "badge_01"
        )));
    }

    #[test]
    fn decal_layer_rejects_unknown_instance_and_decal_id() {
        let document = load_canonical_document().expect("canonical document");

        let instance_error =
            add_module_decal_layer(document.clone(), "missing_instance", "badge_01")
                .expect_err("unknown instance should fail");
        assert_eq!(
            instance_error.to_string(),
            "module instance not found: missing_instance"
        );

        let decal_error = add_module_decal_layer(document, "torso_01", "missing_decal")
            .expect_err("unknown decal should fail");
        assert_eq!(decal_error.to_string(), "decal not found: missing_decal");
    }

    #[test]
    fn connector_attachment_is_updated_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let updated =
            set_connector_attachment(document, "arm_l_01", "hand_socket_l", "weapon_01", "grip")
                .expect("attachment should be updated");
        let arm = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "arm_l_01")
            .expect("arm instance");

        assert_eq!(arm.connector_attachments.len(), 1);
        assert_eq!(arm.connector_attachments[0].target_instance_id, "weapon_01");
        assert_eq!(arm.connector_attachments[0].target_connector, "grip");
    }

    #[test]
    fn connector_attachment_can_be_cleared_through_desktop_bridge() {
        let document = load_canonical_document().expect("canonical document");

        let updated =
            clear_connector_attachment(document, "torso_01", "neck").expect("attachment cleared");
        let torso = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "torso_01")
            .expect("torso instance");

        assert_eq!(torso.connector_attachments.len(), 4);
        assert!(torso
            .connector_attachments
            .iter()
            .all(|attachment| attachment.local_connector != "neck"));
    }

    #[test]
    fn snap_module_instance_aligns_transform_from_target_defaults() {
        let document = create_fighter_template(
            "fighter_template_01",
            "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
        )
        .expect("fighter template");
        let document = add_module_instance(document, "fighter_arm_base_r").expect("arm added");
        let document = add_module_instance(document, "weapon_sword_basic").expect("weapon added");
        let document = apply_edit_command(
            document,
            EditCommand::SetTransform {
                instance_id: "fighter_arm_base_r_01".to_string(),
                field: TransformField::Position,
                value: [3.0, 2.0, 1.0],
            },
        )
        .expect("arm position updated");
        let document = apply_edit_command(
            document,
            EditCommand::SetTransform {
                instance_id: "fighter_arm_base_r_01".to_string(),
                field: TransformField::Rotation,
                value: [0.0, 0.0, 45.0],
            },
        )
        .expect("arm rotation updated");

        let updated = snap_module_instance(
            document,
            "weapon_sword_basic_01",
            "grip",
            "fighter_arm_base_r_01",
            "hand_socket_r",
        )
        .expect("weapon snapped");
        let weapon = updated
            .project
            .modules
            .iter()
            .find(|instance| instance.instance_id == "weapon_sword_basic_01")
            .expect("weapon instance");

        assert_eq!(weapon.transform.position, [3.35, 1.8, 1.0]);
        assert_eq!(weapon.transform.rotation, [0.0, 0.0, 135.0]);
        assert_eq!(weapon.transform.scale, [1.0, 1.0, 1.0]);
        assert_eq!(weapon.connector_attachments.len(), 1);
        assert_eq!(weapon.connector_attachments[0].local_connector, "grip");
        assert_eq!(
            weapon.connector_attachments[0].target_instance_id,
            "fighter_arm_base_r_01"
        );
        assert_eq!(
            weapon.connector_attachments[0].target_connector,
            "hand_socket_r"
        );
    }

    #[test]
    fn snap_module_instance_rejects_incompatible_connector_kinds() {
        let document = create_fighter_template(
            "fighter_template_01",
            "fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json",
        )
        .expect("fighter template");
        let document = add_module_instance(document, "fighter_head_base_a").expect("head added");
        let document = add_module_instance(document, "weapon_sword_basic").expect("weapon added");

        let error = snap_module_instance(
            document,
            "weapon_sword_basic_01",
            "grip",
            "fighter_head_base_a_01",
            "neck_socket",
        )
        .expect_err("snap should reject incompatible connectors");

        assert_eq!(
            error.to_string(),
            "connector kinds are incompatible: weapon_grip -> neck_socket"
        );
    }

    #[test]
    fn canonical_document_validates_cleanly() {
        let document = load_canonical_document().expect("canonical document");
        let report = validate_document(document).expect("validation report");

        assert_eq!(report.status, ReportStatus::Ok);
        assert!(report.issues.is_empty());
    }

    #[test]
    fn canonical_document_exports_to_glb_bundle() {
        let document = load_canonical_document().expect("canonical document");
        let bundle = export_canonical_document().expect("export bundle");

        assert_eq!(bundle.report.status, ReportStatus::Ok);
        assert!(bundle.glb_bytes_base64.starts_with("Z2xURg"));
        assert_eq!(bundle.document.project.id, document.project.id);
    }

    #[test]
    fn save_project_writes_pretty_json_to_requested_path() {
        let document = load_canonical_document().expect("canonical document");
        let out_dir = tempdir().expect("temp dir");
        let out_path = out_dir.path().join("saved_project.zxmodel.json");

        let returned = save_project(&document.project, &out_path.display().to_string())
            .expect("saved project path");
        let saved = std::fs::read_to_string(&out_path).expect("saved project");
        let reparsed = parse_project_str(&saved).expect("saved project parses");

        assert_eq!(returned, out_path.display().to_string());
        assert!(saved.contains("\n  \"id\": \"fighter_basic\""));
        assert_eq!(reparsed.id, "fighter_basic");
    }
}
