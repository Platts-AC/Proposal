# Session Context Snapshot

Date: 2026-10-01 (about 07:55 local)
Model: Claude Sonnet 5.5 (`claude-sonnet-5-5`), as reported by the session
Context Event: Manual Compact
Approx. Tokens Freed: ~722K

Frontend Versions Covered:
v10.00.1 → v10.01.2

Backend Versions Covered:
v16.51 → v16.52.1

Current Frontend:
v10.01.2

Current Backend:
v16.52.1

Project Root:
I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing

---

## 0. How to read this file

- **Versions covered** = versions discussed, investigated, implemented, or tested during this Claude session (frontend v10.00.1 through v10.01.2, backend v16.51 through v16.52.1). They were **not** all active at once.
- **Current version** = the real project endpoint at the moment of compaction: frontend **v10.01.2**, backend **v16.52.1**.
- **Source of this report:** derived from the Claude Code compacted-session summary after a manual compact. It is a recovery/context artifact for future agents (Claude, Codex, Antigravity, others). It is **not authoritative source code**. Where it disagrees with the actual files, the files and Git win. Nothing here was re-verified against Drive beyond what the compact states, and where the compact did not preserve a fact, this report says so instead of guessing.
- Role split: `Session_Context/` = durable snapshots of an agent's working understanding after a compaction or milestone. `Prompt_History/` = task handoffs and what happened in each. Git = source history. Keep them separate.

---

## 1. Project / file structure

| Item | Detail |
|---|---|
| Project | Platts "Changeout Pricing / Proposal" (HVAC changeout pricing + proposal builder) |
| Root | `I:\My Drive\AI Assist\HVAC\AI\Antigravity\Changeout Pricing` (Google Drive-synced folder) |
| Git | Repo at the root; branch `main`; remote Platts-AC/Proposal; `core.autocrlf=true` |
| Canonical frontend | `Agent/retest.html` plus exact mirror `Agent/retest.txt` |
| Canonical backend | `script_changeout.gs` plus exact mirror `script_changeout.txt` |
| Deployed backend | An Apps Script web app. The user reports it as "Version 47". Whether Version 47 equals local v16.52.1 **cannot be proven** from the project (see §8) |
| Rulebooks (active) | `Agent/Changeout_Rules.md`, `Agent/Retest_Rules.md` (mirror/version-sync/scope rules; Git is history; §10 no automatic push) |
| Architecture spec | `Proposal_Revision_Architecture_Spec.md` (intended revision/archive architecture) |
| Prompt_History | `Prompt_History/` at the **project root** (not under `Agent/`). Untracked |
| Session_Context | `Session_Context/` at the project root (this folder). Untracked |
| Drive proposal data | `Platts/Platt's Proposals/...` (untracked, treat as read-only real data) |
| Archive / Reference | Historical/reference material exists but is largely gitignored (`archive_*/`, `Agent/Archive/`, `Agent/retest_v*.html/.txt`, `script_changeout_v*`, etc.). Do not edit |

**Frontend:** `retest.html` is a single file of about 25,600 lines (BOM + CRLF, Tailwind via CDN). The proposal builder lives in the full-screen overlay `#zone-b-proposal`, shown through `toggleViewSwap()`.

**Gitignored checkpoints created in this session** (local copies only, not in Git):
- `Agent/retest_v10.01.1_2026_10_01_0636.html/.txt` (the **only** copy of v10.01.1)
- `Agent/retest_v10.01.2_2026_10_01_0651.html/.txt`

**Version strings** for the frontend appear in: header comment, `<title>`, navbar badge (~line 482), `#page2-version-badge` (~1414), `appVersion` ×3, export filenames ×3. All must be changed together.

---

## 2. Managed proposal architecture

A **managed proposal** is a proposal saved with `builderState`, so it can be reloaded, edited, and revised. Backend actions routed through `doPost`:

- `getProposalFolders`
- `createProposalExport`
- `getProposalState`
- `listManagedProposals` (read-only, side-effect free)
- `updateProposalExport`

**Builder State** = `{proposalAppState, systemScratchpads, selectedProposalRows}`. Equipment is stored by `absoluteIndex` into the live `HVAC_DATABASE`, so a loaded proposal is **re-priced from the current catalog**.

**Drive layout** (per destination folder, for example `Test`):
- Live PDF in the folder root
- Live Google Doc in `Proposal Docs/`
- Manifest at `Proposal Data/PROP-YYMMDD-XXXXXX_manifest.json`
- Archived PDFs in `Archive/`, archived Docs in `Archive/Google Docs/`
- Snapshots in `Proposal Data/Archive/`

**Create** (`createProposalExport`, frontend handler ~line 24683): the client POSTs with `Content-Type: text/plain;charset=utf-8` and a JSON body. The managed branch builds the base name, asserts it is available (`assertManagedProposalBaseNameAvailable`, which checks `{base}.pdf` and `{base}` in the root, `{base}` in `Proposal Docs`, and `{base}_v1.pdf` / `{base}_v1` in `Archive`), then writes Doc, PDF and manifest. On success with `json.managed`, the frontend calls `window.establishLoadedProposalFromCreate(json, destId, builderState)` (v10.01.2). The Create path has **no stage logging** in the backend, only `console.error` in catch blocks.

**Load** (v10.00.1): a Load button, indicator and modal. It validates before changing anything, snapshots current references, applies the saved builder state, and rolls back on failure (`applyLoadedBuilderState`). It does **not** call `masterNewQuote`. Helpers: `showLoadedLinks` / `clearLoadedLinks`.

**Update** (`updateProposalExport`): archives the current live files as `{base}_v{currentRevision}`, writes the new live files, bumps `manifest.currentRevision`. The frontend confirm handler throws `result.error` when it receives `{success:false,error}` (other than `STALE_REVISION`). Update backend code was **unchanged** in the later phases.

**New Quote**: `masterNewQuote` is wrapped so it also clears the loaded identity.

**Loaded identity:** `window.retestLoadedProposal` holds `proposalId`, `currentRevision`, `destinationFolderId`, `baseName`, `currentFiles`, `loadedAt`, `loadedBuilderState`. It is deliberately **kept outside `proposalAppState`**, because Create serializes that object.

**Conflict message:** `window.describeManagedCreateConflict` turns the backend's "already exists" result into a readable message telling the user to Load that proposal and use Update.

---

## 3. Naming / revision rules

- **Managed live baseName:** `{date} - {customer} - Proposal`, for example `2026-10-01 - yeafg - Proposal`.
- **No V-number** and no revision suffix in the managed live filename. No address and no `(2)`-style suffix.
- **Revision is tracked only in `manifest.currentRevision`.**
- **Archived revisions:** `{base}_v1`, `{base}_v2`, and so on.
- **Exact duplicate baseName is rejected** with a clear message. Existing proposals are not renamed.
- A name like `2026-09-29 - new test - Proposal V2` is **only a base name**. The "V2" in it is part of the customer/name text and is **not** the managed revision number.
- **Legacy Create** (no `builderState`) keeps the V-number path: `getNextProposalVersion` with `response.version = nextVersion`.

---

## 4. Frontend state machine

```
NEW / UNLOADED
   │  Create (success)
   ▼
LOADED REV 1 ──edit──▶ EDIT ──Update (success)──▶ LOADED REV 2 ──edit/Update──▶ LOADED REV 3 …
```

