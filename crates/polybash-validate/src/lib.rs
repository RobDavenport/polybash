use polybash_contracts::{
    Budget, IssueSeverity, ModuleDescriptor, ModuleInstance, PaintLayer, Project, ReportStats,
    ReportStatus, StylePack, ValidationIssue, ValidationReport,
};
use polybash_ops::connector_is_compatible;

fn push_issue(
    issues: &mut Vec<ValidationIssue>,
    code: &str,
    severity: IssueSeverity,
    path: impl Into<String>,
    summary: impl Into<String>,
    detail: impl Into<String>,
    suggested_fix: Option<String>,
) {
    issues.push(ValidationIssue {
        code: code.to_string(),
        severity,
        path: path.into(),
        summary: summary.into(),
        detail: detail.into(),
        suggested_fix,
    });
}

fn budget<'a>(project: &Project, style_pack: &'a StylePack) -> Option<&'a Budget> {
    style_pack.budget_for_asset_type(&project.asset_type)
}

fn find_instance<'a>(project: &'a Project, instance_id: &str) -> Option<&'a ModuleInstance> {
    project
        .modules
        .iter()
        .find(|instance| instance.instance_id == instance_id)
}

fn find_module<'a>(style_pack: &'a StylePack, module_id: &str) -> Option<&'a ModuleDescriptor> {
    style_pack.module(module_id)
}

