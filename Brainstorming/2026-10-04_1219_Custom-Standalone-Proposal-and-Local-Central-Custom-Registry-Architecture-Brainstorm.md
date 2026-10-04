# Metadata

| Field | Value |
|---|---|
| Filing date / time | 2026-10-04 12:19 (24-hour local) |
| Topic | Custom / Standalone Proposal mode (proposals with no full HVAC system selection), a deliberate local Custom Catalog, a future central custom registry, and a browser-instance Device ID |
| Source | Owner request, filed through an IDE reconnaissance handoff; the findings below are from tracing the actual code, not from the owner |
| Related records | `Prompt_History/2026-10-04_1219_v10.02.04-v16.52.1_Custom-Standalone-Proposal-Reconnaissance.md` (the handoff and the agent's final report); `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md` and `2026-10-02_1832_Component-Registry-Nested-Grid-and-Proposal-Pilot-Brainstorm.md` (unchanged; the component and registry ideas this builds on); `Prompt_History/2026-10-04_1048_v10.02.04-v16.52.1_Universal-Design-Profile-Foundation.md` (Design Profiles, a different thing) |
| Current frontend version | v10.02.04 |
| Current backend version | v16.52.1 |
| Status | **Brainstorm and reconnaissance / not approved implementation.** Nothing here is an instruction to build. No application code, version or archive was changed to produce this record. |

How this record is organized. "Narrative Summary" and "Preserved Source Material" carry the owner's intent; the source is the complete handoff text, preserved unchanged at the end. Everything under "Reconnaissance Findings" and "Recommended Design" is written by the filing agent after reading the code and running read-only experiments in the mocked test harness (no real backend call, no real proposal); it is labeled as interpretation and can be wrong where the code changes later. Line numbers refer to `Agent/retest.html` and `script_changeout.gs` at v10.02.04 / v16.52.1 and will drift.

# Narrative Summary

The Proposal Builder was built around one job: replacing an HVAC system. Its Page 2 output is composed from selected catalog systems (options), per-system add-ons, global fees and a fixed intro and warranty wording. The owner now needs proposals that contain no full system at all: a bathroom exhaust fan, a whole-home dehumidifier, a bath fan plus a dehumidifier, an ERV, IAQ equipment, ductwork, a dryer vent, a condensate pump, or one-off custom work. The System Changeout workflow must stay exactly as it is.

The direction is a **Proposal Type** (System Changeout or Custom / Standalone), probably chosen in the Proposal Builder Actions area. In Custom mode a purpose-built builder asks for a job intent (replace, install new, add / upgrade, repair / modify), a handful of generic scope terms that only help write a readable introduction, and then real proposal **items**: a generic type, an action, the actual proposal name (for example "Aprilaire E100 Whole-Home Dehumidifier"), a free description the technician types or pastes, optional brand and model, a price and an order. The items can be presented as one combined package, as itemized lines, or as customer-selectable options. The Smart Injector must not be abused as the item store; it stays a place for supplemental notes, fees and enhancements.

Two longer-range ideas ride along but are deliberately not part of the first build. First, a technician can add an item that is not in the built-in list and **explicitly** choose to save it into a reusable, device-local Custom Catalog (never silently collecting everything typed). A deliberately saved entry might later also send a small, silent event to the backend, where a Google Sheet keeps both the current known custom entries and an append-only history, with a separate approval status (pending, approved, retired) so that central recording is never confused with global availability. Second, each browser profile gets a random, persistent **Device ID** (no hardware fingerprinting) so that unknown devices can be identified later, and so that proposals carry a breadcrumb saying which device saved them, without rewriting old proposal records when an administrator later attaches a name or a person to the ID.

The reconnaissance shows that the current architecture can carry this with surprisingly little plumbing, because a managed proposal already saves the whole `proposalAppState` object as opaque JSON, the backend never inspects it beyond three keys, and Load preserves unknown keys inside it. The real work is on the output side (the proposal text is built by system-specific code that stops early when no system is selected), plus a few seams around Load, the working draft and the Create guard. It also found two pre-existing problems that matter here, described below.

# Structured Breakdown

## The feature as the owner described it

- **Proposal Type:** System Changeout (unchanged behavior) or Custom / Standalone (no full system required; proper proposal blocks, not Smart Injector notes).
- **Job intent:** Replace, Install New, Add / Upgrade, Repair / Modify.
- **Generic scope selections:** a multi-select of common terms (Bath Fan, Whole-Home Dehumidifier, ERV / Fresh Air Ventilator, Mini-Split, Thermostat, IAQ Device, UV Light, Ductwork, Dryer Vent, Condensate Pump, Exhaust Fan, Other / Custom) used to generate an introductory scope sentence. Final wording is not decided.
- **Proposal items:** generic type, action, display name, detailed description, optional brand and model, pricing mode, price, ordering, optional acknowledgement or selection marker. Free typing and pasting of the real item description must always work.
- **Presentation / pricing modes:** Combined Package (one investment), Itemized (each item shows its own investment), Customer Options (independently selectable).
- **Generic intro versus detailed items:** generic terms make the readable introduction; detailed items carry the actual equipment or service text and pricing. They must not be fused.
- **Add Custom Item:** an entry may be temporary (this proposal only) or explicitly saved into the device's reusable custom catalog. Only an explicit save turns an ad-hoc entry into reusable data.
- **Future local-to-central path:** save locally at once, silently send a small backend event, record it centrally in Google Sheets (current entries plus append-only history), no noisy messages for normal users, a hidden admin / debug area for history. Central persistence is not global approval.
- **Device ID:** a random persistent browser-instance ID (example form `DEV-A7C94F21B6`), stored locally and reused; metadata (friendly name, assigned user, type, first / last seen, app version) lives separately and is attached by an administrator later; no MAC address, no hardware fingerprinting; different browser profiles may have different IDs.
- **Proposal breadcrumb:** future `sourceDevice` information inside the saved proposal state, so an unknown device that created a proposal for a known customer can be identified afterward.

## Concepts that must stay separate

Current working state; managed proposal saved Builder State; built-in catalog; device-local custom catalog; future central custom catalog; device / browser registry; append-only event history; Design Profiles; Smart Injector note presets. They must not be merged into one generic settings object. The table under "Recommended Design" maps each to its storage, scope and lifetime.

## Owner preferences stated in the handoff

Reuse the existing universal component / grid architecture where practical; do not redesign unrelated Proposal Builder layout work; keep System Changeout intact; do not implement now; prevent another oversized implementation run by phasing; do not invent final proposal wording in this pass; no invasive device identification; no noisy sync messages for normal users.

# Reconnaissance Findings

*Agent-written, from reading the code (references in parentheses) and from read-only experiments in the mocked harness.*

## A. What a managed proposal saves, traced end to end

1. **Where the state is built.** Create builds it inline in `createProposalExportFromRetest` (`retest.html` ~25044): `{ proposalAppState, systemScratchpads, selectedProposalRows }` cloned through JSON, then `window.attachPricingSnapshot(builderState)` adds `pricingSnapshot` and per-scratchpad pins (~26603). Update builds the same literal again (~26050) and attaches the snapshot the same way. The local working draft (`platts_proposal_working_draft_v1`) captures the same three objects plus a catalog fingerprint (~26196).
2. **How Create sends it.** `fetch(API_URL, POST, 'text/plain;charset=utf-8')` with `{ action: 'createProposalExport', destinationFolderId, proposalDate, customerName, address, zip, proposalText, builderState }`. Update uses `retestPostAction` with `{ action: 'updateProposalExport', proposalId, destinationFolderId, loadedRevision, proposalText, builderState }`.
3. **Where the backend stores it.** `createProposalExport` (`script_changeout.gs` 2429): the proposal is **managed** exactly when `payload.builderState` is a plain object (2459). It never inspects the contents. It copies the template Doc into `<destination>/Proposal Docs/`, writes the PDF into the destination folder, and writes `<destination>/Proposal Data/<proposalId>_manifest.json` through `createProposalManifest` (2313): `{ schemaVersion: 1, proposalId, currentRevision: 1, createdAt, updatedAt, destinationFolderId, currentFiles: { googleDocId, pdfId, baseName }, builderState }`. Proposal ids are `PROP-YYMMDD-XXXXXX` (6 hex). A script lock serializes managed Create.
4. **Update.** `updateProposalExport` (2334) requires `proposalAppState`, a truthy `systemScratchpads` and an array `selectedProposalRows`, a non-blank `proposalText` and the loaded revision, under a script lock. It snapshots the old manifest to `Proposal Data/Archive/<id>_builder_state_v<N>.json`, moves the old Doc and PDF into `Archive/`, writes the new Doc and PDF, then **replaces** `manifest.builderState` wholesale and bumps `currentRevision`, with a rollback path if anything fails. A stale revision returns `STALE_REVISION`.
5. **Retrieval.** `getProposalState` (2040) validates the id and destination, reads the manifest from `Proposal Data/`, checks required fields (`schemaVersion`, `proposalId`, `currentRevision`, `destinationFolderId`, `currentFiles`, `builderState`) and returns `builderState` untouched plus file existence and URLs. `listManagedProposals` (2179) returns only `proposalId, baseName, currentRevision, createdAt, updatedAt` per proposal (no state, no type).
6. **Load.** `applyLoadedBuilderState` (~25617): `validateLoadedBuilderState` (needs the three keys, the catalog loaded, every selected row's scratchpad present, `absoluteIndex` inside the catalog), `normalizeLoadedProposalAppState` (fills missing known keys with defaults and **keeps unknown keys**), `resolveSavedPackages` (remaps moved catalog positions), then swaps `window.proposalAppState`, `systemScratchpads` and `selectedProposalRows` and redraws. Everything is regenerated from state under the *current* device settings.
7. **Sidecar JSON.** Yes: one manifest per managed proposal in `Proposal Data/`, plus one archived snapshot per superseded revision. Legacy unmanaged proposals (no `builderState`) have no JSON at all and use the `... - Proposal V<n>` naming.
8. **Recoverable today:** the job data, per-system scratchpads (add-ons, travel, refrigerant, site data, pins and saved quoted pricing), the cart order, text overrides, block order, injected lines, and a pricing snapshot of what was printed. **Not recoverable:** the proposal text as a stored artifact (it exists only inside the Doc and the PDF; the manifest does not keep `proposalText`); the exact wording under the old device's settings (section headings, warranty / closing text and the selection marker come from `propSettings.terminal`, which is per device and not saved in the proposal); and the structure of injected lines (see C).

## B. What depends on selected HVAC system rows

- `updateProposalCartUI` (11104): returns early at 11280 when `selectedProposalRows.length === 0`, after clearing `cachedProposalText`. Everything after that (the intro composer, the Option blocks, universal scope items, Fees, Upgrades, Protection) works from the rows.
- `updateProposalTerminal` (12594): returns early at 12599 with the placeholder "Your customized proposal will compile here..." when there are no rows. The lines that rebuild `window.pureCopyText` (12689 onward) are never reached.
- Smaller dependents, none of which throws on an empty cart: `getActiveCraneState` (3840, inactive), site-profile helpers (3929, 3982, 3994, 4249, 4413), `evaluateQuickSummaryPlacement` (19370, returns null), the sorter badges (loop over rows), `validateLoadedBuilderState` (a warning only), `attachPricingSnapshot` (loops rows; empty gives an empty `options`), the working draft's `isBlank` (26203).
- The intro sentence is **hard-coded system wording** ("We are pleased to offer you a quote to upgrade your HVAC system... We will remove the existing equipment and dispose of it per EPA standards") built by a grammar composer in `updateProposalCartUI` (11298 to 11566). Only five strings are templated through `getTerminalTemplateValue` (customer heading, fees heading, optional heading, protection heading, warranty / closing text); the intro is not one of them. The default warranty / closing text talks about registering "new equipment after new system is registered online", which does not suit a bath fan.

## C. Read-only experiments (mocked backend, nothing real created)

1. **Fresh page, no system, job data filled, output empty:** Create is refused locally with "Missing Date, Name, Address, or Proposal Output." and no request is sent. The only guard is the empty output (`window.pureCopyText`, 25030); there is no explicit system check anywhere in the frontend Create path, and the backend does not look at systems either.
2. **One system selected, then the only system removed through the app's own remove function:** the terminal shows the placeholder but `window.pureCopyText` keeps the old 749 characters, and a following Create **sends that stale text** (it still contains "System Option 1") with a `builderState` of `selectedProposalRows: []`, an orphaned scratchpad still present, and a pricing snapshot with no options. The mock accepted it as a managed Rev 1. *This is a pre-existing hazard in System Changeout mode, not caused by this plan.*
3. **No system, Smart Injector line added:** the line is stored in `proposalAppState.lineInjections` but is not shown and not added to the output, because injected lines are only rendered by the non-empty path of `updateProposalTerminal`.
4. **A zero-row Builder State with an extra key inside `proposalAppState`:** `validateLoadedBuilderState` passes with only the warning "The saved proposal has no selected options."; `normalizeLoadedProposalAppState` keeps the extra key; `applyLoadedBuilderState` applies it and the key is present afterwards. A top-level extra key next to the three known ones would be stored by the backend but ignored by Load and by the draft.
5. **Pricing review for a state with an empty snapshot:** `evaluateSavedPricing` returns a result and the Load panel says "No pricing changes detected since this proposal was saved." That is misleading for a custom proposal whose prices were typed.
6. **Draft:** `isBlank` returns true for a state that has only custom data in `proposalAppState` (no rows, empty job data), so a custom-only draft would not be saved without a change there.

## D. Output model that can be reused

The proposal output is a list of `{ target, text }` blocks (`window.proposalBlocks`), sorted by `proposalAppState.blockOrder`, edited through the Focus Editor into `proposalAppState.textOverrides[target]`, supplemented by `lineInjections` and a boilerplate block, then concatenated into `pureCopyText` (12689). Reusable as they are: the Customer Information block and its heading template, block ordering, drag and drop, the Focus Editor and overrides, injected lines, the copy / clipboard path, the selection marker setting (checkbox or initial line), Create / Update / Load, the Doc and PDF links, the destination folder. Not reusable: the intro composer, the Option blocks and their sub-blocks, the Fees / Upgrades / Protection engines (which refer to option numbers), the default warranty / closing text, the pricing snapshot and the saved-versus-current comparison.

Two traps to design around: the override and ordering keys are plain strings (`'Intro'`, `'Boilerplate'`, `'Option 1'`), and `printedInvestments` (26592) reads blocks named exactly `Option <n>`. A custom path that reused the target `'Intro'` would leak a custom intro override into System Changeout when the type is switched, and one that reused `Option <n>` would feed the pricing snapshot. Custom blocks need their own target names.

## E. The Smart Injector boundary

The Smart Injector (`injectCustomLine`, `buildProposalInjectionText`, 12828 to 12897) turns a category (note, enhancement, fee, spacer), an acknowledgement and an optional price into **one finished string** (for example "• System Enhancement: ...: add $350 to selection above") and stores only `{ id, text }`. The category, price and acknowledgement are lost as data. It is also written as an add-on *to a selection above*, and (C3) it renders nothing without a system. That makes it right for supplemental notes, customer-responsibility lines, one-off fees, enhancements and spacers, and wrong as an item store: a custom item needs structured fields (generic type, action, name, description, brand, model, price, role, order) that can be re-rendered in three presentation modes and reloaded. Boundary: **items are state; injector lines are text.** Injected lines remain available in Custom mode for supplements.

## F. Backend and Google Sheets

1. **Dispatcher.** `doPost` (1859) is an `if (action === ...)` chain over `getProposalFolders`, `createProposalExport`, `getProposalState`, `listManagedProposals`, `updateProposalExport`, each returning `jsonResponse(...)`; unknown actions return `{ success: false, error: 'Unknown action.' }`. A new action is one more branch and fits the pattern.
2. **Action name.** A small `recordRegistryEvents` (batch, idempotent by client event id) fits better than one action per concept; `saveCustomCatalogEntry` would work but would repeat the plumbing for DELETE, RESTORE and device events.
3. **Sheets writes.** The script is container-bound and already uses `SpreadsheetApp.getActiveSpreadsheet()` (`doGet`, `getEnhancementData`, `processApprovals`), so appending rows to dedicated tabs needs no new scope. There is an existing append-only ledger and approval flow to imitate: `Audit_Approval` (a checkbox column) to `Audit_History` in `processApprovals` (1740). `Static_Enhancements` (category, name, price) is already delivered to the frontend through `doGet`'s `enhancements` key, a precedent for later delivering an approved shared custom catalog as another additive key.
4. **Reusable utilities.** `jsonResponse`, `LockService` (script lock with `waitLock(15000)` already used by Create and Update), `Utilities.formatDate` and `Session.getScriptTimeZone()` for timestamps, and `generateProposalId` as a model for generating ids.
5. **To add.** The action branch and handler; payload validation and size caps; formula-injection protection (write text cells so a value beginning with `=`, `+`, `-` or `@` is not evaluated); tabs created once with header rows (the current code assumes its tabs exist and alerts if they do not; a one-time setup function in the style of `testDocumentAuthorization` is the nearest precedent); a web-app redeploy by the owner.
6. **Existing property to keep in mind.** `doPost` has no authentication; anyone with the web-app URL could already call `createProposalExport`. Registry writes should therefore be schema-validated, size-limited, append-only and never auto-approved.

## G. Other findings that affect the plan

- **Same-name collision.** Managed proposals are named `<date> - <customer> - Proposal`, and `assertManagedProposalBaseNameAvailable` (1983) refuses a second one with the same name in the destination folder (including archived Rev 1 names). A customer who gets a system proposal and a custom proposal on the same date collides; this is already true for two system proposals. Only the backend builds the name, so a different custom suffix would be a small backend change.
- **Orphan scratchpads.** Removing a system leaves its scratchpad in `systemScratchpads` (C2: `'111'` remained). Harmless to Load (unused scratchpads only warn) but it is saved.
- **Load list.** `listManagedProposals` has no proposal type, so custom proposals look the same as system ones in the Load picker until a manifest field exists.
- **No device identity exists** in the page today (no `deviceId`, no `DEV-` strings).
- **Layouts.** The Proposal Builder component table has 20 components and layouts are per profile with data revision 5. A new component is invisible in saved layouts until it is placed; the injector components were handled with a one-time default-band migration (revision 2), which is the precedent for placing a Proposal Type control.

# Answers to the Reconnaissance Questions

1. **Functions that require selected HVAC rows.** `updateProposalCartUI` and `updateProposalTerminal` (early returns), the intro composer, the Option / Fees / Upgrades / Protection builders, the universal-scope collector, `getActiveCraneState`, site-profile helpers, quick-summary placement, the sorter badges, the pricing snapshot loop, and the draft `isBlank` test. See B. None throws on an empty cart.
2. **Does Proposal Output render with zero systems?** No. The terminal shows a placeholder, injected lines and overrides do not render, and `pureCopyText` is not regenerated (it goes stale).
3. **What blocks Create with no system?** Only the empty `pureCopyText` check ("Missing Date, Name, Address, or Proposal Output."). No frontend or backend rule mentions systems. Update additionally needs the three Builder State keys and non-blank text. The stale-text case (C2) shows the guard is accidental.
4. **Reusable blocks.** Customer Information, injected lines, ordering / drag / Focus Editor / overrides, copy, the selection marker, the customer heading template, Create / Update / Load and the Doc / PDF path. See D.
5. **New state model.** A `customProposal` object and a `proposalType` field inside `proposalAppState` (below).
6. **Where Proposal Type lives.** A new `control:proposalType` select component in the Actions area (original-node pattern, like the destination select), placed by a one-time layout revision migration, as the owner suggested. It is not made a required component; the Custom panel itself appears whenever the saved type is Custom, so a layout that hides the control cannot strand a loaded custom proposal. Whether it should be required is an open decision.
7. **Where the Custom builder UI lives.** A new collapsible section in the Page 2 body between the customer panel and the Smart Scope checklist, shown only in Custom mode; the Smart Scope checklist and the Systems Sorter are hidden or collapsed with a "not used in Custom mode" note. It is not placed inside the Proposal Builder bar (that bar is for actions, status and the injector). The item list is a dynamic list, not a fixed layout, so it should not use the universal grid; the panel itself can become a Design Profile surface later (`page2.customBuilder`).
8. **Combined / Itemized / Options.** See "Output model". All three fit the block pipeline cleanly with new custom block targets; none needs the Option / Fees / Upgrades engines.
9. **Generic intro versus items.** Separate state (`scopeTerms` and `intent` versus `items`), a separate intro composer with its own phrase table and its own override target (`Custom Intro`), and no automatic derivation of one from the other. Choosing a term may offer to pre-create a blank item of that generic type as a convenience only.
10. **Capture into builderState.** Nothing in the three builderState literals changes: `proposalAppState` is cloned whole at Create, Update and in the draft, so `proposalType` and `customProposal` are saved automatically. This is the cheapest placement; a top-level `builderState.customProposal` would need changes in Create, Update, the draft capture, Load and the recovery comparison.
11. **Load / Update changes.** Update: none (its backend check is satisfied by `systemScratchpads: {}` and `selectedProposalRows: []`). Load: a sanitizer for `customProposal` (never trust saved JSON), type-aware validation (no "no selected options" warning for custom), a custom branch in the Load confirmation panel (items, mode, total, and no catalog price comparison), and the custom render after apply. Working draft: extend `isBlank`, and run the same sanitizer on restore.
12. **Backend schema change?** No for the first phases: the manifest stays opaque and `proposalAppState` is already stored whole. Optional later: a `proposalType` field in the manifest (and in `listManagedProposals`) to label the Load list, and a custom name suffix to avoid the same-name collision.
13. **Structured versus rendered-only.** See A8. Structured: `proposalAppState`, scratchpads, rows, the pricing snapshot numbers. Rendered-only: the final proposal text, the section headings and closing wording (per device), and the Smart Injector lines (stored as finished strings).
14. **A JSON / state file on Drive?** Yes: `Proposal Data/<proposalId>_manifest.json` (schema 1) holding the whole `builderState`, rewritten on each Update, plus `Proposal Data/Archive/<proposalId>_builder_state_v<N>.json` for each superseded revision. Unmanaged legacy proposals have none.
15. **Clean hook for Device ID.** A `provenance` block added to the Builder State at the same two call sites that already call `attachPricingSnapshot`, built by a small `attachProvenance(builderState)` helper (below).
16. **Clean hook for the central registry.** One new `doPost` action (`recordRegistryEvents`), fed by a device-local outbox so a failed call never bothers the user.
17. **Incremental, without touching System Changeout pricing?** Yes. The custom path is a separate branch that never calls the pricing engine, the snapshot comparison or the system builders; the shared seams are few and listed in the phases. The existing suite and the "byte-identical outside the allowed regions" style of check can prove it.

# Recommended Design

*Interpretation, not a decision.*

## State model

Stored inside `proposalAppState` (so it travels with Create, Update, the draft and Load with no new plumbing):

```text
proposalAppState.proposalType   'system' | 'custom'      (absent = 'system'; old proposals load unchanged)
proposalAppState.customProposal = {
  schemaVersion: 1,
  intent: '' | 'replace' | 'install' | 'addUpgrade' | 'repairModify',
  scopeTerms: [ { termId, label, action? } ],            // generic words for the intro only
  presentation: 'combined' | 'itemized' | 'options',
  packageTitle: '',                                      // optional heading for the combined package
  items: [ {
    id,                                                  // stable id, never reused
    genericType,                                         // a built-in term id or 'other'
    action,                                              // replace | install | addUpgrade | repairModify
    name,                                                // the proposal / display name
    description,                                         // typed or pasted scope text (plain text)
    brand, model,                                        // optional
    price,                                               // number or null (null prints no price)
    role,                                                // 'package' | 'line' | 'option'
    marker,                                              // 'none' | 'selection'
    catalogRef                                           // null, or { id } once a catalog exists (informational only)
  } ]
}
```

Design rules:

- **The item owns its values.** A catalog entry only pre-fills an item; the proposal never depends on the local catalog, so a saved proposal loads on any device.
- **Role per item, presentation per proposal.** The owner's three modes are the common presets (combined = every item `package`, itemized = every item `line`, options = every item `option`). Storing the role per item costs nothing now and lets a later "base package plus optional extras" proposal exist without a migration. The first UI can expose only the three presets.
- **Both modes' data survive a type switch.** Switching type changes what is rendered, not what is stored; the saved `proposalType` decides what is generated, and the panel says which data is hidden.
- **Prices are typed numbers**, summed as plain numbers and printed like the existing `Investment: $N` convention (whole dollars unless decided otherwise); the system pricing engine, site profiles, tax-credit rules and the pricing snapshot are never involved.
- **Sanitizing.** One `sanitizeCustomProposal` (bounded counts and lengths, known enums, plain text) used on Load and on draft restore, like the Design Profile validators.

## Output model

All blocks are `{ target, text }` in the existing pipeline; custom blocks get their own targets so overrides, ordering and the pricing snapshot never collide with System Changeout.

| Mode | Blocks (targets) | Printed shape |
|---|---|---|
| Common | `Customer Information` (reused), `Custom Intro`, injected lines (reused), `Custom Closing` | the intro composed from intent and scope terms; closing from a new template key |
| Combined Package | `Custom Package` | a heading, one bullet per item (name, then description), then one `Investment: $total` |
| Itemized | `Custom Item 1` .. `Custom Item N`, optionally `Custom Total` | each item with its own `Investment: $x`; a total line when there are two or more priced items |
| Customer Options | `Custom Option 1` .. `Custom Option N` | an option heading, the selection marker (the existing setting), the item text and `Investment: $x`, so the customer picks one or more |

The block pipeline needs one change to serve this: `updateProposalCartUI` / `updateProposalTerminal` decide "is there anything to render" from the proposal type (rows for System, items for Custom) instead of from the row count alone, and the early-return path must also reset `pureCopyText`. New template keys (`customIntro` lead, `customClosing`) can be added to `getTerminalBuiltInTemplate` so the existing Default Proposal Wording editor covers them; the default custom closing text is an owner wording decision and is not proposed here. The copy-section visibility map (customer, intro, options, fees, optional, protection, warranty) needs the custom targets mapped to the nearest existing section.

## Proposed UI flow

1. The technician chooses **Proposal Type** in the Actions area. System Changeout changes nothing.
2. In Custom mode the Custom builder section opens: **Job intent**, **Scope terms** (chips from the generic list plus Other / Custom), **Presentation** (Combined / Itemized / Options), then the **Items** list.
3. Each item is a card: generic type, action, name, description box (paste friendly), brand, model, price, marker, move up / down, remove. **+ Add Custom Item** starts a temporary item; a separate **Save to Custom Catalog** choice (Phase 2) is the only thing that creates reusable data.
4. The Proposal Output terminal shows the composed blocks live, with the same block editing as today. Create / Update / Load / Doc / PDF / Copy work as they do now.

## Managed proposal integration

No backend change in the first phases. Create, Update and recovery treat the state as before. Load gets the custom branch described in answer 11. The same-name collision and the missing type in the Load list are known limitations to decide on (below).

## Separation of concepts

| Concept | Storage | Scope | Lifetime |
|---|---|---|---|
| 1. Current proposal working state | Memory (`proposalAppState`, `systemScratchpads`, `selectedProposalRows`); local draft `platts_proposal_working_draft_v1` | This browser, this quote | Until New Quote; the draft survives refresh |
| 2. Managed proposal saved Builder State | Drive: `Proposal Data/<id>_manifest.json` and per-revision archive snapshots | One proposal | Permanent, per revision |
| 3. Built-in proposal catalog | Sheets (`Unified Master`, `Static_Enhancements`) via `doGet`, plus wording and add-on lists in the page source | Everyone | Changed by the owner / developer |
| 4. Device-local custom catalog | Future `platts_custom_catalog_v1` in localStorage | This browser profile | Until deleted (soft delete, restorable) |
| 5. Future central custom catalog | Future Sheet tab `CustomCatalog` with a status (pending / approved / retired) | Everyone, once approved | Administered |
| 6. Device / browser registry | Future local `platts_device_identity_v1` plus Sheet tab `Device_Registry` | One browser profile | Persistent ID; metadata attached by an administrator |
| 7. Append-only save / event history | Future Sheet tab `CustomCatalogHistory` plus a local outbox | Central | Append-only |
| 8. Design Profiles | `platts_design_profiles_v1` | This browser, portable by export | Until deleted |
| 9. Smart Injector note presets | `propSettings.terminal.notePresets` in `changeout_prop_settings_v1` | This browser | Until deleted |

None of 4 to 7 is design state; they must never be captured by a Design Profile, and when they are created the Design Profile state map should classify them (a reference-data class) so that rule stays checked.

## Device ID approach

- **Creation.** On the first event that needs it (the first save of a proposal or of a catalog entry, not on every page load), generate `DEV-` plus 10 hex characters from `crypto.getRandomValues` (fallback `Math.random`), store it under its own key, and reuse it. Clearing browser data or using another browser profile creates another ID, which the owner accepts.
- **No hardware fingerprinting.** No MAC address, no canvas or font fingerprinting. Allowed context is coarse and already known to the app: the Proposal Builder mode (desktop or mobile), the app version and timestamps.
- **Two layers.** The immutable `deviceId` is local and travels in events and proposals. Friendly name, assigned user, device type, first seen and last seen belong to the central registry and are edited there by an administrator; they are never baked into proposals, so attaching "Randy's Home Laptop" later does not rewrite history.
- **Unknown devices.** The first event from an ID the backend has not seen creates a registry row marked unknown; an administrator fills in the name and person later.
- **Proposal breadcrumb.** A `provenance` block at the top level of the Builder State (next to `pricingSnapshot`), written by one helper called where `attachPricingSnapshot` is already called: `{ schemaVersion: 1, createdOn: { deviceId, appVersion, at }, lastSavedOn: { deviceId, appVersion, at } }`. Because Update replaces the whole `builderState`, the helper must carry `createdOn` forward from the loaded state; otherwise the creating device would be lost on the first Update. Only the ID is stored (the owner's example also listed a name and a user, which can change). An optional human-readable label snapshot is an open choice.
- **Safety for pricing and reload.** Load and the pricing code read only the three known keys and `pricingSnapshot`; an extra top-level `provenance` key is ignored by them (C4), is kept in `loadedBuilderState`, and is included consistently in the Create-recovery comparison.

## Local versus central registry

- **Local save is complete on its own.** Phase 2 works with no backend: explicit save, edit, soft delete and restore, all device-local.
- **Central recording is an add-on.** Each save / update / delete / restore appends an event to a local outbox with a client-generated event id; a silent background flush posts batches to `recordRegistryEvents`; the backend appends them to `CustomCatalogHistory`, upserts the current entry in `CustomCatalog` as **pending**, upserts the device row, and returns the accepted event ids. Failures retry later and never show a message to normal users; a hidden Advanced section (the Advanced registry already supports adding sections) can show the outbox and history.
- **Approval is separate.** An entry becomes shared only when an administrator marks it approved in the sheet; only then would `doGet` deliver it as an additive key (like `enhancements`) for the frontend to merge as read-only shared entries. Retired entries stop being delivered but stay in the history.

# Phased Implementation Plan

*Interpretation. The owner's four phases hold; the code suggests splitting the first, adding a tiny prerequisite and moving the frontend-only Device ID earlier than the backend work. Each phase is meant to be one focused run.*

| Phase | Scope | Backend | Main risk and how to contain it |
|---|---|---|---|
| **0. Zero-system output seam** (small, standalone) | Make the empty-cart path of `updateProposalCartUI` / `updateProposalTerminal` reset `pureCopyText` (fixes C2 for System Changeout too), and let both functions ask "is there anything to render" through one small function. No custom feature yet. | none | It changes System behavior in one way (Create is refused once the last system is removed). Needs the owner's OK; prove the rest is byte-identical. |
| **1A. Custom core** | `proposalType` and `customProposal` state, sanitizer, the item model, the three presentations as custom blocks, a minimal Custom builder section (items, price, presentation), the Proposal Type control placed in Actions through a layout revision migration, Load / draft / `isBlank` / confirmation branch, tests. | none | The seams into shared code (render dispatch, Load, draft). Contain with a branch that never calls the pricing code and an automated check that System Changeout output is unchanged. |
| **1B. Intent, scope terms and wording** | Job intent, generic scope terms, the intro composer and its phrase table, the `customIntro` / `customClosing` template keys in Default Proposal Wording, Other / Custom term, brand / model and marker fields, reordering polish. | none | Wording and grammar; owner supplies the final sentences. |
| **2. Local Custom Catalog** | `platts_custom_catalog_v1`, explicit Save to Custom Catalog, temporary versus saved, manager (edit, soft delete, restore), catalog pre-fill of items, state-map classification. | none | Silent collection by accident; contained by making save an explicit action only, and by items owning their values. |
| **3A. Device identity (frontend only)** | Local Device ID creation, `provenance` in the Builder State (Create and Update, carrying `createdOn` forward), shown in Advanced diagnostics. Useful for System proposals immediately; independent of 1 and 2, so it can move earlier. | none | Update overwriting the creating device; contained by the carry-forward rule and a test. |
| **3B. Central registry (backend + outbox)** | `recordRegistryEvents` action, the three Sheet tabs, validation / caps / formula-safe writes / idempotency, local outbox and silent flush, hidden Advanced view. | **yes** (new action, tabs, redeploy) | Public unauthenticated endpoint; contained by validation, caps and never auto-approving. |
| **4. Admin consolidation and approval** | Review pending entries in the sheet, approve / retire, deliver approved entries to the frontend (additive `doGet` key), export / import, eventual promotion of approved items into built-ins. | **yes** | Merging near-duplicate entries; start with sheet-side review, no new UI. |

Order of dependencies: 0 before 1A; 1A before 1B; 2 after 1A; 3A any time after 0; 3B after 3A (and after 2 for catalog events); 4 after 3B.

# Deferred Decisions and Open Questions

- Default wording: the custom intro sentences, the custom closing text (the system warranty / registration text does not fit), and any validity clause.
- Whether a Proposal Type control should be a required component or an optional one with default placement (recommended: optional, default-placed).
- Same-name collision: accept for now, or add a custom naming suffix in the backend; and whether to add `proposalType` to the manifest and the Load list.
- Whether Custom items may later also appear as an extra group inside a System Changeout proposal (a hybrid), which the item model would allow but the owner has not asked for.
- Price handling: whole dollars versus cents, an "unpriced / quoted on request" option, sales tax or financing lines.
- Whether to store a human-readable device label with the proposal besides the ID.
- Device ID details: exact format and length, what the hidden admin view shows, and how an administrator maps a recovered or replaced device.
- Who approves central entries, and whether approved entries are delivered by `doGet` or by a separate action.
- Whether the Custom builder section should become a Design Profile surface (`page2.customBuilder`).
- The stale-text fix in Phase 0 changes System Changeout behavior slightly (a Create after removing the last system is refused); needs the owner's confirmation.
- Orphan scratchpads after removing a system: leave, or clean up in a separate small fix.

# Preserved Source Material

The complete handoff text as submitted, unchanged:

````text
PLATTS PROPOSAL — CUSTOM / STANDALONE PROPOSAL MODE RECONNAISSANCE

RECOMMENDED MODEL
Claude Sonnet 5.5

RECOMMENDED EFFORT
High

PROJECT ROOT

I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing

CURRENT BASELINE

Frontend:
v10.02.04

Backend:
v16.52.1

Canonical frontend:
Agent/retest.html
Agent/retest.txt

Backend:
script_changeout.gs
script_changeout.txt

==================================================
TASK TYPE
==================================================

Focused architecture reconnaissance / planning only.

DO NOT implement the feature yet.

DO NOT modify application source code.
DO NOT change versions.
DO NOT create archives.
DO NOT commit, push, or deploy.

The purpose of this pass is to inspect the CURRENT proposal-builder and managed-proposal architecture and produce a concrete implementation plan for a future Custom / Standalone Proposal mode.

==================================================
FEATURE GOAL
==================================================

The current Proposal Builder is primarily designed around HVAC system changeout proposals.

We need to support proposals that may contain NO full HVAC system selection.

Examples:

- bathroom exhaust fan
- whole-home dehumidifier
- bath fan + dehumidifier
- ERV / fresh-air equipment
- IAQ equipment
- ductwork
- dryer vent work
- condensate equipment
- miscellaneous HVAC-related component work
- one-off custom work

The existing System Changeout workflow must remain intact.

The proposed direction is:

Proposal Type:
- System Changeout
- Custom / Standalone

The Proposal Type selector will likely live in the Proposal Builder ACTIONS area.

When System Changeout is selected:
- preserve current behavior

When Custom / Standalone is selected:
- expose a purpose-built custom proposal builder
- do NOT require a selected full HVAC system
- create proper proposal blocks rather than merely abusing Smart Injector notes

==================================================
CURRENT PROPOSAL BUILDER STRUCTURE
==================================================

The current universal Proposal Builder structure includes:

- Summary
- Actions
- Bands

Inspect how these are currently represented and rendered.

Determine the cleanest place for:
- Proposal Type control
- custom proposal configuration UI
- custom item cards / rows
- pricing/presentation controls

Prefer reuse of the existing universal component/grid architecture where practical.

Do not redesign unrelated Proposal Builder layout work.

==================================================
CUSTOM / STANDALONE CONCEPT
==================================================

The intended workflow is approximately:

1. Proposal Type
   - System Changeout
   - Custom / Standalone

2. Job Intent / Action
Possible values:
   - Replace
   - Install New
   - Add / Upgrade
   - Repair / Modify

3. Generic Scope Selections
A multi-select or equivalent list containing common generic terms such as:

   - Bath Fan
   - Whole-Home Dehumidifier
   - ERV / Fresh Air Ventilator
   - Mini-Split
   - Thermostat
   - IAQ Device
   - UV Light
   - Ductwork
   - Dryer Vent
   - Condensate Pump
   - Exhaust Fan
   - Other / Custom

These generic selections may help generate an introductory scope sentence.

Example concept:

“Replace the existing bathroom exhaust fan and install a whole-home dehumidifier…”

Do NOT hard-code final wording in this reconnaissance.
Determine how the existing proposal intro/template system could support this cleanly.

4. Proposal Item Builder

Each actual proposal item should be capable of holding information such as:

   - generic type/category
   - action
   - proposal/display name
   - detailed description/scope
   - optional brand
   - optional model
   - pricing mode
   - price
   - ordering
   - optional acknowledgement / selection marker where applicable

The user must be able to type or paste an arbitrary actual item description.

Example:

Generic type:
Whole-Home Dehumidifier

Proposal item:
Aprilaire E100 Whole-Home Dehumidifier

Description:
[custom scope text]

5. Presentation / Pricing Mode

Potential modes:

A. Combined Package
Multiple items contribute to one combined investment.

B. Itemized
Each item displays its own investment.

C. Customer Options
Items become independently selectable proposal options.

Determine whether these three modes fit the CURRENT proposal block/output architecture cleanly.

If a better internal model is warranted, explain it.

==================================================
GENERIC INTRO VS DETAILED ITEMS
==================================================

We want a distinction between:

GENERIC SCOPE TERMS
Used to create readable introductory wording.

and

DETAILED PROPOSAL ITEMS
Used for actual equipment/service descriptions and pricing.

Example:

Generic intro:
“Replace the existing bathroom exhaust fan and install a whole-home dehumidifier…”

Detailed items:
- Panasonic / Broan bathroom exhaust fan...
- Aprilaire E100 whole-home dehumidifier...

Inspect the current intro, option, boilerplate, fees, upgrades and custom-line generation paths and determine how this distinction could be introduced without breaking System Changeout proposals.

==================================================
CUSTOM USER-ADDED CATALOG ITEMS
==================================================

Future custom proposal UI should support:

+ Add Custom Item

A technician may type something not present in the built-in list.

The entry may be:

A. temporary
   - used only on the current proposal

or

B. explicitly saved
   - becomes part of that browser/device’s reusable custom catalog

IMPORTANT CONCEPT:

Only explicit SAVE actions should turn an ad-hoc entry into reusable custom data.

Do not silently collect every typed value as reusable catalog data.

Potential UI concept:

[ ] Save to Custom Catalog

or another deliberate save mechanism.

==================================================
LOCAL CUSTOM REGISTRY + FUTURE CENTRAL REGISTRY
==================================================

We have also brainstormed a broader future architecture.

This is NOT necessarily part of the first Custom Proposal implementation.

We want to understand where it should fit cleanly.

A deliberately saved custom item may eventually:

1. save locally immediately
2. silently send a small backend event
3. be recorded centrally in Google Sheets
4. be available later for review/recovery/consolidation

Normal users should NOT receive noisy sync messages on successful saves.

A hidden/admin/debug area may eventually expose save/sync history.

Potential backend concepts:

CustomCatalog
- current known custom entries

CustomCatalogHistory
- append-only SAVE / UPDATE / DELETE / RESTORE events

Possible status:
- pending
- approved
- retired

Do NOT assume every locally saved custom entry becomes globally available immediately.

Central persistence and global approval are separate concepts.

==================================================
DEVICE / BROWSER INSTANCE ID
==================================================

We need a future way to identify the browser/device instance that created custom entries or proposals, even if the administrator never manually configured that device.

Do NOT attempt MAC-address access or hardware fingerprinting.

Preferred direction:

On first use, generate a random persistent application/browser-instance ID such as:

DEV-A7C94F21B6

Store it locally.

Reuse that same ID on subsequent activity from that browser profile.

Potential associated metadata:

- deviceId
- optional friendly device name
- optional assigned user
- device type
- first seen
- last seen
- app version

If an unknown browser/device appears:
- it gets a new Device ID automatically
- backend records it as unknown
- administrator can associate it with a person/device later

Friendly name and assigned user must remain separate from immutable Device ID.

Example:

deviceId:
DEV-A7C94F21B6

friendlyName:
Randy's Home Laptop

assignedUser:
Randy

One physical computer may create multiple IDs if different browser profiles/browsers are used.
That is acceptable.

Do NOT perform invasive device fingerprinting.

==================================================
DEVICE ID + MANAGED PROPOSAL STATE
==================================================

Inspect the existing managed proposal / Builder State architecture.

Currently the proposal Create/Update workflow captures structured Builder State.

Determine how future source metadata such as:

sourceDevice: {
  deviceId,
  deviceName,
  assignedUser
}

could be attached to saved proposal state WITHOUT interfering with proposal pricing/state reload behavior.

We want proposals to provide another breadcrumb for identifying an unknown Device ID later.

For example:

Unknown device DEV-ABC123 creates a proposal for a known customer/job.

Later an administrator determines who created that proposal.

The backend Device Registry can then associate DEV-ABC123 with the correct user/device without rewriting historical proposal records.

==================================================
STRUCTURED STATE / RECOVERY
==================================================

Inspect and document exactly what the current managed proposal system saves today.

Determine:

- where builderState is constructed
- how Create sends it
- how Update sends it
- where backend stores it
- how getProposalState retrieves it
- how Load reconstructs the proposal
- whether any sidecar JSON / structured state files are created
- what data is currently recoverable
- what is NOT currently recoverable

We specifically want to understand whether a future Custom / Standalone Proposal state can be added cleanly so saved proposals can be reopened and reconstructed just like System Changeout proposals.

Do not infer.
Trace the actual code.

==================================================
BACKEND / GOOGLE SHEETS POSSIBILITY
==================================================

Inspect the current Apps Script architecture only enough to answer:

1. Is there already an appropriate POST/action dispatcher for adding future small registry events?

2. Would a small action such as:

saveCustomCatalogEntry

or

recordCustomRegistryEvent

fit the existing backend pattern?

3. Could Apps Script write these events to a dedicated Google Sheets tab with minimal overhead?

4. What existing backend utilities could be reused?

5. What would need to be added?

DO NOT implement any Sheet tabs or backend actions in this pass.

==================================================
IMPORTANT SEPARATION
==================================================

Keep these concepts distinct:

1. Current proposal working state
2. Managed proposal saved Builder State
3. Built-in proposal catalog
4. Device-local custom catalog
5. Future central custom catalog
6. Device/browser registry
7. Append-only save/event history
8. Design Profiles
9. Smart Injector note presets

Do NOT merge these into one giant generic settings object.

==================================================
SMART INJECTOR
==================================================

Inspect the current Smart Injector.

It should remain useful for supplemental items such as:

- special notes
- customer responsibility notes
- one-off fees
- enhancements
- spacers

But Custom / Standalone proposal items should NOT merely be stored as Smart Injector lines if a proper proposal-item model is warranted.

Explain the boundary.

==================================================
RECONNAISSANCE QUESTIONS TO ANSWER
==================================================

Return concrete answers to at least:

1. What current functions require selected HVAC system rows?

2. Can Proposal Output currently render meaningfully with zero selected HVAC systems?

3. What validation blocks Create Proposal when there is no system selection?

4. Which current proposal blocks can be reused for custom proposals?

5. What new state model is recommended?

6. Where should Proposal Type live?

7. Where should the Custom Proposal builder UI live?

8. How should Combined / Itemized / Customer Options map into the existing output structure?

9. How should generic intro terms remain separate from detailed proposal items?

10. How should Custom Proposal state be captured into builderState?

11. What changes would Load/Update require?

12. Would backend proposal save/reload require schema changes or can it remain opaque?

13. What current proposal data is stored in structured form versus only rendered text?

14. Is there already a JSON/state file on Drive for managed proposals?
    Identify exact behavior.

15. What is the clean future hook for Device ID metadata?

16. What is the clean future hook for a Custom Catalog backend registry?

17. Can these features be implemented incrementally without touching pricing logic for normal System Changeout proposals?

==================================================
PHASING
==================================================

Recommend a focused phased implementation.

Prefer something approximately like:

PHASE 1
Custom / Standalone Proposal core
- Proposal Type
- custom item state model
- generic intro scope
- combined/itemized/options output
- save/load through managed Builder State
- no shared catalog sync yet

PHASE 2
Local reusable Custom Catalog
- deliberate Save to Custom Catalog
- temporary vs saved items
- local edit/delete/restore behavior

PHASE 3
Persistent Device ID + central registry
- browser-instance ID
- optional device/user assignment
- silent backend event logging
- Google Sheet registry/history

PHASE 4
Admin consolidation / approval
- review pending custom items
- approve/retire
- export/import or shared catalog delivery
- eventual promotion to built-ins

This phase outline is only a starting point.
Change it if the actual code suggests a safer sequence.

The goal is to prevent another oversized implementation run.

==================================================
DOCUMENTATION
==================================================

Create a permanent brainstorming source record under:

Brainstorming/

Suggested title/theme:

Custom Standalone Proposal and Local/Central Custom Registry Architecture

Use the actual current timestamp in the project’s established filename format.

The brainstorming record should preserve:

- the problem being solved
- design concepts above
- reconnaissance findings
- recommended data model
- proposed UI flow
- managed-proposal integration
- device-ID approach
- local/central registry distinction
- proposed phased implementation
- deferred decisions

Also update:

Brainstorming/TODO.md

Integrate the resulting phased feature work into the existing TODO without duplicating existing entries.

Do NOT remove unrelated TODO items.

==================================================
PROMPT HISTORY
==================================================

This is a deliberate IDE handoff.

Create the normal Prompt_History record using the project’s established convention.

Record:
- exact prompt verbatim
- exact final agent report verbatim
- task type
- recommended model/effort
- actual model/effort if exposed
- frontend/backend baseline
- files inspected
- files changed
- tests/checks
- Git/deploy status

Because this is reconnaissance/documentation only:
- frontend remains v10.02.04
- backend remains v16.52.1
- no application archive pair
- no version bump

==================================================
FINAL RESPONSE
==================================================

Return a concise but substantive report containing:

1. Current architecture findings.
2. Exact blockers/assumptions tied to selected HVAC systems.
3. Recommended Custom Proposal state model.
4. Recommended UI placement.
5. Recommended output model for Combined / Itemized / Customer Options.
6. Managed proposal save/load implications.
7. Device ID / registry findings.
8. Recommended implementation phases.
9. Documentation files created/updated.
10. Confirmation that:
    - no application code changed
    - no version changed
    - no archive created
    - no commit
    - no push
    - no deploy

Do not implement the feature in this run.
````
