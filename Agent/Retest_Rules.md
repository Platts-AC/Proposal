# Retest Frontend Rules

## Purpose
This file contains frontend-specific rules for the current Changeout Pricing interface.

For overall project workflow, Git usage, scope control, backend handling, archive policy, and validation requirements, follow `Changeout_Rules.md`.

## 1. Canonical Frontend Files
- Live frontend: `retest.html`
- Required mirror: `retest.txt`

The live filename must remain `retest.html`.

Do not create numbered, timestamped, or alternate live copies unless the user explicitly requests one.

## 2. Mirror Synchronization
Whenever `retest.html` is changed:

1. Make the requested edit in `retest.html`.
2. Overwrite `retest.txt` with the exact same code.
3. Verify both files match exactly.

Do not allow the mirror to become stale.

## 3. Version Display
If the application currently contains:
- a page title version
- a visible UI version badge
- a top-of-file descriptive change comment

keep those references synchronized when a version increment is part of the requested change.

Do not generate backup files because the version changes.

## 4. Asset Safety
The frontend may reference local assets in the same `Agent` directory, including:
- `carrier.png`
- `comfortmaker.png`
- `durastar.png`
- `platts.png`

Do not move or rename these files without verifying and updating all references.

## 5. Scope Control
Modify only what the current request requires.

Do not:
- change unrelated layout or logic
- restructure working code without approval
- restore legacy Retest backup behavior
- create `archive_retest/`
- create timestamped Retest copies
- revive retired `index`, `merge`, `redo`, or `fivestack` workflows

## 6. Validation
After a frontend edit:

1. Confirm `retest.html` contains the intended change.
2. Confirm `retest.txt` is identical.
3. Check for obvious HTML, JavaScript, or CSS errors.
4. Review Git diff for unintended edits.
5. Check Git status for unexpected files.