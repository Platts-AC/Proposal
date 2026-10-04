# Metadata

| Field | Value |
|---|---|
| Filing date / time | 2026-10-02 06:16 (24-hour local) |
| Topic | Universal grid / visual editor architecture: Editor Mode, selected-object inspector, component registry, desktop/mobile variants, expandable regions |
| Source | ChatGPT / user brainstorming discussion, filed through an IDE handoff |
| Current frontend version | v10.01.3 |
| Current backend version | v16.52.1 |
| Status | **Brainstorm / not approved implementation.** Nothing here is an instruction to build. |
| Related records | `Prompt_History/2026-10-02_0438_v10.01.3-v16.52.1_Modal-Editor-Pattern-Deep-Audit.md` and `Prompt_History/2026-10-01_1840_v10.01.3-v16.52.1_UI-Profile-Modal-Settings-Audit.md` (the two read-only audits the discussion refers to); `Brainstorming/TODO.md` (distilled follow-ups only) |

The sections below are preserved from the submitted brainstorm, copied as written. The last section holds the complete submission verbatim as the permanent source material. Nothing in this file has been reduced to TODO entries.

# Narrative Summary

The current Platts Proposal app has accumulated several generations of layout editors, settings panels, draggable modals and grid-control systems. Some of them work very well in certain areas, especially the Page 1 segment editor and the Page 2 shared grid editor, while other areas such as Sorter settings and proposal controls use different interaction patterns.

The original discussion began as a relatively small effort to make proposal Load/Update modals more adjustable and mobile-friendly. That discussion expanded after two read-only audits showed that the app already contains reusable drag/compact helpers, multiple selected-object editors, dormant user-setting infrastructure, and some advanced but currently unreachable fine-tuning controls.

The broader design goal that emerged is not simply to improve individual modals. It is to move gradually toward a more universal visual layout/editor architecture.

The user wants to be able to enter an explicit Editor Mode, click the actual visual object or grid cell being designed, see what is selected, and adjust it live while still seeing the page behind the editor panel. The editor panel should remain draggable and compactable so that it can be moved out of the way while retaining access to the controls.

The layout itself should increasingly behave like a configurable grid or spreadsheet-style canvas. Containers define major horizontal regions. Stacks behave like rows. Splits behave like columns/cells inside those rows. Cells act as slots that can be populated through a familiar Mapping/Contents workflow.

What can be mapped into a cell should eventually go beyond database fields. It may include UI components such as Create Proposal, Update, PDF, DOC, logos, status indicators, warning cards and other reusable components. Section-specific components should appear first, but the user should also be able to browse components from other sections or from a global/shared registry when useful.

Responsive behavior should not depend entirely on one desktop arrangement magically surviving on a phone. The same registered components may eventually have different placement and sizing for regular/desktop and compact/mobile layouts.

The brainstorm also developed two related but distinct expandable-layout concepts.

At the section level, a full-width persistent bar may sit above or below the main container grid. When expanded, that region may reveal a complete arbitrary grid underneath it. Only the persistent bar must span the full width. The content underneath may contain multiple containers, stacks and splits. Multiple such expandable regions could theoretically exist.

Inside a fixed-height container, a different behavior may be useful. A contiguous group of stacks can belong to an expandable group with one anchor stack. When the group is compact, the other stacks hide and the anchor stack expands to absorb their height, preserving the total container height and overall grid geometry. When expanded again, the anchor shrinks and the hidden stacks return. This behaves somewhat like a dynamic vertically merged spreadsheet cell.

These are architectural ideas, not approved implementation instructions. Before coding them, the current source structure should be investigated to determine what can be reused, what conflicts with the proposed model, and what migration path would be safest.

# Structured Breakdown

## 1. Editor Mode

Preferred behavior:

- Editor Mode is an explicit application state.
- While Editor Mode is active, clicking an editable UI element selects it instead of triggering its normal action.
- Example:
  - clicking `Create Proposal` selects the Create Proposal button
  - it must NOT create a proposal while Editor Mode is active
- Normal behavior resumes after exiting Editor Mode.
- For now, an explicit X/Close/Exit control is sufficient.
- No Ctrl-click or long-press modifier is required for the primary workflow.

## 2. Selection and visual feedback

When an editable element is selected:

- visually outline/highlight it on the real page
- identify what level/object is selected
- show a concise context descriptor or breadcrumb
- update the inspector controls to match the selected object type

The Page 2 shared grid editor is a strong existing reference because it already highlights container/stack/split levels and identifies the selected location.

The visual highlighting may be somewhat busy on very small cells, so styling can be refined later, but visible selection is desired.

## 3. Type-aware inspector

The inspector should expose controls appropriate to the selected object.

Examples:

Button:
- width
- height
- text/font size
- icon size
- padding
- alignment
- X/Y fine offsets where appropriate

Mapped field:
- mapping/data source
- label visibility/text
- label font size
- value/data font size
- alignment
- size/layout