- **NEW / UNLOADED:** `retestLoadedProposal` is empty; Update is hidden.
- **CREATE:** on a successful managed Create the new proposal becomes **Loaded Rev 1** (v10.01.2). Create does not leave the page in an unloaded state.
- **EDIT:** the user changes the builder; the baseline for comparison is `loadedBuilderState`.
- **UPDATE:** archives the previous revision and moves to the next revision number, which becomes the new loaded revision.
- **Load** replaces whatever proposal is currently loaded.
- **New Quote** clears the loaded identity.
- **Known gap (the pending task):** if Create's `fetch()` rejects, the success branch never runs, so the page is **not** marked Loaded even though the server may have created the proposal. A retry then hits the "already exists… Load that proposal and use Update" message.

---

## 5. Milestones completed in this session

1. **Reconnaissance** of project structure, canonical files, rules, Git/deploy relationship and risks (read-only; run on several models).
2. **v10.00.1 managed-proposal Load:** recon, then implementation (button, indicator, modal, isolated script block, validate-before-change, snapshot/rollback, `masterNewQuote` wrapper, `retestLoadedProposal` outside `proposalAppState`).
3. **Update archive/revision inspection** (read-only) against the intended architecture.
4. **Forensic Drive investigation** of a failed Update ("Unexpected update response") on "2026-09-29 - new test - Proposal V1": V1/V2 records, archives, manifest, timeline.
5. **Create naming change (frontend v10.01.1, backend v16.52.1):** managed live name `{date} - {customer} - Proposal`; duplicate rejection; legacy path preserved.
6. **Create → Loaded Rev 1 (frontend v10.01.2):** `establishLoadedProposalFromCreate`, plus the **Load/control-row visibility fix** (export row now `flex flex-wrap items-center gap-2`, status span `whitespace-normal break-words max-w-full`, so the Load button is no longer clipped).
7. **Prompt_History establishment** at the project root, with the first record for the Create → Loaded phase.
8. **Two read-only Create "Failed to fetch" investigations** (see §6).
9. **Test tooling** (kept in the session scratchpad, **not** in the project): headless Edge driven over CDP with request interception mocking Apps Script (77-check and 31-check suites), a Node harness running the real `.gs` against an in-memory Drive mock (53 checks), a layout probe, and real-Drive test scripts. All mock suites passed at v10.01.2 (77/77, 31/31, 53/53). Node was not on PATH; VS Code's `Code.exe` with `ELECTRON_RUN_AS_NODE=1` ran the harness.

---

## 6. Current Create fetch-failure issue

**Symptom:** after clicking Create the browser shows "Failed to fetch", although the Apps Script execution list shows `doPost` as **Completed**.

**Established evidence:**
- A real proposal **was** created server-side for the user's 07:24 click: **`PROP-261001-572F8E`**, `2026-10-01 - yeafg - Proposal`, Rev 1, destination `Test`. Doc modified 07:24:35, PDF 07:24:36, manifest created 07:24:37.787. Manifest customer `yeafg`, address `gaga`, phone `4242`, email `2424`. No "Zz" or "Loaded State" text. Doc id `1bRZcB4V1xXCbWSaP1f-aNhNUx_jWvuyoFb9RT85m3AI`, PDF id `1xu_yM2L10nWj_iiZczSeIwRAEYC0Q6V4`.
- The matching Apps Script execution was about **13.19 s** (started 07:24:26), consistent with a full Create (Doc ~9 s, PDF ~10 s, manifest ~11.8 s). An earlier 07:20:44 execution (1.267 s) wrote nothing.
- **"Completed" proves only that the script ran to the end.** It does **not** prove the browser received the response. Apps Script web apps answer a POST with a 302 redirect to `script.googleusercontent.com/macros/echo`, which the browser must then follow.
- "Failed to fetch" means `fetch()` itself **rejected**. A bad HTTP status would read "HTTP error! status: N"; backend errors return readable JSON; a JSON or post-success JS error would show its own text. So the success branch, including the Loaded Rev 1 logic, did **not** run on that click.
- In real headless-Edge tests on the dev machine, the server finished Create in ~10 s and Update in ~16 s, but the browser never received the response and failed at about **49 s** (`ERR_CONNECTION_RESET`) and **59 s** (`ERR_TIMED_OUT`). No redirect/echo request followed the POST. Duration alone is **not** the trigger: the user's Chrome completed a Create (06:17) and an Update (04:52) normally.
- The frontend `fetch` has **no timeout, AbortController or retry**, so the frontend code is not the cause of the lost response.
- The user's Chrome `net::ERR_*` code is **unknown** (no debug port; the Apps Script Executions page is not accessible from the agent).

