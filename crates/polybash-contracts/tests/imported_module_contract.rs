use polybash_contracts::{parse_imported_module_contract_str, AssetType};

#[test]
fn imported_module_contract_fixture_parses_with_source_asset_metadata() {
    let contract = parse_imported_module_contract_str(include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../fixtures/imports/valid/prop_crate_round_a.moduleimport.json"
    )))
    .expect("import contract fixture");

    assert_eq!(contract.id, "prop_crate_round_a");
    assert_eq!(contract.asset_type, AssetType::PropSmall);
    assert_eq!(
        contract.source_asset.path,
        "../assets/prop_crate_round_a.glb"
    );
    assert_eq!(contract.source_asset.format.as_str(), "glb");
    assert_eq!(contract.material_zones, vec!["body", "bands"]);
}
