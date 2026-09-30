# PLATTS PROPOSAL REVISION ARCHITECTURE SPECIFICATION

## 1. Goals
- Introduce a robust, shared proposal identity and storage architecture.
- Enable cross-device operation where proposals can be originated on one device (e.g., mobile) and later loaded, edited, and updated on another (e.g., computer).
- Transition from a standalone PDF/Doc generation system to a stateful Proposal Builder environment backed by secure, structured JSON manifests.

## 2. Non-Goals
- Redesigning the Retest application UI or configuration.
- Modifying Apps Script implementation in this phase.
- Modifying the generated HTML layout of proposals.
- Changing application versions.
- Writing actual test files or modifying existing Google Drive folders.

## 3. Existing Architecture Constraints
- The current workflow has no concept of Builder State storage; it merely generates unlinked PDFs and Docs.
- Current generated artifacts rely on filenames and dates rather than permanent IDs.
- Hundreds of legacy proposals exist in Drive and their structures must not be disrupted or broken by the new methodology.
- Client browsers hold short-lived sessions that cannot share state across devices.

## 4. Proposal Identity
A permanent internal unique identifier, the **Proposal ID**, must be assigned when a proposal is first generated. 
- Must remain unchanged through all subsequent updates and revisions.
- Operates independently of the customer name, filename, folder name, or originating browser/device.
- Recommended format: `PROP-{YYMMDD}-{HEX6}` (e.g., `PROP-260928-A1B2C3`) or a standard UUID v4.
- Used strictly internally as the primary key connecting all proposal artifacts together.

## 5. Manifest / Builder State Schema
The core of the cross-device architecture relies on a shared JSON-based proposal manifest stored in Google Drive. 
- It contains only structured state, IDs, numbers, booleans, and arrays required to reconstruct the Retest session.
- Excludes Google Docs, PDFs, images, and binary data.

**Example Schema:**
```json
{
  "schemaVersion": "1.0",
  "proposalId": "PROP-260928-A1B2C3",
  "currentRevision": 3,
  "createdAt": "2026-09-28T14:30:00Z",
  "updatedAt": "2026-09-29T10:15:00Z",
  "destinationFolderId": "1aBcD_exampleFolderID...",
  "currentFiles": {
    "googleDocId": "1zYXw_exampleDocID...",
    "pdfId": "1bCdE_examplePdfID...",
    "baseName": "2026-09-28 - Dawson - Proposal"
  },
  "builderState": {
    "proposalAppState": {
      "customerName": "Dawson",
      "selectedTier": "Best"
    },
    "systemScratchpads": [...],
    "selectedProposalRows": [...]
  }
}
```

## 6. Drive Folder Structure
To organize assets clearly for users while supporting developer state tracking, destination folders will use the following structure:

```
DESTINATION FOLDER
    [PDFs] 2026-09-28 - Dawson - Proposal.pdf (Current PDFs only)

DESTINATION FOLDER / Google Docs
    [Docs] 2026-09-28 - Dawson - Proposal (Current Google Docs only)

DESTINATION FOLDER / Archive
    [PDFs] 2026-09-28 - Dawson - Proposal_v1.pdf (Historical PDFs)

DESTINATION FOLDER / Archive / Google Docs
    [Docs] 2026-09-28 - Dawson - Proposal_v1 (Historical Google Docs)

DESTINATION FOLDER / Proposal Data
    [JSON] PROP-260928-A1B2C3_manifest.json (Current manifest)
    DESTINATION FOLDER / Proposal Data / Archive
        [JSON] builder_state_v1.json (Historical state snapshots)
```
*Note: The `Proposal Data` subfolder cleanly separates complex JSON states from customer-facing PDFs without breaking folder locality.*

## 7. Current File Naming
The current equivalent proposal files MUST have **no revision suffix**.
- Example PDF: `2026-09-28 - Dawson - Proposal.pdf`
- Example Doc: `2026-09-28 - Dawson - Proposal`
While internally the manifest tracks the actual revision number, the latest live documents conceptually present as standard naming.

## 8. Archived Revision Naming
When an update replaces existing components, older current files are safely moved into the `Archive` folders and explicitly flagged with their historical revision number.
- Suffix format: Lowercase `_v{revision}` unless existing routines prefer another methodology.
- Example First Update Process:
  - Backend creates `_v1` in `Archive`.
  - Manifest records Current Revision = 2.
  - New active files are minted with standard, clean naming.