Container:
- width weight
- stack structure
- spacing
- alignment/layout controls

Stack:
- height weight
- split count
- group/expand behavior if applicable

Split/cell:
- width weight
- mapped content/component
- alignment
- selected component controls

Status/warning card:
- width
- height/max height
- title font
- message font
- spacing/padding
- placement

The user does NOT want unnecessary DOM-level drilling.

For a button, selecting the button should normally expose both button-shell and button-content controls together rather than requiring separate selection of an internal text `<span>`.

More complex components may legitimately expose separate roles such as:
- title
- message
- detail
- icon

## 4. Visual/layout controls first

Initial editor scope should focus on:

- visual properties
- placement
- sizing
- alignment
- spacing
- fonts
- icons
- grid structure
- responsive layout

Do NOT make general workflow/business behavior editable through this visual editor initially.

## 5. Inspector/modal shell behavior

The current draggable/compact work-panel behavior is generally useful.

Important clarification:

The user does NOT currently need header-only collapse as the primary interaction.

The important compact behavior is:

- panel remains open
- controls remain accessible
- panel body remains scrollable
- panel becomes small enough to expose the page behind it
- user can scroll the desired adjuster into view
- user can drag the compact panel to a location where both the control and the live target are visible

Expanded mode is useful, especially on desktop.

Compact mode is especially useful on mobile.

Later, compact/expanded sizes may themselves become adjustable and persistent.

True header-only collapse could exist eventually but is not a current priority.

## 6. Universal grid mental model

The emerging structural hierarchy is approximately:

Section
→ Region
→ Container
→ Stack / Row
→ Split / Cell
→ Mapped Component / Content

Not every area must use every level.

The important user-facing concepts are:

- containers are major side-by-side horizontal regions
- container width is controlled by relative weight
- each container may have its own number of stacks
- stacks divide vertical space
- stack heights can use relative weights
- splits divide a stack horizontally
- split widths can use relative weights
- cells/splits become placement slots

The outer container area continues to fill its assigned height/width.

## 7. Mapping / Contents remains the placement workflow

The user prefers the familiar Mapping concept.

Desired interaction:

1. click/select an empty or populated cell
2. open Mapping / Contents
3. choose what should occupy that slot

The implementation may distinguish data mapping from component placement internally, but the user-facing workflow can remain one familiar mapping/content system.

A slot may contain:

- database field
- button
- icon
- logo
- status component
- warning card
- file-link control
- other registered component

## 8. Component registry

The Mapping/Contents selector should eventually support registered UI components.

Prioritize:

### This Section
Components most relevant to the current section.

Example in Proposal area:
- Create Proposal
- Update Proposal
- PDF
- DOC
- Loaded Proposal indicator
- Proposal status/message

### Other Sections
Allow browsing registries belonging to other areas.

Examples:
- Page 1 Header
- Page 2 Header
- Dispatch
- Customer
- other sections

### Global / Shared
Reusable components such as:
- Platts logo
- date
- common icons
- potentially common customer fields

Example desired behavior:

The Platts logo may normally live in a header, but the user may choose to map another instance into a Proposal section cell.

## 9. Duplicate component placement

Mapping a component to a new cell should NOT automatically mean it must be removed from the old cell.

Duplicates should be allowed where safe.

Examples:
- logo can appear multiple times
- an Update button could potentially appear in two locations but trigger the same underlying action

Some future component types may be singleton-only, but that should be explicit metadata rather than assumed globally.

## 10. Conditional components in Editor Mode

Some runtime controls are not always visible.

Examples:
- Update may only appear when a proposal is loaded
- PDF/DOC links may require a created proposal
- status/warning messages appear only under certain states

Editor Mode should still expose design placeholders for registered conditional components.

These may appear visually ghosted/dashed with metadata such as:

`Hidden in current runtime state`

This allows the user to design placement without having to force the app into every possible live state.

## 11. Component metadata / context

The future component registry may need metadata such as:

- component id
- component type
- originating section
- globally reusable or section-specific
- runtime requirements
- duplicate allowed or singleton
- editor placeholder behavior
- default visual settings
- responsive settings

Example:

Proposal Revision Indicator
- source: Proposal
- requires loaded proposal at runtime
- visible as placeholder in Editor Mode

## 12. Desktop / mobile variants

The user does not want to rely entirely on one layout arrangement fitting every viewport.

The same components may have separate layout values for:

- regular / desktop
- compact / mobile

Potential differences include:
- cell placement
- button width/height
- font size
- icon size
- section arrangement
- expanded/collapsed defaults

The existing dormant user-settings system may eventually support saved overrides and fallback-to-default behavior.

## 13. Structural placement versus fine positioning

These are separate concepts.

Structural placement:
- which cell/slot contains the component
- changed primarily through Mapping/Contents

