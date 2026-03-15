use polybash_contracts::parse_module_descriptor_str;

#[test]
fn imported_module_descriptor_fixture_roundtrips_with_source_asset() {
    let fixture = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../fixtures/imports/valid/fighter_shoulder_guard_a.module.json"
    ));
    let descriptor =
        parse_module_descriptor_str(fixture).expect("module descriptor fixture should parse");

    assert_eq!(descriptor.id, "fighter_shoulder_guard_a");
    assert_eq!(
        descriptor
            .source_asset
            .as_ref()
            .map(|asset| asset.path.as_str()),
        Some("fixtures/imports/valid/fighter_shoulder_guard_a.glb")
    );
    assert_eq!(
        descriptor
            .source_asset
            .as_ref()
            .map(|asset| asset.format.as_str()),
        Some("glb")
    );
    assert_eq!(descriptor.connectors.len(), 1);
    assert_eq!(descriptor.material_zones, vec!["primary", "trim"]);
}