## 9. Create Transaction
The process to establish a brand-new managed proposal:
1. Retest sends proposal content + serialized Builder State.
2. Apps Script assigns a new Proposal ID.
3. Apps Script creates the current Google Doc.
4. Apps Script creates the current PDF.
5. Apps Script saves the Proposal Manifest/Builder State payload to the internal JSON file in `Proposal Data`.
6. Apps Script responds with the Proposal ID, initial revision (1), file IDs, and operational URLs.
7. Retest utilizes the response internally for UI state, acknowledging the backend as authoritative.

## 10. Load Transaction
1. A client application (from any authorized device) identifies available proposals.
2. User selects a proposal.
3. Retest requests the proposal load via Apps Script endpoint.
4. Apps Script retrieves the target JSON from `DESTINATION FOLDER / Proposal Data`.
5. Apps Script responds with the Proposal ID, current revision, and `builderState`.
6. Retest securely hydrates and reconstructs the Proposal Builder environment accurately.

## 11. Update Transaction
1. Retest transmits the `proposalId`, `loadedRevision`, and the newly altered Builder State.
2. Apps Script validates the provided `proposalId`.
3. Apps Script reads the backend `currentRevision`.
4. Stale update validation: If `loadedRevision != currentRevision`, the request is rejected immediately.
5. If valid, Apps Script duplicates the old active state snapshot to `Proposal Data / Archive`.
6. Apps Script renames and relocates the current Doc and PDF to standard `Archive` paths (e.g., appending `_v{loadedRevision}`).
7. Apps Script generates the new active Google Doc and PDF.
8. Apps Script writes the updated `builderState` + newly minted current file IDs to the master manifest.
9. Apps Script increments the current revision count.
10. Apps Script returns the updated IDs, revision, and URLs.

*Execution order guarantees that old assets remain physically untouched until any new file rendering is fully successful.*

## 12. Multi-Device / Stale Revision Protection
Stale protections ensure a user's slow-session editing fails safely instead of blindly executing a destructive override over someone else's newer revision. 
- Update endpoints must enforce: `if (inboundLoadedRevision !== dbCurrentRevision) return ERROR_STALE_REVISION`.
- Retest uses the rejection flag to notify the user of concurrent external modifications.
- **LockService Recommendation**: Utilizing Google Apps Script's `LockService.getScriptLock()` during Create/Update sequences is highly recommended. It guarantees deterministic transaction execution and blocks simultaneous backend writes triggered from identical sub-second requests.

## 13. File ID Safety
Drive operations, updates, and archiving MUST explicitly leverage the Drive File IDs stored within the JSON manifest.
- Do NOT operate solely on finding files via name, date, customer, or folder indexing. 
- Filename matching should be reserved entirely for initial human discovery.
- All destructive operations (renaming, archiving) dictate precise Drive ID targets.

## 14. Revision State Storage
To support later historical comparisons and diffing, prior instances of Builder State must be archived safely without creating bloated JSON payloads.
- **Decision:** **Option B (Separate Archived State Snapshots)** is specified.
- The centralized manifest tracks only the *Live/Current Builder State* + manifest metadata.
- When an update occurs, the backend takes the existing JSON payload and drops it into `DESTINATION FOLDER / Proposal Data / Archive` as `builder_state_v{number}.json` before updating the primary file. 
- Rationale: Smaller, faster central manifest reads, highly predictable data sizes, straightforward retrieval for diff engines when necessary.

## 15. Revision Diff Architecture
Comparisons of what explicitly changed between versions rely heavily on the structured JSON elements, rather than fragile Doc/PDF text parsing.
- Retest maintains responsibility over the Diff Engine.
- If requested, Apps Script passes down the active Builder State alongside a requested archived Builder State. 
- Retest visually maps changes (e.g., `Disconnect: Existing -> New` or Pricing adjustments `8,450 -> 8,725`). 
- No diff mechanism implemented in Apps Script; Apps Script functions purely as a delivery pipeline.

## 16. Failure / Recovery Strategy
Transaction pipelines target high recoverability over destructive urgency.
- Render Docs & PDFs FIRST before ever renaming or tampering with existing active assets.
- If Drive timeouts, permission errors, or generator failures occur during new asset generation, the existing active proposal retains full integrity.
- If saving the updated manifest state fails (e.g., partial failure), retry operations are scoped without corrupting the un-updated client state payload. 
- Stale update protection limits duplicated retries from trashing internal tracking.

