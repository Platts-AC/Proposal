# Platts Proposal — Running TODO

This is a distilled tracking layer, not the archive of any brainstorm. Full rationale, nuance, alternatives and open questions live in the source brainstorm files in this folder. Never rely on this list instead of reading the original when detail matters.

## How to maintain this file

- Add an item only after its source brainstorm has been saved as its own permanent file in `Brainstorming/`.
- Keep each item short. Do not copy a brainstorm's detail here.
- Each item should have: a short title, a concise description, the source brainstorm filename, a status or note, and a prerequisite if important.
- Implementation handoffs go in `Prompt_History/`, not here. Record the outcome here by moving the item to Completed / Superseded with a note.
- Never delete brainstorm records. Update the entry here instead.
- Do not add guessed or historical work.

Entry format:

```text
- Short title
  - Concise description.
  - Source: `YYYY-MM-DD_HHMM_Subject-Brainstorm.md`
  - Status / note; prerequisite if important.
```

## Active / Near-Term

Roadmap consolidated 2026-10-04 (after v10.02.04). Items marked "Source: owner roadmap decision" come straight from the owner's roadmap, not from a brainstorm file; background lives in the brainstorm files and `Prompt_History/` records named in the Deferred section.

- Page 2 header migration
  - Migrate the current Page 2 header onto the newer universal grid / editor / component model proven in the Proposal Builder (component targets, anchors, nudge pad, custom labels, separate Desktop / Mobile layouts). Preserve existing behavior and controls.
  - Keep the Design Profile namespace `page2.header` (v10.02.04 already captures and restores the current header object under that id), so saved and exported profiles stay compatible through the migration where practical: re-register the same id with the new shape and keep reading the old one.
  - Source: owner roadmap decision 2026-10-04.
  - DONE 2026-10-05 (v10.05.00): the Page 2 header is a Proposal Builder region (`header`, beside summary / actions / bands) with the twelve components `header:logo`, `builderTitle`, `versionBadge`, `siteBadge`, `jobNotes`, `mic`, `theme`, `fullscreen`, `back`, `settings`, `text1`, `text2` (Back and the gear required), separate Desktop (the old 88 px header) and Mobile (three rows, Auto height, 38 px buttons) layouts, per-component appearance (size, nudge, vertical position, text and icon sizes, custom text per layout). Layout data revision 6 -> 7 (schema 3). The originals are moved into the cells (never cloned), so the duplicate ids are gone. A customized legacy header (`propSettings.page2Header`) is converted once into the DESKTOP header (the first two custom-text cells become `header:text1` / `text2`; locks, paddings, gaps and wrap modes are not representable); the legacy data is kept untouched except for one reset marker (`builderHeaderReset`). The `page2.header` Design Profile unit is kept for OLD profiles (apply = legacy data kept + converted into the Desktop header, or the Mobile header for a mobile-target profile); new profiles no longer capture it (the header is inside the Builder layouts). The old shared-grid header editor and renderer are kept as compatibility code (the renderer is guarded, the gear opens the Builder editor). Page Width is unchanged. Small hardening found on the way: a component id such as `__proto__` can no longer crash the layout sanitizer. Details: `Prompt_History/2026-10-05_0113_v10.05.00-v16.52.1_Page2-Header-Migration.md`.
- Page Width relocation (with the header / settings migration)
  - DONE 2026-10-05 (v10.05.01): the Page Width block (same markup, same ids, same state) moved out of Proposal Output Settings into a new static panel `#page-layout-settings-panel` that the Proposal Builder engine shows with its layout editor (the header Settings gear, or Edit Layout from Output Settings) and hides again for every other settings scope; exactly one control exists. No change to `propSettings.width` / `fixedWidth`, `changeout_prop_settings_v1`, the `page2.pageWidth` Design Profile unit, the Builder layout revision (still 7) or any header default. Verified on a 390 px phone (options and stepper fully on screen, mode and value kept across close / reopen). Details: `Prompt_History/2026-10-05_0342_v10.05.01-v16.52.1_Page-Width-Relocation.md`.
  - During the Page 2 header / settings migration, move Page Width out of Proposal Output Settings into the appropriate main Page 2 layout / settings area. Not a separate urgent task unless the header migration needs it.
  - Before v10.05.01: the control (Compact / Standard / Wide / Full / Fixed 800 to 2000 px) lives in Proposal Output Settings (v10.02.01), is stored in `changeout_prop_settings_v1` and is captured by the Design Profile unit `page2.pageWidth`; moving the control changes neither the storage nor the profile unit.
  - Source: owner roadmap decision 2026-10-04.

## Planned

Approximate order: further Design Profile namespaces as surfaces migrate, real-device tuning, promotion into built-in defaults, Proposal Output Settings organization. The small fix can be done any time.

