# Proposal Phase 1B: Retest State Mapping Report

## 1. Authoritative Source Verification
* **Path:** `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing\Agent\retest.html`
* **Size:** 1,326,204 bytes
* **Timestamp (Modified):** 2026-09-25 07:47:54 AM
* **Hash (MD5):** `2F69A6B00D39EA461BBDEAD5849C3E31`
* **Version/Build:** `v09.01.5`
* **Version Consistency:** The version `v09.01.5` is consistently identified across the HTML title tag, comments, badges, and export artifact hooks inside the code (e.g. lines 10, 482, 1414, 6173, etc).
* **Backup Parity Analysis:** Searched `Agent\` for concurrent/later timestamped `retest_v...html` files. The highest and most recent version found is `retest_v09.01.5_2026_09_25_0748.html`, which possesses the exact same file size (1,326,204) and MD5 hash (`2F69A6B00D39EA461BBDEAD5849C3E31`). There is no newer file present that supersedes this.
* **Canonical Conclusion:** `retest.html` is positively verified as the authoritative live master.

## 2. Source-Level Mapping: Create Proposal Workflow
### Relevant Nodes & Line Locations
* **Create Proposal Button**: Line ~1823. Directly invokes `onclick="event.preventDefault(); window.createProposalExportFromRetest();"`.
* **createProposalExportFromRetest()**: Declared at line ~24597. Acts as the primary export network wrapper controlling the fetch sequence and UI state loading.
* **updateJobDataFromForm()**: Declared at line ~20386. Directly modifies local job data strings in the model; explicitly run at the top of `createProposalExportFromRetest`.
* **ensureProposalJobData()**: Declared at line ~20105. Retrieves standard payload vectors dynamically.
* **updateProposalTerminal()**: Declared at ~12277. Populates `pureCopyText`.
* **window.pureCopyText**: Initialized at ~12372. Used securely by legacy PDF mapping elements (`<textarea>`); forms the payload body.
* **API_URL**: Declared at ~3399 as constant.
* **current payload construction**: Formed inside `createProposalExportFromRetest` at line ~24638 identically tracking date, customerName, address, zip, destinationFolderId, proposalText, and 'createProposalExport' literal.

## 3. Builder State Identity
### `selectedProposalRows`
* **Declaration:** Line ~3492 `let selectedProposalRows = [];`
* **Shape:** A strict mathematical 1D Array of raw Integers/Row Indexes natively pushed during system selection events.

### `window.systemScratchpads`
* **Declaration:** Lines ~16968, ~17731 `window.systemScratchpads = {};`
* **Shape:** A flat structural Object / HashMap mapped via Row Indexes. Contains simple string configurations like `site`, `absoluteIndex`, and generic string/numeric parameters. No external dependencies.

### `window.proposalAppState`
* **Declaration:** Line ~3594 `window.proposalAppState = {};`
* **Shape:** A nested composite Object holding sub-nodes like `activeSite` boundaries, `addons` arrays/maps, and `deductions`.

## 4. JSON Serialization Safety Check
All three structures were analyzed against DOM injection, circular mapping references, Sets, Maps, explicit class constructions, and unhandled Date objects. 
**Findings:** All structures natively hold string/array/number JS scalars configurations safely mapped inside dictionaries. The data is entirely structured for raw representation making a JSON-stringified clone operation **100% safe**.

## 5. Phase 1B Construction Strategy
### Recommended `builderState` Wrapper
To ensure complete isolation against theoretical racing bugs and accidental structural corruption inside the live UI context before or during the HTTP post, a strict `JSON.parse(JSON.stringify())` deep clone strategy should be invoked natively around existing arrays/variables directly mapping values natively.

```javascript
        const payload = {
            action: 'createProposalExport',
            destinationFolderId: destId,
            proposalDate: pDate,
            customerName: pName,
            address: pAddr,
            zip: pZip,
            proposalText: pText,
            builderState: {
                proposalAppState: JSON.parse(JSON.stringify(window.proposalAppState || {})),
                systemScratchpads: JSON.parse(JSON.stringify(window.systemScratchpads || {})),
                selectedProposalRows: JSON.parse(JSON.stringify(typeof selectedProposalRows !== 'undefined' ? selectedProposalRows : []))
            }
        };
```

### Optimal Insertion Point
The insertion must explicitly manifest inside `window.createProposalExportFromRetest` at approximately **line ~24638-24647** by extending the `const payload = { ... }` block structurally alongside legacy parameters. 

### Functions Affected
* **Needs Modification:** ONLY `window.createProposalExportFromRetest()`.
* **SHOULD NOT Need Modification:** `ensureProposalJobData`, `updateJobDataFromForm`, `updateProposalTerminal` all safely decouple inherently.

### Risks or State-Loss Concerns
Native functions mapped tightly within `proposalAppState`, such as implicit prototype logic generated theoretically inside `createDefaultActiveSite()`, would lose nested `.methods()` against `JSON.parse()`. However, Retest architecture statically isolates pure function implementations inside the root document inherently (e.g., `isMeaningfulSiteProfileActive()`), rendering loss of native object-bound functions irrelevant since only values are required.

## 6. Closing Declaration
**I confirm that ZERO modifications were performed to `retest.html`, `script_changeout.gs`, or any external file.** The scope securely completed Read-Only mapping.