pub fn validate_project(project: &Project, style_pack: &StylePack) -> ValidationReport {
    let mut issues = Vec::new();

    if project.style_pack_id != style_pack.id {
        push_issue(
            &mut issues,
            "STYLEPACK_MISMATCH",
            IssueSeverity::Error,
            "/stylePackId",
            "Project references a different style pack.",
            format!(
                "Project style pack '{}' does not match loaded style pack '{}'.",
                project.style_pack_id, style_pack.id
            ),
            Some("Load the matching style pack or fix the project reference.".to_string()),
        );
    }

    if !style_pack
        .supported_asset_types
        .contains(&project.asset_type)
    {
        push_issue(
            &mut issues,
            "UNSUPPORTED_ASSET_TYPE",
            IssueSeverity::Error,
            "/assetType",
            "Asset type is not supported by this style pack.",
            format!(
                "Asset type '{:?}' is not listed in supportedAssetTypes.",
                project.asset_type
            ),
            Some("Choose a compatible style pack or asset type.".to_string()),
        );
    }

    if style_pack.palettes.is_empty() {
        push_issue(
            &mut issues,
            "MISSING_PALETTE",
            IssueSeverity::Error,
            "/palettes",
            "Style pack contains no palettes.",
            "At least one palette is required to resolve material slots.".to_string(),
            Some("Add at least one palette entry.".to_string()),
        );
    }

    match budget(project, style_pack) {
        Some(budget) => {
            if project.declared_metrics.triangles > budget.triangles {
                push_issue(
                    &mut issues,
                    "BUDGET_TRIANGLES",
                    IssueSeverity::Error,
                    "/declaredMetrics/triangles",
                    "Triangle budget exceeded.",
                    format!(
                        "{} > {} triangles.",
                        project.declared_metrics.triangles, budget.triangles
                    ),
                    Some("Reduce geometry or use a different style pack budget.".to_string()),
                );
            }
            if project.declared_metrics.materials > budget.materials {
                push_issue(
                    &mut issues,
                    "BUDGET_MATERIALS",
                    IssueSeverity::Error,
                    "/declaredMetrics/materials",
                    "Material budget exceeded.",
                    format!(
                        "{} > {} materials.",
                        project.declared_metrics.materials, budget.materials
                    ),
                    Some("Collapse materials or switch palette strategy.".to_string()),
                );
            }
            if project.declared_metrics.textures > budget.textures {
                push_issue(
                    &mut issues,
                    "BUDGET_TEXTURES",
                    IssueSeverity::Error,
                    "/declaredMetrics/textures",
                    "Texture budget exceeded.",
                    format!(
                        "{} > {} textures.",
                        project.declared_metrics.textures, budget.textures
                    ),
                    Some("Reduce atlas count.".to_string()),
                );
            }
            if project.declared_metrics.atlas_width > budget.atlas_width
                || project.declared_metrics.atlas_height > budget.atlas_height
            {
                push_issue(
                    &mut issues,
                    "BUDGET_ATLAS",
                    IssueSeverity::Error,
                    "/declaredMetrics",
                    "Atlas budget exceeded.",
                    format!(
                        "{}x{} exceeds {}x{}.",
                        project.declared_metrics.atlas_width,
                        project.declared_metrics.atlas_height,
                        budget.atlas_width,
                        budget.atlas_height
                    ),
                    Some("Shrink the texture atlas or split the asset.".to_string()),
                );
            }
            if project.declared_metrics.bones > budget.bones {
                push_issue(
                    &mut issues,
                    "BUDGET_BONES",
                    IssueSeverity::Error,
                    "/declaredMetrics/bones",
                    "Bone budget exceeded.",
                    format!(
                        "{} > {} bones.",
                        project.declared_metrics.bones, budget.bones
                    ),
                    Some("Reduce the rig bone count.".to_string()),
                );
            }
            if project.declared_metrics.sockets > budget.sockets {
                push_issue(
                    &mut issues,
                    "BUDGET_SOCKETS",
                    IssueSeverity::Error,
                    "/declaredMetrics/sockets",
                    "Socket budget exceeded.",
                    format!(
                        "{} > {} sockets.",
                        project.declared_metrics.sockets, budget.sockets
                    ),
                    Some("Remove unused sockets.".to_string()),
                );
            }
        }
        None => push_issue(
            &mut issues,
            "MISSING_BUDGET",
            IssueSeverity::Error,
            "/budgets",
            "No budget exists for the asset type.",
            format!("No budget entry for '{}'.", project.asset_type.budget_key()),
            Some("Add the missing budget to the style pack.".to_string()),
        ),
    }

    if project.modules.is_empty() {
        push_issue(
            &mut issues,
            "EMPTY_PROJECT",
            IssueSeverity::Warning,
            "/modules",
            "Project contains no modules.",
            "The project will not export meaningful geometry until modules are added.".to_string(),
            Some("Add at least one module instance.".to_string()),
        );
    }

    for (index, instance) in project.modules.iter().enumerate() {
        let module_path = format!("/modules/{index}");
        let module_descriptor = match find_module(style_pack, &instance.module_id) {
            Some(module) => module,
            None => {
                push_issue(
                    &mut issues,
                    "UNKNOWN_MODULE",
                    IssueSeverity::Error,
                    format!("{module_path}/moduleId"),
                    "Module instance references an unknown module.",
                    format!("Unknown module id '{}'.", instance.module_id),
                    Some("Use a module id that exists in the style pack.".to_string()),
                );
                continue;
            }
        };

        for (zone, material_id) in &instance.material_slots {
            if !style_pack.material_exists(material_id) {
                push_issue(
                    &mut issues,
                    "UNKNOWN_MATERIAL",
                    IssueSeverity::Error,
                    format!("{module_path}/materialSlots/{zone}"),
                    "Material slot references an unknown material.",
                    format!("Material '{material_id}' is not present in any palette."),
                    Some("Assign a material that exists in the style pack palettes.".to_string()),
                );
            }

            if !module_descriptor
                .material_zones
                .iter()
                .any(|candidate| candidate == zone)
            {
                push_issue(
                    &mut issues,
                    "UNKNOWN_MATERIAL_ZONE",
                    IssueSeverity::Error,
                    format!("{module_path}/materialSlots/{zone}"),
                    "Material zone is not defined by the module descriptor.",
                    format!(
                        "Zone '{zone}' is not present on module '{}'.",
                        module_descriptor.id
                    ),
                    Some("Use a valid material zone.".to_string()),
                );
            }
        }

        for (region_id, value) in &instance.region_params {
            match module_descriptor.region(region_id) {
                Some(region) if *value < region.min || *value > region.max => push_issue(
                    &mut issues,
                    "REGION_OUT_OF_RANGE",
                    IssueSeverity::Error,
                    format!("{module_path}/regionParams/{region_id}"),
                    "Region parameter is out of range.",
                    format!(
                        "Region '{region_id}' value {value} is outside [{}, {}].",
                        region.min, region.max
                    ),
                    Some("Clamp the value or update the region descriptor.".to_string()),
                ),
                Some(_) => {}
                None => push_issue(
                    &mut issues,
                    "UNKNOWN_REGION",
                    IssueSeverity::Error,
                    format!("{module_path}/regionParams/{region_id}"),
                    "Region parameter does not exist on this module.",
                    format!(
                        "Region '{region_id}' is not defined for module '{}'.",
                        module_descriptor.id
                    ),
                    Some("Use a valid authored region id.".to_string()),
                ),
            }
        }

        for attachment in &instance.connector_attachments {
            let local_connector = match module_descriptor.connector(&attachment.local_connector) {
                Some(connector) => connector,
                None => {
                    push_issue(
                        &mut issues,
                        "BAD_CONNECTOR",
                        IssueSeverity::Error,
                        format!("{module_path}/connectorAttachments"),
                        "Local connector does not exist.",
                        format!(
                            "Connector '{}' is missing on module '{}'.",
                            attachment.local_connector, module_descriptor.id
                        ),
                        Some("Use a valid connector id.".to_string()),
                    );
                    continue;
                }
            };

            let target_instance = match find_instance(project, &attachment.target_instance_id) {
                Some(target_instance) => target_instance,
                None => {
                    push_issue(
                        &mut issues,
                        "BAD_CONNECTOR",
                        IssueSeverity::Error,
                        format!("{module_path}/connectorAttachments"),
                        "Target instance does not exist.",
                        format!(
                            "Target instance '{}' was not found.",
                            attachment.target_instance_id
                        ),
                        Some("Attach to a real module instance.".to_string()),
                    );
                    continue;
                }
            };

            let target_descriptor = match find_module(style_pack, &target_instance.module_id) {
                Some(target_descriptor) => target_descriptor,
                None => {
                    push_issue(
                        &mut issues,
                        "BAD_CONNECTOR",
                        IssueSeverity::Error,
                        format!("{module_path}/connectorAttachments"),
                        "Target instance references an unknown module.",
                        format!(
                            "Target module '{}' was not found.",
                            target_instance.module_id
                        ),
                        Some("Fix the target instance module id.".to_string()),
                    );
                    continue;
                }
            };

            let target_connector = match target_descriptor.connector(&attachment.target_connector) {
                Some(target_connector) => target_connector,
                None => {
                    push_issue(
                        &mut issues,
                        "BAD_CONNECTOR",
                        IssueSeverity::Error,
                        format!("{module_path}/connectorAttachments"),
                        "Target connector does not exist.",
                        format!(
                            "Connector '{}' is missing on module '{}'.",
                            attachment.target_connector, target_descriptor.id
                        ),
                        Some("Use a valid target connector id.".to_string()),
                    );
                    continue;
                }
            };

            if !connector_is_compatible(style_pack, &local_connector.kind, &target_connector.kind) {
                push_issue(
                    &mut issues,
                    "BAD_CONNECTOR",
                    IssueSeverity::Error,
                    format!("{module_path}/connectorAttachments"),
                    "Connector kinds are incompatible.",
                    format!(
                        "'{}' cannot attach to '{}'.",
                        local_connector.kind, target_connector.kind
                    ),
                    Some("Use a compatible connector pair from the taxonomy.".to_string()),
                );
            }
        }
    }

    if let Some(rig) = &project.rig {
        if style_pack.rig_template(&rig.template_id).is_none() {
            push_issue(
                &mut issues,
                "UNKNOWN_RIG_TEMPLATE",
                IssueSeverity::Error,
                "/rig/templateId",
                "Rig template is unknown.",
                format!("Rig template '{}' is not defined.", rig.template_id),
                Some("Use a valid rig template id.".to_string()),
            );
        }

        for (index, socket) in rig.sockets.iter().enumerate() {
            if socket.name.trim().is_empty() || socket.bone.trim().is_empty() {
                push_issue(
                    &mut issues,
                    "BAD_SOCKET",
                    IssueSeverity::Error,
                    format!("/rig/sockets/{index}"),
                    "Socket binding is incomplete.",
                    "Socket name and bone are both required.".to_string(),
                    Some("Fill both fields.".to_string()),
                );
            }
        }
    }

    for (index, layer) in project.paint_layers.iter().enumerate() {
        match layer {
            PaintLayer::Fill { palette, .. } => {
                if style_pack.palette(palette).is_none() {
                    push_issue(
                        &mut issues,
                        "UNKNOWN_PALETTE",
                        IssueSeverity::Error,
                        format!("/paintLayers/{index}"),
                        "Paint layer references an unknown palette.",
                        format!("Palette '{palette}' does not exist."),
                        Some("Use a valid palette id.".to_string()),
                    );
                }
            }
            PaintLayer::Decal { decal_id, .. } => {
                if !style_pack.decal_ids.iter().any(|known| known == decal_id) {
                    push_issue(
                        &mut issues,
                        "UNKNOWN_DECAL",
                        IssueSeverity::Error,
                        format!("/paintLayers/{index}"),
                        "Paint layer references an unknown decal.",
                        format!("Decal '{decal_id}' is not allowed by the style pack."),
                        Some("Use a valid decal id.".to_string()),
                    );
                }
            }
        }
    }

    issues.sort_by(|left, right| {
        left.code
            .cmp(&right.code)
            .then(left.path.cmp(&right.path))
            .then(left.summary.cmp(&right.summary))
    });

    let status = if issues
        .iter()
        .any(|issue| matches!(issue.severity, IssueSeverity::Error))
    {
        ReportStatus::Error
    } else if issues
        .iter()
        .any(|issue| matches!(issue.severity, IssueSeverity::Warning))
    {
        ReportStatus::Warning
    } else {
        ReportStatus::Ok
    };

    ValidationReport {
        status,
        stats: ReportStats::from((project, project.modules.len())),
        issues,
    }
}
