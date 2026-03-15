use polybash_contracts::{parse_commands_str, parse_project_str, parse_stylepack_str};
use polybash_domain::{apply_command, preview_command, preview_command_with_diff, PreviewValue};

#[test]
fn set_transform_preview_updates_rotation_without_mutating_original() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("style pack fixture");
    let commands = parse_commands_str(
        r#"[{"op":"set_transform","instanceId":"weapon_01","field":"rotation","value":[0.0,0.0,45.0]}]"#,
    )
    .expect("command should parse");

    let preview = preview_command(&project, &stylepack, &commands[0]).expect("preview should work");
    let preview_weapon = preview
        .modules
        .iter()
        .find(|module| module.instance_id == "weapon_01")
        .expect("weapon instance");
    let original_weapon = project
        .modules
        .iter()
        .find(|module| module.instance_id == "weapon_01")
        .expect("weapon instance");

    assert_eq!(preview_weapon.transform.rotation, [0.0, 0.0, 45.0]);
    assert_eq!(original_weapon.transform.rotation, [0.0, 0.0, 90.0]);
}

#[test]
fn set_transform_rejects_non_positive_scale() {
    let mut project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("style pack fixture");
    let commands = parse_commands_str(
        r#"[{"op":"set_transform","instanceId":"head_01","field":"scale","value":[1.0,0.0,1.0]}]"#,
    )
    .expect("command should parse");

    let error = apply_command(&mut project, &stylepack, &commands[0])
        .expect_err("non-positive scale should be rejected");

    assert_eq!(
        error.to_string(),
        "scale components must be greater than zero"
    );
}

#[test]
fn set_transform_preview_returns_diff_metadata() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("style pack fixture");
    let commands = parse_commands_str(
        r#"[{"op":"set_transform","instanceId":"weapon_01","field":"rotation","value":[0.0,0.0,45.0]}]"#,
    )
    .expect("command should parse");

    let preview =
        preview_command_with_diff(&project, &stylepack, &commands[0]).expect("preview should work");

    assert_eq!(preview.diff.op, "set_transform");
    assert_eq!(preview.diff.target, "weapon_01");
    assert_eq!(preview.diff.changes.len(), 1);
    assert_eq!(
        preview.diff.changes[0].path,
        "modules.weapon_01.transform.rotation"
    );
    assert_eq!(
        preview.diff.changes[0].before,
        PreviewValue::Vector3([0.0, 0.0, 90.0])
    );
    assert_eq!(
        preview.diff.changes[0].after,
        PreviewValue::Vector3([0.0, 0.0, 45.0])
    );
}

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

#[test]
fn assign_material_zone_preview_returns_diff_metadata() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("style pack fixture");
    let commands = parse_commands_str(
        r#"[{"op":"assign_material_zone","instanceId":"torso_01","zone":"primary","materialId":"cloth_blue"}]"#,
    )
    .expect("command should parse");

    let preview =
        preview_command_with_diff(&project, &stylepack, &commands[0]).expect("preview should work");

    assert_eq!(preview.diff.op, "assign_material_zone");
    assert_eq!(preview.diff.target, "torso_01");
    assert_eq!(preview.diff.changes.len(), 1);
    assert_eq!(
        preview.diff.changes[0].path,
        "modules.torso_01.material_slots.primary"
    );
    assert_eq!(
        preview.diff.changes[0].before,
        PreviewValue::Text("cloth_red".to_string())
    );
    assert_eq!(
        preview.diff.changes[0].after,
        PreviewValue::Text("cloth_blue".to_string())
    );
}

#[test]
fn valid_command_fixture_previews_and_applies_across_project_state() {
    let mut project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("style pack fixture");
    let commands = parse_commands_str(include_str!(
        "../../../fixtures/commands/valid/fighter_variant_commands.json"
    ))
    .expect("valid command fixture");

    let preview = preview_command(&project, &stylepack, &commands[0]).expect("preview should work");
    let preview_head = preview
        .modules
        .iter()
        .find(|module| module.instance_id == "head_01")
        .expect("head instance");
    assert_eq!(
        preview_head.region_params.get("jaw_width").copied(),
        Some(0.1)
    );

    for command in &commands {
        apply_command(&mut project, &stylepack, command).expect("command should apply");
    }

    let torso = project
        .modules
        .iter()
        .find(|module| module.instance_id == "torso_01")
        .expect("torso instance");
    assert_eq!(
        torso.material_slots.get("primary").map(String::as_str),
        Some("cloth_blue")
    );
    assert_eq!(
        project.rig.as_ref().map(|rig| rig.template_id.as_str()),
        Some("biped_fighter_v1")
    );
    assert!(project.rig.as_ref().is_some_and(|rig| rig
        .sockets
        .iter()
        .any(|socket| socket.name == "weapon_r" && socket.bone == "hand_r")));
}

#[test]
fn set_connector_attachment_preview_returns_diff_metadata() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("style pack fixture");
    let commands = parse_commands_str(
        r#"[{"op":"set_connector_attachment","instanceId":"arm_l_01","localConnector":"hand_socket_l","targetInstanceId":"weapon_01","targetConnector":"grip"}]"#,
    )
    .expect("command should parse");

    let preview =
        preview_command_with_diff(&project, &stylepack, &commands[0]).expect("preview should work");

    assert_eq!(preview.diff.op, "set_connector_attachment");
    assert_eq!(preview.diff.target, "arm_l_01");
    assert_eq!(preview.diff.changes.len(), 1);
    assert_eq!(
        preview.diff.changes[0].path,
        "modules.arm_l_01.connector_attachments.hand_socket_l"
    );
    assert_eq!(preview.diff.changes[0].before, PreviewValue::Missing);
    assert_eq!(
        preview.diff.changes[0].after,
        PreviewValue::Text("weapon_01::grip".to_string())
    );
}

#[test]
fn clear_connector_attachment_preview_returns_missing_diff_metadata() {
    let project = parse_project_str(include_str!(
        "../../../fixtures/projects/valid/fighter_basic.zxmodel.json"
    ))
    .expect("project fixture");
    let stylepack = parse_stylepack_str(include_str!(
        "../../../fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json"
    ))
    .expect("style pack fixture");
    let commands = parse_commands_str(
        r#"[{"op":"clear_connector_attachment","instanceId":"torso_01","localConnector":"neck"}]"#,
    )
    .expect("command should parse");

    let preview =
        preview_command_with_diff(&project, &stylepack, &commands[0]).expect("preview should work");

    assert_eq!(preview.diff.op, "clear_connector_attachment");
    assert_eq!(preview.diff.target, "torso_01");
    assert_eq!(preview.diff.changes.len(), 1);
    assert_eq!(
        preview.diff.changes[0].path,
        "modules.torso_01.connector_attachments.neck"
    );
    assert_eq!(
        preview.diff.changes[0].before,
        PreviewValue::Text("head_01::neck_socket".to_string())
    );
    assert_eq!(preview.diff.changes[0].after, PreviewValue::Missing);
}
