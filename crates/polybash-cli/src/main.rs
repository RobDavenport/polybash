use clap::{Parser, Subcommand};
use polybash_contracts::{
    parse_project_str, parse_stylepack_str, to_pretty_json, Project, StylePack,
};
use polybash_export::{export_project, ExportError};
use polybash_validate::validate_project;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Parser)]
#[command(name = "polybash-cli")]
#[command(about = "PolyBash validation and export helper")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Validate {
        #[arg(long)]
        project: PathBuf,
        #[arg(long)]
        stylepack: PathBuf,
    },
    Inspect {
        #[arg(long)]
        project: PathBuf,
        #[arg(long)]
        stylepack: PathBuf,
    },
    Export {
        #[arg(long)]
        project: PathBuf,
        #[arg(long)]
        stylepack: PathBuf,
        #[arg(long)]
        out: PathBuf,
    },
}

fn read_file(path: &Path) -> Result<String, String> {
    fs::read_to_string(path)
        .map_err(|error| format!("failed to read '{}': {error}", path.display()))
}

fn load_project(path: &Path) -> Result<Project, String> {
    parse_project_str(&read_file(path)?)
        .map_err(|error| format!("failed to parse project '{}': {error}", path.display()))
}

fn load_stylepack(path: &Path) -> Result<StylePack, String> {
    parse_stylepack_str(&read_file(path)?)
        .map_err(|error| format!("failed to parse style pack '{}': {error}", path.display()))
}

fn write_string(path: &Path, value: &str) -> Result<(), String> {
    fs::write(path, value).map_err(|error| format!("failed to write '{}': {error}", path.display()))
}

fn main() {
    let cli = Cli::parse();
    let exit_code = match run(cli) {
        Ok(code) => code,
        Err(error) => {
            eprintln!("{error}");
            1
        }
    };
    std::process::exit(exit_code);
}

fn run(cli: Cli) -> Result<i32, String> {
    match cli.command {
        Commands::Validate { project, stylepack } | Commands::Inspect { project, stylepack } => {
            let project = load_project(&project)?;
            let stylepack = load_stylepack(&stylepack)?;
            let report = validate_project(&project, &stylepack);
            println!("{}", to_pretty_json(&report).map_err(|e| e.to_string())?);
            Ok(if report.has_errors() { 2 } else { 0 })
        }
        Commands::Export {
            project,
            stylepack,
            out,
        } => {
            let project = load_project(&project)?;
            let stylepack = load_stylepack(&stylepack)?;
            fs::create_dir_all(&out).map_err(|error| {
                format!("failed to create output dir '{}': {error}", out.display())
            })?;

            match export_project(&project, &stylepack) {
                Ok(bundle) => {
                    fs::write(out.join("asset.glb"), bundle.glb_bytes)
                        .map_err(|error| format!("failed to write asset.glb: {error}"))?;
                    write_string(
                        &out.join("asset.report.json"),
                        &to_pretty_json(&bundle.report).map_err(|e| e.to_string())?,
                    )?;
                    Ok(0)
                }
                Err(ExportError::ValidationBlocked(report)) => {
                    write_string(
                        &out.join("asset.report.json"),
                        &to_pretty_json(&report).map_err(|e| e.to_string())?,
                    )?;
                    Ok(2)
                }
            }
        }
    }
}
