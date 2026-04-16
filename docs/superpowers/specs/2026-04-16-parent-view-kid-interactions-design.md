# Parent View: Kid's Kawi Interactions + Chatbot Search

**Date:** 2026-04-16
**Status:** Approved design, ready for implementation plan
**Scope:** `kawabel-web` only

## Problem

Parents currently visit `/parent`, type a short `parent_code`, and see their child's name, star count, level, and a list of progress scores. They cannot see *what* their child actually worked on with Kawi — no chat transcripts, no uploaded homework photos, no dictation attempts, no mock test answers. There is no way to ask "what's she struggling with this week?" or "did she finish her IPA homework?" without guessing from raw scores.

Additionally, **chat messages are not persisted anywhere today.** Both the web `POST /api/chat` and the Express backend's `/api/chat` proxy directly to OpenAI without writing to any store. Messages only live in the student's client-side memory.

## Goals

1. Parents can see everything their child did with Kawi — chat, photos, dictation, quizzes, tests — scoped strictly to their linked children.
2. Parents can ask free-form questions about the child's activity and get cited answers grounded in the actual interactions.
3. On first page load, parents see a proactive "this week in a nutshell" card so they don't need to start from a blank prompt.
4. Access to this data is stronger than a shared code — Google-authenticated parent accounts, not a free-floating token.
5. Storage cost stays bounded via retention policies.

## Non-goals (v1)

- No parent-to-parent messaging.
- No parent-driven curriculum requests ("please have Kawi focus on X with my kid").
- No email / WhatsApp digests of the weekly report — the dashboard is the surface in v1.
- No multi-language parent UI — Bahasa Indonesia only in v1.
- Flutter-app parent surface is out of scope. The web dashboard is the only parent surface.

## Architecture

Three logical units, all in `kawabel-web`:

1. **Capture layer** — the existing `/api/chat`, photo upload, `/api/progress`, dictation submission, and test submission endpoints are retrofitted to write every interaction into an `interactions` table *before* returning to the client. For text-bearing rows (chat turns, photo captions, quiz/test rows), embeddings are computed in the same request via `waitUntil` so the kid's experience is not slowed.

