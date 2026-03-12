use std::path::PathBuf;
use std::process::Command;

fn fixture_path(relative: &str) -> String {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../")
        .join(relative)
        .to_string_lossy()
        .into_owned()
}

#[test]
fn validate_command_prints_clean_report_for_canonical_fighter() {
    let valid_project = fixture_path("fixtures/projects/valid/fighter_basic.zxmodel.json");
    let stylepack = fixture_path("fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json");

    let output = Command::new(env!("CARGO_BIN_EXE_polybash-cli"))
        .args([
            "validate",
            "--project",
            &valid_project,
            "--stylepack",
            &stylepack,
        ])
        .output()
        .expect("validate command runs");

    assert_eq!(output.status.code(), Some(0));

    let stdout = String::from_utf8(output.stdout).expect("utf8 stdout");
    assert!(stdout.contains("\"status\": \"ok\""));
    assert!(stdout.contains("\"issues\": []"));
}

#[test]
fn validate_command_returns_nonzero_for_invalid_fixture() {
    let invalid_project =
        fixture_path("fixtures/projects/invalid/fighter_over_budget.zxmodel.json");
    let stylepack = fixture_path("fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json");

    let output = Command::new(env!("CARGO_BIN_EXE_polybash-cli"))
        .args([
            "validate",
            "--project",
            &invalid_project,
            "--stylepack",
            &stylepack,
        ])
        .output()
        .expect("validate command runs");

    assert_eq!(output.status.code(), Some(2));

    let stdout = String::from_utf8(output.stdout).expect("utf8 stdout");
    assert!(stdout.contains("\"status\": \"error\""));
    assert!(stdout.contains("\"code\": \"BUDGET_TRIANGLES\""));
}