Fine positioning:
- small visual offsets inside that assigned location
- X/Y nudge
- alignment
- padding
- step adjustments

The user prefers Mapping/Contents for structural relocation rather than requiring a special move command.

## 14. Existing fine-adjustment concepts worth recovering

Previous reconnaissance found dormant/unreachable Dispatch controls including:

- 3×3 nudge pad
- 1 / 2 / 5 px step selector
- center reset
- mapping-move controls
- container/stack/split reordering
- pixel width and height locks
- wrap/overflow controls
- font/icon steppers

Do not assume these exact implementations should return unchanged.

They should be investigated as reusable ideas/code rather than recreated blindly.

## 15. Status and message placement

Proposal Create/Update currently generates status and warning text that can disturb surrounding controls.

Long-term concept:

Create a designated status/message region or slot so runtime messages have an expected home rather than unpredictably pushing neighboring buttons around.

Possible messages:
- Creating proposal
- Updating proposal
- Proposal created
- revision information
- connection lost
- checking whether proposal saved
- warnings/errors

The slot controls placement and available space.

The message component controls typography/padding/severity styling.

## 16. Richer collapsible section headers

Existing app sections often have collapsible bodies while the section header remains visible.

The header itself is increasingly becoming a useful grid.

The user may want the header to contain multiple subregions, some of which can expand/collapse independently.

Example:
- primary controls remain visible
- secondary controls may hide
- status/message area may expand only when needed

If an important alert exists inside a collapsed subregion, the persistent header should still surface an indicator such as:
- warning icon
- badge
- count
- short status marker

Collapsed must not mean important state becomes invisible.

## 17. Section-level full-width expandable region

A section may have one or more optional regions above or below the main weighted container grid.

Concept:

Persistent full-width bar/header
+
expandable arbitrary grid content below it

Example:

[ Full-width Status Bar ]
[ arbitrary containers/stacks/splits when expanded ]

[ Main Container Grid ]

The important clarification:

Only the persistent bar/header needs to span the full width.

The expanded content underneath does NOT need to be full-width cells.

It may contain:
- multiple containers
- different stack counts
- multiple splits
- complex mapped content

Multiple expandable regions could theoretically be stacked above or below the main grid.

The main container grid remains its own persistent structure.

## 18. Container-level Expand-to-Fill Stack Group

This is different from normal section collapse.

A fixed-height container may contain a contiguous stack group.

Example:

Stack 1
Stack 2 ← anchor
Stack 3
Stack 4
Stack 5

Stacks 2–4 belong to one expandable group.

Expanded state:
- Stack 2 normal height
- Stack 3 visible
- Stack 4 visible

Compact state:
- Stack 3 hidden
- Stack 4 hidden
- Stack 2 expands to absorb their combined height

The total outer container height remains unchanged.

This preserves alignment with neighboring containers.

When expanded again:
- Stack 2 returns to normal height
- Stack 3 and Stack 4 reappear

The anchor does not need to look like a traditional header.

It might contain:
- carrier logo
- system name
- summary card
- alert
- other mapped component

Example:

Expanded:
- Stack 2 = Carrier logo
- Stack 3 = Model / Serial
- Stack 4 = Efficiency / Refrigerant

Compact:
- Carrier logo occupies the combined vertical space of stacks 2–4

This resembles a dynamically merged spreadsheet cell.

## 19. Initial constraint for expandable stack groups

For sanity and predictable geometry:

Expandable stack groups should initially use contiguous stacks only.

Examples:
- stacks 2–4 = valid
- stacks 1, 3 and 5 = not one group

Do not build arbitrary non-contiguous grouping unless a real need later emerges.

## 20. Section-level collapse and container-level expand-to-fill are different

Keep these concepts separate.

Section-level expandable region:
- sits above/below main grid
- persistent full-width header/bar
- hidden content disappears
- section height changes
- main content may shift vertically

Container-level expand-to-fill group:
- lives inside fixed-height container
- hidden stacks disappear
- anchor consumes their space
- outer container dimensions stay unchanged

They may share UI concepts but should not be treated as identical geometry.

## 21. Emerging architectural layers

The brainstorm is converging on approximately five cooperating systems:

### A. Layout/Grid Engine
- regions
- containers
- stacks
- splits
- weights
- placement
- expandable structures

### B. Component Registry
- fields
- buttons
- icons
- logos
- messages
- indicators
- other reusable UI components

### C. Visual Selection / Inspector
- explicit Editor Mode
- click real target
- highlight selected item
- context/breadcrumb
- type-specific controls
- live preview

### D. Responsive Variants
- desktop/regular layout
- mobile/compact layout
- potentially different placements and dimensions

### E. Expandable Region Primitives
- section-level expandable region
- fixed-container expand-to-fill stack group

These are conceptual layers, not approved implementation modules yet.

## 22. Important existing patterns to investigate further

Previous audit results indicate useful existing systems already exist:

- `initDraggableModal`
- `toggleWorkModalSize`
- Page 1 smartModal
- Page 1 Inspector
- Page 2 shared grid editor
- Dispatch Body controls
- dormant legacy Dispatch nudge controls
- dormant Page 2 header controls
- Sorter container/stack/split data model
- dormant `changeout_user_settings_v1` user-settings layer

Future reconnaissance should determine how much of this can become shared infrastructure.

## 23. Risks / concerns

Do not rush implementation.

Potential risks include:

- replacing working editors too early
- creating a fifth version of container/stack/split logic
- breaking existing saved profiles/settings
- confusing runtime mapping with editor-only component placement
- allowing incompatible components in invalid contexts
- excessive responsive complexity
- duplicated component state
- stale saved coordinates
- hidden runtime controls becoming impossible to edit
- making every arbitrary DOM node editable
- over-generalizing before a proven pilot exists

## 24. Desired development approach

The user does NOT want this entire architecture implemented at once.

Preferred process:

1. preserve brainstorm
2. perform structural reconnaissance
3. compare proposed architecture against current data models
4. identify reusable infrastructure
5. identify migration/compatibility risks
6. choose a small pilot
7. implement one controlled phase
8. validate desktop and mobile
9. continue incrementally

Do not turn this brainstorm into a giant implementation task.

# Open Questions / Reconnaissance Targets

These are questions for future investigation, not decisions that must be made now.

1. Can the existing container/stack/split models be unified or adapted without replacing working systems?
2. How different are:
   - Page 1 column/pill/subdivision
   - Page 2 container/stack/split
   - Dispatch
   - Sorter
3. Can the Page 2 shared grid selection/highlight system become the basis for a broader Editor Mode?
4. What should qualify as an editable registered component?
5. Where should component definitions live?
6. How should duplicate component instances reference the same underlying runtime action/data?
7. How should section-specific versus global components be registered?
8. How should Editor Mode expose conditional/hidden components?
9. How should regular/mobile layout variants be stored?
10. How should layout defaults interact with saved user overrides?
11. Can dormant Dispatch nudge/lock controls be safely reused?
12. How should expandable section regions be represented in state?
13. How should container-level expand-to-fill groups be represented?
14. Can expandable stack groups coexist cleanly with weighted stack heights?
15. What happens to mappings/settings of hidden stacks while compact?
16. How should alert badges surface state from collapsed regions?
17. Which current editor should become the first migration/pilot?
18. What compatibility constraints exist for existing profiles and Page 2 settings?
19. Which stale/duplicate editor code should be left alone versus eventually retired?
20. What is the smallest structural foundation worth implementing first?

# Source Brainstorm Submission — Verbatim

The complete handoff prompt exactly as submitted:

````text
PLATTS PROPOSAL — FILE FIRST BRAINSTORM RECORD: UNIVERSAL GRID / VISUAL EDITOR ARCHITECTURE

TASK TYPE
Brainstorm filing / project documentation

RECOMMENDED MODEL
Claude Sonnet 5.5

RECOMMENDED EFFORT
High

PROJECT ROOT

I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing

IMPORTANT SCOPE

This is documentation-only.

Do NOT modify:
- frontend source
- backend source
- proposal data
- rules files
- deployed code

Do NOT create a proposal.
Do NOT commit.
Do NOT push.
Do NOT deploy.

BACKGROUND

The project now has:

- `Prompt_History/` for actual IDE handoffs and final reports
- `Session_Context/` for milestone/current-state snapshots
- `Brainstorming/` for permanent design/architecture brainstorm records
- `Brainstorming/TODO.md` for distilled future-work tracking
- Git for actual source history

The Brainstorming structure has already been created.

This task is the FIRST real brainstorm filing.

IMPORTANT RECORD-PRESERVATION RULE

The brainstorm record created by this task is the durable source document.

Do NOT reduce this submission into TODO entries and discard the detail.

The brainstorm file must preserve:
1. the narrative explanation of what we are trying to accomplish
2. the structured breakdown of the ideas and preferences
3. the unresolved questions and concepts that are not yet implementation commitments
4. this complete brainstorm handoff content as the permanent source material

After the brainstorm file is saved, THEN update `Brainstorming/TODO.md` with only the concise items worth tracking.

TODO entries must reference the originating brainstorm filename.

BRAINSTORM FILE NAMING

Use the local filing timestamp so chronological sorting works.

Preferred pattern:

`Brainstorming/YYYY-MM-DD_HHMM_Universal-Grid-and-Visual-Editor-Brainstorm.md`

Use 24-hour local time.

If two records somehow occur in the same minute, include seconds.

Do not invent an earlier timestamp. Use the actual filing time for this record.

==================================================
NARRATIVE SUMMARY
==================================================

