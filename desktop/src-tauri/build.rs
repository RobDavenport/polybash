use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::SystemTime;

fn main() {
    println!("cargo:rerun-if-changed=../index.html");
    println!("cargo:rerun-if-changed=../package.json");
    println!("cargo:rerun-if-changed=../src");
    println!("cargo:rerun-if-changed=../tsconfig.json");
    println!("cargo:rerun-if-changed=../vite.config.ts");

    ensure_frontend_dist();
    tauri_build::build()
}

fn ensure_frontend_dist() {
    let desktop_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .canonicalize()
        .expect("desktop dir");
    let dist_index = desktop_dir.join("dist").join("index.html");

    if !needs_frontend_build(&desktop_dir, &dist_index) {
        return;
    }

    println!("cargo:warning=Building desktop frontend with pnpm...");

    let status = Command::new(corepack_command())
        .arg("pnpm")
        .arg("build")
        .current_dir(&desktop_dir)
        .status()
        .expect("failed to spawn corepack pnpm build for desktop frontend");

    if !status.success() {
        panic!(
            "desktop frontend build failed with status {status}. Run `corepack pnpm --dir desktop build` for details."
        );
    }
}

fn corepack_command() -> &'static str {
    if cfg!(windows) {
        "corepack.cmd"
    } else {
        "corepack"
    }
}

fn needs_frontend_build(desktop_dir: &Path, dist_index: &Path) -> bool {
    if !dist_index.exists() {
        return true;
    }

    let output_mtime = modified_time(dist_index).unwrap_or(SystemTime::UNIX_EPOCH);
    latest_input_mtime(desktop_dir) > output_mtime
}

fn latest_input_mtime(desktop_dir: &Path) -> SystemTime {
    [
        desktop_dir.join("index.html"),
        desktop_dir.join("package.json"),
        desktop_dir.join("tsconfig.json"),
        desktop_dir.join("vite.config.ts"),
        desktop_dir.join("src"),
    ]
    .iter()
    .fold(SystemTime::UNIX_EPOCH, |latest, path| {
        latest.max(latest_mtime(path))
    })
}

fn latest_mtime(path: &Path) -> SystemTime {
    if path.is_dir() {
        fs::read_dir(path)
            .ok()
            .into_iter()
            .flat_map(|entries| entries.filter_map(Result::ok))
            .map(|entry| latest_mtime(&entry.path()))
            .fold(SystemTime::UNIX_EPOCH, SystemTime::max)
    } else {
        modified_time(path).unwrap_or(SystemTime::UNIX_EPOCH)
    }
}

fn modified_time(path: &Path) -> Option<SystemTime> {
    fs::metadata(path).ok()?.modified().ok()
}
