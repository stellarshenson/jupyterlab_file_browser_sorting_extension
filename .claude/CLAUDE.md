<!-- @import /home/lab/workspace/.claude/CLAUDE.md -->

# Project-Specific Configuration

This file imports workspace-level configuration from `/home/lab/workspace/.claude/CLAUDE.md`.
All workspace rules apply. Project-specific rules below strengthen or extend them.

The workspace `/home/lab/workspace/.claude/` directory contains additional instruction files
(MERMAID.md, NOTEBOOK.md, DATASCIENCE.md, GIT.md, and others) referenced by CLAUDE.md.
Consult workspace CLAUDE.md and the .claude directory to discover all applicable standards.

## Mandatory Bans (Reinforced)

The following workspace rules are STRICTLY ENFORCED for this project:

- **No automatic git tags** - only create tags when user explicitly requests
- **No automatic version changes** - only modify version in package.json/pyproject.toml/etc. when user explicitly requests
- **No automatic publishing** - never run `make publish`, `npm publish`, `twine upload`, or similar without explicit user request
- **No manual package installs if Makefile exists** - use `make install` or equivalent Makefile targets, not direct `pip install`/`uv install`/`npm install`
- **No automatic git commits or pushes** - only when user explicitly requests

## Project Context

JupyterLab extension implementing LC_COLLATE=C (ASCIIbetical) sorting for the file browser, with a context-menu toggle to switch Unix-style sorting on or off.

**Technology Stack**:

- TypeScript for frontend extension code
- JupyterLab 4.x extension API
- Python packaging with `pyproject.toml` and `hatch`

**Package Names**:

- npm: `jupyterlab_file_browser_sorting_extension`
- PyPI: `jupyterlab-file-browser-sorting-extension`
- GitHub: `stellarshenson/jupyterlab_file_browser_sorting_extension`

**Build and Install**:

- Always use `make install` to build and install the extension
- Always commit both `package.json` and `package-lock.json` together

## Journal Rules (Project-Specific)

- **APPEND ONLY**: New journal entries MUST be appended at the end of the file, never inserted between existing entries
- Entries maintain strict chronological order by position - the last entry in the file is always the most recent work
- Never reorder, move, or insert entries out of sequence
- The Stellars **journal plugin** is the canonical tool for this file: create via `/journal:create`, append via `/journal:update`, archive via `/journal:archive`. The `journal:journal` skill auto-triggers on any mention of "journal" and runs `journal-tools check` after every write
- Direct edits to `JOURNAL.md` are a last resort - prefer the plugin so modus secundis format, continuous numbering and append-only order are enforced automatically

## Strengthened Rules

This is a published npm + PyPI package, so the release-related bans are the highest risk and are emphasized here:

- **`make install` only** - never run `jlpm install`/`jlpm build`/`pip install` directly while a Makefile target exists
- **No version bumps or releases without an explicit request** - releases go through the GitHub Actions release workflow on explicit instruction only
- **Keep the lockfile in sync** - commit `package.json` and `package-lock.json` together on every dependency change
