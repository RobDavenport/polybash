# Codex Launch Guide

## Goal

Use this guide when you want Codex to build the repo from this scaffold without wasting time on setup or architecture invention.

## Before you launch

Make sure the repo contains:
- `AGENTS.md`
- `README.md`
- `MASTER_SPEC.md`
- `docs/04-TDD-QUALITY-GATES.md`
- `docs/05-ACCEPTANCE-TEST-MATRIX.md`
- `codex/STANDALONE_PIVOT.md`
- `codex/GAP_REPORT.md`
- `codex/taskboard.yaml`
- `codex/prompts/`

## Launch sequence

1. Start with `codex/prompts/00-LAUNCH-STANDALONE.md`.
2. Let Codex bootstrap the current state and report the immediate gaps.
3. Run prompts in order:
   - `00-LAUNCH-THIS-REPO.md` only if you need the broader legacy bootstrap view
   - `01-BOOTSTRAP-AND-CONTRACTS.md`
   - `02-FIXTURES-AND-DOMAIN.md`
   - `03-VALIDATOR-AND-EXPORT.md`
   - `04-CLI.md`
   - `05-PLUGIN-SHELL.md` for the desktop shell slice
   - `06-PLUGIN-WORKFLOWS.md` for desktop workflows
   - `07-ACCEPTANCE-AND-CI.md`
   - `08-GAP-REPORT-AND-HANDOFF.md`
4. Require a structured summary after each prompt.

## Non-negotiable rules

- red / green / refactor
- no implementation-first shortcuts
- validators stay authoritative
- no silent fallbacks
- do not chase M2 before M1 is green

## Review checklist

- Did Codex add failing tests first?
- Did it keep boundaries clean?
- Did it leave acceptance evidence?
- Did it document any real gap instead of faking completion?
