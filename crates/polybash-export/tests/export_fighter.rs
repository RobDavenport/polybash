use polybash_contracts::{parse_project_str, parse_stylepack_str, ReportStatus};
use polybash_export::export_project;

#[test]
fn valid_fighter_exports_to_glb_bytes() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("valid project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("valid style pack fixture");

    let bundle = export_project(&project, &stylepack).expect("export should succeed");

    assert!(bundle.glb_bytes.starts_with(b"glTF"));
    assert_eq!(bundle.report.status, ReportStatus::Ok);
}

#[test]
fn repeated_export_is_deterministic_for_canonical_fighter() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("valid project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("valid style pack fixture");

    let first = export_project(&project, &stylepack).expect("first export should succeed");
    let second = export_project(&project, &stylepack).expect("second export should succeed");

    assert_eq!(first.glb_bytes, second.glb_bytes);
    assert_eq!(first.report, second.report);
}
