use polybash_contracts::parse_commands_str;
use polybash_llm::{summarize_command_preview_targets, summarize_commands};

#[test]
fn transform_command_summarizes_to_structured_line() {
    let commands = parse_commands_str(
        r#"[{"op":"set_transform","instanceId":"weapon_01","field":"rotation","value":[0.0,0.0,45.0]}]"#,
    )
    .expect("transform command should parse");

    let summaries = summarize_commands(&commands);

    assert_eq!(summaries, vec!["set_transform weapon_01 rotation 0 0 45"]);
}

#[test]
fn valid_command_fixture_summarizes_to_structured_lines() {
    let commands = parse_commands_str(include_str!(
        "../../../fixtures/commands/valid/fighter_variant_commands.json"
    ))
    .expect("valid command fixture");

    let summaries = summarize_commands(&commands);

    assert_eq!(summaries.len(), 4);
    assert!(summaries
        .iter()
        .any(|summary| summary == "assign_rig_template biped_fighter_v1"));
    assert!(summaries
        .iter()
        .any(|summary| summary == "attach_socket weapon_r hand_r"));
}

#[test]
fn connector_commands_summarize_to_structured_lines_and_preview_targets() {
    let commands = parse_commands_str(
        r#"[
            {"op":"set_connector_attachment","instanceId":"arm_l_01","localConnector":"hand_socket_l","targetInstanceId":"weapon_01","targetConnector":"grip"},
            {"op":"clear_connector_attachment","instanceId":"torso_01","localConnector":"neck"}
        ]"#,
    )
    .expect("connector commands should parse");

    let summaries = summarize_commands(&commands);
    let preview_targets = summarize_command_preview_targets(&commands);

    assert_eq!(
        summaries,
        vec![
            "set_connector_attachment arm_l_01 hand_socket_l weapon_01 grip",
            "clear_connector_attachment torso_01 neck",
        ]
    );
    assert_eq!(
        preview_targets,
        vec![
            "preview arm_l_01 modules.arm_l_01.connector_attachments.hand_socket_l",
            "preview torso_01 modules.torso_01.connector_attachments.neck",
        ]
    );
}

#[test]
fn invalid_command_fixture_is_rejected() {
    let error = parse_commands_str(include_str!(
        "../../../fixtures/commands/invalid/unknown_op.json"
    ))
    .expect_err("invalid command fixture should fail");

    assert!(error.to_string().contains("unknown variant"));
}

#[test]
fn preview_targets_are_summarized_to_deterministic_paths() {
    let commands = parse_commands_str(
        r#"[
            {"op":"set_transform","instanceId":"weapon_01","field":"rotation","value":[0.0,0.0,45.0]},
            {"op":"assign_material_zone","instanceId":"torso_01","zone":"primary","materialId":"cloth_blue"}
        ]"#,
    )
    .expect("preview commands should parse");

    let summaries = summarize_command_preview_targets(&commands);

    assert_eq!(
        summaries,
        vec![
            "preview weapon_01 modules.weapon_01.transform.rotation",
            "preview torso_01 modules.torso_01.material_slots.primary",
        ]
    );
}