The current Platts Proposal app has accumulated several generations of layout editors, settings panels, draggable modals and grid-control systems. Some of them work very well in certain areas, especially the Page 1 segment editor and the Page 2 shared grid editor, while other areas such as Sorter settings and proposal controls use different interaction patterns.

The original discussion began as a relatively small effort to make proposal Load/Update modals more adjustable and mobile-friendly. That discussion expanded after two read-only audits showed that the app already contains reusable drag/compact helpers, multiple selected-object editors, dormant user-setting infrastructure, and some advanced but currently unreachable fine-tuning controls.

The broader design goal that emerged is not simply to improve individual modals. It is to move gradually toward a more universal visual layout/editor architecture.

The user wants to be able to enter an explicit Editor Mode, click the actual visual object or grid cell being designed, see what is selected, and adjust it live while still seeing the page behind the editor panel. The editor panel should remain draggable and compactable so that it can be moved out of the way while retaining access to the controls.

The layout itself should increasingly behave like a configurable grid or spreadsheet-style canvas. Containers define major horizontal regions. Stacks behave like rows. Splits behave like columns/cells inside those rows. Cells act as slots that can be populated through a familiar Mapping/Contents workflow.

What can be mapped into a cell should eventually go beyond database fields. It may include UI components such as Create Proposal, Update, PDF, DOC, logos, status indicators, warning cards and other reusable components. Section-specific components should appear first, but the user should also be able to browse components from other sections or from a global/shared registry when useful.

Responsive behavior should not depend entirely on one desktop arrangement magically surviving on a phone. The same registered components may eventually have different placement and sizing for regular/desktop and compact/mobile layouts.

The brainstorm also developed two related but distinct expandable-layout concepts.

At the section level, a full-width persistent bar may sit above or below the main container grid. When expanded, that region may reveal a complete arbitrary grid underneath it. Only the persistent bar must span the full width. The content underneath may contain multiple containers, stacks and splits. Multiple such expandable regions could theoretically exist.

Inside a fixed-height container, a different behavior may be useful. A contiguous group of stacks can belong to an expandable group with one anchor stack. When the group is compact, the other stacks hide and the anchor stack expands to absorb their height, preserving the total container height and overall grid geometry. When expanded again, the anchor shrinks and the hidden stacks return. This behaves somewhat like a dynamic vertically merged spreadsheet cell.

These are architectural ideas, not approved implementation instructions. Before coding them, the current source structure should be investigated to determine what can be reused, what conflicts with the proposed model, and what migration path would be safest.

==================================================
STRUCTURED BRAINSTORM BREAKDOWN
==================================================

## 1. Editor Mode

Preferred behavior:

- Editor Mode is an explicit application state.
- While Editor Mode is active, clicking an editable UI element selects it instead of triggering its normal action.
- Example:
  - clicking `Create Proposal` selects the Create Proposal button
  - it must NOT create a proposal while Editor Mode is active
- Normal behavior resumes after exiting Editor Mode.
- For now, an explicit X/Close/Exit control is sufficient.
- No Ctrl-click or long-press modifier is required for the primary workflow.

## 2. Selection and visual feedback

When an editable element is selected:

- visually outline/highlight it on the real page
- identify what level/object is selected
- show a concise context descriptor or breadcrumb
- update the inspector controls to match the selected object type

The Page 2 shared grid editor is a strong existing reference because it already highlights container/stack/split levels and identifies the selected location.

The visual highlighting may be somewhat busy on very small cells, so styling can be refined later, but visible selection is desired.

## 3. Type-aware inspector

The inspector should expose controls appropriate to the selected object.

Examples:

Button:
- width
- height
- text/font size
- icon size
- padding
- alignment
- X/Y fine offsets where appropriate

Mapped field:
- mapping/data source
- label visibility/text
- label font size
- value/data font size
- alignment
- size/layout

Container:
- width weight
- stack structure
- spacing
- alignment/layout controls

Stack:
- height weight
- split count
- group/expand behavior if applicable

Split/cell:
- width weight
- mapped content/component
- alignment
- selected component controls

Status/warning card:
- width
- height/max height
- title font
- message font
- spacing/padding
- placement

The user does NOT want unnecessary DOM-level drilling.

For a button, selecting the button should normally expose both button-shell and button-content controls together rather than requiring separate selection of an internal text `<span>`.

More complex components may legitimately expose separate roles such as:
- title
- message
- detail
- icon

## 4. Visual/layout controls first

Initial editor scope should focus on:

- visual properties
- placement
- sizing
- alignment
- spacing
- fonts
- icons
- grid structure
- responsive layout

Do NOT make general workflow/business behavior editable through this visual editor initially.

## 5. Inspector/modal shell behavior

The current draggable/compact work-panel behavior is generally useful.

Important clarification:

The user does NOT currently need header-only collapse as the primary interaction.

The important compact behavior is:

- panel remains open
- controls remain accessible
- panel body remains scrollable
- panel becomes small enough to expose the page behind it
- user can scroll the desired adjuster into view
- user can drag the compact panel to a location where both the control and the live target are visible