**Most likely classification:** a successful backend Create with a lost/undelivered response, a break somewhere between Apps Script finishing and the browser receiving the redirect/echo response.

**Corrections to earlier statements (important):**
- An earlier Prompt_History record (`..._Create-Loaded-State.md`) wrongly says real Create/Update "appear to take about a minute". That is **wrong**. The server finishes in ~10–16 s; the client drops at ~49–59 s. The record was left unedited; later records carry the correction.
- An earlier inference that the user's attempt for "Loaded State Test 1001" created nothing was superseded: the 7:24 click did create "yeafg".

**Design constraints for the fix:**
- **Do NOT automatically retry the Create POST** (it would risk duplicate proposals).
- Recovery must use a **read-only** lookup (`listManagedProposals`) to learn whether Create actually succeeded.
- Optionally log error type and elapsed time to the console.

---

## 7. Test / proposal records (real Drive, `Platts/Platt's Proposals/Test/`)

Destination `Test` folder id: `1iuXY-cPKRiqcokFTPb47n7caGs4mk1tH`. The other destination, "Platt's Proposals 2026" (`1GU70f8VBeY8ETU7DZigReFkpkOY66uCC`), had **0** managed proposals at last check.

| ID | Name / customer | Rev | Origin | Label |
|---|---|---|---|---|
| `PROP-260929-7F0BE2` | "new test … V1" | 2 | Earlier test | Older managed test (user-created) |
| `PROP-260929-8190BB` | "… V2" | 1 | Earlier test | Older managed test (user-created) |
| `PROP-261001-AD164F` | "tester" | 1 | User, created 06:17 | User test (normal Chrome Create) |
| `PROP-261001-5B7E8D` | "Zz Loaded State Test" | 2 | **IDE/Claude-created THROWAWAY**, created 06:46:44, updated 06:48:48.9 | **Throwaway.** Unrelated to the user's clicks. Still in `Test`; deleting it is the owner's call |
| `PROP-261001-572F8E` | "yeafg" (`2026-10-01 - yeafg - Proposal`) | 1 | **User's** Create click at 07:24:37.787 | The evidence record for the fetch-failure issue; browser reported "Failed to fetch" |

The customer "Loaded State Test 1001" the user mentioned earlier produced **no** proposal. Whether "yeafg" was the name the user intended to type at 07:24 is **unconfirmed**.

Also noted but unverified: the live Doc may show a "(1)" alias in the local Drive mirror; this was only seen in the mirror, not confirmed in the Drive web UI.

---

## 8. Git / deployment state (at time of compaction)

- Branch `main`, HEAD **`6a66f2b`** ("Document local development and deployment workflow"); `origin/main` **`ad0f540`**.
- Working tree: modified `Agent/retest.html`, `Agent/retest.txt`, `script_changeout.gs`, `script_changeout.txt` (the v10.01.2 / v16.52.1 work); untracked `Platts/`, `Prompt_History/` (and now `Session_Context/`).
- Source fingerprints at this snapshot: `retest.html` mtime 06:37:33 (SHA-256 prefix `BF4309DD91C2`, mirror identical); `script_changeout.gs` mtime 05:56:21 (prefix `8E51753BCEF2`, mirror identical).
- **Nothing from this session was committed, pushed, or deployed by the agent.**
- **Backend deployment:** the user reports "Version 47". The project holds no deployment IDs, and the agent cannot read the Apps Script editor, so it **cannot be proven** that the deployed code equals local v16.52.1. Observed behaviour (clean names, `_v1` archives, manifest shape) is consistent with the local source, whose last modification (05:56:21) predates all observed behaviour. Do not state more than that.
- Frontend v10.01.2 is a local file; it was tested with mocks and one real-Drive run through a headless browser.

