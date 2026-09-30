# Proposal Phase 1D: Backend Load Foundation — Implementation Report

## 1. Authoritative Source
`I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\script_changeout.gs`

## 2. Starting Baseline
- **Version:** v16.49
- **MD5:** `681AA194CCA9727E9B76CDEFA2208F5C`

## 3. Resulting Version
- **Version:** v16.50
- **MD5 (all four files):** `C32401A9B71E94CC2089B5EADA01BC67`

## 4. Functions Added / Modified
| Function | Change |
|---|---|
| `doPost` | Added `getProposalState` routing branch |
| `getProposalSubfolderIfExists` | **NEW** — read-only folder lookup helper |
| `getProposalState` | **NEW** — full load implementation |

No existing functions were modified beyond the doPost route addition.

## 5. doPost Routing Change
```javascript
if (action === 'getProposalState') {
    return jsonResponse(getProposalState(payload));
}
```
Added immediately after the `createProposalExport` branch. Existing routing untouched.

## 6. proposalId Validation Rule
Format: `^PROP-\d{6}-[0-9A-F]{6}$`  
Missing or malformed input throws immediately before any Drive access.

## 7. Destination Validation
Delegates to existing `validateProposalDestinationFolder(destinationFolderId)` — verifies supplied folder is a valid direct child of `PROPOSAL_ROOT_FOLDER_ID`. Unchanged from production behavior.

## 8. Read-Only Proposal Data Lookup
Uses new `getProposalSubfolderIfExists(destinationFolder, 'Proposal Data')`. Returns `null` if folder absent — **never creates it**. Duplicate same-name subfolder detection throws immediately.

## 9. Exact Manifest Filename Rule
```
<proposalId>_manifest.json
```
Example: `PROP-260929-7F0BE2_manifest.json`. Searched via `dataFolder.getFilesByName(manifestFileName)`. No fuzzy matching; no filename inference.

## 10. Duplicate Manifest Behavior
If `getFilesByName` returns more than one result: throws `'Duplicate manifest files found for proposalId "...". Data integrity review required.'` — load is refused.

## 11. Manifest Validation
1. Parsed as JSON (parse failure → throw).
2. Confirmed to be a non-array object.
3. `manifest.proposalId === requestedProposalId` — mismatch throws.
4. `manifest.destinationFolderId === requestedDestinationFolderId` — mismatch throws.
5. Required fields checked: `schemaVersion`, `proposalId`, `currentRevision`, `destinationFolderId`, `currentFiles`, `builderState`.
6. `currentFiles.googleDocId`, `currentFiles.pdfId`, `currentFiles.baseName` all required.
7. `builderState` must be a non-array object.

## 12. Destination Consistency Check
`manifest.destinationFolderId !== destinationFolderId` → throws with clear message. Prevents cross-destination manifest confusion.

## 13. File-ID Validation
`DriveApp.getFileById()` called for `googleDocId` and `pdfId` independently. Each wrapped in its own `try/catch` — a missing file yields `exists: false` and a warning string rather than failing the entire load.

## 14. Missing Doc/PDF Warning Behavior
Warnings are collected in an array and returned in the response `warnings` field. The `builderState` and all manifest data are still returned and fully recoverable even if one or both files have been manually deleted.

## 15. Success Response Shape
```json
{
    "success": true,
    "managed": true,
    "proposalId": "...",
    "currentRevision": 1,
    "destinationFolderId": "...",
    "createdAt": "...",
    "updatedAt": "...",
    "currentFiles": {
        "googleDocId": "...",
        "pdfId": "...",
        "baseName": "...",
        "googleDocExists": true,
        "pdfExists": true,
        "googleDocUrl": "...",
        "pdfUrl": "..."
    },
    "builderState": { "proposalAppState": {}, "systemScratchpads": {}, "selectedProposalRows": [] },
    "warnings": []
}
```

## 16. Not-Found / Legacy Response Shape
Returned when Proposal Data folder is absent or exact manifest filename not found:
```json
{
    "success": false,
    "managed": false,
    "notFound": true,
    "error": "Managed proposal state not found."
}
```

## 17. No Files Created During Load
**Confirmed.** `getProposalSubfolderIfExists` is strictly read-only. `getProposalState` calls only `getFilesByName`, `getBlob().getDataAsString()`, and `DriveApp.getFileById()`. Zero create/write/trash calls.

## 18. Managed Create Unchanged
**Confirmed.** `createProposalExport`, `getOrCreateProposalSubfolder`, `generateProposalId`, and `createProposalManifest` were not modified.

## 19. Legacy Create Unchanged
**Confirmed.** Legacy path inside `createProposalExport` (non-managed branch) was not modified.

## 20. Retest Untouched
**Confirmed.** No Retest files were modified.

## 21. No Update / Archive / Migration Added
**Confirmed.** Only `getProposalState` (read-only) was introduced.

## 22. Static Validation Performed
- `Select-String` confirmed zero `v16.49` tokens remain (legacy changelog mention absent — no hits at all).
- `Select-String` confirmed three `v16.50` hits at expected locations (header, doGet log, Zone 8).
- All new function names confirmed present at expected line numbers.
- `getProposalSubfolderIfExists` confirmed placed before `getOrCreateProposalSubfolder`.
- `getProposalState` confirmed placed between helpers and `createProposalManifest`.

## 23. Runtime Testing
**None performed.** Static analysis only.

## 24. Mirror Parity
All four files confirmed at MD5 `C32401A9B71E94CC2089B5EADA01BC67`.

## 25. Archive Filenames
- `script_changeout_v16.50_2026_09_29_0622.gs`
- `script_changeout_v16.50_2026_09_29_0622.txt`

## 26. Diff Filename
`script_changeout_v16.50_diff.txt`
