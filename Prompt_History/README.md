# Prompt_History

Record of real IDE handoffs: what was asked of an agent, and what the agent reported back.

Related records: `Session_Context/` holds milestone state snapshots, `Brainstorming/` holds design brainstorms and `TODO.md`, and Git holds source history. Keep them separate.

## Rules

- **One record per real IDE handoff.** Ordinary brainstorming does not go here; it goes in `Brainstorming/`.
- Each record contains, in one file, the **exact handoff prompt verbatim** and the **exact final agent report verbatim**, plus a Metadata table (task, type, recommended and actual model and effort, versions, files inspected or changed, Git state, deployment state).
- Record the actual model and effort only if the environment exposes them. Otherwise write `UNKNOWN`. Do not guess.
- Do not rewrite the historical content of a record because a filename changed.
- No separate report files and no `Agent_Reports` folder.

## Naming

`YYYY-MM-DD_HHMM_vFE-vBE_Task-Name.md`

Example: `2026-10-02_0616_v10.01.3-v16.52.1_Universal-Grid-Brainstorm-Filing.md`

- Local time, 24-hour `HHMM`. This sorts records in the order they happened.
- Add seconds only if two records are created in the same minute.
- `vFE-vBE` is the frontend and backend version at the time.
- Use the actual current time when filing. If it cannot be read from the environment, do not invent it: use the fallback below and say so in the report.

## Recovering timestamps for older records

Never fabricate a historical timestamp. For a record without a known time, use the strongest evidence in this order:

1. A time recorded inside the record (metadata, handoff, report).
2. The file's creation time, when it is consistent with the record's own content and neighboring records.
3. Cross-references, version progression and the order of tasks.

If a trustworthy `HHMM` can be recovered, use it. If only the order of same-day records is reliable, use a daily sequence number (`YYYY-MM-DD_001_…`, restarting each date) so no exact time is implied. If even the order is unclear, leave the filename unchanged and say why.

For records renamed this way, `HHMM` is the time the record was filed (its creation time). Records written after 2026-10-02 06:16 use the time at the start of filing, which is within a minute or two of the same thing.

## Renamed records (2026-10-02)

Ten records written before this convention were renamed on 2026-10-02 by inserting their recovered filing time. The full old-to-new map is in `2026-10-02_0640_v10.01.3-v16.52.1_Record-Filename-Normalization.md`.

Pointers outside the verbatim prompts and reports were updated to the new names. Text inside the verbatim prompt and verbatim report sections was not edited, so those sections still show the filenames as they were at the time.
