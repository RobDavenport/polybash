use std::fs;
use std::path::PathBuf;
use std::process::Command;

use tempfile::tempdir;

fn fixture_path(relative: &str) -> String {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../")
        .join(relative)
        .to_string_lossy()
        .into_owned()
}

#[test]
fn export_command_writes_glb_and_report_for_valid_fixture() {
    let out_dir = tempdir().expect("temp dir");
    let valid_project = fixture_path("fixtures/projects/valid/fighter_basic.zxmodel.json");
    let stylepack = fixture_path("fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json");

    let output = Command::new(env!("CARGO_BIN_EXE_polybash-cli"))
        .args([
            "export",
            "--project",
            &valid_project,
            "--stylepack",
            &stylepack,
            "--out",
            out_dir.path().to_str().expect("utf8 temp path"),
        ])
        .output()
        .expect("export command runs");

    assert_eq!(output.status.code(), Some(0));

    let glb_bytes = fs::read(out_dir.path().join("asset.glb")).expect("glb written");
    let report =
        fs::read_to_string(out_dir.path().join("asset.report.json")).expect("report written");

    assert!(glb_bytes.starts_with(b"glTF"));
    assert!(report.contains("\"status\": \"ok\""));
}

#[test]
fn export_command_blocks_invalid_fixture_and_still_writes_report() {
    let out_dir = tempdir().expect("temp dir");
    let invalid_project =
        fixture_path("fixtures/projects/invalid/fighter_over_budget.zxmodel.json");
    let stylepack = fixture_path("fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json");

    let output = Command::new(env!("CARGO_BIN_EXE_polybash-cli"))
        .args([
            "export",
            "--project",
            &invalid_project,
            "--stylepack",
            &stylepack,
            "--out",
            out_dir.path().to_str().expect("utf8 temp path"),
        ])
        .output()
        .expect("export command runs");

    assert_eq!(output.status.code(), Some(2));
    assert!(!out_dir.path().join("asset.glb").exists());

    let report =
        fs::read_to_string(out_dir.path().join("asset.report.json")).expect("report written");
    assert!(report.contains("\"status\": \"error\""));
    assert!(report.contains("\"code\": \"BUDGET_TRIANGLES\""));
}
