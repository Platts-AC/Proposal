# Brainstorming

Durable archive for substantial design, architecture and feature brainstorming between the user and ChatGPT.

Nothing here is an approved implementation task. A brainstorm record preserves ideas and the reasoning behind them so they survive interruptions, bug fixes and side issues.

## The five project records

| Place | Answers |
|---|---|
| `Brainstorming/` | What were we thinking, and why? |
| `Brainstorming/TODO.md` | What should we remember to revisit or do? |
| `Prompt_History/` | What did we actually ask an IDE agent to do, and what did it report? |
| `Session_Context/` | What was the project state at a major milestone? |
| Git | What actually changed in source? |

Keep these separate. Do not put brainstorm content in Prompt_History, and do not put implementation results in Brainstorming.

## Core rule: one permanent source record per brainstorm

- Every substantial brainstorm submission becomes its **own standalone file** in this folder.
- That file is the **source document** for the discussion. It is never reduced to TODO entries, replaced by TODO entries, overwritten after TODO extraction, or discarded as temporary input.
- Preserve the complete submitted brainstorm as the source content. Do not drop descriptive paragraphs just because the same ideas could be bullets, and do not replace the brainstorm with a shorter interpretation.
- If an agent adds headings, an index or interpreted notes, keep the original meaning and detail, and clearly label interpreted or distilled notes apart from the preserved source material.
- The record must stay useful even if `TODO.md` later becomes stale, incomplete or slightly wrong.

## What each record contains

1. **Narrative summary:** concise prose covering the problem that prompted the discussion, how the idea evolved, the overall concept or architecture, why it may matter, and the direction being explored. This keeps the "why".
2. **Structured breakdown**, as applicable: concepts discussed, user preferences, architectural ideas, proposed behaviors, possible implementation phases, open questions, risks and concerns, deferred ideas, dependencies, and items that may become future work. This keeps the "what".
3. **Preserved source material:** the submitted brainstorm text itself.

## Naming

Use descriptive filenames with the local filing date and time, so they sort chronologically:

`YYYY-MM-DD_HHMM_Descriptive-Subject-Brainstorm.md`

- `HHMM` is 24-hour local time of filing. Add seconds only if two records are filed in the same minute.
- Use the actual filing time. Never invent a timestamp.

Example: `2026-10-02_0616_Universal-Grid-and-Visual-Editor-Brainstorm.md`

Do not use generic names such as `ideas.md`, `notes.md` or `brainstorm.md`.

Prompt_History records follow the same date-and-time idea; see `Prompt_History/README.md`.

## Processing a new brainstorm

1. Save the brainstorm as its own permanent file in this folder **first**.
2. Review the saved file for actionable, deferred or research items.
3. Update `TODO.md` with only the distilled items worth tracking.
4. In each TODO entry, reference the source brainstorm filename.
5. Never treat `TODO.md` as a substitute for reading the original when detailed context is needed.

## TODO.md

`TODO.md` is the distilled tracking layer: concise items, each pointing back to its source brainstorm. When an item is completed, superseded or abandoned, update its entry in `TODO.md` (move it to Completed / Superseded with a note). Do not delete brainstorm records.

## From brainstorm to implementation

A brainstorm becomes work only when the user issues an actual IDE implementation handoff. That handoff and the agent's final report belong in `Prompt_History/`, and may cite the brainstorm filename for context.

## When to consult this folder

Future agents should read `Brainstorming/` and `TODO.md` when asked things like:

- "What were we planning?"
- "What is still on the list?"
- "What ideas did we have for X?"
- "What did we defer?"
- "Why were we considering this architecture?"

For detail, open the source brainstorm file named in the TODO entry.