---

## 9. Prompt_History convention

- Real **IDE handoff prompts** are archived in `Prompt_History/` at the project root. Ordinary brainstorming with the user or ChatGPT is **not**.
- Filename pattern: `YYYY-MM-DD_v{frontend}-v{backend}_{Task-Name}.md`.
- Each record carries: date, task, type, frontend and backend version, recommended model and effort, actual model and effort, the verbatim prompt, files touched, result/testing, Git and deployment status.
- Recommended vs actual may differ. **Metadata the environment does not expose is recorded as UNKNOWN, never guessed.** In this session the actual model was `claude-sonnet-5-5`, and the actual effort was UNKNOWN (only a raw `reasoning_effort` value of 10 with no defined scale was visible).
- Records for this session: `..._Create-Loaded-State.md`, `..._Create-Fetch-Failure-Investigation.md`, `..._Create-Fetch-Failure-ReadOnly-Investigation.md`, and the context-archive handoff.

---

## 10. Rulebook / workflow quirks and cautions

- **Backup-rule conflict:** `Changeout_Rules.md` §3 forbids versioned backup copies (Git is history), but the user explicitly asked for checkpoints for one task. The checkpoints in `Agent/` are gitignored. Follow the current rulebook unless the user explicitly asks otherwise.
- **Mirror rule:** every edit to `retest.html` or `script_changeout.gs` must be mirrored byte-for-byte to `.txt` and versions kept in sync.
- **Scope discipline:** do not refactor, do not touch unrelated areas. Do not modify the backend for frontend-only tasks.
- **No automatic commit, push, merge or deploy.** The user does those.
- **Read-only tasks** have repeatedly meant exactly that: no file changes except a requested Prompt_History/context record; report unexpected changes instead of cleaning up.
- **Do not create real proposals in Drive** unless a task explicitly permits it and it is clearly labelled throwaway.
- **Equipment is stored by catalog index**, so loaded proposals re-price from the current catalog. Reordering or changing the catalog changes loaded proposals.
- **"Completed" in Apps Script ≠ browser got the response.**
- **Git line endings:** `core.autocrlf=true` plus BOM + CRLF in `retest.html`; editing tools must preserve them.
- **Test tooling lives outside the project** (session scratchpad). It will not exist in a new session.

---

## 11. Current unresolved / next task

**Managed Create fetch-failure recovery** (not implemented; awaiting explicit approval).

Expected behaviour:

1. Normal Create success → **Loaded Rev 1** (already implemented).
2. `fetch()` rejects / network failure on a **managed** Create → call the **read-only** `listManagedProposals` to see whether a matching managed proposal exists for the expected base name (and sensible creation-time window).
3. **Exactly one** match → recover it as **Loaded Rev 1** (load it the same way Load does).
4. **No match** → show a clear "nothing was created, safe to retry" message.
5. **Ambiguous** (more than one candidate) → do **not** guess; tell the user and let them Load manually.
6. **Never automatically retry the Create POST.**
7. Optional: log error type and elapsed time to the console; consider a client timeout with a clear message. No backend change is required for the recovery itself.

Optional evidence step: with Chrome DevTools open (Network tab, "Preserve log"), click Create once with a new customer and read the `exec` request's status or `net::ERR_…` text and whether a 302 and `script.googleusercontent.com/macros/echo` request follow.

Other open items (none authorized): amend the wrong "about a minute" sentence in the first Prompt_History record; decide whether to delete the throwaway Zz proposal; confirm with the user whether "yeafg" was the intended customer.