Expanded mode is useful, especially on desktop.

Compact mode is especially useful on mobile.

Later, compact/expanded sizes may themselves become adjustable and persistent.

True header-only collapse could exist eventually but is not a current priority.

## 6. Universal grid mental model

The emerging structural hierarchy is approximately:

Section
→ Region
→ Container
→ Stack / Row
→ Split / Cell
→ Mapped Component / Content

Not every area must use every level.

The important user-facing concepts are:

- containers are major side-by-side horizontal regions
- container width is controlled by relative weight
- each container may have its own number of stacks
- stacks divide vertical space
- stack heights can use relative weights
- splits divide a stack horizontally
- split widths can use relative weights
- cells/splits become placement slots

The outer container area continues to fill its assigned height/width.

## 7. Mapping / Contents remains the placement workflow

The user prefers the familiar Mapping concept.

Desired interaction:

1. click/select an empty or populated cell
2. open Mapping / Contents
3. choose what should occupy that slot

The implementation may distinguish data mapping from component placement internally, but the user-facing workflow can remain one familiar mapping/content system.

A slot may contain:

- database field
- button
- icon
- logo
- status component
- warning card
- file-link control
- other registered component

## 8. Component registry

The Mapping/Contents selector should eventually support registered UI components.

Prioritize:

### This Section
Components most relevant to the current section.

Example in Proposal area:
- Create Proposal
- Update Proposal
- PDF
- DOC
- Loaded Proposal indicator
- Proposal status/message

### Other Sections
Allow browsing registries belonging to other areas.

Examples:
- Page 1 Header
- Page 2 Header
- Dispatch
- Customer
- other sections

### Global / Shared
Reusable components such as:
- Platts logo
- date
- common icons
- potentially common customer fields

Example desired behavior:

The Platts logo may normally live in a header, but the user may choose to map another instance into a Proposal section cell.

## 9. Duplicate component placement

Mapping a component to a new cell should NOT automatically mean it must be removed from the old cell.

Duplicates should be allowed where safe.

Examples:
- logo can appear multiple times
- an Update button could potentially appear in two locations but trigger the same underlying action

Some future component types may be singleton-only, but that should be explicit metadata rather than assumed globally.

## 10. Conditional components in Editor Mode

Some runtime controls are not always visible.

Examples:
- Update may only appear when a proposal is loaded
- PDF/DOC links may require a created proposal
- status/warning messages appear only under certain states

Editor Mode should still expose design placeholders for registered conditional components.

These may appear visually ghosted/dashed with metadata such as:

`Hidden in current runtime state`

This allows the user to design placement without having to force the app into every possible live state.

## 11. Component metadata / context

The future component registry may need metadata such as:

- component id
- component type
- originating section
- globally reusable or section-specific
- runtime requirements
- duplicate allowed or singleton
- editor placeholder behavior
- default visual settings
- responsive settings

Example:

Proposal Revision Indicator
- source: Proposal
- requires loaded proposal at runtime
- visible as placeholder in Editor Mode

## 12. Desktop / mobile variants

The user does not want to rely entirely on one layout arrangement fitting every viewport.

The same components may have separate layout values for:

- regular / desktop
- compact / mobile

Potential differences include:
- cell placement
- button width/height
- font size
- icon size
- section arrangement
- expanded/collapsed defaults

The existing dormant user-settings system may eventually support saved overrides and fallback-to-default behavior.

## 13. Structural placement versus fine positioning

These are separate concepts.

Structural placement:
- which cell/slot contains the component
- changed primarily through Mapping/Contents

Fine positioning:
- small visual offsets inside that assigned location
- X/Y nudge
- alignment
- padding
- step adjustments

The user prefers Mapping/Contents for structural relocation rather than requiring a special move command.

## 14. Existing fine-adjustment concepts worth recovering

Previous reconnaissance found dormant/unreachable Dispatch controls including:

- 3×3 nudge pad
- 1 / 2 / 5 px step selector
- center reset
- mapping-move controls
- container/stack/split reordering
- pixel width and height locks
- wrap/overflow controls
- font/icon steppers

Do not assume these exact implementations should return unchanged.

They should be investigated as reusable ideas/code rather than recreated blindly.

## 15. Status and message placement

Proposal Create/Update currently generates status and warning text that can disturb surrounding controls.

Long-term concept:

Create a designated status/message region or slot so runtime messages have an expected home rather than unpredictably pushing neighboring buttons around.

Possible messages:
- Creating proposal
- Updating proposal
- Proposal created
- revision information
- connection lost
- checking whether proposal saved
- warnings/errors

The slot controls placement and available space.

The message component controls typography/padding/severity styling.

## 16. Richer collapsible section headers

Existing app sections often have collapsible bodies while the section header remains visible.

The header itself is increasingly becoming a useful grid.

