use polybash_contracts::{parse_commands_str, parse_project_str, parse_stylepack_str};
use polybash_domain::preview_command;

#[test]
fn set_region_param_preview_clamps_to_stylepack_range() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("style pack fixture");
    let commands = parse_commands_str(
        r#"[{"op":"set_region_param","instanceId":"head_01","region":"jaw_width","value":999.0}]"#,
    )
    .expect("command should parse");

    let preview = preview_command(&project, &stylepack, &commands[0]).expect("preview should work");
    let head = preview
        .modules
        .iter()
        .find(|module| module.instance_id == "head_01")
        .expect("head instance");

    assert_eq!(head.region_params.get("jaw_width").copied(), Some(0.2));
}
