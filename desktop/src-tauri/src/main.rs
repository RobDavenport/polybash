fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            polybash_desktop::commands::load_canonical_document_command,
            polybash_desktop::commands::create_fighter_template_command,
            polybash_desktop::commands::load_document_command,
            polybash_desktop::commands::add_module_instance_command,
            polybash_desktop::commands::remove_module_instance_command,
            polybash_desktop::commands::mirror_module_instance_command,
            polybash_desktop::commands::apply_edit_command_command,
            polybash_desktop::commands::preview_edit_command_command,
            polybash_desktop::commands::set_connector_attachment_command,
            polybash_desktop::commands::clear_connector_attachment_command,
            polybash_desktop::commands::snap_module_instance_command,
            polybash_desktop::commands::set_fill_layer_palette_command,
            polybash_desktop::commands::add_module_decal_layer_command,
            polybash_desktop::commands::remove_module_decal_layer_command,
            polybash_desktop::commands::save_project_command,
            polybash_desktop::commands::validate_document_command,
            polybash_desktop::commands::export_document_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running PolyBash desktop");
}