The user may want the header to contain multiple subregions, some of which can expand/collapse independently.

Example:
- primary controls remain visible
- secondary controls may hide
- status/message area may expand only when needed

If an important alert exists inside a collapsed subregion, the persistent header should still surface an indicator such as:
- warning icon
- badge
- count
- short status marker

Collapsed must not mean important state becomes invisible.

## 17. Section-level full-width expandable region

A section may have one or more optional regions above or below the main weighted container grid.

Concept:

Persistent full-width bar/header
+
expandable arbitrary grid content below it

Example:

[ Full-width Status Bar ]
[ arbitrary containers/stacks/splits when expanded ]

[ Main Container Grid ]

The important clarification:

Only the persistent bar/header needs to span the full width.

The expanded content underneath does NOT need to be full-width cells.

It may contain:
- multiple containers
- different stack counts
- multiple splits
- complex mapped content

Multiple expandable regions could theoretically be stacked above or below the main grid.

The main container grid remains its own persistent structure.

## 18. Container-level Expand-to-Fill Stack Group

This is different from normal section collapse.

A fixed-height container may contain a contiguous stack group.

Example:

Stack 1
Stack 2 ← anchor
Stack 3
Stack 4
Stack 5

Stacks 2–4 belong to one expandable group.

Expanded state:
- Stack 2 normal height
- Stack 3 visible
- Stack 4 visible

Compact state:
- Stack 3 hidden
- Stack 4 hidden
- Stack 2 expands to absorb their combined height

The total outer container height remains unchanged.

This preserves alignment with neighboring containers.

When expanded again:
- Stack 2 returns to normal height
- Stack 3 and Stack 4 reappear

The anchor does not need to look like a traditional header.

It might contain:
- carrier logo
- system name
- summary card
- alert
- other mapped component

Example:

Expanded:
- Stack 2 = Carrier logo
- Stack 3 = Model / Serial
- Stack 4 = Efficiency / Refrigerant

Compact:
- Carrier logo occupies the combined vertical space of stacks 2–4

This resembles a dynamically merged spreadsheet cell.

## 19. Initial constraint for expandable stack groups

For sanity and predictable geometry:

Expandable stack groups should initially use contiguous stacks only.

Examples:
- stacks 2–4 = valid
- stacks 1, 3 and 5 = not one group

Do not build arbitrary non-contiguous grouping unless a real need later emerges.

## 20. Section-level collapse and container-level expand-to-fill are different

Keep these concepts separate.

Section-level expandable region:
- sits above/below main grid
- persistent full-width header/bar
- hidden content disappears
- section height changes
- main content may shift vertically

Container-level expand-to-fill group:
- lives inside fixed-height container
- hidden stacks disappear
- anchor consumes their space
- outer container dimensions stay unchanged

They may share UI concepts but should not be treated as identical geometry.

## 21. Emerging architectural layers

The brainstorm is converging on approximately five cooperating systems:

### A. Layout/Grid Engine
- regions
- containers
- stacks
- splits
- weights
- placement
- expandable structures

### B. Component Registry
- fields
- buttons
- icons
- logos
- messages
- indicators
- other reusable UI components

### C. Visual Selection / Inspector
- explicit Editor Mode
- click real target
- highlight selected item
- context/breadcrumb
- type-specific controls
- live preview

### D. Responsive Variants
- desktop/regular layout
- mobile/compact layout
- potentially different placements and dimensions

### E. Expandable Region Primitives
- section-level expandable region
- fixed-container expand-to-fill stack group

These are conceptual layers, not approved implementation modules yet.

## 22. Important existing patterns to investigate further

Previous audit results indicate useful existing systems already exist:

- `initDraggableModal`
- `toggleWorkModalSize`
- Page 1 smartModal
- Page 1 Inspector
- Page 2 shared grid editor
- Dispatch Body controls
- dormant legacy Dispatch nudge controls
- dormant Page 2 header controls
- Sorter container/stack/split data model
- dormant `changeout_user_settings_v1` user-settings layer

Future reconnaissance should determine how much of this can become shared infrastructure.

## 23. Risks / concerns

Do not rush implementation.

Potential risks include:

- replacing working editors too early
- creating a fifth version of container/stack/split logic
- breaking existing saved profiles/settings
- confusing runtime mapping with editor-only component placement
- allowing incompatible components in invalid contexts
- excessive responsive complexity
- duplicated component state
- stale saved coordinates
- hidden runtime controls becoming impossible to edit
- making every arbitrary DOM node editable
- over-generalizing before a proven pilot exists

## 24. Desired development approach

The user does NOT want this entire architecture implemented at once.

Preferred process:

1. preserve brainstorm
2. perform structural reconnaissance
3. compare proposed architecture against current data models
4. identify reusable infrastructure
5. identify migration/compatibility risks
6. choose a small pilot
7. implement one controlled phase
8. validate desktop and mobile
9. continue incrementally

