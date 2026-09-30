# Project Structure Audit Report
**Date:** 2026-09-29

## 1. Current Project Map
The workspace under `Changeout Pricing` is a sprawling monolithic directory combining source code, massive operational backup histories, local agent instructions, diagnostics, and data exports.

### High-Level Map:
- **Root Directory:** Contains primary HTML/JS/GS files alongside numerous diagnostic `dump_*.txt` files, documentation (`*.md`), screenshots, and root-level versioned backups (e.g., `script_changeout_v...`, `analyzer_v...`).
- **`Agent/`:** A massive subfolder (nearly 900 files) containing strict AI operation rules, automation scripts (`.py`, `.ps1`), implementation reports, and an expansive graveyard of timestamped visual/text backups (`retest_v...`).
- **`archive_*/` Folders:** specialized overflow storage (`archive_5stack`, `archive_analyzer`, `archive_html`, `archive_merge`, `archive_retest`, `archive_script`, etc.). 
- **`Govee/`:** CSV data exports and sensor dashboards (`sensor_dashboard.html`).
- **`Script Docs/` & `script/`**, **`Vault*/`**: Subdirectories operating as secondary backup storage or specific staging areas for `.gs` and HTML components. 
- **Other Dirs:** `AI Studio`, `NotebookLM chats`, `Voice descriptions`.

## 2. Likely Live/Authoritative Files
- **Primary Live Frontend Files:** 
  - `index.html` (along with its `index.txt` mirror)
  - `retest.html` (a heavily iterated workspace branch)
  - `fivestack.html`, `merge.html`, `analyzer.html`, `redo.html` 
- **Primary Live Backend Files:** 
  - `script_changeout.gs` (Apps Script main logic)
  - Mirrored locally as `script_changeout.txt` and `script_changeout.html`
- **Agent Governance/Rules (inside `Agent/` directory):** 
  - `Changeout_Rules.md`, `FiveStack_Rules.md`, `Merge_Rules.md`, `Redo_Rules.md`, `Retest_Rules.md` 
- **Documentation & Specs:** 
  - `Proposal_AppsScript_Workflow_Inventory.md`, `Proposal_Phase1X_...Report.md`, `Proposal_Revision_Architecture_Spec.md`, `implementation_plan.md`

## 3. Folder-by-Folder Purpose
- **`Agent/`:** Distinctly **NOT** a standard project folder. It serves as an AI Control Room and Automation Pipeline. It contains static instruction prompts (e.g., `Changeout_Rules.md`), patching Python/PowerShell scripts (`backup.ps1`, `apply_v09_migration.py`), and serves as a dumping ground for hundreds of version-controlled `retest_vNN.NN*.html` files and `diff.txt` outputs.
- **`archive_*/` (e.g., archive_retest, archive_script, archive_html):** Long-term cold storage. Files overflow here when active visible backups hit predefined limits (usually >4 files).
- **`Govee/` & `canvas/`:** Isolated environmental sensor data analysis (CSV dumps from Govee thermometers) and dashboard visualizers (`sensor_dashboard_v*.html`).
- **`Script Docs/` & `script/` / `Vault/`:** Interstitial or secondary backup staging areas, likely used to stash verified builds (`retest_v07.30...`) so they aren't lost in the enormous `Agent` or Root directory churn.
- **`AI Studio` & `NotebookLM chats`:** Transcript or chat knowledge storage generated during brainstorming or LLM prompt sessions.

## 4. Suspected Clutter or Historical Material
The project is severely encumbered by duplicated, transient, or superseded materials:
- **Massive In-Line Versioning:** Hundreds of timestamped increments in the root and `Agent` directories (e.g., `script_changeout_v16.42_2026_09_18...`, `retest_v07.61.0...`, `analyzer_v02.22...`).
- **Dual Formats (Mirrors):** Every `.html` file is duplicated exactly as a `.txt` file (necessitated by Google Apps Script / Prompting quirks, but counts as clutter).
- **Diff & Patch artifacts:** Countless `*_diff.txt`, `patch_v...py`, `apply_repair...py`, and `results2.txt` files inside `Agent/`.
- **Dumps:** Root files like `dump1.txt`, `dump_check.txt`, `dump_legacy.txt`.
- **Screenshots:** Heavy accumulation of `Screenshot_*.jpg` files in the root. 

## 5. Existing Housekeeping & Versioning Logic
Based on the `Changeout_Rules.md` and `backup.ps1` constraints:
- **Strict Sync Mirrors:** All live `.html` files **MUST** have an exact `.txt` twin (e.g., `index.html` → `index.txt`).
- **Timestamped Increments:** Saving triggers the creation of localized clones (e.g. `retest_v07.03_[Timestamp].html` & `.txt`). Version numbering mandates major/minor integer increments (e.g., `v01.00` → `v01.01`).
- **Rolling Archival Limit:** The rules explicitly enforce a limit of (**AT MOST 4 active backups**) for `.html` and `.txt` files in the active workspace. Any older files are supposed to be moved to the respective `archive_html/`, `archive_visual/`, and `archive_script/` directories.
- **Validation Hashes:** Built-in PowerShell scripts (`backup.ps1`) require rigid compliance by scanning for specific regex occurrences (`v07.03` exactly 4 times), required DOM tokens (`dispatch-header-layout`), and executing SHA256 checksums to authorize backups.

## 6. Dependencies or Risks before Reorganizing
- **Hardcoded Automation Paths:** Python and PowerShell scripts (`apply_proposal_patch.py`, `backup.ps1`) inside the `Agent` directory reference absolute names (like `retest.html` and `retest.txt`), and target specific directories. Moving them will break continuous CI/CD-style operations.
- **Agent Blindness:** The `Agent\*_Rules.md` instruction sets strictly define where files live. Moving rules out of `Agent/` might prevent AI systems from reading instructions on fresh boot-ups.
- **Mirror Fragility:** Purging `.txt` files just because they match `.html` files will break the "Sync Mirror" architectural constraint dictated in `Changeout_Rules.md`. 
- **Regex Check Failures:** Version strings (e.g., "v08.07.1") are hard-tied across files. Reorganizing version backups without updating the internal scripts will trigger `BACKUP FAILED` exceptions from the rigid `.ps1` tools.

## 7. Suggested Cleanup Categories (NO FILES DELETED)
If a cleanup is initiated later, it should follow these categories safely:
- **Phase A: Orphaned Dumps & Media.** (Move `.jpg` screenshots, `dump_*.txt` readouts, and raw diff logs into an isolated `/logs_media` archive).
- **Phase B: Backup Consolidations.** (Commandeer all stranded `script_changeout_v*.gs`, `retest_v*.html`, and `analyzer_v*.txt` from the Root & Agent folders and push them into their respective `archive_*/` directories, honoring the 4-file limit).
- **Phase C: Script Extraction.** (Migrate non-rule python/powershell patch scripts out of `Agent/` into an `Agent/patches` or `scripts/build` subfolder to keep the primary rules visible).
- **Phase D: Reports.** (Group all `Proposal_Phase*.md` and `*validation_report.txt` files into a clean `Docs/` directory).
