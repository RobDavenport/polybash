use polybash_contracts::{Project, StylePack, ValidationReport};
use polybash_validate::validate_project;
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Clone)]
pub struct ExportBundle {
    pub glb_bytes: Vec<u8>,
    pub report: ValidationReport,
}

#[derive(Debug, Error)]
pub enum ExportError {
    #[error("validation blocked export")]
    ValidationBlocked(ValidationReport),
}

fn encode_minimal_glb(node_name: &str) -> Vec<u8> {
    let json_payload = json!({
        "asset": {
            "version": "2.0",
            "generator": "polybash-export"
        },
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": node_name}]
    });

    let mut json_bytes = serde_json::to_vec(&json_payload).expect("minimal glb json");
    while json_bytes.len() % 4 != 0 {
        json_bytes.push(0x20);
    }

    let total_length = 12 + 8 + json_bytes.len();
    let mut glb = Vec::with_capacity(total_length);

    glb.extend_from_slice(b"glTF");
    glb.extend_from_slice(&2u32.to_le_bytes());
    glb.extend_from_slice(&(total_length as u32).to_le_bytes());
    glb.extend_from_slice(&(json_bytes.len() as u32).to_le_bytes());
    glb.extend_from_slice(&0x4E4F534Au32.to_le_bytes());
    glb.extend_from_slice(&json_bytes);

    glb
}

pub fn export_project(
    project: &Project,
    style_pack: &StylePack,
) -> Result<ExportBundle, ExportError> {
    let report = validate_project(project, style_pack);

    if report.has_errors() {
        return Err(ExportError::ValidationBlocked(report));
    }

    Ok(ExportBundle {
        glb_bytes: encode_minimal_glb(&project.id),
        report,
    })
}