Do not turn this brainstorm into a giant implementation task.

==================================================
OPEN QUESTIONS / RECONNAISSANCE TARGETS
==================================================

These are questions for future investigation, not decisions that must be made now.

1. Can the existing container/stack/split models be unified or adapted without replacing working systems?
2. How different are:
   - Page 1 column/pill/subdivision
   - Page 2 container/stack/split
   - Dispatch
   - Sorter
3. Can the Page 2 shared grid selection/highlight system become the basis for a broader Editor Mode?
4. What should qualify as an editable registered component?
5. Where should component definitions live?
6. How should duplicate component instances reference the same underlying runtime action/data?
7. How should section-specific versus global components be registered?
8. How should Editor Mode expose conditional/hidden components?
9. How should regular/mobile layout variants be stored?
10. How should layout defaults interact with saved user overrides?
11. Can dormant Dispatch nudge/lock controls be safely reused?
12. How should expandable section regions be represented in state?
13. How should container-level expand-to-fill groups be represented?
14. Can expandable stack groups coexist cleanly with weighted stack heights?
15. What happens to mappings/settings of hidden stacks while compact?
16. How should alert badges surface state from collapsed regions?
17. Which current editor should become the first migration/pilot?
18. What compatibility constraints exist for existing profiles and Page 2 settings?
19. Which stale/duplicate editor code should be left alone versus eventually retired?
20. What is the smallest structural foundation worth implementing first?

==================================================
TODO EXTRACTION GUIDANCE
==================================================

After saving the permanent brainstorm record, update:

`Brainstorming/TODO.md`

Do NOT copy this entire brainstorm into TODO.

Extract only meaningful follow-up items.

Likely TODO candidates include:

### Research / Reconnaissance Needed
- Audit existing grid/state models against the proposed universal layout architecture.
- Determine whether Page 2 shared-grid selection/highlighting can support a general Editor Mode.
- Audit how a component registry could reuse existing mappings/actions without duplicating business logic.
- Investigate responsive regular/mobile layout storage.
- Investigate data representation for section-level expandable regions.
- Investigate data representation for fixed-container expand-to-fill stack groups.
- Evaluate dormant Dispatch nudge/lock code for safe reuse.

### Planned / Deferred
- Standardize selected-object visual inspector behavior after reconnaissance.
- Standardize component Mapping/Contents picker with local, cross-section and global registries.
- Add conditional-component placeholders in Editor Mode.
- Establish reserved status/message regions where useful.
- Eventually persist panel/layout overrides through the user-settings system.

These are NOT necessarily Active/Near-Term implementation tasks.

Reference the source brainstorm filename in every TODO item derived from this brainstorm.

==================================================
BRAINSTORM FILE CONTENT REQUIREMENT
==================================================

The new brainstorm file must contain:

# Metadata

Include:
- filing date/time
- topic
- source: ChatGPT/user brainstorming discussion
- current frontend version: v10.01.3
- current backend version: v16.52.1
- status: brainstorm / not approved implementation

# Narrative Summary

Preserve the narrative above.

# Structured Breakdown

Preserve the structured brainstorm content above.

# Open Questions / Reconnaissance Targets

Preserve the open questions.

# Source Brainstorm Submission — Verbatim

Paste this COMPLETE handoff prompt verbatim.

Do not replace the verbatim source with only the organized summary.

==================================================
PROMPT HISTORY REQUIREMENT
==================================================

This is also a real IDE handoff.

Create ONE Prompt_History record.

Use the current local filing timestamp in the filename.

Preferred pattern:

`Prompt_History/YYYY-MM-DD_HHMM_v10.01.3-v16.52.1_Universal-Grid-Brainstorm-Filing.md`

If timestamp naming conflicts with an existing documented rule, note the conflict in the final report but do not rename older files during this task.

This Prompt_History file must contain BOTH:

1. exact handoff prompt verbatim
2. exact final agent report verbatim

Structure:

# Metadata

# Handoff Prompt — Verbatim

# Final Agent Report — Verbatim

Do NOT create:
- Agent_Reports
- Session_Context snapshot
- source changes

==================================================
FINAL REPORT
==================================================

Return a concise report confirming:

1. exact Brainstorming filename created
2. narrative summary preserved
3. structured brainstorm preserved
4. complete source handoff preserved verbatim
5. TODO.md updated only with distilled follow-up items
6. TODO items reference the brainstorm source filename
7. no brainstorm content was discarded in favor of TODO
8. exact Prompt_History filename
9. any naming-rule conflict discovered
10. confirmation:
   - no frontend changes
   - no backend changes
   - no proposal changes
   - no rules changes
   - no commit
   - no push
   - no deploy

CRITICAL FINAL STEP

Before returning the final report:

Append that exact final report verbatim under:

## Final Agent Report — Verbatim

inside the SAME Prompt_History record.

Then return that same report to the user.
````
