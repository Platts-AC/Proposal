# Project Reorganization Dependency Check
**Date:** 2026-09-29

## Overview
This report maps dependencies found via a regex sweep over the authoritative live files (`Agent/retest.html`, `script_changeout.gs`), existing `*_Rules.md` files, and automation scripts (`*.py`, `*.ps1`). 

### Dependency Scan Results

**1. PNG/Image Files relative to `retest.html`**
- **REFERENCING FILE:** `Agent/retest.html`
- **REFERENCE FOUND:** Explicit DOM strings referencing `./platts.png`, `./carrier.png`, `./comfortmaker.png`, `./durastar.png` globally (Lines 471, 1400, 11701, 15360, 23734, etc.).
- **CURRENT TARGET:** The script expects images in the same directory as the `.html` file (`./`), despite images physically residing in the workspace root.
- **WHAT WOULD BREAK IF TARGET MOVED:** If PNGs move to a dedicated `Media/` folder, the broken paths will persist (or break deployed apps).
- **REQUIRED UPDATE:** Search and replace `./image.png` with `../Media/Logos/image.png` inside `retest.html` and any deployment workflow.

**2. `archive_*` Folders**
- **REFERENCING FILE:** All `Agent/*_Rules.md` text instructions (e.g., `Changeout_Rules.md`, `Merge_Rules.md`).
- **REFERENCE FOUND:** Static directives like `move the oldest backup of that type into the appropriate archive folder: archive_html/`.
- **CURRENT TARGET:** Relative sub-directories depending on AI interpretation (either the Root or `Agent/`).
- **WHAT WOULD BREAK IF TARGET MOVED:** AI agents following instructions will create new standalone `archive_html/` directories upon backup capacity overrides instead of sorting into a renamed consolidated location like `archive/frontend/`.
- **REQUIRED UPDATE:** Rule markdown files must be updated to target the new consolidated directory paths (e.g. `archive/frontend/legacy_index/`).

**3. `retest` target inside Backup Scripts**
- **REFERENCING FILE:** `Agent/backup.ps1` and `Agent/backup_generator.ps1`.
- **REFERENCE FOUND:** `$source = "retest.html"` / `$src = "I:\...\Agent\retest.html"`.
- **CURRENT TARGET:** The static `retest.html` file explicitly inside `Agent/`.
- **WHAT WOULD BREAK IF TARGET MOVED:** Powershell scripts will throw `BACKUP FAILED: retest.html missing`.
- **REQUIRED UPDATE:** PowerShell scripts must be rewritten to point to the new location if `retest.html` is ever moved.

**4. `Vault/` and `Script Docs/`**
- **REFERENCING SCANS:** None found inside core authoritative files.
- **NOTE:** `retest.html` contains 11+ UI references to a feature named `"Layout Vault"` (e.g., `<h3 ...>Layout Vault</h3>`, `exportLayoutVault()`, `Vault 0 KB`), which handles local JSON backup caching. This is merely a naming coincidence and does not reference the physical `Vault/` directory on disk.

**5. `script_changeout.gs` Context**
- **REFERENCING FILE:** Python patch/deploy scripts inside `Agent/` (e.g., `apply_v09_migration.py`, `add_package_extractor.py`).
- **REFERENCE FOUND:** Hardcoded read writes: `open('script_changeout.gs', 'w')` coupled with `shutil.copy`.
- **CURRENT TARGET:** Implicit relative execution. The scripts depend entirely upon being called with the current-working-directory (CWD) pointing at the Workspace Root.
- **WHAT WOULD BREAK IF TARGET MOVED:** Changing the backend `.gs` location breaks Python deployment tools.
- **REQUIRED UPDATE:** Python patch workflows require a variable refactor specifying absolute targeting or explicit path logic.

---

## Final Classification Map

**SAFE TO MOVE AS-IS**
- `Media / Screenshots`
- `Logs / Diagnostics` (Dumps and transient log texts)
- `Vault/`, `Script Docs/`, and early `script/` history folders (No live execution depends on their preservation relative locations).

**MOVE ONLY WITH REFERENCE UPDATE**
- `archive_*` Legacy Folders (Will break `*_Rules.md` agent routing).
- `*.png / *.jpg` Brand Imagery (Requires inline `<img src="">` modifications in `retest.html`).
- `Agent/*.ps1 / Agent/*.py` (Hardcoded to expect certain locations for source files). 

**KEEP IN PLACE FOR NOW**
- `Agent/retest.html` and `retest.txt`
- Root `script_changeout.gs` and its txt/html twins.
- `Agent/*_Rules.md` (Governing active workspace constraints).
