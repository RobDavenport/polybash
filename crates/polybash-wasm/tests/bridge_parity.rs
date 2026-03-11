use base64::prelude::{Engine as _, BASE64_STANDARD};
use polybash_contracts::{parse_project_str, parse_stylepack_str, ValidationReport};
use polybash_export::export_project as native_export_project;
use polybash_validate::validate_project as native_validate_project;
use polybash_wasm::{
    export_project_json, validate_project_json, BridgeErrorPayload, WasmExportBundle,
};

const VALID_PROJECT_JSON: &str =
    include_str!("../../../fixtures/projects/valid/fighter_basic.zxmodel.json");
const INVALID_PROJECT_JSON: &str =
    include_str!("../../../fixtures/projects/invalid/fighter_over_budget.zxmodel.json");
const STYLEPACK_JSON: &str =
    include_str!("../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json");

#[test]
fn wasm_validation_matches_native_report() {
    let project = parse_project_str(VALID_PROJECT_JSON).expect("valid project fixture");
    let style_pack = parse_stylepack_str(STYLEPACK_JSON).expect("valid style pack fixture");

    let native = native_validate_project(&project, &style_pack);
    let bridged: ValidationReport =
        serde_json::from_str(&validate_project_json(VALID_PROJECT_JSON, STYLEPACK_JSON).unwrap())
            .expect("bridge report json");

    assert_eq!(bridged, native);
}

#[test]
fn wasm_export_matches_native_bundle() {
    let project = parse_project_str(VALID_PROJECT_JSON).expect("valid project fixture");
    let style_pack = parse_stylepack_str(STYLEPACK_JSON).expect("valid style pack fixture");

    let native = native_export_project(&project, &style_pack).expect("native export succeeds");
    let bridged: WasmExportBundle =
        serde_json::from_str(&export_project_json(VALID_PROJECT_JSON, STYLEPACK_JSON).unwrap())
            .expect("bridge export json");

    assert_eq!(bridged.report, native.report);
    assert_eq!(
        bridged.glb_bytes_base64,
        BASE64_STANDARD.encode(native.glb_bytes)
    );
}

#[test]
fn wasm_export_surfaces_structured_validation_failure() {
    let payload = export_project_json(INVALID_PROJECT_JSON, STYLEPACK_JSON)
        .expect_err("invalid export should fail")
        .to_payload();

    assert_eq!(
        payload,
        BridgeErrorPayload {
            code: "VALIDATION_BLOCKED".to_string(),
            message: "validation blocked export".to_string(),
            validation_report: Some(
                serde_json::from_str::<ValidationReport>(&native_validation_json(
                    INVALID_PROJECT_JSON,
                    STYLEPACK_JSON
                ),)
                .expect("native validation report"),
            ),
        }
    );
}

fn native_validation_json(project_json: &str, stylepack_json: &str) -> String {
    let project = parse_project_str(project_json).expect("project fixture");
    let style_pack = parse_stylepack_str(stylepack_json).expect("style pack fixture");
    serde_json::to_string(&native_validate_project(&project, &style_pack))
        .expect("native validation report json")
}
