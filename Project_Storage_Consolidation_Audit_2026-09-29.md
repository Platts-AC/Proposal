# Project Storage Consolidation Audit
**Date:** 2026-09-29

## 1. Directory Breakdown & Analysis

### A. Root Archive Folders 
`I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\archive_*`
**Contains:** `archive_5stack`, `archive_analyzer`, `archive_html`, `archive_merge`, `archive_redo`, `archive_retest`, `archive_script`.
**Project/Component:** Specific to their named historical branches (five stack styling, analyzer logic, base HTML UI, merge architecture, etc.).
**Classification:** HISTORICAL.
**Notes:** `archive_html` contains the earliest pre-retest frontend versions `index_v01-v04`. `archive_script` contains backend `script_changeout_v12-v16`. 

### B. Agent/ Archive Folders
`I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\archive_*`
**Contains:** `archive_analyzer`, `archive_failed`, `archive_html`, `archive_visual`.
**Project/Component:** Agent automation overflows.
**Classification:** HISTORICAL / TOOL LOGS.
**Notes:** `Agent/archive_html` contains `retest_v03-v06`. Wait, this overlaps with Root's `archive_retest`! This was likely caused by AI patching scripts dumping into the wrong path when rule limits were hit.

### C. Vault/
`I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Vault\`
**Contains:** `Vault_Index`, `Vault_Script`, `retest_v07.30`/`v07.31` `.html` files.
**Project/Component:** Staging ground for presumed stable frontend versions and specific script snippets.
**Classification:** HISTORICAL / MIRROR.
**Notes:** Duplicates active workspace histories.

### D. Script Docs/
`I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Script Docs\`
**Contains:** `html/`, `script/`, `retest_v07.30`/`v07.31` `.txt` files.
**Project/Component:** Text-based mirror components to the Vault.
**Classification:** HISTORICAL / MIRROR.

### E. script/
`I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\script\`
**Contains:** `script_v01.00 - v11.03` `.txt` files.
**Project/Component:** Very early chronological backend logic drafts prior to the `script_changeout` renaming phase.
**Classification:** HISTORICAL.

## 2. Duplicate & Overlapping Storage Locations
- **Overlapping Archive Rules:** There are `archive_html` folders in both Root and `Agent/`. Root contains `index_v...` files, `Agent/archive_html` contains `retest_v...txt` files (despite `Retest_Rules.md` dictating use of `archive_retest`).
- **Partitioned Twin Storage:** The Vault acts as `.html` storage while Script Docs acts as `.txt` storage for the exact same versions (e.g., `retest_v07.30_2026_08_29_0935`).

## 3. Potential Duplicate Files That Could Be De-duplicated Later
1. `Vault\retest_v07.30_2026_08_29_0935.html` vs `Agent\retest_v07.30_...html`
2. `Script Docs\retest_v07.30_2026_08_29_0935.txt` vs `Agent\retest_v07.30_...txt`
3. `Agent\index.html` (241024 bytes) vs Root `index.html` (110446 bytes) — Not direct duplicates, but conflicting live states.
4. Redundant identical `.html` and `.txt` visual clones sitting in all nested folders that could theoretically be merged into single files or a source-control repository.

---

## 4. Proposed Consolidation Map

**Keep Active**
- `I:\...\script_changeout.gs` -> `I:\...\script_changeout.gs`
- `I:\...\script_changeout.txt` -> `I:\...\script_changeout.txt`
- `I:\...\Agent\retest.html` -> `I:\...\Agent\retest.html`
- `I:\...\Agent\retest.txt` -> `I:\...\Agent\retest.txt`
- `I:\...\Agent\*_Rules.md` -> `I:\...\Agent\*_Rules.md`

**Historical Frontend**
- `I:\...\archive_html\*` -> `I:\...\archive\frontend\legacy_index\`
- `I:\...\Agent\archive_html\*` -> `I:\...\archive\frontend\retest\`
- `I:\...\archive_retest\*` -> `I:\...\archive\frontend\retest\`
- `I:\...\Vault\retest_*` -> `I:\...\archive\frontend\retest\`
- `I:\...\Script Docs\retest_*` -> `I:\...\archive\frontend\retest\`

**Historical Backend**
- `I:\...\script\*` -> `I:\...\archive\backend\script_legacy\`
- `I:\...\archive_script\*` -> `I:\...\archive\backend\script_changeout\`
- `I:\...\Vault\Vault_Script\*` -> `I:\...\archive\backend\vault\`
- `I:\...\Script Docs\script\*` -> `I:\...\archive\backend\script_changeout\`

**Legacy Experiments**
- `I:\...\fivestack.html`, `merge.html`, `redo.html`, `analyzer.html` -> `I:\...\archive\legacy_projects\`
- `I:\...\archive_5stack\*` -> `I:\...\archive\legacy_projects\5stack\`
- `I:\...\archive_merge\*` -> `I:\...\archive\legacy_projects\merge\`
- `I:\...\archive_redo\*` -> `I:\...\archive\legacy_projects\redo\`
- `I:\...\archive_analyzer\*` -> `I:\...\archive\legacy_projects\analyzer\`
- `I:\...\Agent\archive_analyzer\*` -> `I:\...\archive\legacy_projects\analyzer\`

**Legacy Automation / Patch Scripts**
- `I:\...\Agent\apply_*.py` -> `I:\...\Agent\scripts\patching\`
- `I:\...\Agent\patch_*.py` -> `I:\...\Agent\scripts\patching\`
- `I:\...\Agent\backup*.ps1` -> `I:\...\Agent\scripts\automation\`

**Documentation / Reports**
- `I:\...\Proposal_*.md` -> `I:\...\Docs\specs\`
- `I:\...\Agent\*implementation_plan.md` -> `I:\...\Docs\implementation_plans\`
- `I:\...\Agent\*_report.txt` -> `I:\...\Docs\reports\`

**Media / Screenshots**
- `I:\...\Screenshot_*.jpg` -> `I:\...\Media\Screenshots\`
- `I:\...\*.png` (durastar/carrier/etc) -> `I:\...\Media\Logos\`

**Logs / Diagnostics**
- `I:\...\dump*.txt` -> `I:\...\Logs\dumps\`
- `I:\...\Agent\archive_failed\*` -> `I:\...\Logs\failed_validation\`