- Register migrated surfaces in the Design Profile system
  - As other visual surfaces migrate, register them in the existing registry (`window.designProfiles.register`, platts_design_profiles_v1) instead of building new profile mechanisms. Candidates: Dispatch header, Customer header, Smart Scope / checklist appearance, Systems Sorter, Page 1 results grid (see the Deferred item), other migrated visual / layout surfaces.
  - Keep design state separate from working state and user workflow preferences (the v10.02.04 state map classifies every storage key). The future Custom Proposal builder section is a candidate surface (`page2.customBuilder`); the custom catalog, Device ID and outbox are not design state and must stay out of Design Profiles.
  - Source: owner roadmap decision 2026-10-04; foundation in `Prompt_History/2026-10-04_1048_v10.02.04-v16.52.1_Universal-Design-Profile-Foundation.md`.
  - Follows each surface migration; the Page 2 header is first (done in v10.05.00: it rides inside the Proposal Builder Desktop / Mobile layouts, so it needed no new profile unit; the legacy `page2.header` unit stays read-only for old profiles).
- Real-device mobile design tuning
  - Keep the Desktop / Mobile separation. Tune real mobile layouts on real devices and save named Design Profiles (for example Android Field, iPhone Field, Tablet); export / import between devices as needed.
  - No automatic Android / iPhone detection for now: named profiles and manual selection are enough until real use shows otherwise (see the Deferred item).
  - Source: owner roadmap decision 2026-10-04.
  - Practical now; the foundation exists (v10.02.04). Not yet tried on a physical device.
- Design Profile to built-in default promotion
  - A developer / IDE workflow that takes an accepted exported Design Profile JSON and promotes its values into the application's built-in source defaults. Workflow: real-device visual tuning, Save / Update Design Profile, export readable JSON, review the accepted profile, IDE agent promotes the approved values into the built-in defaults, clear the local override, verify the fallback matches the tuned design.
  - The browser itself must not rewrite source code. Replaces the earlier scattered "promote tuned layouts into built-in defaults" notes.
  - Source: owner roadmap decision 2026-10-04.
  - Needs an accepted real-device profile to be useful; no prerequisite in code.
- Proposal Output Settings organization
  - The panel mixes several concepts and is confusing. Reorganize into clearly separated areas, for example: Proposal Output Appearance / Behavior, Default Proposal Wording, Proposal Selection Marker, Saved Proposal Note Presets.
  - Clarify what Save Custom and Use Built-In mean for Default Proposal Wording. Make clear that proposal wording templates are not Design Profiles, that note presets are not Design Profiles, and that note presets only populate the injector.
  - Organizational and wording cleanup only, not a rewrite of proposal generation. Page Width has left this panel (relocated in v10.05.01). Custom / Standalone Proposal Phase 1A added one optional key there (Custom Proposal Closing Text); Phase 1B (v10.04.00) added no wording keys (the Custom intro is composed in code from a fixed phrase table), so any later Custom intro wording keys belong with or after this cleanup.
  - Source: owner roadmap decision 2026-10-04.
  - Small UX cleanup.
- Small known fix: Page 2 header custom-text escaping
  - The Page 2 header custom-text input does not escape its value attribute (found in v10.02.04), so a hand-typed double quote can break the field. Imported Design Profile data is already sanitized (angle brackets and double quotes are removed from header text); hand entry still needs the repair. Keep it a small isolated fix (a second custom-text input in the shared grid editor has the same pattern and can be checked at the same time).
  - Source: owner roadmap decision 2026-10-04; found in `Prompt_History/2026-10-04_1048_v10.02.04-v16.52.1_Universal-Design-Profile-Foundation.md`.
  - Do before or with the header migration, which replaces that editor.
  - DONE 2026-10-04 (v10.04.01): the value attribute now goes through the existing `escapePage2HeaderHtml` in the live shared-grid editor and in the dead legacy header editor copy (the shared editor also serves the Dispatch grid, which therefore gets the same repair). Details: `Prompt_History/2026-10-04_2330_v10.04.01-v16.52.1_Page2-Header-Custom-Text-Escaping-Fix.md`.
