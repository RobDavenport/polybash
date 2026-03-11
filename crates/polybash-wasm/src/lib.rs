use base64::prelude::{Engine as _, BASE64_STANDARD};
use polybash_contracts::{parse_project_str, parse_stylepack_str, ValidationReport};
use polybash_export::{export_project as native_export_project, ExportError};
use polybash_validate::validate_project as native_validate_project;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WasmExportBundle {
    pub report: ValidationReport,
    #[serde(rename = "glbBytesBase64")]
    pub glb_bytes_base64: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BridgeErrorPayload {
    pub code: String,
    pub message: String,
    #[serde(rename = "validationReport", skip_serializing_if = "Option::is_none")]
    pub validation_report: Option<ValidationReport>,
}

#[derive(Debug, Error)]
pub enum BridgeError {
    #[error("failed to parse project json: {0}")]
    ParseProject(String),
    #[error("failed to parse style pack json: {0}")]
    ParseStylePack(String),
    #[error("validation blocked export")]
    ValidationBlocked(ValidationReport),
    #[error("failed to serialize bridge payload: {0}")]
    Serialize(String),
}

impl BridgeError {
    pub fn to_payload(&self) -> BridgeErrorPayload {
        match self {
            Self::ParseProject(message) => BridgeErrorPayload {
                code: "PARSE_PROJECT".to_string(),
                message: message.clone(),
                validation_report: None,
            },
            Self::ParseStylePack(message) => BridgeErrorPayload {
                code: "PARSE_STYLEPACK".to_string(),
                message: message.clone(),
                validation_report: None,
            },
            Self::ValidationBlocked(report) => BridgeErrorPayload {
                code: "VALIDATION_BLOCKED".to_string(),
                message: self.to_string(),
                validation_report: Some(report.clone()),
            },
            Self::Serialize(message) => BridgeErrorPayload {
                code: "SERIALIZE_BRIDGE_PAYLOAD".to_string(),
                message: message.clone(),
                validation_report: None,
            },
        }
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(&self.to_payload()).unwrap_or_else(|_| {
            "{\"code\":\"SERIALIZE_BRIDGE_ERROR\",\"message\":\"failed to serialize bridge error payload\"}".to_string()
        })
    }
}

fn parse_inputs(
    project_json: &str,
    stylepack_json: &str,
) -> Result<(polybash_contracts::Project, polybash_contracts::StylePack), BridgeError> {
    let project = parse_project_str(project_json)
        .map_err(|error| BridgeError::ParseProject(error.to_string()))?;
    let style_pack = parse_stylepack_str(stylepack_json)
        .map_err(|error| BridgeError::ParseStylePack(error.to_string()))?;
    Ok((project, style_pack))
}

pub fn validate_project_json(
    project_json: &str,
    stylepack_json: &str,
) -> Result<String, BridgeError> {
    let (project, style_pack) = parse_inputs(project_json, stylepack_json)?;
    let report = native_validate_project(&project, &style_pack);
    serde_json::to_string(&report).map_err(|error| BridgeError::Serialize(error.to_string()))
}

pub fn export_project_json(
    project_json: &str,
    stylepack_json: &str,
) -> Result<String, BridgeError> {
    let (project, style_pack) = parse_inputs(project_json, stylepack_json)?;

    match native_export_project(&project, &style_pack) {
        Ok(bundle) => serde_json::to_string(&WasmExportBundle {
            report: bundle.report,
            glb_bytes_base64: BASE64_STANDARD.encode(bundle.glb_bytes),
        })
        .map_err(|error| BridgeError::Serialize(error.to_string())),
        Err(ExportError::ValidationBlocked(report)) => Err(BridgeError::ValidationBlocked(report)),
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm_bindings {
    use super::{export_project_json, validate_project_json};
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen(js_name = validateProject)]
    pub fn validate_project_bridge(
        project_json: &str,
        stylepack_json: &str,
    ) -> Result<String, JsValue> {
        validate_project_json(project_json, stylepack_json)
            .map_err(|error| JsValue::from_str(&error.to_json()))
    }

    #[wasm_bindgen(js_name = exportProject)]
    pub fn export_project_bridge(
        project_json: &str,
        stylepack_json: &str,
    ) -> Result<String, JsValue> {
        export_project_json(project_json, stylepack_json)
            .map_err(|error| JsValue::from_str(&error.to_json()))
    }
}
