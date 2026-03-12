use polybash_contracts::{
    EditCommand, ModuleInstance, Project, RigAssignment, SocketBinding, StylePack, TransformField,
};
use polybash_ops::clamp_region;
use thiserror::Error;

#[derive(Debug, Clone, PartialEq)]
pub struct CommandPreview {
    pub project: Project,
    pub diff: CommandDiff,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CommandDiff {
    pub op: String,
    pub target: String,
    pub changes: Vec<CommandChange>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct CommandChange {
    pub path: String,
    pub before: PreviewValue,
    pub after: PreviewValue,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PreviewValue {
    Vector3([f32; 3]),
    Scalar(f32),
    Text(String),
    Missing,
}

#[derive(Debug, Error)]
pub enum DomainError {
    #[error("module instance not found: {0}")]
    MissingInstance(String),
    #[error("module descriptor not found: {0}")]
    MissingModule(String),
    #[error("region not found: {0}")]
    MissingRegion(String),
    #[error("scale components must be greater than zero")]
    InvalidScale,
}

fn instance<'a>(project: &'a Project, instance_id: &str) -> Option<&'a ModuleInstance> {
    project
        .modules
        .iter()
        .find(|instance| instance.instance_id == instance_id)
}

fn instance_mut<'a>(project: &'a mut Project, instance_id: &str) -> Option<&'a mut ModuleInstance> {
    project
        .modules
        .iter_mut()
        .find(|instance| instance.instance_id == instance_id)
}

pub fn preview_command_with_diff(
    project: &Project,
    style_pack: &StylePack,
    command: &EditCommand,
) -> Result<CommandPreview, DomainError> {
    let mut cloned = project.clone();
    apply_command(&mut cloned, style_pack, command)?;
    let diff = build_command_diff(project, &cloned, command)?;

    Ok(CommandPreview {
        project: cloned,
        diff,
    })
}

pub fn preview_command(
    project: &Project,
    style_pack: &StylePack,
    command: &EditCommand,
) -> Result<Project, DomainError> {
    preview_command_with_diff(project, style_pack, command).map(|preview| preview.project)
}

pub fn apply_command(
    project: &mut Project,
    style_pack: &StylePack,
    command: &EditCommand,
) -> Result<(), DomainError> {
    match command {
        EditCommand::SetTransform {
            instance_id,
            field,
            value,
        } => {
            let instance = instance_mut(project, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;

            if matches!(field, TransformField::Scale)
                && value.iter().any(|component| *component <= 0.0)
            {
                return Err(DomainError::InvalidScale);
            }

            match field {
                TransformField::Position => instance.transform.position = *value,
                TransformField::Rotation => instance.transform.rotation = *value,
                TransformField::Scale => instance.transform.scale = *value,
            }
        }
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

fn transform_value(instance: &ModuleInstance, field: &TransformField) -> PreviewValue {
    match field {
        TransformField::Position => PreviewValue::Vector3(instance.transform.position),
        TransformField::Rotation => PreviewValue::Vector3(instance.transform.rotation),
        TransformField::Scale => PreviewValue::Vector3(instance.transform.scale),
    }
}

fn transform_field_name(field: &TransformField) -> &'static str {
    match field {
        TransformField::Position => "position",
        TransformField::Rotation => "rotation",
        TransformField::Scale => "scale",
    }
}

fn build_command_diff(
    before: &Project,
    after: &Project,
    command: &EditCommand,
) -> Result<CommandDiff, DomainError> {
    match command {
        EditCommand::SetTransform {
            instance_id, field, ..
        } => {
            let before_instance = instance(before, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;
            let after_instance = instance(after, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;

            Ok(CommandDiff {
                op: "set_transform".to_string(),
                target: instance_id.clone(),
                changes: vec![CommandChange {
                    path: format!(
                        "modules.{instance_id}.transform.{}",
                        transform_field_name(field)
                    ),
                    before: transform_value(before_instance, field),
                    after: transform_value(after_instance, field),
                }],
            })
        }
        EditCommand::SetRegionParam {
            instance_id,
            region,
            ..
        } => {
            let before_instance = instance(before, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;
            let after_instance = instance(after, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;

            Ok(CommandDiff {
                op: "set_region_param".to_string(),
                target: instance_id.clone(),
                changes: vec![CommandChange {
                    path: format!("modules.{instance_id}.region_params.{region}"),
                    before: before_instance
                        .region_params
                        .get(region)
                        .copied()
                        .map(PreviewValue::Scalar)
                        .unwrap_or(PreviewValue::Missing),
                    after: after_instance
                        .region_params
                        .get(region)
                        .copied()
                        .map(PreviewValue::Scalar)
                        .unwrap_or(PreviewValue::Missing),
                }],
            })
        }
        EditCommand::AssignMaterialZone {
            instance_id, zone, ..
        } => {
            let before_instance = instance(before, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;
            let after_instance = instance(after, instance_id)
                .ok_or_else(|| DomainError::MissingInstance(instance_id.clone()))?;

            Ok(CommandDiff {
                op: "assign_material_zone".to_string(),
                target: instance_id.clone(),
                changes: vec![CommandChange {
                    path: format!("modules.{instance_id}.material_slots.{zone}"),
                    before: before_instance
                        .material_slots
                        .get(zone)
                        .cloned()
                        .map(PreviewValue::Text)
                        .unwrap_or(PreviewValue::Missing),
                    after: after_instance
                        .material_slots
                        .get(zone)
                        .cloned()
                        .map(PreviewValue::Text)
                        .unwrap_or(PreviewValue::Missing),
                }],
            })
        }
        EditCommand::AssignRigTemplate { .. } => Ok(CommandDiff {
            op: "assign_rig_template".to_string(),
            target: "project.rig".to_string(),
            changes: vec![CommandChange {
                path: "project.rig.template_id".to_string(),
                before: before
                    .rig
                    .as_ref()
                    .map(|rig| PreviewValue::Text(rig.template_id.clone()))
                    .unwrap_or(PreviewValue::Missing),
                after: after
                    .rig
                    .as_ref()
                    .map(|rig| PreviewValue::Text(rig.template_id.clone()))
                    .unwrap_or(PreviewValue::Missing),
            }],
        }),
        EditCommand::AttachSocket { name, .. } => Ok(CommandDiff {
            op: "attach_socket".to_string(),
            target: name.clone(),
            changes: vec![CommandChange {
                path: format!("project.rig.sockets.{name}"),
                before: before
                    .rig
                    .as_ref()
                    .and_then(|rig| {
                        rig.sockets
                            .iter()
                            .find(|socket| socket.name == *name)
                            .map(|socket| PreviewValue::Text(socket.bone.clone()))
                    })
                    .unwrap_or(PreviewValue::Missing),
                after: after
                    .rig
                    .as_ref()
                    .and_then(|rig| {
                        rig.sockets
                            .iter()
                            .rev()
                            .find(|socket| socket.name == *name)
                            .map(|socket| PreviewValue::Text(socket.bone.clone()))
                    })
                    .unwrap_or(PreviewValue::Missing),
            }],
        }),
    }
}
