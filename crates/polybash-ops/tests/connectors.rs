use polybash_contracts::parse_stylepack_str;
use polybash_ops::connector_is_compatible;

#[test]
fn connector_taxonomy_matches_expected_pairs() {
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("stylepack fixture");

    assert!(connector_is_compatible(&stylepack, "neck", "neck_socket"));
    assert!(connector_is_compatible(
        &stylepack,
        "weapon_grip",
        "hand_socket"
    ));
    assert!(!connector_is_compatible(
        &stylepack,
        "hand_socket",
        "neck_socket"
    ));
}