2. **Parent portal** — `/parent` is fully rewritten. Google sign-in gate → `parent_accounts` table → list of linked kids (first sign-in pairs using the kid's existing `parent_code`). Dashboard at `/parent/[studentId]` shows three stacked panels: weekly insights card, conversational chatbot, raw activity timeline.

3. **Insights layer** — Vercel cron every Monday at 06:00 WIB generates a weekly summary per active student into `weekly_reports`. Parent Q&A at `/api/parent/ask` does hybrid retrieval (last 7 days by date + older via pgvector), calls GPT-4o, returns prose with citation IDs.

Data flow is one-way: kid's action → capture → `interactions` → summarization → parent reads. Parent never writes to anything the kid sees.

## Data model

### New tables

```sql
-- One row per Google-authenticated parent.
CREATE TABLE parent_accounts (
  id            SERIAL PRIMARY KEY,
  google_id     TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many: one parent can watch several siblings; one student can be watched by both parents.
CREATE TABLE parent_student_links (
  parent_id   INTEGER REFERENCES parent_accounts(id) ON DELETE CASCADE,
  student_id  INTEGER REFERENCES students(id) ON DELETE CASCADE,
  linked_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (parent_id, student_id)
);

-- Unified event log for everything the kid does with Kawi.
CREATE TABLE interactions (
  id            BIGSERIAL PRIMARY KEY,
  student_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN
                  ('chat_user','chat_assistant','photo','dictation','quiz','test')),
  subject       TEXT,          -- populated when inferable (math, IPA, etc.)
  topic         TEXT,          -- optional finer tag
  content       TEXT,          -- user msg, assistant reply, dictation answer, quiz Q+A, test Q+A
  photo_url     TEXT,          -- signed Supabase Storage URL; null for non-photo rows
  photo_path    TEXT,          -- storage path, used by retention job for deletion
  score         INTEGER,       -- for dictation/quiz/test rows
  total         INTEGER,
  correct       BOOLEAN,       -- for individual quiz/test answers
  thread_id     UUID,          -- groups consecutive chat turns into one conversation
  embedding     VECTOR(1536),  -- OpenAI text-embedding-3-small; null when no text to embed
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_student_time  ON interactions(student_id, created_at DESC);
CREATE INDEX idx_interactions_student_kind  ON interactions(student_id, kind);
CREATE INDEX idx_interactions_embedding     ON interactions USING hnsw (embedding vector_cosine_ops);
```

### Reused tables

- `weekly_reports` (already exists) holds the pre-computed "this week in a nutshell" card.
- `students.parent_code` remains but changes role: no longer a credential, now a one-shot pairing token during parent sign-in.

### RLS

- `interactions` and `weekly_reports` are readable only when `student_id` is in the authenticated parent's `parent_student_links`, or by the student themselves.
- Writes to these tables are gated to the student's own rows via the service role inside capture endpoints.

### Retention

Enforced by a daily Vercel cron:

- Rows older than 30 days with `photo_url` set → blob deleted from Storage, `photo_url` and `photo_path` nulled.
- Rows older than 365 days without `score`/`total` set (chat turns, photo rows whose blob has already been purged) → deleted.
- Rows with `score`/`total` set (dictation/quiz/test) are preserved forever as progress records; their `content` is nulled after 365 days but the score data remains.

## Auth flow

### First-time pairing

1. Parent visits `/parent` → "Sign in with Google" (reuses existing OAuth wiring used for students).
2. Google callback: if no row in `parent_accounts` for this `google_id`, create one. Show "Add your first child" screen with an input for the kid's `parent_code`.
3. Server verifies the code against `students.parent_code`, inserts a row into `parent_student_links`, lands the parent on the dashboard. The same code remains valid for a second parent (mum + dad both pair to the same kid).

### Returning parent

1. Sign in with Google → row exists → load `parent_student_links`.
2. If >1 linked kid, show a kid-picker. If 1 kid, go straight to the dashboard.
3. A small "+ Add child" button lets them pair more siblings using another code.

### Session and authorization

- Supabase Auth JWT from the Google sign-in identifies the parent by email.
- Middleware on every `/parent/*` route and every `/api/parent/*` endpoint resolves the parent row from the JWT (email → `parent_accounts.id`) and verifies the requested `student_id` is in their `parent_student_links`. Anything outside → 403. The same email can authenticate as either a student or a parent — the dashboard path determines which role is being acted on, and `parent_accounts` vs `students` lookup determines access.

### Unlinking and account deletion

- "Unlink" removes the `parent_student_links` row; kid data untouched.
- "Delete my parent account" wipes `parent_accounts` + all links; kid data untouched.
- Kid-side account deletion cascades via `ON DELETE CASCADE`, plus triggers a Storage cleanup job for any photos.

### What goes away

The old "enter parent_code, no sign-in" flow is removed. `parent_code` is no longer a credential.

## UI

The dashboard at `/parent/[studentId]` uses Nunito for headings, Poppins body, primary `#4CAF50` — same system as the rest of Kawabel.

**Header:** kid avatar, name, grade, star count, level. Kid-switcher pill on the right if parent has >1 linked student. Settings drawer (unlink child, retention info, sign out).

### Panel 1 — Weekly insight card (top, always visible)

Pulled from `weekly_reports` for the current week. Reads like a short note from Kawi:

> *"Minggu ini Alya aktif 5 dari 7 hari. Dia makin lancar perkalian dua digit (8/10 soal benar di sesi terakhir), tapi masih sering bingung soal pecahan campuran. Saya sudah kasih latihan tambahan di topik ini. Dia juga selesaikan PR IPA tentang fotosintesis."*

Below the paragraph: three chips — **Strongest**, **Struggling**, **Recommended next**. Each chip is clickable and pipes its label into the chatbot as a pre-filled question.

### Panel 2 — Chatbot (middle)

Standard chat UI. Placeholder: *"Tanya apa saja tentang belajar Alya..."*. Three suggestion chips below the input on first load: "Apa yang dia kerjakan hari ini?", "Mata pelajaran apa yang sulit?", "Apakah dia sudah selesaikan PR matematika?".

Replies render as prose with inline citation pills like `[1]` `[2]`. Clicking a citation scrolls Panel 3 to that exact interaction and highlights it.

### Panel 3 — Raw activity timeline (bottom)

Reverse-chronological, grouped by day, infinite scroll. Each row is a compact card with an icon for the `kind`:

- 💬 chat thread — first question + reply count; expands on tap to full transcript
- 📷 photo — thumbnail + Kawi's interpretation
- ✍️ dictation — word list + score
- 📝 quiz/test — subject + score + expandable per-question breakdown

Filters at the top: subject chips (Math, IPA, IPS, …), kind toggle (all / chat / photos / quizzes), date range.

### Mobile

Tabs instead of stacking, same three panels. Panel 2 (chatbot) is the default tab because that is what parents actually want to use.

### Empty states

If the kid has never used Kawi, Panel 1 shows a friendly "belum ada aktivitas minggu ini" card with how-to hints instead of a blank card.

## Chatbot behavior

### Weekly summary cron (`/api/cron/weekly-reports`)

Scheduled Mondays at 06:00 WIB via Vercel cron declared in `vercel.ts`.

1. Query all students with ≥1 interaction in the last 7 days.
2. For each student, pull last week's interactions: chat turns, photo captions, dictation rows, quiz + test rows with score and correctness.
3. Single GPT-4o call with a structured prompt. Response shape (OpenAI JSON mode):
   ```json
   { "paragraph": "...", "strongest": "...", "struggling": "...", "next_step": "..." }
   ```
4. Upsert into `weekly_reports` keyed by `(student_id, week_start)`.

If the cron misses (deploy outage, platform delay), the dashboard falls back to on-demand generation on page load and caches the result into `weekly_reports` anyway.

### Parent Q&A (`POST /api/parent/ask`)

Request body: `{ student_id: number, question: string, history: { role, content }[] }`.

1. **Auth:** verify parent JWT owns `student_id` via `parent_student_links`. 403 otherwise.
2. **Retrieval (hybrid):**
   - Pull last 7 days of rows for this `student_id` ordered by time. Cap at 60 rows (recency beats semantics for parent questions).
   - Embed the question with `text-embedding-3-small`. Vector search over `interactions.embedding` scoped to this `student_id` with `created_at < now() - interval '7 days'`, limit 20 by cosine distance.
   - Merge, dedupe by `id`, sort chronologically. Each row is assigned a 1-indexed `cite_id`.
3. **Prompt:** system message sets parent-facing tone (Bahasa Indonesia, warm, concise, do not fabricate). Includes the kid's name and grade. Retrieved rows injected as `[1] 2026-04-14 chat: "..."`, `[2] 2026-04-13 quiz math pecahan 6/10: ...`. User message: parent's question + last 3 turns of parent-chatbot history.
4. **Response contract:** GPT-4o returns (JSON mode):
   ```json
   { "answer": "...", "citations": [1, 3, 7] }
   ```
   Answer contains `[N]` markers inline. Server maps `cite_id` → `interaction_id` so the UI can render clickable pills.
5. **Guardrails:**
   - If retrieval returns 0 rows, skip the LLM and return a deterministic message.
   - If the question is flagged unrelated-to-child (weather, general trivia), short-circuit with a polite redirect.

### Capture-path embedding

`chat_user`, `chat_assistant`, `photo` (caption text), `quiz`, and `test` rows get embedded inline in the originating API call using `waitUntil` so the kid's chat response is not delayed. Dictation rows skip embedding — short word lists do not benefit from semantic search.

### Cost

- `text-embedding-3-small`: $0.02 / 1M tokens. Each chat turn costs well under $0.00001.
- Weekly summary: one GPT-4o call per active student per week.
- Parent Q&A: one GPT-4o call per question plus one small embedding.

Negligible relative to existing OpenAI spend on student chat.

## Privacy and consent

### Kid visibility

The kid knows. Two touch points:

- One-time banner inside the student app when a parent first pairs: *"Orang tuamu bisa lihat ringkasan belajarmu di Kawabel. Belajar jujur, tidak apa salah!"*
- A small 👀 badge next to the kid's avatar on the student home screen whenever any parent is linked (passive reminder).

### Kid cannot hide specific conversations

Product position: "parent sees everything Kawi sees." Hiding would undermine parent trust. The escape hatch for a kid wanting privacy is *not using Kawi for that thing*, which matches physical-world tuition centers.

### Parent cannot contact the kid through this surface

No "message your kid" feature. Parent flow is read-only for the kid's data, write-only for their own account settings.

### Data deletion

- Dashboard "Unlink" → removes link only.
- Dashboard "Delete my parent account" → wipes `parent_accounts` + all `parent_student_links`.
- Neither action touches the kid's data.
- Kid-side account deletion cascades via FK, plus triggers a Storage cleanup job.

### Indonesian legal context

UU PDP applies. Parent consent to store chat + photos is implied by existing ToS plus a disclosure shown during the pairing flow: "With Kawabel Parent View enabled, Kawi's conversations with your child are stored so you can review them." Consent timestamp recorded on `parent_student_links.linked_at`.

## Testing

- **RLS policy tests** (Supabase SQL tests) — a parent reading another parent's kid's `interactions` returns 0 rows. Service role bypass works for capture endpoints.
- **Integration tests** (Vitest + local Supabase) for `/api/parent/ask` covering: valid question → cited answer, unauthorized student_id → 403, zero-retrieval → canned response, long kid history → retrieval limit respected.
- **Unit tests** for the retention cron: photos >30d deleted from Storage, text >365d purged, rows with `score`/`total` preserved with `content` nulled.
- **E2E** (Playwright) golden-path: Google sign-in stub → pair with parent_code → ask a question → click a citation → timeline scrolls to the right row.
- **No mocks of Supabase in integration tests** — run against a local Supabase instance so RLS is exercised.

## Migration notes

- Enable `pgvector` extension on Supabase (one-line SQL, already available on their platform).
- Drop the existing `/parent` unauthenticated lookup endpoint (`src/app/api/parent/route.ts`) — replaced by authenticated endpoints.
- No backfill of past chat messages. Old conversations pre-launch are lost; only interactions from the launch date forward appear in the dashboard.
- `parent_code` column remains. Its role shifts from credential to pairing token.

## Open questions

None blocking. If any of the following come up during implementation, revisit this spec:

- Does the weekly summary cron need to run closer to daily for very active students? Defer until we see real usage.
- Should the chatbot be able to answer across siblings ("who did more this week, Alya or Budi?")? Defer to v2.
