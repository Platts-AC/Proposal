*NOTE: If the user prompt begins with "[REDO MODE]", immediately ignore this document and strictly follow Redo_Rules.md.*
*NOTE: If the user prompt begins with "[TEST MODE]", immediately ignore this document and strictly follow FiveStack_Rules.md.*

# Master IDE Instructions: Changeout Web App Version Control & Archiving

## Core Objective
You are responsible for managing the version control, file formatting, and archiving of both frontend (HTML/JS) and backend (Google Apps Script / .gs) files in this workspace. You must maintain static live files for functionality, while generating strict, timestamped backups.

## 1. File Formats & Naming
- **Live Files:** The active working files must always remain static (e.g., `index.html`, `merge.html`, `Code.gs`). Never append version numbers to these live file names.
- **Sync Mirror:** For each live HTML file, maintain a plain‑text mirror with the same base name and `.txt` extension (e.g., `index.txt`, `merge.txt`). This mirror is overwritten on every edit.
- **Timestamped Backups:** Every time you edit a live HTML file you must generate **both**:
  - a `.txt` backup: `index_vXX.XX_[Timestamp].txt`
  - a visual `.html` backup: `index_vXX.XX_[Timestamp].html`
  The same rule applies to other frontend files (`merge_v...` etc.). Backend `.gs` files continue to use only `.txt` backups.

## 2. Version Incrementing Rules
- **Minor Updates:** Increment the decimal (e.g., `v01.00` → `v01.01`) for small UI tweaks, bug fixes, or CSS adjustments.
- **Major Updates:** Increment the major number and reset decimal to zero (e.g., `v01.05` → `v02.00`) for large logic overhauls or new page features.

## 3. Mandatory Internal Code Updates (Split by File Type)

**IF EDITING HTML FILES:**
1. Update the `<title>` tag (e.g., `<title>Changeout Lookup v01.01</title>`).
2. Update the version `<span class="text-[8px] font-normal">vX.XX</span>` located on the active button in the bottom navigation ribbon.
3. Update the descriptive comment tag at the very top detailing the exact structural change.

**IF EDITING APPS SCRIPT (.gs) FILES:**
1. Update the version number inside the primary execution `console.log` message.
2. Update the version number in the master comment block at the very top of the script.

## 4. Workspace Limits & Archiving Rules
- **Active Workspace:** Must contain **at most 4 active `.txt` backup files** **and** **4 active `.html` backup files** for each frontend component.
- **Archive Directories:** When a 5th backup of a given type is generated, move the oldest backup of that type into the appropriate archive folder:
  - Frontend text backups → `archive_html/`
  - Frontend visual HTML backups → `archive_visual/`
  - Backend script backups → `archive_script/`

## 5. Standard Edit Flow
When instructed to edit or update code:
1. Apply the requested edits directly to the live static file (`index.html`, `merge.html`, or `Code.gs`).
2. Update the internal version numbers inside the code per Section 3.
3. Create the `.txt` clone with the incremented version number and exact current timestamp.
4. Create the visual `.html` clone with the same version and timestamp.
5. Overwrite the sync mirror (`index.txt` or `merge.txt`).
6. Execute the archiving rule if the workspace limit of 4 active backups (per type) is exceeded.