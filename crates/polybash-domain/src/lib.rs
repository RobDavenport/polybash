use polybash_contracts::{
    EditCommand, ModuleInstance, Project, RigAssignment, SocketBinding, StylePack,
};
use polybash_ops::clamp_region;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DomainError {
    #[error("module instance not found: {0}")]
    MissingInstance(String),
    #[error("module descriptor not found: {0}")]
    MissingModule(String),
    #[error("region not found: {0}")]
    MissingRegion(String),
}

fn instance_mut<'a>(project: &'a mut Project, instance_id: &str) -> Option<&'a mut ModuleInstance> {
    project
        .modules
        .iter_mut()
        .find(|instance| instance.instance_id == instance_id)
}

pub fn preview_command(
    project: &Project,
    style_pack: &StylePack,
    command: &EditCommand,
) -> Result<Project, DomainError> {
    let mut cloned = project.clone();
    apply_command(&mut cloned, style_pack, command)?;
    Ok(cloned)
}

pub fn apply_command(
    project: &mut Project,
    style_pack: &StylePack,
    command: &EditCommand,
) -> Result<(), DomainError> {
    match command {
        EditCommand::SetRegionParam {
            instance_id,
            region,
            value,
        } => {
            let module_id = project
                .modules
                .iter()
                .find(|instance| instance.instance_id == *instance_id)
                .map(|instance| instance.module_id.clone())
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;

            let module = style_pack
                .module(&module_id)
                .ok_or_else(|| DomainError::MissingModule(module_id.clone()))?;
            let region_descriptor = module
                .region(region)
                .ok_or_else(|| DomainError::MissingRegion(region.clone()))?;
            let clamped = clamp_region(region_descriptor, *value);

            let instance = instance_mut(project, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;
            instance.region_params.insert(region.clone(), clamped);
        }
        EditCommand::AssignMaterialZone {
            instance_id,
            zone,
            material_id,
        } => {
            let instance = instance_mut(project, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;
            instance
                .material_slots
                .insert(zone.clone(), material_id.clone());
        }
        EditCommand::AssignRigTemplate { template_id } => match &mut project.rig {
            Some(rig) => rig.template_id = template_id.clone(),
            None => {
                project.rig = Some(RigAssignment {
                    template_id: template_id.clone(),
                    sockets: Vec::new(),
                })
            }
        },
        EditCommand::AttachSocket { name, bone } => {
            let rig = project.rig.get_or_insert_with(|| RigAssignment {
                template_id: String::new(),
                sockets: Vec::new(),
            });
            rig.sockets.push(SocketBinding {
                name: name.clone(),
                bone: bone.clone(),
            });
        }
    }

    Ok(())
}
