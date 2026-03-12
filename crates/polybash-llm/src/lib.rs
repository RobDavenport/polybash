use polybash_contracts::{EditCommand, TransformField};

#[derive(Debug, Clone, PartialEq)]
pub struct CommandProposal {
    pub summary: String,
    pub commands: Vec<EditCommand>,
}

pub fn summarize_commands(commands: &[EditCommand]) -> Vec<String> {
    commands
        .iter()
        .map(|command| match command {
            EditCommand::SetTransform {
                instance_id,
                field,
                value,
            } => format!(
                "set_transform {instance_id} {} {} {} {}",
                transform_field_name(field),
                value[0],
                value[1],
                value[2]
            ),
            EditCommand::SetRegionParam {
                instance_id,
                region,
                value,
            } => format!("set_region_param {instance_id} {region} {value}"),
            EditCommand::AssignMaterialZone {
                instance_id,
                zone,
                material_id,
            } => format!("assign_material_zone {instance_id} {zone} {material_id}"),
            EditCommand::AssignRigTemplate { template_id } => {
                format!("assign_rig_template {template_id}")
            }
            EditCommand::AttachSocket { name, bone } => format!("attach_socket {name} {bone}"),
        })
        .collect()
}

pub fn summarize_command_preview_targets(commands: &[EditCommand]) -> Vec<String> {
    commands
        .iter()
        .map(|command| match command {
            EditCommand::SetTransform {
                instance_id, field, ..
            } => format!(
                "preview {instance_id} modules.{instance_id}.transform.{}",
                transform_field_name(field)
            ),
            EditCommand::SetRegionParam {
                instance_id,
                region,
                ..
            } => format!("preview {instance_id} modules.{instance_id}.region_params.{region}"),
            EditCommand::AssignMaterialZone {
                instance_id, zone, ..
            } => format!("preview {instance_id} modules.{instance_id}.material_slots.{zone}"),
            EditCommand::AssignRigTemplate { .. } => {
                "preview project.rig project.rig.template_id".to_string()
            }
            EditCommand::AttachSocket { name, .. } => {
                format!("preview {name} project.rig.sockets.{name}")
            }
        })
        .collect()
}

fn transform_field_name(field: &TransformField) -> &'static str {
    match field {
        TransformField::Position => "position",
        TransformField::Rotation => "rotation",
        TransformField::Scale => "scale",
    }
}
