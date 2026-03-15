use polybash_contracts::parse_module_import_str;

#[test]
fn blender_module_import_fixture_parses() {
    let imported = parse_module_import_str(include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../fixtures/imports/valid/weapon_hammer_basic.import.json"
    )))
    .expect("import fixture parses");

    assert_eq!(imported.version, 1);
    assert_eq!(imported.source_asset.format.as_str(), "glb");
    assert_eq!(
        imported.source_asset.path,
        "../source/weapon_hammer_basic.glb"
    );
    assert_eq!(imported.id, "weapon_hammer_basic");
    assert_eq!(imported.asset_type.budget_key(), "weapon");
}
