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
