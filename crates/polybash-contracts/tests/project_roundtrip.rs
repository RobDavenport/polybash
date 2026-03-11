use polybash_contracts::{parse_project_str, to_pretty_json};

#[test]
fn fighter_project_roundtrips_without_losing_identity_fields() {
    let fixture = include_str!("../../../fixtures/projects/valid/fighter_basic.zxmodel.json");
    let project = parse_project_str(fixture).expect("fixture should parse");
    let serialized = to_pretty_json(&project).expect("project should serialize");

    assert!(serialized.contains("\"id\": \"fighter_basic\""));
    assert!(serialized.contains("\"stylePackId\": \"zx_fighter_v1\""));
}
