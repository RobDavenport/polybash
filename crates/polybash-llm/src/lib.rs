use polybash_contracts::EditCommand;

#[derive(Debug, Clone, PartialEq)]
pub struct CommandProposal {
    pub summary: String,
    pub commands: Vec<EditCommand>,
}

pub fn summarize_commands(commands: &[EditCommand]) -> Vec<String> {
    commands
        .iter()
        .map(|command| match command {
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
