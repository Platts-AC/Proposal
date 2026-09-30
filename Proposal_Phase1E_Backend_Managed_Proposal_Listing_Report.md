# Proposal Phase 1E: Backend Managed Proposal Listing — Implementation Report

## 1. Authoritative Source
`I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\script_changeout.gs`

## 2. Starting Baseline
- **Version:** v16.50
- **MD5:** `C32401A9B71E94CC2089B5EADA01BC67`

## 3. Resulting Version
- **Version:** v16.51
- **MD5 (all four files):** `90C25C3E5D3CED071B52F5EBC3834A51`

## 4. Functions Added / Modified
| Function | Change |
|---|---|
| `doPost` | Added `listManagedProposals` routing branch |
| `listManagedProposals` | **NEW** — read-only listing implementation |

No existing functions were modified beyond the doPost addition.

## 5. doPost Routing Change
```javascript
if (action === 'listManagedProposals') {
    return jsonResponse(listManagedProposals(payload));
}
```
Added immediately after the `getProposalState` branch. All prior routing untouched.

## 6. Destination Validation
Delegates to existing `validateProposalDestinationFolder(destinationFolderId)`. Unchanged behavior — supplied folder must be a valid direct child of `PROPOSAL_ROOT_FOLDER_ID`.

## 7. Proposal Data Lookup Behavior
Uses existing `getProposalSubfolderIfExists(destinationFolder, 'Proposal Data')` — read-only, never creates. If the folder is absent, the function returns immediately with `success: true`, `proposals: []` — not an error condition.

## 8. Candidate Manifest Filename Rule
Only files matching: `^(PROP-\d{6}-[0-9A-F]{6})_manifest\.json$`  
All other files in Proposal Data are silently skipped. No PDFs, Docs, or unrelated files are inspected.

## 9. Manifest Parsing / Validation Rules (per file, non-fatal)
1. File contents read as string → `JSON.parse` (parse failure → skip + warning).
2. Parsed value must be a non-array object.
3. `manifest.proposalId` must exist and match `^PROP-\d{6}-[0-9A-F]{6}$`.
4. `manifest.proposalId` must match the proposalId extracted from the filename.
5. `manifest.destinationFolderId` must match the requested `destinationFolderId`.
6. `manifest.currentFiles` must be a present object.
7. `manifest.currentFiles.baseName` must be a non-empty string.
8. `manifest.currentRevision` must not be `undefined` or `null`.

## 10. Malformed Manifest Warning Behavior
Each validation failure produces a descriptive warning string added to `warnings[]`. The offending manifest is skipped from `proposals[]`. The remaining manifests continue to be processed normally.

## 11. Duplicate proposalId Behavior
If two or more manifests resolve to the same `proposalId`:
- The first valid entry is retracted from `proposals[]`.
- A single warning is emitted: `'Duplicate managed proposal ID "..." detected in Proposal Data. Both entries excluded.'`
- All subsequent encounters of the duplicate ID are silently skipped (no extra warnings).
- Neither file is modified or trashed.

## 12. Proposal List Item Shape
```json
{
    "proposalId": "PROP-260929-7F0BE2",
    "baseName": "2026-09-29 - Customer - Proposal V1",
    "currentRevision": 1,
    "createdAt": "2026-09-29T10:00:00.000Z",
    "updatedAt": "2026-09-29T10:00:00.000Z"
}
```
`builderState` is explicitly **not included** in list items.

## 13. Success Response Shape
```json
{
    "success": true,
    "managed": true,
    "destinationFolderId": "...",
    "proposals": [ ... ],
    "warnings": []
}
```

## 14. Empty Destination Behavior
If Proposal Data folder is absent, or present but contains zero valid managed manifests: `proposals: []`, `success: true`. Not treated as an error.

## 15. Sort Order
Proposals sorted by: `updatedAt` descending → `createdAt` descending → `baseName` ascending. Most recently updated proposal appears first.

## 16. builderState Not Returned by List Action
**Confirmed.** The `entry` object constructed per valid manifest contains only `proposalId`, `baseName`, `currentRevision`, `createdAt`, `updatedAt`. `manifest.builderState` is never accessed or forwarded.

## 17. No Files / Folders Created or Modified
**Confirmed.** `listManagedProposals` calls only: `validateProposalDestinationFolder`, `getProposalSubfolderIfExists`, `dataFolder.getFiles()`, `file.getName()`, `file.getBlob().getDataAsString()`, and `JSON.parse`. Zero mutating Drive API calls.

## 18. getProposalState Unchanged
**Confirmed.** Not modified.

## 19. Managed Create Unchanged
**Confirmed.** `createProposalExport` and all managed Create helpers not modified.

## 20. Legacy Create Unchanged
**Confirmed.** Legacy path in `createProposalExport` not modified.

## 21. Retest Untouched
**Confirmed.** No Retest files were modified.

## 22. No Update / Archive / Migration Added
**Confirmed.** Only `listManagedProposals` (read-only) was introduced.

## 23. Static Validation Performed
- `Select-String` confirmed zero `v16.50` version-label hits remain.
- `v16.51` confirmed at exactly 3 expected locations (header, doGet log, Zone 8).
- `action === 'listManagedProposals'` confirmed at line 1885.
- `function listManagedProposals` confirmed at line 2155.
- `MANIFEST_FILENAME_RE` and `getProposalSubfolderIfExists` calls confirmed inside function body.
- `builderState` comment confirms it is excluded from list entries.

## 24. Runtime Testing
**None performed.** Static analysis only.

## 25. Mirror Parity
All four files identical at MD5 `90C25C3E5D3CED071B52F5EBC3834A51`.

## 26. Archive Filenames
- `script_changeout_v16.51_2026_09_29_0701.gs`
- `script_changeout_v16.51_2026_09_29_0701.txt`

## 27. Diff Filename
`script_changeout_v16.51_diff.txt`
