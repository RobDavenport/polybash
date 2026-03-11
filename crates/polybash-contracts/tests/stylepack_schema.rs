use polybash_contracts::{bundled_project_schema, bundled_report_schema, bundled_stylepack_schema};

#[test]
fn bundled_schemas_are_non_empty() {
    assert!(bundled_project_schema().contains("PolyBashProject"));
    assert!(bundled_stylepack_schema().contains("PolyBashStylePack"));
    assert!(bundled_report_schema().contains("PolyBashValidationReport"));
}
