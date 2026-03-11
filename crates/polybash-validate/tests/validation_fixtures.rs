use polybash_contracts::{parse_project_str, parse_stylepack_str, ReportStatus};
use polybash_validate::validate_project;

#[test]
fn canonical_fighter_fixture_validates_cleanly() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("valid project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("valid style pack fixture");

    let report = validate_project(&project, &stylepack);

    assert_eq!(report.status, ReportStatus::Ok);
    assert!(report.issues.is_empty());
}

#[test]
fn over_budget_fixture_fails_validation() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/invalid/fighter_over_budget.zxmodel.json"
    ))
    .expect("invalid project fixture should still parse");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("valid style pack fixture");

    let report = validate_project(&project, &stylepack);

    assert_eq!(report.status, ReportStatus::Error);
    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "BUDGET_TRIANGLES"));
}

#[test]
fn bad_connector_fixture_fails_validation() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/invalid/bad_connector.zxmodel.json"
    ))
    .expect("invalid project fixture should still parse");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("valid style pack fixture");

    let report = validate_project(&project, &stylepack);

    assert!(report
        .issues
        .iter()
        .any(|issue| issue.code == "BAD_CONNECTOR"));
}
