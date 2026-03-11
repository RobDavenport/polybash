# Codex Environment Notes

Recommended default environment for the first PolyBash pass:

- sandboxed task environment
- internet access: minimal
- if dependency installation is needed, use the common dependency allowlist first
- prefer GET/HEAD/OPTIONS only unless a task clearly needs more
- keep secrets out of the repo
- review the work log and diffs after each major task

Why this matters:
- PolyBash needs Rust and Node dependencies
- Codex should not have broader network access than necessary
- prompt injection risk rises quickly when agents browse untrusted content

The goal is to let Codex fetch dependencies while keeping the task environment tight.
