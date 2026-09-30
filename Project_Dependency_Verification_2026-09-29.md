# Project Dependency Verification Report
**Date:** 2026-09-29

## 1. Agent/ Folder Behavior
**Finding:** The `Agent/` directory is **NOT** loaded or scanned by any Antigravity IDE configuration mechanism.
**Evidence:** 
- The workspace configuration file (`Changeout Pricing.code-workspace`) contains only standard default values (`"folders": [{"path": "."}]`) without any explicit inclusions/exclusions for `Agent/`. 
- No `.gemini/` or `.agents/` configurations dictate its behavior. 
- **Conclusion:** The AI responds to parsing inside `Agent/` purely because of project-imposed markdown rules (`Changeout_Rules.md`) and human instruction, not because the underlying IDE engine grants it a special namespace.

## 2. HTML/TXT Mirror Requirement
**Finding:** The `.txt` mirror limitation is a strict workspace edict imposed by project rules, binding both live and archived scopes.
**Evidence:** 
- **Rule Source:** `Agent/Changeout_Rules.md` (Lines 11-15).
  - *Line 11:* "Sync Mirror: For each live HTML file, maintain a plain-text mirror with the same base name and `.txt` extension (e.g., `index.txt`, `merge.txt`)."
  - *Line 12:* "Every time you edit a live HTML file you must generate both: a `.txt` backup... and a visual `.html` backup."
- **Scope:** Applies explicitly to frontend web app files (e.g., `index.html`, `merge.html`, `retest.html`) in both their active and archived states.

## 3. Backup & Version Automation Dependencies
**Finding:** Workspace scripts require files to remain precisely positioned relative to execution scopes.
**Evidence from Scripts:**
1. **`Agent/backup.ps1` (Lines 3-10):**
   - **Hardcoded Targets:** It explicitly defines `$source = "retest.html"` and targets specific output templates (e.g., `$archiveHtml = "retest_${version}_${timestamp}.html"`).
   - **Regex Dependency:** Checksum logic demands exactly four string matches for prior versions (Line 18: `[regex]::Matches($sourceText, 'v07\.02').Count`).
   - **Tokens:** Requires precise DOM tokens (e.g., `'dispatch-header-layout'`).
2. **`Agent/*.py` Scripts (e.g., `apply_v09_migration.py`, `inject_auth_helper.py`):**
   - **Targeting:** Written as `open('script_changeout.gs', ...)`. These scripts assume the Current Working Directory (CWD) is the Workspace Root when executing Python patch commands.
3. **Workspace Limits:** `Changeout_Rules.md` (Lines 33-37) imposes a strict cap of 4 visible backups before mandatory shifting into respective `archive_html/` and `archive_visual/` folders. Moving or renaming these `.txt/.html` streams will break the parsing limit checks.

## 4. Current Authoritative Files
**Finding:** True authoritative files are structurally bisected between the Root and `Agent/` directories.
**Evidence (`find_by_name` results):**
- **`script_changeout.gs`:** Exists exclusively at the workspace root. Python scripts inside `Agent/` target this root file by running in the parent CWD scope.
- **`retest.html`:** Exists exclusively inside the `Agent/` folder (i.e. `Agent/retest.html`). It acts as a massive iterative sub-workspace for frontend compilation, governed by `Agent/backup.ps1`.
- **`index.html`:** Exists in **both** the root and inside `Agent/`. The root is highly likely the authoritative compiled application, while the `Agent/index.html` serves as a sandbox mirror.

## 5. Reorganization Risk Map
* **Root Primary Files (`index.html`, `script_changeout.gs`)**
  - **Status:** **KEEP IN PLACE**
  - **Reason:** Hardcoded dependencies in Python scripts traversing relative paths.
* **`Agent/retest.html`**
  - **Status:** **KEEP IN PLACE** or **SAFE TO MOVE AFTER SCRIPT/RULE UPDATE**
  - **Reason:** Rooted by `Agent/backup.ps1`. Changing path breaks automated regex & hash verifications.
* **`archive_*/` directories**
  - **Status:** **KEEP IN PLACE**
  - **Reason:** Targeted by instructions in `Changeout_Rules.md` (Lines 34-37). Moving them requires updating the rule sets.
* **Transient Media (`dump_*.txt`, root `Screenshot_*.jpg`)**
  - **Status:** **SAFE TO MOVE**
  - **Reason:** Standalone diagnostic exports with no upstream caller.

## Claims from the first audit that were confirmed, disproved, or remain uncertain.
1. **Confirmed:** `Agent/` serves as an active control room loaded with patch scripts and strict Markdown rules.
2. **Disproved:** The first audit implied `retest.html` resided natively alongside other root application files. In reality, `retest.html` is trapped completely inside the `Agent/` folder.
3. **Confirmed:** Automation rules enforce dual HTML/TXT structures purely manually (via LLM rule interpretations) or by isolated scripts, not by built-in Antigravity IDE behavior.
4. **Disproved:** The implication that Antigravity treats `Agent/` as a protected environment structure. Workspace settings show no knowledge of `Agent/`. It is just a highly congested project folder that the user treats as an organizational boundary.
