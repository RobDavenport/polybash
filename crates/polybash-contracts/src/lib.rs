use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub type Vec3 = [f32; 3];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "snake_case")]
pub enum AssetType {
    Character,
    Weapon,
    PropSmall,
    VehicleSmall,
}

impl AssetType {
    pub fn budget_key(&self) -> &'static str {
        match self {
            Self::Character => "character",
            Self::Weapon => "weapon",
            Self::PropSmall => "prop_small",
            Self::VehicleSmall => "vehicle_small",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Transform {
    pub position: Vec3,
    pub rotation: Vec3,
    pub scale: Vec3,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TransformField {
    Position,
    Rotation,
    Scale,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ConnectorAttachment {
    #[serde(rename = "localConnector")]
    pub local_connector: String,
    #[serde(rename = "targetInstanceId")]
    pub target_instance_id: String,
    #[serde(rename = "targetConnector")]
    pub target_connector: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ModuleInstance {
    #[serde(rename = "instanceId")]
    pub instance_id: String,
    #[serde(rename = "moduleId")]
    pub module_id: String,
    pub transform: Transform,
    #[serde(rename = "connectorAttachments", default)]
    pub connector_attachments: Vec<ConnectorAttachment>,
    #[serde(rename = "materialSlots", default)]
    pub material_slots: BTreeMap<String, String>,
    #[serde(rename = "regionParams", default)]
    pub region_params: BTreeMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PaintLayer {
    Fill {
        target: String,
        palette: String,
    },
    Decal {
        target: String,
        #[serde(rename = "decalId")]
        decal_id: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SocketBinding {
    pub name: String,
    pub bone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RigAssignment {
    #[serde(rename = "templateId")]
    pub template_id: String,
    #[serde(default)]
    pub sockets: Vec<SocketBinding>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DeclaredMetrics {
    pub triangles: u32,
    pub materials: u32,
    pub textures: u32,
    #[serde(rename = "atlasWidth")]
    pub atlas_width: u32,
    #[serde(rename = "atlasHeight")]
    pub atlas_height: u32,
    pub bones: u32,
    pub sockets: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Project {
    pub version: u32,
    pub id: String,
    #[serde(rename = "assetType")]
    pub asset_type: AssetType,
    #[serde(rename = "stylePackId")]
    pub style_pack_id: String,
    #[serde(rename = "skeletonTemplate", default)]
    pub skeleton_template: Option<String>,
    #[serde(default)]
    pub modules: Vec<ModuleInstance>,
    #[serde(rename = "paintLayers", default)]
    pub paint_layers: Vec<PaintLayer>,
    #[serde(default)]
    pub rig: Option<RigAssignment>,
    #[serde(rename = "declaredMetrics")]
    pub declared_metrics: DeclaredMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Budget {
    pub triangles: u32,
    pub materials: u32,
    pub textures: u32,
    #[serde(rename = "atlasWidth")]
    pub atlas_width: u32,
    #[serde(rename = "atlasHeight")]
    pub atlas_height: u32,
    pub bones: u32,
    pub sockets: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Palette {
    pub id: String,
    pub materials: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RigTemplate {
    pub id: String,
    #[serde(rename = "requiredBones", default)]
    pub required_bones: Vec<String>,
    #[serde(rename = "defaultSockets", default)]
    pub default_sockets: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ConnectorDescriptor {
    pub id: String,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RegionDescriptor {
    pub id: String,
    pub min: f32,
    pub max: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ModuleDescriptor {
    pub id: String,
    #[serde(rename = "assetType")]
    pub asset_type: AssetType,
    #[serde(default)]
    pub connectors: Vec<ConnectorDescriptor>,
    #[serde(default)]
    pub regions: Vec<RegionDescriptor>,
    #[serde(rename = "materialZones", default)]
    pub material_zones: Vec<String>,
}

impl ModuleDescriptor {
    pub fn connector(&self, id: &str) -> Option<&ConnectorDescriptor> {
        self.connectors.iter().find(|connector| connector.id == id)
    }

    pub fn region(&self, id: &str) -> Option<&RegionDescriptor> {
        self.regions.iter().find(|region| region.id == id)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StylePack {
    pub version: u32,
    pub id: String,
    #[serde(rename = "supportedAssetTypes", default)]
    pub supported_asset_types: Vec<AssetType>,
    #[serde(default)]
    pub budgets: BTreeMap<String, Budget>,
    #[serde(rename = "connectorTaxonomy", default)]
    pub connector_taxonomy: BTreeMap<String, Vec<String>>,
    #[serde(default)]
    pub palettes: Vec<Palette>,
    #[serde(rename = "rigTemplates", default)]
    pub rig_templates: Vec<RigTemplate>,
    #[serde(default)]
    pub modules: Vec<ModuleDescriptor>,
    #[serde(rename = "decalIds", default)]
    pub decal_ids: Vec<String>,
}

impl StylePack {
    pub fn budget_for_asset_type(&self, asset_type: &AssetType) -> Option<&Budget> {
        self.budgets.get(asset_type.budget_key())
    }

    pub fn module(&self, id: &str) -> Option<&ModuleDescriptor> {
        self.modules.iter().find(|module| module.id == id)
    }

    pub fn rig_template(&self, id: &str) -> Option<&RigTemplate> {
        self.rig_templates.iter().find(|template| template.id == id)
    }

    pub fn palette(&self, id: &str) -> Option<&Palette> {
        self.palettes.iter().find(|palette| palette.id == id)
    }

    pub fn material_exists(&self, material_id: &str) -> bool {
        self.palettes
            .iter()
            .flat_map(|palette| palette.materials.iter())
            .any(|known| known == material_id)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ReportStatus {
    Ok,
    Warning,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "snake_case")]
pub enum IssueSeverity {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ReportStats {
    pub triangles: u32,
    pub materials: u32,
    pub textures: u32,
    #[serde(rename = "atlasWidth")]
    pub atlas_width: u32,
    #[serde(rename = "atlasHeight")]
    pub atlas_height: u32,
    pub bones: u32,
    pub sockets: u32,
    #[serde(rename = "moduleCount")]
    pub module_count: u32,
}

impl From<(&Project, usize)> for ReportStats {
    fn from(value: (&Project, usize)) -> Self {
        let (project, module_count) = value;
        Self {
            triangles: project.declared_metrics.triangles,
            materials: project.declared_metrics.materials,
            textures: project.declared_metrics.textures,
            atlas_width: project.declared_metrics.atlas_width,
            atlas_height: project.declared_metrics.atlas_height,
            bones: project.declared_metrics.bones,
            sockets: project.declared_metrics.sockets,
            module_count: module_count as u32,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ValidationIssue {
    pub code: String,
    pub severity: IssueSeverity,
    pub path: String,
    pub summary: String,
    pub detail: String,
    #[serde(rename = "suggestedFix", default)]
    pub suggested_fix: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ValidationReport {
    pub status: ReportStatus,
    pub stats: ReportStats,
    #[serde(default)]
    pub issues: Vec<ValidationIssue>,
}

impl ValidationReport {
    pub fn has_errors(&self) -> bool {
        self.issues
            .iter()
            .any(|issue| matches!(issue.severity, IssueSeverity::Error))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "op", rename_all = "snake_case")]
pub enum EditCommand {
    SetTransform {
        #[serde(rename = "instanceId")]
        instance_id: String,
        field: TransformField,
        value: Vec3,
    },
    SetRegionParam {
        #[serde(rename = "instanceId")]
        instance_id: String,
        region: String,
        value: f32,
    },
    AssignMaterialZone {
        #[serde(rename = "instanceId")]
        instance_id: String,
        zone: String,
        #[serde(rename = "materialId")]
        material_id: String,
    },
    AssignRigTemplate {
        #[serde(rename = "templateId")]
        template_id: String,
    },
    AttachSocket {
        name: String,
        bone: String,
    },
}

pub fn parse_project_str(input: &str) -> Result<Project, serde_json::Error> {
    serde_json::from_str(input)
}

pub fn parse_stylepack_str(input: &str) -> Result<StylePack, serde_json::Error> {
    serde_json::from_str(input)
}

pub fn parse_commands_str(input: &str) -> Result<Vec<EditCommand>, serde_json::Error> {
    serde_json::from_str(input)
}

pub fn to_pretty_json<T: Serialize>(value: &T) -> Result<String, serde_json::Error> {
    serde_json::to_string_pretty(value)
}

pub fn bundled_project_schema() -> &'static str {
    include_str!("../../../contracts/generated/project.schema.json")
}

pub fn bundled_stylepack_schema() -> &'static str {
    include_str!("../../../contracts/generated/stylepack.schema.json")
}

pub fn bundled_report_schema() -> &'static str {
    include_str!("../../../contracts/generated/report.schema.json")
}
