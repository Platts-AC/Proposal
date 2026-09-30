# Proposal Phase 1C: Proposal Docs Folder Routing — Implementation Report

## 1. Authoritative Source
`I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\script_changeout.gs`

## 2. Starting Baseline
- **Version:** v16.48
- **MD5:** `A8D8AABE89AC9B87322F68E2A99F1E2E`
- **Rollback baseline .gs mirror:** `script_changeout_v16.48_2026_09_22_0556.gs`

## 3. Resulting Version
- **Version:** v16.49
- **MD5 (all four files):** `681AA194CCA9727E9B76CDEFA2208F5C`

## 4. Exact Function Modified
`createProposalExport(payload)` — three-line insertion resolving `docDestinationFolder` before the `makeCopy` call.

## 5. Exact Proposal Docs Folder Logic
```javascript
const docDestinationFolder = isManaged
    ? getOrCreateProposalSubfolder(destinationFolder, 'Proposal Docs')
    : destinationFolder;
const docFile = templateFile.makeCopy(baseName, docDestinationFolder);
```
`getOrCreateProposalSubfolder` (existing Phase 1A helper) searches for a direct-child folder with the exact name `Proposal Docs` inside the validated `destinationFolder`. If found, it reuses it; if absent, it creates it. No global or Drive-root folder is ever touched.

## 6. Routing Is Relative to Selected destinationFolderId
**Confirmed.** `destinationFolder` is always the Drive Folder object resolved from the user-selected `destinationFolderId`. Every Proposal Docs lookup/creation is scoped to that folder.

## 7. Exact Managed Doc Routing Change
- Before: `templateFile.makeCopy(baseName, destinationFolder)` — Doc placed directly in destination.
- After (managed): `templateFile.makeCopy(baseName, docDestinationFolder)` — Doc placed in `destinationFolder/Proposal Docs/`.
- After (legacy): Unchanged — `docDestinationFolder === destinationFolder`.

## 8. PDF Remains in Destination Root
**Confirmed.** `pdfFile = destinationFolder.createFile(pdfBlob)` was not touched. The PDF continues to land directly in the selected destination folder for both managed and legacy proposals.

## 9. Proposal Data Unchanged
**Confirmed.** The `getOrCreateProposalSubfolder(destinationFolder, 'Proposal Data')` call on line ~2074 was not modified.

## 10. Manifest Schema Unchanged
**Confirmed.** `createProposalManifest` arguments and internal body were not modified. The manifest continues to store `currentFiles.googleDocId`, `currentFiles.pdfId`, and `currentFiles.baseName` by Drive file ID.

## 11. Existing Test/Proposal Docs is Reusable
**Confirmed by logic.** `getOrCreateProposalSubfolder` searches for an existing direct-child folder first. The pre-existing `Proposal Docs` folder inside the Test destination will be found and reused; no duplicate will be created.

## 12. Future Destinations Auto-Create Proposal Docs
**Confirmed.** For any destination lacking a `Proposal Docs` child folder, `getOrCreateProposalSubfolder` will create it automatically during the first managed Create targeting that folder.

## 13. Legacy Routing Unchanged
**Confirmed.** The `isManaged` conditional ensures `docDestinationFolder === destinationFolder` for all legacy (non-builderState) payloads. No legacy behaviour was altered.

## 14. No Legacy File Migration or Cleanup Added
**Confirmed.** Zero migration, archival, or historical-file-sweep code was introduced.

## 15. Cleanup Behavior
Failure cleanup block (`docFile.setTrashed`, `pdfFile.setTrashed`, `manifestFile.setTrashed`) was not modified. Proposal Docs and Proposal Data subfolders are not trashed on failure, consistent with spec.

## 16. Locking Behavior
`LockService.getScriptLock()` block for managed Create was not modified. Legacy Create remains unlocked.

## 17. Validation Performed
Static source analysis only:
- Confirmed `isManaged` decision is resolved before `docDestinationFolder`.
- Confirmed `getOrCreateProposalSubfolder` exists and accepts `(folder, name)`.
- Confirmed `pdfFile = destinationFolder.createFile(...)` was not touched.
- Confirmed `makeCopy` now receives `docDestinationFolder`.
- Confirmed `manifestFile` arguments unchanged.
- Confirmed all v16.48 active labels replaced with v16.49 (3 locations).

## 18. Runtime Testing
**None performed.** This is a static-only validation pass.

## 19. Mirror Parity
`script_changeout.txt` re-synced from authoritative `.gs`. Hash matches.

## 20. Archival Filenames
- `script_changeout_v16.49_2026_09_29_0602.gs`
- `script_changeout_v16.49_2026_09_29_0602.txt`

## 21. Diff Filename
`script_changeout_v16.49_diff.txt`

## 22. Retest Untouched
**Confirmed.** No Retest files were modified in this phase.

## 23. Load / Update / Archive Not Implemented
**Confirmed.** No Load, Update, Archive, or state-hydration logic was introduced.