- Custom / Standalone Proposal mode (Phases 0, 1A, 1B)
  - Proposals with no full HVAC system (bath fan, dehumidifier, ERV, IAQ, ductwork, dryer vent, one-off work). A Proposal Type (System Changeout or Custom / Standalone, chosen in the Actions area) and a purpose-built Custom builder: job intent, generic scope terms for the intro only, and real proposal items (generic type, action, name, description, brand / model, price, role), presented as Combined Package, Itemized or Customer Options. System Changeout stays untouched; the Smart Injector stays for supplemental notes and fees and is not the item store.
  - Recommended state: `proposalType` and `customProposal` inside `proposalAppState` (so Create, Update, the working draft and Load carry it with no backend change); custom blocks with their own targets; no pricing-engine involvement.
  - Phase 0 DONE 2026-10-04 (v10.02.05): the stale-output hazard is fixed at its root. Both renderers now ask one seam, `hasRenderableProposalContent()` (today: one or more selected system rows), and when it says no, `resetProposalOutputState()` clears `pureCopyText`, the cached text, the block lists and the terminal (only rendered output; state, scratchpads, injected lines and settings are untouched). No Create guard was added (it would conflict with future zero-row custom proposals); the empty output now fails the existing "Missing ... Proposal Output" check. Phase 1A extends `hasRenderableProposalContent()` for the custom type. Details: `Prompt_History/2026-10-04_1302_v10.02.05-v16.52.1_Proposal-Empty-State-and-Stale-Output-Fix.md`.
  - Phase 1A DONE 2026-10-04 (v10.03.00): `proposalType` / `customProposal` inside `proposalAppState` (one sanitizer for the live state, the working draft and Load), the `control:proposalType` Proposal Builder component (layout data revision 6, one-time migration), the Custom Proposal panel (presentation, package title, item cards with add / remove / move), Combined / Itemized / Customer Options blocks with their own targets, the type-aware render seam, Create / Update / Load (type-aware confirmation, no pricing snapshot for Custom), draft support, New Quote reset and a distinct managed file name `<date> - <customer> - Custom - Proposal` (frontend only; no backend change). Details: `Prompt_History/2026-10-04_1450_v10.03.00-v16.52.1_Custom-Standalone-Proposal-Core.md`.
  - Phase 1B DONE 2026-10-04 (v10.04.00): Job Intent (Replace / Install New / Add-Upgrade / Repair-Modify, stored `replace` / `install` / `upgrade` / `repair`, blank allowed), a 12-term generic Scope multi-select with an Other / Custom text field (`customProposal.scopeTerms` as normalized ids, `customProposal.otherScope`), a deterministic intro composer (fixed phrase table, no generated text; fallback "We are pleased to provide this proposal for the following work."), item "Type" (same vocabulary as Scope) and Action (same four values as Job Intent), and display-name-first item headings without repeated brand / model or "Action Type" wording. One sanitizer; Phase 1A values (`addUpgrade`, `repairModify`, `iaqDevice`, `uvLight`, the `{ termId }` scope form) are mapped on load. Pricing, presentation modes, the selection marker, the closing text, Create / Update / Load, the draft and the v10.03.01 type-switch warning are unchanged; frontend only, no backend change. No intro wording keys were added to Default Proposal Wording (the phrase table lives in code). Details: `Prompt_History/2026-10-04_2233_v10.04.00-v16.52.1_Custom-Proposal-Intent-Scope-and-Wording.md`.
  - v10.03.01 (2026-10-04): Update of a loaded managed proposal whose Proposal Type changed since it was loaded or last saved now asks for an explicit "Continue Update" (wording names both types); fresh proposals, Create and unchanged-type Updates never warn. Runtime only (read from the loaded proposal's runtime Builder State copy), no new stored field, no backend change. Details: `Prompt_History/2026-10-04_1600_v10.03.01-v16.52.1_Managed-Proposal-Type-Switch-Update-Warning.md`.
  - Source: `2026-10-04_1219_Custom-Standalone-Proposal-and-Local-Central-Custom-Registry-Architecture-Brainstorm.md`; findings and plan: `Prompt_History/2026-10-04_1219_v10.02.04-v16.52.1_Custom-Standalone-Proposal-Reconnaissance.md`.
  - Next: Phases 0, 1A and 1B are done; the later phases (2 to 4) below stay deferred until requested. Open decisions are listed in the brainstorm record (whether Proposal Type should become a required component, price format, intro and closing wording). Decided in Phase 1A: the Custom file name is built by the frontend as `... - Custom - Proposal`; an exact "Custom Proposal" suffix would need a one-line backend change.

## Deferred / Revisit Later

Most of these wait on the reconnaissance items below. None is an approved implementation task. The three items directly below are roadmap entries added 2026-10-04; the older items follow (nested grids are the existing "Nested-cell component composition" entry).

- Universal Design Profile: Page 1 expansion
  - Later, extend the Design Profile system to the Page 1 visual / layout state, using the existing registry (one more namespace, not another profile system). Design-only state: results-grid dimensions, column widths, row / column gaps, pill and subdivision geometry, label positions, custom labels, label / data font sizes, alignments and other purely visual Page 1 settings.
  - Explicitly excluded: filters, selected systems, customer / job data, current quote / proposal state, working / runtime state and any other non-design data (the Page 1 state `changeout_state_v1` mixes both, so the capture must pick fields, not copy the object).
  - Keep the existing Page 1 Layout Vault (`changeout_profiles_v1`) untouched for backward compatibility until the Design Profile system fully supersedes it.
  - Source: owner roadmap decision 2026-10-04; related research: "Audit existing grid/state models".
  - Deferred; after more surfaces have migrated and registered.
- Storage audit by namespace
  - A focused audit of persistent browser storage that classifies and reports it as design state, working state, preferences and legacy / unknown (the v10.02.04 state map is the starting classification), to find large or obsolete namespaces and see what the application actually stores.
  - Do not confuse the browser's origin-storage estimate (shown in Advanced diagnostics) with the localStorage quota, and make no speculative quota claims.
  - Source: owner roadmap decision 2026-10-04.
  - Deferred.
- Device-specific profile automation
  - Automatic Android / iPhone / tablet detection or profile selection, only if real use shows named profiles and manual selection are not enough.
  - Source: owner roadmap decision 2026-10-04.
  - Deferred; see the Planned item on real-device tuning.
- Local Custom Catalog (Custom Proposal Phase 2)
  - Device-local reusable custom items and scope terms (`platts_custom_catalog_v1`, soft delete with restore). Only an explicit "Save to Custom Catalog" creates an entry; typed values stay in the proposal item, and a proposal item always owns its values so a saved proposal loads on any device. Never captured by a Design Profile; classify it in the state map when created.
  - Source: `2026-10-04_1219_Custom-Standalone-Proposal-and-Local-Central-Custom-Registry-Architecture-Brainstorm.md`
  - Deferred; after Phase 1A.
- Device ID and proposal provenance (Custom Proposal Phase 3A)
  - A random persistent browser-instance ID (for example `DEV-A7C94F21B6`, created at first save, no hardware fingerprinting) and a `provenance` block in the Builder State (created-on and last-saved-on device, app version, time), added beside `attachPricingSnapshot` at Create and Update. Update replaces the whole Builder State, so the creating device must be carried forward. Friendly name and assigned user stay in the central registry, never in the proposal. Frontend only; independent of the custom proposal work and can be pulled forward.
  - Source: `2026-10-04_1219_Custom-Standalone-Proposal-and-Local-Central-Custom-Registry-Architecture-Brainstorm.md`
  - Deferred; no prerequisite except the owner's go-ahead.
- Central custom registry (Custom Proposal Phase 3B)
  - A silent `recordRegistryEvents` backend action (batch, idempotent by event id) fed by a device-local outbox, writing Sheet tabs `CustomCatalogHistory` (append-only SAVE / UPDATE / DELETE / RESTORE), `CustomCatalog` (current entries, status pending / approved / retired) and `Device_Registry`; no messages for normal users, a hidden Advanced view for history. The endpoint is unauthenticated like the existing ones, so validate, cap sizes, write formula-safe text and never auto-approve. Needs a backend change and redeploy.
  - Source: `2026-10-04_1219_Custom-Standalone-Proposal-and-Local-Central-Custom-Registry-Architecture-Brainstorm.md`
  - Deferred; after Phases 2 and 3A. Related: "Storage audit by namespace" (the new local keys and the outbox become namespaces to classify).
- Custom registry admin consolidation and approval (Custom Proposal Phase 4)
  - Sheet-side review of pending entries (modeled on the existing `Audit_Approval` to `Audit_History` flow), approve / retire, delivery of approved entries to the frontend as an additive `doGet` key (like `enhancements`), export / import, and eventual promotion of approved items into built-ins.
  - Source: `2026-10-04_1219_Custom-Standalone-Proposal-and-Local-Central-Custom-Registry-Architecture-Brainstorm.md`
  - Deferred; after Phase 3B.

- Standardize the selected-object visual inspector
  - Type-aware controls for the selected object, shared across editors.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Deferred; after reconnaissance.
  - Impl 2026-10-03 (v10.02.00): the Proposal Builder editor has a component-aware appearance inspector, kept apart from cell geometry and saved per profile (text size and fine tune, icon size, gap, text and vertical alignment, nudge, message density; Reset Component Appearance). Not shared with other editors yet. Details: `Prompt_History/2026-10-03_2341_v10.02.00-v16.52.1_Proposal-Component-Styling-and-Pricing-Snapshot.md`.
  - Impl 2026-10-04 (v10.02.01): the Proposal Builder X / Y nudge is now a compact reusable arrow pad (`window.renderNudgePad`, 1 px steps, Shift 4 px, center resets); it can later serve the Page 2 header editor and other surfaces. Deferred idea: a percentage readout / entry helper for ratios (0.10 can read as 9%, 0.20 as 17% depending on siblings) that converts a target percentage back into a sibling ratio. Details: `Prompt_History/2026-10-04_0622_v10.02.01-v16.52.1_Page2-Width-and-Nudge-Pad.md`.
  - Impl 2026-10-04 (v10.02.02): the Proposal Builder inspector can position a component, its text or its icon (capability-driven targets, one reusable arrow pad), choose the icon position (Left / Right / Top / Bottom) and nudge without changing any geometry (transform based). Layout data revision 4, schema still 3. This is the component model intended for reuse in the Page 2 header migration. Details: `Prompt_History/2026-10-04_0749_v10.02.02-v16.52.1_Component-Subtarget-Positioning.md`.
  - Impl 2026-10-04 (v10.02.03): the inspector now has independent Text and Icon alignment (Left / Center / Right, Top / Middle / Bottom; Auto is not stored) next to the existing Content group alignment, a +/-100 px nudge range (+/-40 compact, Shift 5 px) and a per-profile custom visible label for ten components (Reset label, plain text, 80 characters). All transform based, so no geometry changes. Layout data revision 5, schema still 3. Details: `Prompt_History/2026-10-04_0859_v10.02.03-v16.52.1_Target-Alignment-and-Custom-Labels.md`.
  - Note 2026-10-04 (v10.02.04): all inspector appearance values (labels, anchors, nudges, ratios) now travel inside Design Profiles as part of the Proposal Builder layouts; no inspector change in this version. Details: `Prompt_History/2026-10-04_1048_v10.02.04-v16.52.1_Universal-Design-Profile-Foundation.md`.
- Standardize the Mapping/Contents picker with component registries
  - One familiar picker offering this-section, other-section and global components.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Deferred; needs the component-registry reconnaissance first.
  - Addendum: registry is controlled (no arbitrary HTML/JS in cells); definition versus instance kept separate; registered link/tool components. Source: `2026-10-02_1832_Component-Registry-Nested-Grid-and-Proposal-Pilot-Brainstorm.md`
  - Impl 2026-10-03 (v10.01.6): first required-singleton component in the Proposal Builder (the settings gear): runtime capability flags (singleton, required, movable, removable, duplicable, allowed surfaces), Move-only editing and sanitizer re-insertion; no registry yet. Details: `Prompt_History/2026-10-03_1051_v10.01.6-v16.52.1_Proposal-Protected-Settings-Component.md`.
  - Impl 2026-10-03 (v10.01.7): the runtime capability metadata (allowed regions, singleton, required, movable) now spans three region kinds (summary, actions, band) and two required singletons (settings gear, message region); still no global registry. Details: `Prompt_History/2026-10-03_1225_v10.01.7-v16.52.1_Proposal-Bands-and-Ratio-Geometry.md`.
  - Impl 2026-10-03 (v10.01.8): the Smart Injector controls (Saved preset, Load preset, category, Acknowledge, price, text, Mic, Add) are original-node components in the same runtime capability table, which gained a fill mode (both, width, natural); components not placed in a layout are listed and can be placed from the editor. `#active-injections-container` and the rest of the app stay unmapped; still no global registry. Details: `Prompt_History/2026-10-03_1414_v10.01.8-v16.52.1_Proposal-Injector-and-Cell-Fill.md`.
  - Impl 2026-10-03 (v10.01.09): the runtime capability metadata gained availability and hint fields for actionable conditional controls. Global/Utility tools (storage meter, clock, version, status) and the component style inspector are not started and remain for the later registry brainstorm. Details: `Prompt_History/2026-10-03_1717_v10.01.09-v16.52.1_Proposal-Working-Draft-and-Runtime-UX.md`.
  - Impl 2026-10-03 (v10.02.00): the runtime capability metadata gained style, icon and wrap fields. Still deferred: Global / Utility component registry; the This Section / Other Sections / Global source selector; duplicated display instances; storage meter and clock components; nested component grids; component-associated contextual bands; ratio locking; migration of other Page 2 sections; real authorization for administrative settings. Details: `Prompt_History/2026-10-03_2341_v10.02.00-v16.52.1_Proposal-Component-Styling-and-Pricing-Snapshot.md`.
  - Impl 2026-10-04 (v10.02.01): one reusable storage status (`window.getStorageStatus`, from the existing Layout Vault accounting) is shown in Advanced diagnostics. Still deferred: the Global / Utility storage-meter component built on it, and the Page 2 header migration (the next planned step now that the Page 2 width controls are back). Details: `Prompt_History/2026-10-04_0622_v10.02.01-v16.52.1_Page2-Width-and-Nudge-Pad.md`.
  - Consolidated 2026-10-04: the "next planned" notes recorded with v10.02.02, v10.02.03 and v10.02.04 (Page 2 header migration, Page Width relocation, further Design Profile namespaces, promotion of tuned design into built-in defaults, storage breakdown by namespace, nested grids, header custom-text escaping) now have their own entries under Active / Near-Term, Planned and Deferred above. Origin: `Prompt_History/2026-10-04_0749_v10.02.02-v16.52.1_Component-Subtarget-Positioning.md`, `Prompt_History/2026-10-04_0859_v10.02.03-v16.52.1_Target-Alignment-and-Custom-Labels.md` and `Prompt_History/2026-10-04_1048_v10.02.04-v16.52.1_Universal-Design-Profile-Foundation.md`.
- Conditional-component placeholders in Editor Mode
  - Ghosted placeholders for runtime-conditional components (for example Update, PDF/DOC links).
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Deferred; depends on Editor Mode and the registry.
  - Impl 2026-10-03 (v10.01.4): the Proposal Builder Layout editor labels each slot and flags runtime-conditional components (Update, DOC/PDF, loaded indicator). Slots keep a minimum size and the default stacks use natural height, so appearing components do not shift neighbors. Details: `Prompt_History/2026-10-03_0639_v10.01.4-v16.52.1_Proposal-Builder-Custom-Grid-Implementation.md`.
  - Advanced 2026-10-03 (v10.01.5): the Proposal Builder editor now draws conditional components (Update, DOC, PDF, loaded indicator) as the real elements through editor-only CSS; runtime hidden classes are never touched. Details: `Prompt_History/2026-10-03_0843_v10.01.5-v16.52.1_Proposal-Builder-Collapse-and-Edit-Preview-Refinement.md`.
  - Advanced 2026-10-03 (v10.01.8): the conditional injector price input is previewed as the real element in the editor too; its runtime hidden class and the category selection are never touched. Details: `Prompt_History/2026-10-03_1414_v10.01.8-v16.52.1_Proposal-Injector-and-Cell-Fill.md`.
  - Advanced 2026-10-03 (v10.01.09): at runtime too, the actionable conditional controls of the Proposal Builder (Update, DOC, PDF, note price) now stay in their cells, muted and disabled, until they are valid, instead of vanishing and leaving holes; informational displays (the loaded proposal box) still collapse when empty. Details: `Prompt_History/2026-10-03_1717_v10.01.09-v16.52.1_Proposal-Working-Draft-and-Runtime-UX.md`.
- Reserved status/message regions
  - Give Create/Update status and warning text a designated slot so it stops disturbing neighboring controls.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Deferred; use where it helps.
  - Recon 2026-10-02: the shift is caused by conditional items (status, links, Update, indicator) entering one wrapping row, not by wrapping alone; reserved slots with append-only growth would stabilize it. Details: `Prompt_History/2026-10-02_1847_v10.01.3-v16.52.1_Proposal-Builder-Grid-Reconnaissance.md`.
  - Implemented 2026-10-03 (v10.01.4) for the Proposal Builder only: a full-width stacking banner region above the grid (zero height when empty); the original status node is the primary banner. Other surfaces remain open. Details: `Prompt_History/2026-10-03_0639_v10.01.4-v16.52.1_Proposal-Builder-Custom-Grid-Implementation.md`.
  - Advanced 2026-10-03 (v10.01.5): the Proposal Builder message region moved into the persistent summary strip, so banners stay visible while the section is collapsed. Details: `Prompt_History/2026-10-03_0843_v10.01.5-v16.52.1_Proposal-Builder-Collapse-and-Edit-Preview-Refinement.md`.
  - Advanced 2026-10-03 (v10.01.7): the Proposal Builder message region is now a required, movable component that lives in reusable full-width bands (stacks and splits, Auto or minimum height, collapsed-state policy); per-sibling weight locks and component-owned contextual bands stay open. Details: `Prompt_History/2026-10-03_1225_v10.01.7-v16.52.1_Proposal-Bands-and-Ratio-Geometry.md`.
  - Advanced 2026-10-03 (v10.02.00): the Proposal Builder message region has its own appearance controls (text size, fine tune, alignment, vertical position, density), independent of band height. Details: `Prompt_History/2026-10-03_2341_v10.02.00-v16.52.1_Proposal-Component-Styling-and-Pricing-Snapshot.md`.
- Persist panel/layout overrides through the user-settings system
  - Saved overrides with fallback to defaults, including desktop/mobile variants.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Deferred; depends on the responsive-storage research item.
  - Advanced 2026-10-03 (v10.01.4): Proposal Builder layouts are stored as sparse per-profile overrides at `proposalBar.layouts.desktop` and `proposalBar.layouts.mobile` (schemaVersion 1) in `changeout_user_settings_v1`; reset deletes only the selected override. Details: `Prompt_History/2026-10-03_0639_v10.01.4-v16.52.1_Proposal-Builder-Custom-Grid-Implementation.md`.
  - Advanced 2026-10-03 (v10.01.5): Proposal Builder layout schema is now v2 (`surfaces.summary` and `surfaces.actions` per profile); v10.01.4 layouts migrate without being rewritten; Summary and Actions reset separately. Details: `Prompt_History/2026-10-03_0843_v10.01.5-v16.52.1_Proposal-Builder-Collapse-and-Edit-Preview-Refinement.md`.
  - Advanced 2026-10-03 (v10.01.7): Proposal Builder layout schema is now v3 (`surfaces.summary`, `surfaces.actions` with a height, and an ordered `bands` list); v10.01.6 layouts migrate without being rewritten, `messagePlacement` becomes a band. Details: `Prompt_History/2026-10-03_1225_v10.01.7-v16.52.1_Proposal-Bands-and-Ratio-Geometry.md`.
  - Advanced 2026-10-03 (v10.01.8): the layout schema stays v3 with a `revision` data field (2 = injector components exist); a v10.01.7 layout gets one default injector band appended once per profile on load, without rewriting stored data, and a component the user leaves unplaced stays unplaced. Details: `Prompt_History/2026-10-03_1414_v10.01.8-v16.52.1_Proposal-Injector-and-Cell-Fill.md`.
  - Advanced 2026-10-03 (v10.02.00): the layout schema stays v3 with data revision 3 and an optional per-component `styles` map; ratios are stored in hundredths and heights in 5 px steps; a restrained editor appearance is stored separately at `proposalBar.editor`. v10.01.09 layouts load unchanged. Managed proposals now also save a `pricingSnapshot` inside their Builder State (no backend change). Details: `Prompt_History/2026-10-03_2341_v10.02.00-v16.52.1_Proposal-Component-Styling-and-Pricing-Snapshot.md`.
  - Note 2026-10-04 (v10.02.01): the Page 2 width mode (Compact / Standard / Wide / Full / Fixed 800 to 2000 px) is back in the Proposal Output settings and sizes the Page 2 header and body together; it stays in the existing device-local `changeout_prop_settings_v1`, and phones are always full width. Details: `Prompt_History/2026-10-04_0622_v10.02.01-v16.52.1_Page2-Width-and-Nudge-Pad.md`.
  - Advanced 2026-10-04 (v10.02.02): optional per-component `textNudgeX/Y`, `iconNudgeX/Y` and `iconPosition` in `layout.styles` (sparse, +/-20 px, data revision 4); revision 3 layouts load unchanged. Promotion of tuned layouts into the built-in defaults remains a later step. Details: `Prompt_History/2026-10-04_0749_v10.02.02-v16.52.1_Component-Subtarget-Positioning.md`.
  - Advanced 2026-10-04 (v10.02.03): optional per-component `textAnchorX/Y`, `iconAnchorX/Y` and `customLabel` in `layout.styles` (sparse, data revision 5); revision 3 and 4 layouts load unchanged. Promotion of tuned layouts into the built-in defaults remains a later step. Details: `Prompt_History/2026-10-04_0859_v10.02.03-v16.52.1_Target-Alignment-and-Custom-Labels.md`.
  - Impl 2026-10-04 (v10.02.04): Universal Design Profile foundation. Named, portable design profiles (`platts_design_profiles_v1`, schema 1) capture and apply only registered design namespaces (Proposal Builder Desktop / Mobile layouts and editor appearance, Page 2 page width, existing Page 2 header layout) through a registry (`window.designProfiles.register`); Save New / Update / Load / Rename / Delete / Export / Import / Backup all in a dialog opened from Page 1 Settings and the Proposal Builder Advanced area. Never holds job, customer, proposal, pricing or draft data; separate from the Layout Vault. Further namespaces, the Page 1 expansion and promotion into built-in defaults are tracked as their own entries (Planned / Deferred). Details: `Prompt_History/2026-10-04_1048_v10.02.04-v16.52.1_Universal-Design-Profile-Foundation.md`.
- Registered tool/link components
  - A generic registered link component (id, label, URL, icon, tab behavior, visibility rules) for tools such as QuickStash, Diagnostics and Job Portal, placed through Mapping/Contents.
  - Source: `2026-10-02_1832_Component-Registry-Nested-Grid-and-Proposal-Pilot-Brainstorm.md`
  - Deferred; depends on the component registry.
- Nested-cell component composition
  - Compose a cell from smaller mapped components through a nested grid (for example price plus tags).
  - Source: `2026-10-02_1832_Component-Registry-Nested-Grid-and-Proposal-Pilot-Brainstorm.md`
  - Deferred; wait for the nested-grid research item below.
  - Note 2026-10-04 (v10.02.01): manual testing showed that tall cells holding a short, natural-height control are useful room for a future grid inside a cell (independently mapped badges, labels and internal controls). Still deferred. Details: `Prompt_History/2026-10-04_0622_v10.02.01-v16.52.1_Page2-Width-and-Nudge-Pad.md`.
  - Roadmap 2026-10-04 (owner decision): this is the universal-editor nested grid / container item. A cell or region may contain another structured container / grid only when a migrated surface genuinely needs more hierarchy than the flat model gives. Wait until the Section, Region, Container, Stack, Split (cell) model is proven across more surfaces, and avoid arbitrary HTML / JS composition. Deferred.

## Research / Reconnaissance Needed

- Audit existing grid/state models against the proposed universal layout architecture
  - Compare Page 1 column/pill/subdivision, Page 2 container/stack/split, Dispatch and Sorter. Identify what can be adapted without replacing working systems.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - First step before any implementation.
  - Recon 2026-10-02: two families, not four copies. Page 2 header and Dispatch already share one renderer, editor and split schema; Page 1 and the Sorter are data-driven templates repeated per row. Page 1 differs from container/stack/split in sizing, mapping and selection persistence. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
- Page 2 shared-grid selection/highlight as the basis for a general Editor Mode
  - Determine whether it can carry a broader click-to-select Editor Mode.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Recon 2026-10-02: highlight lives inside the `renderSharedGrid` re-render and is tied to the settings modal being open. Actions are suppressed only for Page 2 header clones, not for Dispatch buttons. Click wiring is inline or property based, so one capture-phase interceptor is feasible. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
  - Impl 2026-10-03 (v10.01.4): the Proposal Builder editor blocks control actions with one capture-phase click handler plus `inert` on the moved originals; tested, no Create request is sent while editing. Finding (pre-existing, not fixed): `window.sanitizePage2HeaderSettings` is defined only when saved Page 2 settings exist, so a browser with no `changeout_prop_settings_v1` throws in `renderSharedGrid` and `toggleProposalSettings`. Details: `Prompt_History/2026-10-03_0639_v10.01.4-v16.52.1_Proposal-Builder-Custom-Grid-Implementation.md`.
  - Impl 2026-10-03 (v10.01.5): the Proposal Builder now blocks actions with one capture-phase handler on the section `<details>` plus `inert`, across both of its surfaces; real-click tests show no action, request, navigation or setting change while editing. Details: `Prompt_History/2026-10-03_0843_v10.01.5-v16.52.1_Proposal-Builder-Collapse-and-Edit-Preview-Refinement.md`.
- Component registry reuse
  - How a registry could reuse existing mappings and actions without duplicating business logic.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Recon 2026-10-02: two partial registries exist (`page2HeaderExternalMappingRegistry`, `dispatchExternalMappingRegistry`) plus hard-coded mapping lists. There is no central action table. Duplicate safety is blocked mainly by id-based lookups and captured node references. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
- Responsive regular/mobile layout storage
  - How layout variants are stored and how defaults interact with saved overrides.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Recon 2026-10-02: localStorage is per device, so phone and desktop settings are already separate. A base layout plus sparse compact overrides fits the user-settings layer for numeric and visual values; structural variants only if a real need appears. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
  - Impl 2026-10-03 (v10.01.4): the Proposal Builder uses two complete layouts (desktop, mobile) instead of a base plus compact overrides, so the profiles can differ in structure. Mode comes from Force Desktop, then the 640 px convention; a landscape phone (640 px or wider) uses the desktop profile. Details: `Prompt_History/2026-10-03_0639_v10.01.4-v16.52.1_Proposal-Builder-Custom-Grid-Implementation.md`.
- Representation of section-level expandable regions
  - Persistent full-width bar plus an arbitrary expandable grid.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Recon 2026-10-02: a `<details>` whose `<summary>` holds a shared grid already exists (Dispatch). A region object can be added incrementally; only one region can be sticky. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
- Representation of fixed-container expand-to-fill stack groups
  - Contiguous stacks with one anchor; outer container height unchanged.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Recon 2026-10-02: summing weights is not exact, because hiding stacks removes gaps and locked-pixel stacks do not scale. It needs gap and pixel compensation and stable stack ids. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
- Evaluate dormant Dispatch nudge/lock code for safe reuse
  - Nudge pad, step selector, px locks and related controls found unreachable in the earlier audit.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Recon 2026-10-02: the schema fields (offsets, locks, wrap, overflow, controlSize) already exist and the renderers apply them; the shared editor has no controls for them. The legacy functions can be adapted to the shared selection state. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
  - Note 2026-10-03 (v10.02.00): the Proposal Builder got its own clamped nudge and appearance controls; the dormant Dispatch nudge/lock code and the Dispatch appearance code were not reused or changed. Details: `Prompt_History/2026-10-03_2341_v10.02.00-v16.52.1_Proposal-Component-Styling-and-Pricing-Snapshot.md`.
- Check action suppression while editing the Dispatch grid
  - Found in code only (not run): in Dispatch grid edit mode the Take Photo, Choose Photo, Extract and gear components keep live click handlers, unlike the Page 2 header clones.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Confirm in a browser before relying on it; relevant to any Editor Mode design. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
- Decide the fate of unreachable legacy editors
  - Legacy Dispatch tabs (layout, mapping, align/font) and the old Page 2 header editor cannot be reached from the UI but still hold fine-tuning code and stale-looking state.
  - Source: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`
  - Roadmap note 2026-10-04: the old Page 2 header editor is part of the Page 2 header migration (Active / Near-Term), so this decision is due with it.
  - v10.05.00 note: the Page 2 header migration kept the old shared-grid header editor and renderer as compatibility code on purpose (migration first, cleanup later): the renderer is guarded while the Builder header is active and the gear no longer opens the old editor. The decision to retire it is still open, together with the vestigial header settings (`desktopLayout`, `mobileLayout`, `metadataPosition`, `controlsPosition`, `showMic`, `showTheme`, `showFullscreen`).
  - Decide restore-selectively versus retire; do not delete without a decision. Details: `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
- Evaluate one-level nested-grid (containerized cell) support
  - Can the shared-grid schema hold one nested level without recursion everywhere; reduced or full schema; editor breadcrumb and responsive behavior.
  - Source: `2026-10-02_1832_Component-Registry-Nested-Grid-and-Proposal-Pilot-Brainstorm.md`
  - Note 2026-10-04: tracked with the deferred "Nested-cell component composition" entry; start only after the flat model is proven across more surfaces.
- Map Page 1 tags/badges to registered components
  - Determine how the coastal price difference and site/Oceana tags could become mapped components without changing pricing or filter behavior.
  - Source: `2026-10-02_1832_Component-Registry-Nested-Grid-and-Proposal-Pilot-Brainstorm.md`

## Completed / Superseded

- Compare the Proposal Builder action/status area against Page 2 as the first pilot
  - The structural reconnaissance recommended Page 2 Header and Dispatch first; the addendum prefers considering the Proposal Builder area first. Compare options with source evidence.
  - Source: `2026-10-02_1832_Component-Registry-Nested-Grid-and-Proposal-Pilot-Brainstorm.md`
  - Decision pending; see `Prompt_History/2026-10-02_0648_v10.01.3-v16.52.1_Universal-Grid-Structural-Reconnaissance.md`.
  - Recon 2026-10-02: source and phone screenshots support the Proposal Builder bar as the first new surface (go). No code depends on the controls' DOM position. Details: `Prompt_History/2026-10-02_1847_v10.01.3-v16.52.1_Proposal-Builder-Grid-Reconnaissance.md`.
  - Completed 2026-10-03: the Proposal Builder bar was chosen and implemented first (v10.01.4). Details: `Prompt_History/2026-10-03_0639_v10.01.4-v16.52.1_Proposal-Builder-Custom-Grid-Implementation.md`.
- Audit the minimum Proposal Builder grid conversion
  - Smallest conversion of the action/status area that leaves Create, Update and Load logic completely untouched, including a reserved status slot.
  - Source: `2026-10-02_1832_Component-Registry-Nested-Grid-and-Proposal-Pilot-Brainstorm.md`
  - Recon 2026-10-02: smallest safe slice is a reserved-slot grid shell that moves the original nodes (no clones), a default layout, one sanitizer, no editor. Create, Update and Load code stays untouched. Details: `Prompt_History/2026-10-02_1847_v10.01.3-v16.52.1_Proposal-Builder-Grid-Reconnaissance.md`.
  - Completed 2026-10-03: implemented as a custom grid (original nodes moved, default layouts, sanitizer, layout editor) with Create, Update and Load logic untouched (v10.01.4). Details: `Prompt_History/2026-10-03_0639_v10.01.4-v16.52.1_Proposal-Builder-Custom-Grid-Implementation.md`.
