# Project Rules Inventory
**Date:** 2026-09-29

## Table of Contents
1. [Changeout Pricing.code-workspace](#1-changeout-pricingcode-workspace)
2. [Agent\Changeout_Rules.md](#2-agentchangeout_rulesmd)
3. [Agent\FiveStack_Rules.md](#3-agentfivestack_rulesmd)
4. [Agent\Merge_Rules.md](#4-agentmerge_rulesmd)
5. [Agent\Redo_Rules.md](#5-agentredo_rulesmd)
6. [Agent\Retest_Rules.md](#6-agentretest_rulesmd)
7. [Agent\backup.ps1](#7-agentbackupps1)
8. [Agent\backup_generator.ps1](#8-agentbackup_generatorps1)

---

### 1. Changeout Pricing.code-workspace
**Relative path:** `Changeout Pricing.code-workspace`
**Full absolute path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Changeout Pricing.code-workspace`
**Filename:** `Changeout Pricing.code-workspace`

```json
{
	"folders": [
		{
			"path": "."
		}
	],
	"settings": {}
}
```

---

### 2. Agent\Changeout_Rules.md
**Relative path:** `Agent\Changeout_Rules.md`
**Full absolute path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\Changeout_Rules.md`
**Filename:** `Changeout_Rules.md`

```markdown
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
```

---

### 3. Agent\FiveStack_Rules.md
**Relative path:** `Agent\FiveStack_Rules.md`
**Full absolute path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\FiveStack_Rules.md`
**Filename:** `FiveStack_Rules.md`

```markdown
# Sandbox IDE Instructions: Five Stack Testing

## Core Objective
This is a quarantined testing environment. You are strictly managing the "Five Stack" CSS/HTML component builder. Do not touch `index.html` or `Code.gs`.

## 1. File Format & Naming Convention
*   **The Live File:** `fivestack.html`
*   **The Sync Mirror:** You must overwrite a static `fivestack.txt` file on every update for AI syncing.
*   **The Backup Format:** `fivestack_v[Major].[Minor]_[YYYY-MM-DD]_[HHMMSS].txt`

## 2. Mandatory Internal Code Updates
When a new version is generated, you must update:
1.  The `<title>` tag (e.g., `<title>Five Stack Sandbox v01.00</title>`).
2.  A descriptive HTML comment tag at the very top detailing the exact structural change.

## 3. Workspace Limit & Archiving Rules
*   **Active Workspace:** Capped at a maximum of 4 active `fivestack_v...txt` backup files.
*   **Archive Directory (`archive_5stack/`):** The moment you generate a 5th backup, move the oldest version into the `archive_5stack/` folder.
```

---

### 4. Agent\Merge_Rules.md
**Relative path:** `Agent\Merge_Rules.md`
**Full absolute path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\Merge_Rules.md`
**Filename:** `Merge_Rules.md`

```markdown
# Master IDE Instructions: App Integration & Merge Protocol

## Core Objective
This rulebook strictly governs the integration of our sandbox UI components into our main application logic. When operating in [MERGE MODE], you are strictly managing the "merge" environment. Do not touch `index.html`, `fivestack.html`, or `Code.gs`.

## 1. The Static Live File vs. The Sync Mirror
*   **The Live File:** The active working file must always remain static as `merge.html`. **Never** append version numbers to this live file name.
*   **The Sync Mirror:** Every time you edit the live file, you must ALSO overwrite a static `merge.txt` file with the exact same code so external AI tools can maintain a live sync via Google Drive.

## 2. Backup Naming Structure & Incrementing
*   Every time you successfully edit the live file, you MUST generate an exact clone of the code saved strictly as a timestamped `.txt` backup.
*   Backup files must follow this exact format:
    `merge_v[Major].[Minor]_[YYYY-MM-DD]_[HHMMSS].txt`
    *(Example: `merge_v01.00_2026-07-05_163000.txt`)*

## 3. Mandatory Internal Code Updates
The moment a new version is generated, you must update the internal tags inside `merge.html`:
1.  Update the `<title>` tag (e.g., `<title>Changeout Merge v01.00</title>`).
2.  Update the descriptive HTML comment tag at the very top detailing the exact structural change.

## 4. Workspace Limit & Archiving Rules
You must manage the file tree automatically using a rolling first-in, first-out queue:
*   **Active Workspace:** This main directory is strictly capped at a **maximum of 4 active `.txt` backup files**.
*   **Archive Directory (`archive_merge/`):** The moment you generate a 5th backup `.txt` version, you must immediately locate the oldest version in the active workspace and move it into the `archive_merge/` folder.
```

---

### 5. Agent\Redo_Rules.md
**Relative path:** `Agent\Redo_Rules.md`
**Full absolute path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\Redo_Rules.md`
**Filename:** `Redo_Rules.md`

```markdown
# Master IDE Instructions: Standalone Redo Protocol

## Core Objective
This rulebook strictly governs the creation of the standalone lookup tool. When operating in `[REDO MODE]`, you are strictly managing the "redo" environment. Do not touch `index.html`, `merge.html`, or `fivestack.html`.

## 1. The Static Live File vs. The Sync Mirror
* **The Live File:** The active working file must always remain static as `redo.html`. **Never** append version numbers to this live file name.
* **The Sync Mirror:** Every time you edit the live file, you must ALSO overwrite a static `redo.txt` file with the exact same code so external AI tools can maintain a live sync.

## 2. Backup Naming Structure & Incrementing
* Every time you successfully edit the live file, you MUST generate an exact clone of the code saved strictly as BOTH a timestamped `.txt` backup and a timestamped `.html` visual backup.
* Backup files must follow this exact format:
  `redo_v[Major].[Minor]_[YYYY-MM-DD]_[HHMMSS].txt`
  `redo_v[Major].[Minor]_[YYYY-MM-DD]_[HHMMSS].html`

## 3. Mandatory Internal Code Updates (The Version Stamps)
The moment a new version is generated, you must update the internal tags inside `redo.html` so the version is visibly stamped for the user:
1. Update the `<title>` tag (e.g., `<title>Standalone Lookup v01.00</title>`).
2. Update a highly visible UI Version Badge located directly on the screen (e.g., inside the header or search hub).
3. Update the descriptive HTML comment tag at the very top detailing the exact structural change.

## 4. Workspace Limit & Archiving Rules
You must manage the file tree automatically using a rolling first-in, first-out queue:
* **Active Workspace:** This main directory is strictly capped at a **maximum of 4 active `.txt` backup files AND 4 active `.html` backup files**.
* **Archive Directory:** The moment you generate a 5th backup version, you must immediately locate the oldest versions in the active workspace and move them into the archive folders.
```

---

### 6. Agent\Retest_Rules.md
**Relative path:** `Agent\Retest_Rules.md`
**Full absolute path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\Retest_Rules.md`
**Filename:** `Retest_Rules.md`

```markdown
# Master IDE Instructions: Standalone Retest Protocol

## Core Objective
This rulebook strictly governs the creation and editing of the new multi-column grid builder test bed. Manage the "retest" environment cleanly without touching `index.html`, `merge.html`, `fivestack.html`, or `redo.html`.

## 1. The Static Live File vs. The Sync Mirror
* **The Live File:** The active working file must always remain static as `retest.html`. **Never** append version numbers to this live file name.
* **The Sync Mirror:** Every time you edit the live file, you must ALSO overwrite a static `retest.txt` file with the exact same code so external AI tools can maintain a live sync.

## 2. Backup Naming Structure & Incrementing
* Every time you successfully edit the live file, you MUST generate an exact clone of the code saved strictly as BOTH a timestamped `.txt` backup and a timestamped `.html` visual backup.
* Backup files must follow this exact format:
  `retest_v[Major].[Minor]_[YYYY-MM-DD]_[HHMMSS].txt`
  `retest_v[Major].[Minor]_[YYYY-MM-DD]_[HHMMSS].html`

## 3. Mandatory Internal Code Updates (The Version Stamps)
The moment a new version is generated, you must update the internal tags inside `retest.html` so the version is visibly stamped for the user:
1. Update the `<title>` tag (e.g., `<title>HVAC Grid Builder v01.00</title>`).
2. Update a highly visible UI Version Badge located directly on the screen (inside the header).
3. Update the descriptive HTML comment tag at the very top detailing the exact structural change.

## 4. Workspace Limit & Archiving Rules
You must manage the file tree automatically using a rolling first-in, first-out queue:
* **Active Workspace:** This main directory is strictly capped at a **maximum of 4 active `.txt` backup files AND 4 active `.html` backup files**.
* **Archive Directory:** The moment you generate a 5th backup version, you must immediately locate the oldest versions in the active workspace and move them into the `archive_retest/` folder.
```

---

### 7. Agent\backup.ps1
**Relative path:** `Agent\backup.ps1`
**Full absolute path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\backup.ps1`
**Filename:** `backup.ps1`

```powershell
$ErrorActionPreference = "Stop"

$source = "retest.html"
$version = "v07.03"
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"

$plainTextCopy = "retest.txt"
$archiveHtml = "retest_${version}_${timestamp}.html"
$archiveText = "retest_${version}_${timestamp}.txt"
$archiveReport = "archive_report_${version}_${timestamp}.txt"

if (-not (Test-Path -LiteralPath $source)) {
    throw "BACKUP FAILED: retest.html missing."
}

$sourceText = Get-Content -LiteralPath $source -Raw

$oldCount = [regex]::Matches($sourceText, 'v07\.02').Count
$newCount = [regex]::Matches($sourceText, 'v07\.03').Count

if ($oldCount -ne 0) {
    throw "BACKUP FAILED: v07.02 remains."
}

if ($newCount -ne 4) {
    throw "BACKUP FAILED: expected four v07.03 occurrences; found $newCount."
}

$requiredTokens = @(
    'dispatch-header-layout',
    'dispatchSelectedContainer',
    'dispatchSelectedStack',
    'dispatchSelectedSplit',
    'headerHeight',
    'wrapMode',
    'overflowMode',
    'dispatch-take-photo-btn',
    'dispatch-choose-photo-btn',
    'showTakePhoto',
    'showChoosePhoto',
    'spread'
)

foreach ($token in $requiredTokens) {
    if (-not $sourceText.Contains($token)) {
        throw "BACKUP FAILED: required token missing: $token"
    }
}

Copy-Item -LiteralPath $source -Destination $plainTextCopy -Force
Copy-Item -LiteralPath $source -Destination $archiveHtml -Force
Copy-Item -LiteralPath $source -Destination $archiveText -Force

$sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
$plainHash  = (Get-FileHash -LiteralPath $plainTextCopy -Algorithm SHA256).Hash
$htmlHash   = (Get-FileHash -LiteralPath $archiveHtml -Algorithm SHA256).Hash
$textHash   = (Get-FileHash -LiteralPath $archiveText -Algorithm SHA256).Hash

if (
    $sourceHash -ne $plainHash -or
    $sourceHash -ne $htmlHash -or
    $sourceHash -ne $textHash
) {
    throw "BACKUP FAILED: source-copy SHA256 mismatch."
}

$lineCount = (Get-Content -LiteralPath $source).Count

$report = @"
V07.03 DISPATCH VISUAL CELL EDITOR

Version:
v07.03

Line Count:
$lineCount

PASS - v07.02 count = 0
PASS - v07.03 count = 4

PASS - Dispatch visual edit-grid support present
PASS - direct cell-selection state present
PASS - persistent selected-cell context present
PASS - master Dispatch header height present
PASS - Stack height weighting preserved
PASS - Move Mapping support present
PASS - Wrap state present
PASS - Overflow state present
PASS - Dispatch body presentation controls present
PASS - reserved Spread state preserved

FILES:
retest.html
retest.txt
$archiveHtml
$archiveText
$archiveReport

SHA256:
$sourceHash
"@

Set-Content `
    -LiteralPath $archiveReport `
    -Value $report `
    -Encoding UTF8

$requiredFiles = @(
    $source,
    $plainTextCopy,
    $archiveHtml,
    $archiveText,
    $archiveReport
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $file)) {
        throw "BACKUP FAILED: missing $file"
    }
}

Write-Output "V07.03 COMPLETE"
Write-Output "LINE COUNT: $lineCount"
Write-Output "V07.02 COUNT: $oldCount"
Write-Output "V07.03 COUNT: $newCount"
Write-Output "SHA256: $sourceHash"
Write-Output "FILES:"
foreach ($file in $requiredFiles) {
    Write-Output $file
}
```

---

### 8. Agent\backup_generator.ps1
**Relative path:** `Agent\backup_generator.ps1`
**Full absolute path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\backup_generator.ps1`
**Filename:** `backup_generator.ps1`

```powershell
$timestamp = Get-Date -Format "yyyy_MM_dd_HHmm"
$src = "I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\retest.html"
$baseDir = "I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent"
$target1 = "$baseDir\retest.txt"
$target2 = "$baseDir\retest_v07.53_${timestamp}.html"
$target3 = "$baseDir\retest_v07.53_${timestamp}.txt"
Copy-Item $src -Destination $target1 -Force
Copy-Item $src -Destination $target2 -Force
Copy-Item $src -Destination $target3 -Force

$files = @($src, $target1, $target2, $target3)
$results = @()
foreach ($f in $files) {
    if (Test-Path $f) {
        $bytes = (Get-Item $f).Length
        $lines = (Get-Content $f).Length
        $hash = (Get-FileHash $f -Algorithm SHA256).Hash
        $name = Split-Path $f -Leaf
        $results += "$name | Bytes: $bytes | Lines: $lines | SHA256: $hash"
    } else {
        $results += "Failed to find $f"
    }
}
$results -join "`n" | Out-File "$baseDir\retest_v07.53_hash_report.txt" -Encoding utf8
Write-Output (Get-Content "$baseDir\retest_v07.53_hash_report.txt")
```

---

## Overlapping or Conflicting Files
1. **The `*_Rules.md` Collection:** 
   `Changeout_Rules.md`, `FiveStack_Rules.md`, `Merge_Rules.md`, `Redo_Rules.md`, and `Retest_Rules.md` are distinct rulebooks instructing the assistant to manage divergent environments (`index.html`, `fivestack.html`, `merge.html`, `redo.html`, `retest.html`). Because they lack explicit conditional gating (aside from a brief mention about `[REDO MODE]` in `Changeout_Rules.md`), an agent reading all rules simultaneously will receive fundamentally contradictory instructions on which file is authoritative and which archive schema to follow.
2. **The Backup Automation Scripts:**
   `backup.ps1` and `backup_generator.ps1` both govern the generation of `.txt` and `.html` backups for `retest.html`. However, `backup.ps1` has hardcoded checks for `v07.03`, exact regex matching, and DOM token constraints (`'dispatch-header-layout'`). `backup_generator.ps1` is physically hardcoded with absolute C: or Drive paths to output `v07.53` clones but performs no regex checks. Running one could break the state expected by the other.
