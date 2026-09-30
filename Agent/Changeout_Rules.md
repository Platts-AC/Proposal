# Master IDE Instructions: Changeout Pricing Project

## Core Objective
Maintain the current Changeout Pricing application safely and predictably. Make only requested changes, preserve the existing working structure unless explicitly instructed otherwise, and use Git for version history instead of creating timestamped backup copies.

## 1. Canonical Live Files

### Frontend
- Canonical live frontend: `Agent/retest.html`
- Required plain-text mirror: `Agent/retest.txt`

### Backend
- Canonical live backend: `script_changeout.gs`
- Required plain-text mirror: `script_changeout.txt`

These filenames are static and must not be renamed or version-numbered.

Do not create alternate live files such as `index.html`, `merge.html`, `redo.html`, `fivestack.html`, or additional numbered copies unless the user explicitly requests one.

## 2. Mirror Requirements
Whenever `Agent/retest.html` is changed:
1. Apply the requested edit to `Agent/retest.html`.
2. Overwrite `Agent/retest.txt` so it contains the exact same code.
3. Verify that the HTML and TXT files match.

Whenever `script_changeout.gs` is changed:
1. Apply the requested edit to `script_changeout.gs`.
2. Overwrite `script_changeout.txt` so it contains the exact same code.
3. Verify that the GS and TXT files match.

The TXT mirrors exist so external AI tools can inspect the same current source without requiring conversion.

## 3. Git Is the Version History
Git is the authoritative version-history system for current development.

Do not automatically create:
- timestamped HTML backups
- timestamped TXT backups
- numbered backup files
- rolling backup queues
- new `archive_*` folders
- duplicate version-history copies

Historical material belongs under `Archive/`, which is intentionally excluded from Git.

Before or after substantial changes, use Git status and diff to verify exactly what changed. Do not commit unrelated changes together unless explicitly requested.

## 4. Internal Version Numbers
The application may continue to display internal version numbers for user-facing identification.

When a requested change warrants a version increment:
- update the existing version indicator in the affected live file
- update any existing matching version reference or top-of-file change comment that is part of the current application

Do not create backup files merely because a version number changes.

Do not invent a version increase when the user has not requested one unless the existing project workflow clearly requires it for that specific change.

## 5. Scope Control
Make only the changes required by the current request.

Do not:
- rewrite unrelated sections
- reorganize unrelated code
- rename files or folders without instruction
- remove functionality because it appears unused
- replace working logic with a different architecture without approval
- modify archived or reference material unless specifically requested

If a requested change requires touching additional files, identify those files before changing them.

## 6. File and Dependency Safety
Preserve existing relative paths and runtime dependencies.

Current frontend assets may include files located beside `Agent/retest.html`, including:
- `carrier.png`
- `comfortmaker.png`
- `durastar.png`
- `platts.png`

Do not move or rename runtime assets without also verifying and updating every reference.

Do not assume old files under `Archive/` or `Reference/` are active dependencies.

## 7. Validation After Changes
After editing frontend or backend code:

1. Verify the canonical file was changed.
2. Verify its TXT mirror matches exactly.
3. Check for syntax or structural errors appropriate to the file type.
4. Review Git diff to confirm only intended changes occurred.
5. Check Git status for unexpected modified or untracked files.
6. Report what was changed and any validation performed.

Do not claim validation that was not actually performed.

## 8. Historical Material
The following are historical/reference areas and are not part of the current live application unless the user explicitly says otherwise:
- `Archive/`
- `Reference/`

Do not recreate retired project structures, legacy mode files, timestamped backup systems, or old archive folders merely because historical documents mention them.

## 9. Current Project Priority
Unless explicitly instructed otherwise, treat these as the current authoritative application files:

1. `Agent/retest.html`
2. `Agent/retest.txt`
3. `script_changeout.gs`
4. `script_changeout.txt`

When instructions from an older file conflict with this rulebook, follow this rulebook and the current user request.

## 10. Local Development and GitHub Deployment
- Local files are the active development workspace.
- Test Agent/retest.html locally in the browser before publishing.
- Local Git commits are development checkpoints and do not automatically imply deployment.
- GitHub is a separate deployment target for tested/stable versions.
- Do not automatically merge origin/main into local main.
- Do not automatically push local main to GitHub.
- Publish to GitHub only when the user explicitly requests deployment of a tested version.
- Existing GitHub history should be preserved unless the user explicitly requests restructuring.