## 17. Legacy Proposal Handling
Existing proposals that operate solely on PDF/Doc generation without internal states maintain uninterrupted legacy behavior.
- **LEGACY PROPOSAL**: Retains its existing Docs/PDFs. Does not possess a saved Builder State. Cannot support automated Builder 'Load' requests natively.
- **MANAGED PROPOSAL**: Has a generated identity, internal manifest, Builder State tracking. Enables cross-device capability.
- Ensure any folder-indexing logic ignores/warns softly when encountering a Legacy proposal rather than failing ungracefully.

## 18. Retest vs Apps Script Responsibilities

| Sub-system | Primary Responsibilities |
| :--- | :--- |
| **Retest** | • General UI & User Interaction<br>• Managing active Builder State<br>• Serialization & Hydration of Builder State on save/load<br>• Delivering loaded revision timestamps for checks<br>• Handling potential revision diff rendering (future) |
| **Apps Script** | • Permanent Proposal ID assignment<br>• Current Revision verification and enforcement (anti-stale payload checking)<br>• Shared Builder JSON State Drive persistence<br>• Validated Google Doc / PDF generation<br>• File ID linkage, folder management, and archive operation orchestration<br>• Using `LockService` for concurrency isolation |

## 19. Proposed API Contracts

### `createProposalExport(payload)`
**Request Base:** `{ content: HTMLString, state: BuilderStateObj }`
**Success Response:** `{ proposalId, revision: 1, googleDocUrl, pdfUrl, googleDocId, pdfId }`

### `getProposalState(payload)`
**Request Base:** `{ proposalId, directoryId }`
**Success Response:** `{ proposalId, currentRevision, builderState, pdfUrl, googleDocUrl }`

### `updateProposalExport(payload)`
**Request Base:** `{ proposalId, loadedRevision, content: HTMLString, state: BuilderStateObj }`
**Success Response:** `{ proposalId, currentRevision, googleDocUrl, pdfUrl }`
**Stale Response:** `{ error: "STALE_REVISION", currentRevision, message: "A newer revision exists." }`

## 20. Implementation Phases
*Note: A strict separation of responsibilities enforces that Retest and Apps Script components are modified across independent tasks.*

**Phase 1: (APPS SCRIPT ONLY)** Setup Create Transaction capabilities and manifest generation, saving valid UUIDs and state without enforcing client usage.
**Phase 2: (RETEST ONLY)** Transmit the serialized Builder State safely into the active Phase 1 endpoints during Create commands.
**Phase 3: (APPS SCRIPT ONLY)** Build out `getProposalState` logic, successfully reading created manifests from Drive to supply data endpoints.
**Phase 4: (RETEST ONLY)** Intercept load behaviors, fetching initial states and re-hydrating the exact proposal configurations inside the UI.
**Phase 5: (APPS SCRIPT ONLY)** Write the comprehensive Update Transaction, enabling archive creation, state snapshots, and rigid Stale Revision handling blocks.
**Phase 6: (RETEST ONLY)** Inject UI mechanics corresponding to Updates (e.g., transmitting payload `loadedRevision`, managing backend Rejection messages for stales).
**Phase 7: (RETEST ONLY)** Future implementation for diff capabilities by downloading older builder states and scanning discrepancies.

## 21. Testing Requirements
- Test identical device-independent hydration by transferring Builder State across varying Retest environments.
- Artificially mock simultaneous write requests to validate `LockService` atomicity.
- Provide malformed `loadedRevision` numbers mapping sequentially against known backends to forcibly trigger stale revision rejection.

## 22. Rollback Strategy
Rollbacks rely heavily on maintaining decoupled, concurrent execution paths for legacy systems. New routines should map to separate feature-flagged configurations (`e.g., useManagedState = true`). Should critical failures arise, Retest endpoints quickly pivot back toward standard unmanaged requests. 

## 23. Open Questions / Decisions
- Confirm standard polling timeout constraints for generating substantial PDFs concurrently across simultaneous requests. 
- Should legacy proposals be manually upgradeable by forcing an override of standard Docs, or effectively sandboxed?
- Finalize the preferred JSON tracking size limits before breaking arrays down (e.g., limiting extensive row references unneeded by direct state hydration).

---

## IMPLEMENTATION GATES
1. **Gate 1 (Persistence Setup)**: Apps Script reliably outputs a functioning JSON manifest with accurate revision counters and verifiable UUID allocations alongside standard generated PDFs.
2. **Gate 2 (Full Hydration)**: Retest achieves perfectly accurate rebuilding of internal states relying exclusively on fetched JSON manifests retrieved by ID.
3. **Gate 3 (Transaction Safety)**: Stale operations successfully block without breaking internal environments, and files relocate fully via ID references during update procedures without orphan records.
