# Parent View: Kid Interactions + Chatbot Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Google-authenticated parents view every interaction their child has with Kawi (chat, photos, dictation, quizzes, tests) and ask free-form questions answered by a RAG chatbot with citations and a pre-computed weekly summary.

**Architecture:** Capture layer retrofits existing endpoints to write into a unified `interactions` table with pgvector embeddings. Parent dashboard is a Google-signed-in route at `/parent/[studentId]` with three panels (weekly card, chatbot, timeline). Q&A endpoint uses hybrid retrieval (date-filtered recent + vector-search older) against GPT-4o. Weekly and retention Vercel crons keep data fresh and bounded.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + pgvector + Storage + RLS), OpenAI GPT-4o + text-embedding-3-small, Vercel Crons, Vitest for integration/unit tests, Playwright for E2E.

**Spec:** `docs/superpowers/specs/2026-04-16-parent-view-kid-interactions-design.md`

**Repo:** `kawabel-web` (all paths below are relative to its root).

---

## File Structure

### New files
```
supabase/
  migrations/
    20260416_001_parent_view_schema.sql
    20260416_002_parent_view_rls.sql
    20260416_003_parent_view_storage.sql
src/lib/
  embeddings.ts              # OpenAI text-embedding-3-small wrapper
  interactions.ts            # insert/query helpers for the interactions table
  parent-auth.ts             # request-level parent authentication middleware
  parent-retrieval.ts        # hybrid date + vector retrieval for ask endpoint
src/app/api/parent/
  pair/route.ts              # POST { id_token, parent_code }
  students/route.ts          # GET linked students
  unlink/route.ts            # POST { student_id } to remove a link
  ask/route.ts               # POST { student_id, question, history }
  weekly-report/route.ts     # GET current weekly report
  interactions/route.ts      # GET paginated timeline
src/app/api/parent/photo/route.ts  # photo upload endpoint (new)
src/app/api/cron/
  weekly-reports/route.ts
  retention/route.ts
src/app/parent/
  page.tsx                   # REWRITE: sign-in + kid picker
  pair/page.tsx              # pair form (first child or additional)
  [studentId]/page.tsx       # dashboard shell
  components/
    WeeklyCard.tsx
    ParentChatbot.tsx
    ActivityTimeline.tsx
    KidSwitcher.tsx
    ParentHeader.tsx
tests/
  unit/
    embeddings.test.ts
    interactions.test.ts
    parent-auth.test.ts
    parent-retrieval.test.ts
  integration/
    parent-pair.test.ts
    parent-ask.test.ts
    parent-rls.test.ts
    retention-cron.test.ts
    weekly-cron.test.ts
  e2e/
    parent-golden-path.spec.ts
  helpers/
    supabase-test.ts         # local Supabase connection + fixture helpers
vitest.config.ts
playwright.config.ts
```

### Modified files
```
package.json                 # add vitest, @vitest/ui, playwright, supabase CLI
vercel.json                  # add crons (weekly + retention)
src/lib/supabase.ts          # add anon client for JWT-scoped queries
src/app/api/chat/route.ts    # log chat_user + chat_assistant interactions
src/app/api/progress/route.ts # log as `quiz` or `test` interactions
```

### Deleted files
```
src/app/api/parent/route.ts  # unauthenticated parent_code lookup (replaced)
```

---

## Phase 0: Scaffolding & Tooling

### Task 0.1: Add Vitest and test harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/helpers/supabase-test.ts`

- [ ] **Step 1: Install test deps**

```bash
cd ~/Documents/kawabel-web
npm install -D vitest @vitest/ui dotenv
```

- [ ] **Step 2: Add scripts to `package.json`**

Edit the `scripts` block in `package.json` to include:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:integration": "vitest run tests/integration",
"test:unit": "vitest run tests/unit"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/helpers/setup-env.ts'],
    testTimeout: 30_000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 4: Create `tests/helpers/setup-env.ts`**

```ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test.local' });
dotenv.config({ path: '.env.local' });
```

- [ ] **Step 5: Create `tests/helpers/supabase-test.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

export function getTestSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_KEY!;
  if (!url || !key) throw new Error('Missing test Supabase env');
  return createClient(url, key);
}

export async function createTestStudent(db: ReturnType<typeof getTestSupabase>, overrides: Partial<{
  name: string; parent_code: string; email: string;
}> = {}) {
  const name = overrides.name ?? `Test_${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await db.from('students').insert({
    name,
    email: overrides.email ?? `${name.toLowerCase()}@test.local`,
    parent_code: overrides.parent_code ?? `TEST-${Math.floor(Math.random() * 9000 + 1000)}`,
    grade: 'SD',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function cleanupStudent(db: ReturnType<typeof getTestSupabase>, id: number) {
  await db.from('parent_student_links').delete().eq('student_id', id);
  await db.from('interactions').delete().eq('student_id', id);
  await db.from('students').delete().eq('id', id);
}
```

- [ ] **Step 6: Smoke test — write a trivial test to confirm runner works**

Create `tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => expect(1 + 1).toBe(2));
});
```

Run: `npm run test:unit`
Expected: `1 passed`

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/
git commit -m "chore: add vitest test harness"
```

---

### Task 0.2: Install Playwright for E2E

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`

- [ ] **Step 1: Install**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Add script**

Add to `package.json` scripts: `"test:e2e": "playwright test"`

- [ ] **Step 3: Config**

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json playwright.config.ts
git commit -m "chore: add playwright for e2e"
```

---

### Task 0.3: Supabase CLI + local dev env

**Files:**
- Create: `supabase/` directory structure
- Modify: `.gitignore`

- [ ] **Step 1: Install Supabase CLI if not present**

```bash
which supabase || brew install supabase/tap/supabase
```

- [ ] **Step 2: Init supabase in repo**

```bash
cd ~/Documents/kawabel-web
supabase init
```

This creates `supabase/config.toml` and `supabase/migrations/`.

- [ ] **Step 3: Add `.gitignore` entries**

Append to `.gitignore`:

```
.env.test.local
supabase/.temp/
supabase/.branches/
```

- [ ] **Step 4: Start local Supabase for tests**

```bash
supabase start
```

Capture the printed `API URL`, `anon key`, and `service_role key`.

- [ ] **Step 5: Create `.env.test.local`**

```
SUPABASE_URL=<local API URL from step 4>
SUPABASE_SERVICE_KEY=<service_role key from step 4>
SUPABASE_ANON_KEY=<anon key from step 4>
OPENAI_API_KEY=sk-test-placeholder
```

- [ ] **Step 6: Commit**

```bash
git add supabase/config.toml .gitignore
git commit -m "chore: init supabase local dev"
```

---

## Phase 1: Data Layer

### Task 1.1: Schema migration (tables + pgvector)

**Files:**
- Create: `supabase/migrations/20260416_001_parent_view_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Enable pgvector extension (idempotent).
CREATE EXTENSION IF NOT EXISTS vector;

-- Parent accounts (Google-authenticated).
CREATE TABLE IF NOT EXISTS parent_accounts (
  id          SERIAL PRIMARY KEY,
  google_id   TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_accounts_email ON parent_accounts(email);

-- Parent↔student links (many-to-many).
CREATE TABLE IF NOT EXISTS parent_student_links (
  parent_id   INTEGER REFERENCES parent_accounts(id) ON DELETE CASCADE,
  student_id  INTEGER REFERENCES students(id) ON DELETE CASCADE,
  linked_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_links_student ON parent_student_links(student_id);

-- Unified interaction event log.
CREATE TABLE IF NOT EXISTS interactions (
  id           BIGSERIAL PRIMARY KEY,
  student_id   INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN
                 ('chat_user','chat_assistant','photo','dictation','quiz','test')),
  subject      TEXT,
  topic        TEXT,
  content      TEXT,
  photo_url    TEXT,
  photo_path   TEXT,
  score        INTEGER,
  total        INTEGER,
  correct      BOOLEAN,
  thread_id    UUID,
  embedding    VECTOR(1536),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_student_time ON interactions(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_student_kind ON interactions(student_id, kind);
CREATE INDEX IF NOT EXISTS idx_interactions_embedding ON interactions USING hnsw (embedding vector_cosine_ops);
```

- [ ] **Step 2: Apply locally**

```bash
supabase db reset
```

This applies all migrations including the bootstrap `supabase-setup.sql`. If the CLI does not auto-pick up `supabase-setup.sql`, copy its contents into an earlier migration `supabase/migrations/20260101_000_bootstrap.sql` first.

Expected output: "Applied migration 20260416_001_parent_view_schema" and no errors.

- [ ] **Step 3: Sanity check tables exist**

```bash
supabase db reset >/dev/null 2>&1
psql "$(supabase status -o json | jq -r .DB_URL)" -c "\d+ interactions"
```

Expected: column listing including `embedding vector(1536)`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260416_001_parent_view_schema.sql
git commit -m "feat(db): add parent_accounts, parent_student_links, interactions"
```

---

### Task 1.2: RLS policies

**Files:**
- Create: `supabase/migrations/20260416_002_parent_view_rls.sql`
- Create: `tests/integration/parent-rls.test.ts`

- [ ] **Step 1: Write failing test**

`tests/integration/parent-rls.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';

describe('parent RLS', () => {
  const admin = getTestSupabase();
  let studentA: any, studentB: any, parentA: any;

  beforeAll(async () => {
    studentA = await createTestStudent(admin);
    studentB = await createTestStudent(admin);
    const { data } = await admin.from('parent_accounts').insert({
      google_id: 'g_testA', email: 'parentA@test.local', name: 'A',
    }).select().single();
    parentA = data;
    await admin.from('parent_student_links').insert({ parent_id: parentA.id, student_id: studentA.id });
    await admin.from('interactions').insert([
      { student_id: studentA.id, kind: 'chat_user', content: 'A question' },
      { student_id: studentB.id, kind: 'chat_user', content: 'B question' },
    ]);
  });

  afterAll(async () => {
    await cleanupStudent(admin, studentA.id);
    await cleanupStudent(admin, studentB.id);
    await admin.from('parent_accounts').delete().eq('id', parentA.id);
  });

  it('parent with JWT only sees linked students interactions', async () => {
    const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${await signTestJwt(parentA.email)}` } },
    });
    const { data } = await anon.from('interactions').select('*');
    expect(data?.map(r => r.student_id)).toEqual([studentA.id]);
  });
});

// Dev helper: sign a Supabase Auth JWT for tests.
async function signTestJwt(email: string) {
  const { data, error } = await getTestSupabase().auth.admin.generateLink({
    type: 'magiclink', email,
  });
  if (error) throw error;
  return data.properties.hashed_token;
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:integration -- parent-rls
```
Expected: FAIL — "relation interactions has no RLS" or returns rows from both students.

- [ ] **Step 3: Write the RLS migration**

`supabase/migrations/20260416_002_parent_view_rls.sql`:

```sql
-- Enable RLS on new tables.
ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- parent_accounts: a parent can read/update their own row by matching email.
CREATE POLICY parent_accounts_self_read ON parent_accounts
  FOR SELECT USING (email = auth.jwt() ->> 'email');
CREATE POLICY parent_accounts_self_update ON parent_accounts
  FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- parent_student_links: a parent sees their own links.
CREATE POLICY links_self_read ON parent_student_links
  FOR SELECT USING (
    parent_id IN (SELECT id FROM parent_accounts WHERE email = auth.jwt() ->> 'email')
  );

-- interactions: readable when student_id is in the parent's linked set.
CREATE POLICY interactions_parent_read ON interactions
  FOR SELECT USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_id IN (
        SELECT id FROM parent_accounts WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

-- weekly_reports: same rule.
CREATE POLICY reports_parent_read ON weekly_reports
  FOR SELECT USING (
    student_id IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_id IN (
        SELECT id FROM parent_accounts WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

-- Service role bypasses RLS by default; no policy needed for capture path.
```

- [ ] **Step 4: Apply + rerun test**

```bash
supabase db reset
npm run test:integration -- parent-rls
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260416_002_parent_view_rls.sql tests/integration/parent-rls.test.ts
git commit -m "feat(db): add RLS for parent view tables"
```

---

### Task 1.3: Storage bucket for kid photos

**Files:**
- Create: `supabase/migrations/20260416_003_parent_view_storage.sql`

- [ ] **Step 1: Write migration**

```sql
-- Create private storage bucket for kid-uploaded homework photos.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kid-photos', 'kid-photos', false, 8_388_608,
        ARRAY['image/jpeg','image/png','image/webp','image/heic'])
ON CONFLICT (id) DO NOTHING;

-- Parents can read their linked kids' photos.
CREATE POLICY kid_photo_parent_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kid-photos'
    AND (storage.foldername(name))[1]::int IN (
      SELECT student_id FROM parent_student_links
      WHERE parent_id IN (SELECT id FROM parent_accounts WHERE email = auth.jwt() ->> 'email')
    )
  );

-- Authenticated students can upload into their own folder.
CREATE POLICY kid_photo_self_upload ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kid-photos'
    AND (storage.foldername(name))[1]::int IN (
      SELECT id FROM students WHERE email = auth.jwt() ->> 'email'
    )
  );
```

- [ ] **Step 2: Apply**

```bash
supabase db reset
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260416_003_parent_view_storage.sql
git commit -m "feat(db): add kid-photos storage bucket with RLS"
```

---

## Phase 2: Capture Infrastructure

### Task 2.1: `embeddings.ts` helper

**Files:**
- Create: `src/lib/embeddings.ts`
- Create: `tests/unit/embeddings.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { embedText } from '@/lib/embeddings';

describe('embedText', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns 1536-dim float vector', async () => {
    const vec = await embedText('halo dunia');
    expect(Array.isArray(vec)).toBe(true);
    expect(vec).toHaveLength(1536);
    expect(typeof vec[0]).toBe('number');
  });

  it('returns null for empty input', async () => {
    expect(await embedText('')).toBeNull();
    expect(await embedText('   ')).toBeNull();
  });

  it('truncates inputs beyond model limit', async () => {
    const long = 'a'.repeat(100_000);
    const vec = await embedText(long);
    expect(vec).toHaveLength(1536);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm run test:unit -- embeddings
```
Expected: FAIL — cannot resolve `@/lib/embeddings`.

- [ ] **Step 3: Implement**

`src/lib/embeddings.ts`:

```ts
import OpenAI from 'openai';

let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const MODEL = 'text-embedding-3-small';
const MAX_CHARS = 24_000; // well under the 8192-token limit for this model

export async function embedText(text: string): Promise<number[] | null> {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  const input = trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;

  const res = await getClient().embeddings.create({
    model: MODEL,
    input,
  });
  return res.data[0]?.embedding ?? null;
}
```

- [ ] **Step 4: Run test**

```bash
npm run test:unit -- embeddings
```
Expected: PASS (requires a real `OPENAI_API_KEY` in `.env.test.local`; if not available, mark tests as `skip` when `!process.env.OPENAI_API_KEY`). For local runs without OpenAI, add this guard at the top of the file:

```ts
const hasKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-test-placeholder';
const maybe = hasKey ? it : it.skip;
```
And change `it` → `maybe` in the 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/embeddings.ts tests/unit/embeddings.test.ts
git commit -m "feat: add text embedding helper"
```

---

### Task 2.2: `interactions.ts` capture helpers

**Files:**
- Create: `src/lib/interactions.ts`
- Create: `tests/unit/interactions.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';
import { logInteraction, logChatTurn } from '@/lib/interactions';

describe('interactions helpers', () => {
  const db = getTestSupabase();
  let student: any;

  beforeAll(async () => { student = await createTestStudent(db); });
  afterAll(async () => { await cleanupStudent(db, student.id); });

  it('logInteraction inserts a single row with embedding', async () => {
    const id = await logInteraction({
      student_id: student.id,
      kind: 'quiz',
      subject: 'math',
      content: 'What is 2+2?',
      score: 1, total: 1, correct: true,
    });
    const { data } = await db.from('interactions').select('*').eq('id', id).single();
    expect(data.kind).toBe('quiz');
    expect(data.correct).toBe(true);
  });

  it('logChatTurn inserts two rows sharing a thread_id', async () => {
    const thread = await logChatTurn({
      student_id: student.id,
      user_message: 'Tolong bantu soal ini',
      assistant_message: 'Baik, mari kita lihat...',
    });
    const { data } = await db.from('interactions')
      .select('*').eq('thread_id', thread).order('id', { ascending: true });
    expect(data).toHaveLength(2);
    expect(data![0].kind).toBe('chat_user');
    expect(data![1].kind).toBe('chat_assistant');
  });
});
```

- [ ] **Step 2: Run — FAIL**

```bash
npm run test:integration -- interactions
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/lib/interactions.ts`:

```ts
import { randomUUID } from 'crypto';
import { getSupabase } from './supabase';
import { embedText } from './embeddings';

type Kind = 'chat_user' | 'chat_assistant' | 'photo' | 'dictation' | 'quiz' | 'test';

export interface InteractionInput {
  student_id: number;
  kind: Kind;
  subject?: string | null;
  topic?: string | null;
  content?: string | null;
  photo_url?: string | null;
  photo_path?: string | null;
  score?: number | null;
  total?: number | null;
  correct?: boolean | null;
  thread_id?: string | null;
}

/** Insert one interaction, embedding text content when present. Returns the new row id. */
export async function logInteraction(input: InteractionInput): Promise<number> {
  const db = getSupabase();
  const shouldEmbed = !!input.content && input.kind !== 'dictation';
  const embedding = shouldEmbed ? await embedText(input.content!) : null;

  const { data, error } = await db.from('interactions').insert({
    ...input,
    embedding,
  }).select('id').single();

  if (error) throw error;
  return data.id;
}

/** Shorthand: log a full user→assistant turn under one thread_id. Returns thread_id. */
export async function logChatTurn(args: {
  student_id: number;
  user_message: string;
  assistant_message: string;
  thread_id?: string;
  subject?: string | null;
}): Promise<string> {
  const thread_id = args.thread_id ?? randomUUID();
  await logInteraction({
    student_id: args.student_id,
    kind: 'chat_user',
    content: args.user_message,
    thread_id,
    subject: args.subject ?? null,
  });
  await logInteraction({
    student_id: args.student_id,
    kind: 'chat_assistant',
    content: args.assistant_message,
    thread_id,
    subject: args.subject ?? null,
  });
  return thread_id;
}
```

- [ ] **Step 4: Run test — PASS**

```bash
npm run test:integration -- interactions
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/interactions.ts tests/unit/interactions.test.ts
git commit -m "feat: add interaction logging helpers"
```

---

### Task 2.3: Retrofit `/api/chat` to persist interactions

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Write failing test**

`tests/integration/chat-capture.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';

describe('/api/chat capture', () => {
  const db = getTestSupabase();
  let student: any;

  beforeAll(async () => { student = await createTestStudent(db); });
  afterAll(async () => { await cleanupStudent(db, student.id); });

  it('stores chat_user + chat_assistant rows with shared thread_id', async () => {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        student_id: student.id,
        messages: [{ role: 'user', content: 'Hai Kawi' }],
      }),
    });
    expect(res.ok).toBe(true);
    // Allow waitUntil to flush (poll briefly).
    let rows: any[] = [];
    for (let i = 0; i < 10 && rows.length < 2; i++) {
      await new Promise(r => setTimeout(r, 200));
      const { data } = await db.from('interactions').select('*').eq('student_id', student.id);
      rows = data ?? [];
    }
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map(r => r.kind))).toEqual(new Set(['chat_user', 'chat_assistant']));
    expect(rows[0].thread_id).toBe(rows[1].thread_id);
  });
});
```

- [ ] **Step 2: Run — FAIL**

Boot dev server (`npm run dev`) in another terminal then `npm run test:integration -- chat-capture`. Expect FAIL (no rows).

- [ ] **Step 3: Modify `src/app/api/chat/route.ts`**

At the top, add:

```ts
import { logChatTurn } from '@/lib/interactions';
import { after } from 'next/server';
```

After `const reply = completion.choices[0]?.message?.content || 'Maaf, coba tanya lagi ya!';` and *before* the `return NextResponse.json({ reply });` line:

```ts
// Persist for parent view (best-effort; don't block the kid's response).
if (student_id && student_id > 0) {
  const lastUserMessage = typeof lastMsg?.content === 'string'
    ? lastMsg.content
    : textContent;
  after(async () => {
    try {
      await logChatTurn({
        student_id,
        user_message: lastUserMessage,
        assistant_message: reply,
      });
    } catch (e) {
      console.error('Chat capture failed:', e);
    }
  });
}
```

(`after` is the Next.js 16 `unstable_after`/`after` API — imports from `next/server`.)

- [ ] **Step 4: Rerun test**

```bash
npm run test:integration -- chat-capture
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts tests/integration/chat-capture.test.ts
git commit -m "feat(chat): persist chat turns as interactions for parent view"
```

---

### Task 2.4: Photo upload endpoint

**Files:**
- Create: `src/app/api/parent/photo/route.ts` (misnamed — actually student-side; place at `src/app/api/photo/route.ts`)

Use `src/app/api/photo/route.ts` instead.

- [ ] **Step 1: Write failing test**

`tests/integration/photo-capture.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';
import fs from 'fs';

describe('/api/photo capture', () => {
  const db = getTestSupabase();
  let student: any;

  beforeAll(async () => { student = await createTestStudent(db); });
  afterAll(async () => { await cleanupStudent(db, student.id); });

  it('stores photo row with photo_url + photo_path', async () => {
    const form = new FormData();
    form.append('student_id', String(student.id));
    form.append('caption', 'soal matematika halaman 42');
    const fakePng = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]); // PNG header
    form.append('file', new Blob([fakePng], { type: 'image/png' }), 'test.png');

    const res = await fetch('http://localhost:3000/api/photo', { method: 'POST', body: form });
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.photo_url).toMatch(/^https?:\/\//);

    await new Promise(r => setTimeout(r, 400));
    const { data } = await db.from('interactions').select('*')
      .eq('student_id', student.id).eq('kind', 'photo').single();
    expect(data.photo_url).toBe(json.photo_url);
    expect(data.photo_path).toBe(json.photo_path);
    expect(data.content).toBe('soal matematika halaman 42');
  });
});
```

- [ ] **Step 2: Run — FAIL**

Expected: 404 from the endpoint.

- [ ] **Step 3: Implement `src/app/api/photo/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { logInteraction } from '@/lib/interactions';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const studentId = Number(form.get('student_id'));
    const caption = String(form.get('caption') ?? '');
    const file = form.get('file') as File | null;

    if (!studentId || !file) {
      return NextResponse.json({ error: 'student_id and file required' }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'file too large (max 8MB)' }, { status: 413 });
    }

    const db = getSupabase();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${studentId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await db.storage.from('kid-photos')
      .upload(path, file, { contentType: file.type });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: signed } = await db.storage.from('kid-photos').createSignedUrl(path, 60 * 60 * 24 * 30);
    const photoUrl = signed?.signedUrl ?? '';

    after(async () => {
      try {
        await logInteraction({
          student_id: studentId,
          kind: 'photo',
          content: caption || null,
          photo_url: photoUrl,
          photo_path: path,
        });
      } catch (e) { console.error('Photo capture failed:', e); }
    });

    return NextResponse.json({ photo_url: photoUrl, photo_path: path });
  } catch (err) {
    console.error('Photo upload error:', err);
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Rerun — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/photo/route.ts tests/integration/photo-capture.test.ts
git commit -m "feat(photo): upload endpoint with interaction capture"
```

---

### Task 2.5: Retrofit `/api/progress` to log interactions

**Files:**
- Modify: `src/app/api/progress/route.ts`

- [ ] **Step 1: Read existing route**

```bash
cat src/app/api/progress/route.ts
```

Note the shape of the incoming body (likely `{ student_id, subject, topic, score, total, type }`).

- [ ] **Step 2: Write failing test**

`tests/integration/progress-capture.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';

describe('/api/progress capture', () => {
  const db = getTestSupabase();
  let student: any;
  beforeAll(async () => { student = await createTestStudent(db); });
  afterAll(async () => { await cleanupStudent(db, student.id); });

  it('persists a quiz interaction with score/total', async () => {
    const res = await fetch('http://localhost:3000/api/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        student_id: student.id, subject: 'math', topic: 'perkalian',
        score: 8, total: 10, type: 'quiz', content: 'What is 3x4? Answered 12.',
      }),
    });
    expect(res.ok).toBe(true);
    await new Promise(r => setTimeout(r, 300));
    const { data } = await db.from('interactions').select('*').eq('student_id', student.id).eq('kind', 'quiz').single();
    expect(data.score).toBe(8);
    expect(data.subject).toBe('math');
  });
});
```

- [ ] **Step 3: Run — FAIL**

- [ ] **Step 4: Modify `src/app/api/progress/route.ts`**

In the POST handler, after the existing progress insert succeeds, add before the response:

```ts
import { after } from 'next/server';
import { logInteraction } from '@/lib/interactions';
// ...
const { type, subject, topic, score, total, content } = body; // match existing names
const kind = type === 'test' ? 'test' : type === 'dictation' ? 'dictation' : 'quiz';
after(async () => {
  try {
    await logInteraction({
      student_id, kind, subject, topic,
      content: content ?? null, score, total,
    });
  } catch (e) { console.error('Progress capture failed:', e); }
});
```

If the existing route does not accept a `content` field yet, also extend the request contract to pass through the question+answer text (optional).

- [ ] **Step 5: Rerun — PASS**

- [ ] **Step 6: Commit**

```bash
git add src/app/api/progress/route.ts tests/integration/progress-capture.test.ts
git commit -m "feat(progress): persist as quiz/test/dictation interactions"
```

---

## Phase 3: Parent Auth

### Task 3.1: `parent-auth.ts` middleware helper

**Files:**
- Create: `src/lib/parent-auth.ts`
- Create: `tests/unit/parent-auth.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getTestSupabase } from '../helpers/supabase-test';
import { authenticateParent } from '@/lib/parent-auth';

describe('authenticateParent', () => {
  const db = getTestSupabase();
  let parent: any;

  beforeAll(async () => {
    const { data } = await db.from('parent_accounts').insert({
      google_id: 'g_middleware_test', email: 'mw@test.local', name: 'MW',
    }).select().single();
    parent = data;
  });
  afterAll(async () => { await db.from('parent_accounts').delete().eq('id', parent.id); });

  it('returns parent row for valid Google id_token', async () => {
    vi.spyOn(global, 'fetch').mockImplementationOnce(async () =>
      new Response(JSON.stringify({ email: 'mw@test.local', sub: 'g_middleware_test', name: 'MW' }), { status: 200 }));
    const result = await authenticateParent('fake_id_token');
    expect(result.parent.email).toBe('mw@test.local');
  });

  it('throws for invalid token', async () => {
    vi.spyOn(global, 'fetch').mockImplementationOnce(async () => new Response('bad', { status: 400 }));
    await expect(authenticateParent('bad')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement `src/lib/parent-auth.ts`**

```ts
import { NextRequest } from 'next/server';
import { getSupabase } from './supabase';

export interface AuthedParent {
  id: number;
  email: string;
  google_id: string;
  name: string | null;
}

// Tiny in-process cache: Google tokeninfo is cheap but re-hitting it per API call is wasteful.
const cache = new Map<string, { exp: number; email: string; sub: string; name?: string; picture?: string }>();

async function verifyGoogleToken(id_token: string) {
  const now = Date.now();
  const cached = cache.get(id_token);
  if (cached && cached.exp > now) return cached;

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`);
  if (!res.ok) throw new Error('invalid_token');
  const info = await res.json() as { email: string; sub: string; name?: string; picture?: string; exp?: string };
  const entry = {
    email: info.email, sub: info.sub, name: info.name, picture: info.picture,
    exp: Math.min(now + 10 * 60_000, Number(info.exp) * 1000 || now + 600_000),
  };
  cache.set(id_token, entry);
  return entry;
}

export async function authenticateParent(id_token: string): Promise<{ parent: AuthedParent }> {
  const gu = await verifyGoogleToken(id_token);
  const db = getSupabase();

  const { data: existing } = await db.from('parent_accounts')
    .select('id, email, google_id, name')
    .eq('email', gu.email)
    .maybeSingle();

  if (existing) return { parent: existing };

  const { data: created, error } = await db.from('parent_accounts').insert({
    google_id: gu.sub, email: gu.email, name: gu.name ?? null, avatar_url: gu.picture ?? null,
  }).select('id, email, google_id, name').single();
  if (error) throw error;
  return { parent: created };
}

/** Extract + verify the parent from a Next request. Throws on failure. */
export async function requireParent(req: NextRequest): Promise<AuthedParent> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.replace(/^Bearer /i, '').trim();
  if (!token) throw new Error('missing_token');
  const { parent } = await authenticateParent(token);
  return parent;
}

/** Verify parent owns student. */
export async function requireParentOwnsStudent(parentId: number, studentId: number): Promise<void> {
  const db = getSupabase();
  const { data } = await db.from('parent_student_links')
    .select('student_id')
    .eq('parent_id', parentId).eq('student_id', studentId)
    .maybeSingle();
  if (!data) throw new Error('forbidden');
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/parent-auth.ts tests/unit/parent-auth.test.ts
git commit -m "feat: add parent auth middleware"
```

---

### Task 3.2: `POST /api/parent/pair`

**Files:**
- Create: `src/app/api/parent/pair/route.ts`
- Create: `tests/integration/parent-pair.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';

describe('/api/parent/pair', () => {
  const db = getTestSupabase();
  let student: any;
  beforeAll(async () => {
    student = await createTestStudent(db, { parent_code: 'ZEBRA-9999' });
    vi.spyOn(global, 'fetch').mockImplementation(async (url: any, opts?: any) => {
      if (String(url).includes('tokeninfo')) {
        return new Response(JSON.stringify({ email: 'pair@test.local', sub: 'g_pair', name: 'Pair' }), { status: 200 });
      }
      return (fetch as any).__actual(url, opts);
    });
  });
  afterAll(async () => {
    await cleanupStudent(db, student.id);
    await db.from('parent_accounts').delete().eq('email', 'pair@test.local');
  });

  it('pairs a parent to the student by parent_code', async () => {
    const res = await fetch('http://localhost:3000/api/parent/pair', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer fake_id' },
      body: JSON.stringify({ parent_code: 'ZEBRA-9999' }),
    });
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.student.id).toBe(student.id);
    const { data } = await db.from('parent_student_links')
      .select('*').eq('student_id', student.id);
    expect(data).toHaveLength(1);
  });

  it('rejects unknown code', async () => {
    const res = await fetch('http://localhost:3000/api/parent/pair', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer fake_id' },
      body: JSON.stringify({ parent_code: 'DOES-NOT-EXIST' }),
    });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement `src/app/api/parent/pair/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireParent } from '@/lib/parent-auth';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let parent;
  try { parent = await requireParent(req); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const { parent_code } = await req.json();
  if (!parent_code || typeof parent_code !== 'string') {
    return NextResponse.json({ error: 'parent_code required' }, { status: 400 });
  }

  const db = getSupabase();
  const { data: student } = await db.from('students')
    .select('id, name, grade, stars, level, avatar_url, parent_code')
    .eq('parent_code', parent_code.trim().toUpperCase())
    .maybeSingle();

  if (!student) return NextResponse.json({ error: 'code_not_found' }, { status: 404 });

  const { error: linkErr } = await db.from('parent_student_links').upsert(
    { parent_id: parent.id, student_id: student.id },
    { onConflict: 'parent_id,student_id' },
  );
  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });

  return NextResponse.json({ student });
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/parent/pair tests/integration/parent-pair.test.ts
git commit -m "feat(parent): pair endpoint (google token + parent_code)"
```

---

### Task 3.3: `GET /api/parent/students` + `POST /api/parent/unlink`

**Files:**
- Create: `src/app/api/parent/students/route.ts`
- Create: `src/app/api/parent/unlink/route.ts`

- [ ] **Step 1: Implement students list**

`src/app/api/parent/students/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireParent } from '@/lib/parent-auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  let parent;
  try { parent = await requireParent(req); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const db = getSupabase();
  const { data } = await db.from('parent_student_links')
    .select('student:students(id, name, grade, stars, level, avatar_url)')
    .eq('parent_id', parent.id);

  const students = (data ?? []).map((r: any) => r.student).filter(Boolean);
  return NextResponse.json({ students });
}
```

- [ ] **Step 2: Implement unlink**

`src/app/api/parent/unlink/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireParent } from '@/lib/parent-auth';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  let parent;
  try { parent = await requireParent(req); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const { student_id } = await req.json();
  if (!student_id) return NextResponse.json({ error: 'student_id required' }, { status: 400 });

  const db = getSupabase();
  await db.from('parent_student_links')
    .delete()
    .eq('parent_id', parent.id).eq('student_id', student_id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Integration test (both endpoints in one file)**

`tests/integration/parent-students.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';

describe('students + unlink', () => {
  const db = getTestSupabase();
  let student: any, parent: any;

  beforeAll(async () => {
    student = await createTestStudent(db);
    const { data } = await db.from('parent_accounts').insert({
      google_id: 'g_list', email: 'list@test.local', name: 'L',
    }).select().single();
    parent = data;
    await db.from('parent_student_links').insert({ parent_id: parent.id, student_id: student.id });

    vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('tokeninfo')) {
        return new Response(JSON.stringify({ email: 'list@test.local', sub: 'g_list' }), { status: 200 });
      }
      return fetch(url);
    });
  });
  afterAll(async () => {
    await cleanupStudent(db, student.id);
    await db.from('parent_accounts').delete().eq('id', parent.id);
  });

  it('lists linked students', async () => {
    const res = await fetch('http://localhost:3000/api/parent/students', {
      headers: { authorization: 'Bearer fake_id' },
    });
    const json = await res.json();
    expect(json.students.map((s: any) => s.id)).toContain(student.id);
  });

  it('unlink removes the link', async () => {
    await fetch('http://localhost:3000/api/parent/unlink', {
      method: 'POST',
      headers: { authorization: 'Bearer fake_id', 'content-type': 'application/json' },
      body: JSON.stringify({ student_id: student.id }),
    });
    const { data } = await db.from('parent_student_links')
      .select('*').eq('parent_id', parent.id).eq('student_id', student.id);
    expect(data).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/parent/students src/app/api/parent/unlink tests/integration/parent-students.test.ts
git commit -m "feat(parent): students list + unlink endpoints"
```

---

### Task 3.4: Delete old `/api/parent` unauthenticated endpoint

**Files:**
- Delete: `src/app/api/parent/route.ts`

- [ ] **Step 1: Delete**

```bash
rm src/app/api/parent/route.ts
```

- [ ] **Step 2: Grep for callers**

```bash
npx rg --files-with-matches "api/parent\\b|/api/parent['\"\\)]" src/ tests/ || echo "no callers"
```

If any results appear outside `api/parent/pair|students|unlink|ask|weekly-report|interactions|photo`, update them to use the new authenticated endpoints.

- [ ] **Step 3: Commit**

```bash
git add -A src/app/api/parent/
git commit -m "chore(parent): remove unauthenticated parent_code lookup"
```

---

## Phase 4: Parent Dashboard UI

### Task 4.1: Sign-in landing page (`/parent/page.tsx` rewrite)

**Files:**
- Modify: `src/app/parent/page.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mascot } from '@/components/mascot';
import { ArrowLeft } from 'lucide-react';

declare global { interface Window { google?: any; handleGoogleParent?: (r: any) => void; } }

export default function ParentLanding() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.handleGoogleParent = async (r: { credential: string }) => {
      setLoading(true); setError(null);
      localStorage.setItem('parent_id_token', r.credential);
      try {
        const res = await fetch('/api/parent/students', {
          headers: { authorization: `Bearer ${r.credential}` },
        });
        if (!res.ok) throw new Error('auth_failed');
        const { students } = await res.json();
        if (!students || students.length === 0) {
          router.push('/parent/pair');
        } else if (students.length === 1) {
          router.push(`/parent/${students[0].id}`);
        } else {
          sessionStorage.setItem('parent_students', JSON.stringify(students));
          router.push('/parent/pick');
        }
      } catch (e) {
        setError('Sign-in gagal, coba lagi.');
      } finally { setLoading(false); }
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.body.appendChild(script);
    return () => { script.remove(); delete window.handleGoogleParent; };
  }, [router]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-muted"><ArrowLeft size={20}/></Link>
          <Mascot size="lg" />
          <span className="text-xl font-black kawabel-gradient-text" style={{ fontFamily: 'var(--font-nunito)' }}>kawabel</span>
          <span className="text-sm text-muted-foreground ml-1">Orang Tua</span>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 py-10 text-center space-y-6">
        <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-nunito)' }}>Masuk sebagai Orang Tua</h1>
        <p className="text-sm text-muted-foreground">Lihat apa yang dipelajari anak Anda bersama Kawi.</p>
        <div id="g_id_onload"
          data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          data-callback="handleGoogleParent"
          data-auto_prompt="false"></div>
        <div className="g_id_signin" data-type="standard" data-size="large" data-theme="outline"
             data-text="signin_with" data-shape="pill" data-logo_alignment="left"></div>
        {loading && <p className="text-sm text-muted-foreground">Memeriksa...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in dev**

```bash
npm run dev
```
Open `http://localhost:3000/parent`. Expected: Google sign-in button renders. Clicking shows Google popup; after sign-in either routes to `/parent/pair` (new parent) or `/parent/<id>` (existing single-linked parent).

- [ ] **Step 3: Commit**

```bash
git add src/app/parent/page.tsx
git commit -m "feat(parent): replace parent_code lookup with Google sign-in landing"
```

---

### Task 4.2: Pair page `/parent/pair`

**Files:**
- Create: `src/app/parent/pair/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PairPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    const token = localStorage.getItem('parent_id_token');
    if (!token) { router.push('/parent'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/parent/pair', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ parent_code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error === 'code_not_found' ? 'Kode tidak ditemukan' : 'Gagal menautkan, coba lagi'); return; }
      router.push(`/parent/${data.student.id}`);
    } catch { setError('Gagal menautkan, coba lagi'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/parent" className="p-1.5 rounded-lg hover:bg-muted"><ArrowLeft size={20}/></Link>
          <span className="font-bold">Tautkan Anak</span>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 py-10 space-y-5">
        <p className="text-sm text-muted-foreground">
          Masukkan kode anak Anda. Anda bisa meminta kode ini dari anak atau pengajar.
        </p>
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Kode anak (contoh: ALYA-4821)"
          className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-center text-lg font-mono font-bold tracking-wider"
          autoFocus
        />
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <button onClick={submit} disabled={loading || code.trim().length < 4}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-40">
          {loading ? 'Menautkan...' : 'Tautkan'}
        </button>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
          Dengan menautkan, Anda dapat melihat percakapan dan aktivitas belajar anak. Data chat dan foto disimpan aman sesuai kebijakan privasi Kawabel.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify — `npm run dev`**, go to `/parent/pair` after signing in, enter an existing `parent_code`, confirm redirect to `/parent/<id>`.

- [ ] **Step 3: Commit**

```bash
git add src/app/parent/pair/page.tsx
git commit -m "feat(parent): pair page for first/additional child"
```

---

### Task 4.3: Kid picker page `/parent/pick`

**Files:**
- Create: `src/app/parent/pick/page.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Kid { id: number; name: string; grade?: string; avatar_url?: string; }

export default function PickPage() {
  const [kids, setKids] = useState<Kid[]>([]);
  const router = useRouter();

  useEffect(() => {
    const raw = sessionStorage.getItem('parent_students');
    if (!raw) { router.push('/parent'); return; }
    setKids(JSON.parse(raw));
  }, [router]);

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-4">
      <h1 className="text-xl font-black" style={{ fontFamily: 'var(--font-nunito)' }}>Pilih Anak</h1>
      <div className="grid gap-3">
        {kids.map(k => (
          <Link key={k.id} href={`/parent/${k.id}`}
            className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/30">
            {k.avatar_url ? <img src={k.avatar_url} className="w-12 h-12 rounded-xl object-cover" alt=""/>
              : <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{k.name.charAt(0)}</div>}
            <div>
              <div className="font-bold">{k.name}</div>
              <div className="text-xs text-muted-foreground">{k.grade}</div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/parent/pair" className="block text-center text-sm text-primary underline mt-4">+ Tambah anak</Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify** — two linked kids → `/parent/pick` shows both.

- [ ] **Step 3: Commit**

```bash
git add src/app/parent/pick/page.tsx
git commit -m "feat(parent): kid picker for parents with multiple children"
```

---

### Task 4.4: Dashboard shell `/parent/[studentId]/page.tsx`

**Files:**
- Create: `src/app/parent/[studentId]/page.tsx`
- Create: `src/app/parent/components/ParentHeader.tsx`

- [ ] **Step 1: Implement `ParentHeader.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';

export interface HeaderStudent { id: number; name: string; grade?: string; stars?: number; level?: number; avatar_url?: string; }

export function ParentHeader({ student, onSettings }: { student: HeaderStudent; onSettings: () => void }) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/parent" className="p-1.5 rounded-lg hover:bg-muted"><ArrowLeft size={20}/></Link>
        {student.avatar_url
          ? <img src={student.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover"/>
          : <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">{student.name.charAt(0)}</div>}
        <div className="flex-1">
          <div className="font-bold leading-tight">{student.name}</div>
          <div className="text-xs text-muted-foreground leading-tight">{student.grade} · Lv {student.level} · ⭐ {student.stars}</div>
        </div>
        <button onClick={onSettings} className="p-1.5 rounded-lg hover:bg-muted"><Settings size={18}/></button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Implement dashboard page**

`src/app/parent/[studentId]/page.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ParentHeader, HeaderStudent } from '../components/ParentHeader';
import { WeeklyCard } from '../components/WeeklyCard';
import { ParentChatbot } from '../components/ParentChatbot';
import { ActivityTimeline } from '../components/ActivityTimeline';

export default function Dashboard() {
  const { studentId } = useParams<{ studentId: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<HeaderStudent | null>(null);
  const [scrollToId, setScrollToId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('parent_id_token');
    if (!token) { router.push('/parent'); return; }
    fetch('/api/parent/students', { headers: { authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(({ students }) => {
        const s = students?.find((x: any) => x.id === Number(studentId));
        if (!s) router.push('/parent');
        else setStudent(s);
      });
  }, [studentId, router]);

  if (!student) return <div className="p-10 text-center text-sm text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-dvh bg-background">
      <ParentHeader student={student} onSettings={() => { /* drawer in Task 4.8 */ }} />
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <WeeklyCard studentId={student.id} />
        <ParentChatbot studentId={student.id} studentName={student.name} onCiteClick={setScrollToId} />
        <ActivityTimeline studentId={student.id} scrollToId={scrollToId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify dev renders shell with placeholders**

Dashboard should render with 3 stub panels (components built in subsequent tasks). Confirm no runtime errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/parent/[studentId] src/app/parent/components/ParentHeader.tsx
git commit -m "feat(parent): dashboard shell and kid header"
```

---

### Task 4.5: WeeklyCard component + `GET /api/parent/weekly-report`

**Files:**
- Create: `src/app/api/parent/weekly-report/route.ts`
- Create: `src/app/parent/components/WeeklyCard.tsx`

- [ ] **Step 1: API**

```ts
// src/app/api/parent/weekly-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireParent, requireParentOwnsStudent } from '@/lib/parent-auth';
import { getSupabase } from '@/lib/supabase';
import { generateWeeklyReport } from '@/lib/weekly-report';

export async function GET(req: NextRequest) {
  let parent;
  try { parent = await requireParent(req); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const studentId = Number(req.nextUrl.searchParams.get('student_id'));
  try { await requireParentOwnsStudent(parent.id, studentId); }
  catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }

  const weekStart = currentWeekStart();
  const db = getSupabase();

  const { data: cached } = await db.from('weekly_reports')
    .select('*').eq('student_id', studentId).eq('week_start', weekStart)
    .maybeSingle();

  if (cached) return NextResponse.json({ report: parseReport(cached.report_text) });

  // Cron missed this student — fallback to on-demand generation.
  const report = await generateWeeklyReport(studentId, weekStart);
  await db.from('weekly_reports').upsert({
    student_id: studentId, week_start: weekStart, report_text: JSON.stringify(report),
  });
  return NextResponse.json({ report });
}

function currentWeekStart(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun
  const offset = (day + 6) % 7; // monday
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}
function parseReport(text: string) { try { return JSON.parse(text); } catch { return { paragraph: text, strongest: '', struggling: '', next_step: '' }; } }
```

- [ ] **Step 2: Create `src/lib/weekly-report.ts`**

```ts
import OpenAI from 'openai';
import { getSupabase } from './supabase';

let client: OpenAI | null = null;
function openai() { if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); return client; }

export interface WeeklyReport { paragraph: string; strongest: string; struggling: string; next_step: string; }

export async function generateWeeklyReport(studentId: number, weekStart: string): Promise<WeeklyReport> {
  const db = getSupabase();
  const { data: student } = await db.from('students').select('name, grade').eq('id', studentId).single();
  const since = new Date(`${weekStart}T00:00:00Z`); since.setUTCDate(since.getUTCDate() - 7);
  const { data: rows } = await db.from('interactions')
    .select('kind, subject, topic, content, score, total, correct, created_at')
    .eq('student_id', studentId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })
    .limit(500);

  if (!rows || rows.length === 0) {
    return { paragraph: `Belum ada aktivitas minggu ini untuk ${student?.name ?? 'anak Anda'}.`, strongest: '', struggling: '', next_step: '' };
  }

  const digest = rows.map(r => {
    if (r.kind === 'quiz' || r.kind === 'test') return `[${r.kind}] ${r.subject ?? ''} ${r.topic ?? ''} ${r.score}/${r.total}`;
    if (r.kind === 'dictation') return `[dictation] ${r.score}/${r.total}`;
    if (r.kind === 'photo') return `[photo] ${r.content?.slice(0, 80) ?? ''}`;
    return `[${r.kind}] ${r.content?.slice(0, 120) ?? ''}`;
  }).join('\n');

  const sys = `Anda adalah Kawi, tutor AI ${student?.name ?? 'anak'} (${student?.grade ?? 'SD'}). Tulis ringkasan minggu untuk orang tua dalam Bahasa Indonesia yang hangat dan jujur. Tidak mengada-ada fakta. Kembalikan JSON dengan kunci: paragraph (2-3 kalimat), strongest (2-4 kata), struggling (2-4 kata), next_step (2-6 kata).`;

  const resp = await openai().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: sys }, { role: 'user', content: `Aktivitas minggu ini:\n${digest}` }],
    temperature: 0.6, max_tokens: 400,
  });
  try { return JSON.parse(resp.choices[0].message.content ?? '{}'); }
  catch { return { paragraph: 'Ringkasan tidak tersedia.', strongest: '', struggling: '', next_step: '' }; }
}
```

- [ ] **Step 3: `WeeklyCard.tsx`**

```tsx
'use client';
import { useEffect, useState } from 'react';

interface Report { paragraph: string; strongest: string; struggling: string; next_step: string; }

export function WeeklyCard({ studentId }: { studentId: number }) {
  const [r, setR] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('parent_id_token');
    fetch(`/api/parent/weekly-report?student_id=${studentId}`, {
      headers: { authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(d => { setR(d.report); })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="rounded-2xl border border-border/60 p-5 text-sm text-muted-foreground">Memuat ringkasan minggu ini...</div>;
  if (!r?.paragraph) return null;

  const chip = (label: string, kind: 'strongest'|'struggling'|'next_step') => label && (
    <button onClick={() => window.dispatchEvent(new CustomEvent('parent-chatbot-prompt', { detail: { kind, label } }))}
      className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20">
      {label}
    </button>
  );

  return (
    <div className="rounded-2xl border border-border/60 p-5 bg-gradient-to-br from-green-50 to-emerald-50 space-y-3">
      <p className="text-sm leading-relaxed">{r.paragraph}</p>
      <div className="flex flex-wrap gap-2">
        {chip(r.strongest, 'strongest')}
        {chip(r.struggling, 'struggling')}
        {chip(r.next_step, 'next_step')}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Integration test for weekly cron & on-demand fallback**

`tests/integration/weekly-cron.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';
import { generateWeeklyReport } from '@/lib/weekly-report';

describe('weekly report', () => {
  const db = getTestSupabase();
  let student: any;
  beforeAll(async () => {
    student = await createTestStudent(db);
    await db.from('interactions').insert([
      { student_id: student.id, kind: 'quiz', subject: 'math', score: 8, total: 10, content: 'perkalian' },
      { student_id: student.id, kind: 'chat_user', content: 'bantu soal pecahan' },
      { student_id: student.id, kind: 'chat_assistant', content: 'oke, kita lihat bersama' },
    ]);
  });
  afterAll(async () => { await cleanupStudent(db, student.id); });

  it('returns non-empty paragraph when activity exists', async () => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-test-placeholder') return;
    const r = await generateWeeklyReport(student.id, new Date().toISOString().slice(0, 10));
    expect(r.paragraph.length).toBeGreaterThan(10);
  });

  it('returns empty-week message when no activity', async () => {
    const empty = await createTestStudent(db);
    try {
      const r = await generateWeeklyReport(empty.id, new Date().toISOString().slice(0, 10));
      expect(r.paragraph).toMatch(/belum ada/i);
    } finally { await cleanupStudent(db, empty.id); }
  });
});
```

- [ ] **Step 5: Run — PASS**

- [ ] **Step 6: Commit**

```bash
git add src/app/api/parent/weekly-report src/lib/weekly-report.ts src/app/parent/components/WeeklyCard.tsx tests/integration/weekly-cron.test.ts
git commit -m "feat(parent): weekly report endpoint + WeeklyCard component"
```

---

### Task 4.6: `GET /api/parent/interactions` + ActivityTimeline

**Files:**
- Create: `src/app/api/parent/interactions/route.ts`
- Create: `src/app/parent/components/ActivityTimeline.tsx`

- [ ] **Step 1: Endpoint**

```ts
// src/app/api/parent/interactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireParent, requireParentOwnsStudent } from '@/lib/parent-auth';
import { getSupabase } from '@/lib/supabase';

const PAGE_SIZE = 40;

export async function GET(req: NextRequest) {
  let parent;
  try { parent = await requireParent(req); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const studentId = Number(req.nextUrl.searchParams.get('student_id'));
  const cursor = req.nextUrl.searchParams.get('cursor'); // ISO date
  const kinds = (req.nextUrl.searchParams.get('kinds') ?? '').split(',').filter(Boolean);
  const subject = req.nextUrl.searchParams.get('subject');
  try { await requireParentOwnsStudent(parent.id, studentId); }
  catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }

  const db = getSupabase();
  let q = db.from('interactions')
    .select('id, kind, subject, topic, content, photo_url, score, total, correct, thread_id, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (cursor) q = q.lt('created_at', cursor);
  if (kinds.length) q = q.in('kind', kinds as any);
  if (subject) q = q.eq('subject', subject);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const nextCursor = data && data.length === PAGE_SIZE ? data[data.length - 1].created_at : null;
  return NextResponse.json({ interactions: data, next_cursor: nextCursor });
}
```

- [ ] **Step 2: Component**

`src/app/parent/components/ActivityTimeline.tsx`:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Image, Pencil, FileText } from 'lucide-react';

interface Item {
  id: number; kind: string; subject?: string|null; topic?: string|null;
  content?: string|null; photo_url?: string|null; score?: number|null;
  total?: number|null; thread_id?: string|null; created_at: string;
}

export function ActivityTimeline({ studentId, scrollToId }: { studentId: number; scrollToId: number | null }) {
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const refs = useRef(new Map<number, HTMLDivElement>());

  async function load(c: string | null) {
    setLoading(true);
    const token = localStorage.getItem('parent_id_token');
    const url = new URL('/api/parent/interactions', window.location.origin);
    url.searchParams.set('student_id', String(studentId));
    if (c) url.searchParams.set('cursor', c);
    const res = await fetch(url.toString(), { headers: { authorization: `Bearer ${token}` } });
    const { interactions, next_cursor } = await res.json();
    setItems(prev => c ? [...prev, ...interactions] : interactions);
    setCursor(next_cursor); setMore(!!next_cursor); setLoading(false);
  }

  useEffect(() => { load(null); }, [studentId]);

  useEffect(() => {
    if (!scrollToId) return;
    const el = refs.current.get(scrollToId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2500);
    } else if (more) { load(cursor); /* fetch more to find it */ }
  }, [scrollToId]);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold">Aktivitas</h3>
      {items.length === 0 && !loading && <div className="text-sm text-muted-foreground">Belum ada aktivitas.</div>}
      <div className="space-y-2">
        {items.map(it => (
          <div key={it.id}
            ref={el => { if (el) refs.current.set(it.id, el); }}
            className="rounded-xl border border-border/60 p-3 bg-card transition-all">
            <div className="flex items-start gap-3">
              <KindIcon kind={it.kind} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span>{new Date(it.created_at).toLocaleString('id-ID')}</span>
                  {it.subject && <span>· {it.subject}</span>}
                  {it.topic && <span>· {it.topic}</span>}
                </div>
                <Body item={it} />
              </div>
              {it.score != null && it.total != null && (
                <span className={`text-sm font-bold ${it.score / it.total >= 0.7 ? 'text-green-600' : 'text-orange-500'}`}>
                  {it.score}/{it.total}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {more && (
        <button onClick={() => load(cursor)} disabled={loading}
          className="w-full py-2 rounded-lg border border-border text-sm hover:bg-muted/30 disabled:opacity-40">
          {loading ? 'Memuat...' : 'Muat lebih banyak'}
        </button>
      )}
    </div>
  );
}

function KindIcon({ kind }: { kind: string }) {
  if (kind === 'photo') return <Image size={18} className="text-purple-500 mt-0.5" />;
  if (kind === 'dictation') return <Pencil size={18} className="text-blue-500 mt-0.5" />;
  if (kind === 'quiz' || kind === 'test') return <FileText size={18} className="text-green-600 mt-0.5" />;
  return <MessageSquare size={18} className="text-amber-500 mt-0.5" />;
}

function Body({ item }: { item: Item }) {
  if (item.kind === 'photo' && item.photo_url) {
    return (
      <div className="mt-1 space-y-1">
        <img src={item.photo_url} alt="" className="max-h-40 rounded-lg border" />
        {item.content && <p className="text-sm">{item.content}</p>}
      </div>
    );
  }
  if (item.content) return <p className="text-sm line-clamp-3 whitespace-pre-wrap">{item.content}</p>;
  return null;
}
```

- [ ] **Step 3: Verify** — dashboard renders items; "Muat lebih banyak" pagination works.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/parent/interactions src/app/parent/components/ActivityTimeline.tsx
git commit -m "feat(parent): activity timeline endpoint + component"
```

---

## Phase 5: Chatbot Q&A (RAG)

### Task 5.1: `parent-retrieval.ts` hybrid retrieval

**Files:**
- Create: `src/lib/parent-retrieval.ts`
- Create: `tests/unit/parent-retrieval.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';
import { retrieveForQuestion } from '@/lib/parent-retrieval';
import { logInteraction } from '@/lib/interactions';

describe('retrieveForQuestion', () => {
  const db = getTestSupabase();
  let student: any;
  beforeAll(async () => {
    student = await createTestStudent(db);
    const now = new Date();
    const old = new Date(now.getTime() - 30 * 86400000).toISOString();
    await logInteraction({ student_id: student.id, kind: 'chat_user', content: 'Apa itu fotosintesis?' });
    await db.from('interactions').insert({
      student_id: student.id, kind: 'quiz', subject: 'ipa', score: 6, total: 10,
      content: 'fotosintesis klorofil', created_at: old,
    });
  });
  afterAll(async () => { await cleanupStudent(db, student.id); });

  it('returns recent rows by date, ordered chronologically with cite_id', async () => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-test-placeholder') return;
    const rows = await retrieveForQuestion({ studentId: student.id, question: 'apa yang dia pelajari tentang tanaman?' });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < rows.length; i++) {
      expect(new Date(rows[i].created_at).getTime()).toBeGreaterThanOrEqual(new Date(rows[i-1].created_at).getTime());
    }
    expect(rows[0].cite_id).toBe(1);
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

`src/lib/parent-retrieval.ts`:

```ts
import { getSupabase } from './supabase';
import { embedText } from './embeddings';

export interface RetrievedRow {
  cite_id: number;
  id: number;
  kind: string;
  subject: string | null;
  topic: string | null;
  content: string | null;
  photo_url: string | null;
  score: number | null;
  total: number | null;
  created_at: string;
}

export async function retrieveForQuestion(args: {
  studentId: number;
  question: string;
  recentDays?: number;
  recentCap?: number;
  vectorCap?: number;
}): Promise<RetrievedRow[]> {
  const { studentId, question, recentDays = 7, recentCap = 60, vectorCap = 20 } = args;
  const db = getSupabase();
  const cutoff = new Date(Date.now() - recentDays * 86400000).toISOString();

  // Recent by date.
  const { data: recent } = await db.from('interactions')
    .select('id, kind, subject, topic, content, photo_url, score, total, created_at')
    .eq('student_id', studentId)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(recentCap);

  // Older by vector similarity.
  const emb = await embedText(question);
  let older: any[] = [];
  if (emb) {
    const { data } = await db.rpc('match_interactions', {
      p_student_id: studentId,
      p_cutoff: cutoff,
      p_embedding: emb,
      p_limit: vectorCap,
    });
    older = data ?? [];
  }

  const map = new Map<number, any>();
  [...(recent ?? []), ...older].forEach(r => { if (!map.has(r.id)) map.set(r.id, r); });
  const merged = [...map.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return merged.map((r, i) => ({ cite_id: i + 1, ...r }));
}
```

- [ ] **Step 4: Add `match_interactions` RPC (new migration)**

`supabase/migrations/20260416_004_match_interactions.sql`:

```sql
CREATE OR REPLACE FUNCTION match_interactions(
  p_student_id INT,
  p_cutoff     TIMESTAMPTZ,
  p_embedding  VECTOR(1536),
  p_limit      INT
) RETURNS TABLE (
  id BIGINT, kind TEXT, subject TEXT, topic TEXT, content TEXT,
  photo_url TEXT, score INT, total INT, created_at TIMESTAMPTZ
) LANGUAGE SQL STABLE AS $$
  SELECT i.id, i.kind, i.subject, i.topic, i.content, i.photo_url, i.score, i.total, i.created_at
  FROM interactions i
  WHERE i.student_id = p_student_id
    AND i.created_at < p_cutoff
    AND i.embedding IS NOT NULL
  ORDER BY i.embedding <=> p_embedding
  LIMIT p_limit;
$$;
```

Apply: `supabase db reset`.

- [ ] **Step 5: Run test — PASS**

- [ ] **Step 6: Commit**

```bash
git add src/lib/parent-retrieval.ts supabase/migrations/20260416_004_match_interactions.sql tests/unit/parent-retrieval.test.ts
git commit -m "feat(parent): hybrid retrieval (date + pgvector)"
```

---

### Task 5.2: `POST /api/parent/ask`

**Files:**
- Create: `src/app/api/parent/ask/route.ts`
- Create: `tests/integration/parent-ask.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';
import { logInteraction } from '@/lib/interactions';

describe('/api/parent/ask', () => {
  const db = getTestSupabase();
  let student: any, parent: any;
  beforeAll(async () => {
    student = await createTestStudent(db, { name: 'Alya' });
    const { data } = await db.from('parent_accounts').insert({
      google_id: 'g_ask', email: 'ask@test.local', name: 'AskParent',
    }).select().single();
    parent = data;
    await db.from('parent_student_links').insert({ parent_id: parent.id, student_id: student.id });
    await logInteraction({ student_id: student.id, kind: 'chat_user', content: 'bantu soal perkalian' });
    await logInteraction({ student_id: student.id, kind: 'quiz', subject: 'math', score: 8, total: 10, content: 'perkalian dua digit' });

    vi.spyOn(global, 'fetch').mockImplementation(async (url: any, opts?: any) => {
      if (String(url).includes('tokeninfo')) {
        return new Response(JSON.stringify({ email: 'ask@test.local', sub: 'g_ask' }), { status: 200 });
      }
      return (fetch as any).__actual ? (fetch as any).__actual(url, opts) : new Response();
    });
  });
  afterAll(async () => {
    await cleanupStudent(db, student.id);
    await db.from('parent_accounts').delete().eq('id', parent.id);
  });

  it('returns answer + citations when activity exists', async () => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-test-placeholder') return;
    const res = await fetch('http://localhost:3000/api/parent/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer fake_id' },
      body: JSON.stringify({ student_id: student.id, question: 'Apa yang dia kerjakan minggu ini?' }),
    });
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(typeof json.answer).toBe('string');
    expect(Array.isArray(json.citations)).toBe(true);
    for (const c of json.citations) { expect(typeof c.interaction_id).toBe('number'); }
  });

  it('returns 403 when parent does not own the student', async () => {
    const rogue = await createTestStudent(db);
    try {
      const res = await fetch('http://localhost:3000/api/parent/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer fake_id' },
        body: JSON.stringify({ student_id: rogue.id, question: 'apa?' }),
      });
      expect(res.status).toBe(403);
    } finally { await cleanupStudent(db, rogue.id); }
  });

  it('returns canned reply when zero retrieval', async () => {
    const quiet = await createTestStudent(db);
    await db.from('parent_student_links').insert({ parent_id: parent.id, student_id: quiet.id });
    try {
      const res = await fetch('http://localhost:3000/api/parent/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer fake_id' },
        body: JSON.stringify({ student_id: quiet.id, question: 'apa yang dia pelajari?' }),
      });
      const json = await res.json();
      expect(json.answer).toMatch(/belum ada/i);
      expect(json.citations).toEqual([]);
    } finally { await cleanupStudent(db, quiet.id); }
  });
});
```

- [ ] **Step 2: Run — FAIL (404 / not implemented)**

- [ ] **Step 3: Implement**

```ts
// src/app/api/parent/ask/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireParent, requireParentOwnsStudent } from '@/lib/parent-auth';
import { getSupabase } from '@/lib/supabase';
import { retrieveForQuestion } from '@/lib/parent-retrieval';

let client: OpenAI | null = null;
function openai() { if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); return client; }

export async function POST(req: NextRequest) {
  let parent;
  try { parent = await requireParent(req); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const body = await req.json() as { student_id: number; question: string; history?: { role: string; content: string }[] };
  const { student_id, question } = body;
  const history = (body.history ?? []).slice(-3);

  if (!student_id || !question) return NextResponse.json({ error: 'student_id and question required' }, { status: 400 });
  try { await requireParentOwnsStudent(parent.id, student_id); }
  catch { return NextResponse.json({ error: 'forbidden' }, { status: 403 }); }

  const rows = await retrieveForQuestion({ studentId: student_id, question });
  if (rows.length === 0) {
    return NextResponse.json({ answer: 'Belum ada aktivitas untuk menjawab pertanyaan itu.', citations: [] });
  }

  const db = getSupabase();
  const { data: student } = await db.from('students').select('name, grade').eq('id', student_id).single();

  const context = rows.map(r => {
    const date = r.created_at.slice(0, 10);
    if (r.kind === 'quiz' || r.kind === 'test')
      return `[${r.cite_id}] ${date} ${r.kind} ${r.subject ?? ''} ${r.topic ?? ''} ${r.score}/${r.total}: ${r.content ?? ''}`;
    if (r.kind === 'photo') return `[${r.cite_id}] ${date} photo: ${r.content ?? '(no caption)'}`;
    return `[${r.cite_id}] ${date} ${r.kind}: ${(r.content ?? '').slice(0, 400)}`;
  }).join('\n');

  const sys = `Anda menjawab orang tua dari ${student?.name ?? 'anak'} (${student?.grade ?? 'SD'}) dalam Bahasa Indonesia. Ringkas, hangat, jujur. Gunakan hanya fakta dari KONTEKS. Tandai kutipan inline seperti [1] [2]. Jangan mengada-ada. Kembalikan JSON: {"answer": string, "citations": number[]}. Jika pertanyaan di luar ruang lingkup belajar anak, jawab dengan sopan mengarahkan kembali.`;

  const completion = await openai().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: sys },
      ...history.map(h => ({ role: h.role as 'user'|'assistant', content: h.content })),
      { role: 'user', content: `KONTEKS:\n${context}\n\nPERTANYAAN: ${question}` },
    ],
    temperature: 0.4, max_tokens: 700,
  });

  let parsed: { answer: string; citations: number[] };
  try { parsed = JSON.parse(completion.choices[0].message.content ?? '{"answer":"","citations":[]}'); }
  catch { parsed = { answer: 'Maaf, saya tidak bisa menjawab sekarang.', citations: [] }; }

  const citations = (parsed.citations ?? [])
    .map(n => rows.find(r => r.cite_id === n))
    .filter(Boolean)
    .map((r: any) => ({ cite_id: r.cite_id, interaction_id: r.id, kind: r.kind, created_at: r.created_at }));

  return NextResponse.json({ answer: parsed.answer, citations });
}
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/parent/ask tests/integration/parent-ask.test.ts
git commit -m "feat(parent): ask endpoint with RAG + citation mapping"
```

---

### Task 5.3: `ParentChatbot.tsx` component

**Files:**
- Create: `src/app/parent/components/ParentChatbot.tsx`

- [ ] **Step 1: Implement**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string; citations?: Citation[] };
interface Citation { cite_id: number; interaction_id: number; kind: string; created_at: string; }

const SEED_QUESTIONS = [
  'Apa yang dia kerjakan hari ini?',
  'Mata pelajaran apa yang sulit?',
  'Apakah dia sudah selesaikan PR matematika?',
];

export function ParentChatbot({ studentId, studentName, onCiteClick }:
  { studentId: number; studentName: string; onCiteClick: (id: number | null) => void }) {

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPrompt(e: any) { ask(`Ceritakan tentang: ${e.detail.label}`); }
    window.addEventListener('parent-chatbot-prompt', onPrompt as any);
    return () => window.removeEventListener('parent-chatbot-prompt', onPrompt as any);
  }, [messages]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }); }, [messages]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    const next: Msg[] = [...messages, { role: 'user', content: question }];
    setMessages(next); setInput(''); setLoading(true);
    try {
      const token = localStorage.getItem('parent_id_token');
      const res = await fetch('/api/parent/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          student_id: studentId, question,
          history: messages.slice(-3).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      setMessages([...next, { role: 'assistant', content: json.answer ?? '...', citations: json.citations ?? [] }]);
    } catch { setMessages([...next, { role: 'assistant', content: 'Gagal menjawab, coba lagi.' }]); }
    finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
      <h3 className="text-base font-bold">Tanya tentang {studentName}</h3>

      <div ref={scrollRef} className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SEED_QUESTIONS.map(q => (
              <button key={q} onClick={() => ask(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted">{q}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block max-w-[85%] text-sm rounded-xl px-3 py-2 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-muted/50'}`}>
              <Answer text={m.content} citations={m.citations ?? []} onCiteClick={onCiteClick} />
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground">Kawi sedang berpikir...</div>}
      </div>

      <div className="flex gap-2">
        <input value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(input)}
          placeholder={`Tanya apa saja tentang belajar ${studentName}...`}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"/>
        <button onClick={() => ask(input)} disabled={!input.trim() || loading}
          className="px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-40">
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
}

function Answer({ text, citations, onCiteClick }: {
  text: string; citations: Citation[]; onCiteClick: (id: number | null) => void;
}) {
  // Replace [1], [2], ... with clickable pills.
  const parts = text.split(/(\[\d+\])/g);
  return <>{parts.map((p, i) => {
    const m = p.match(/^\[(\d+)\]$/);
    if (!m) return <span key={i}>{p}</span>;
    const cid = Number(m[1]);
    const cite = citations.find(c => c.cite_id === cid);
    if (!cite) return <span key={i}>{p}</span>;
    return (
      <button key={i} onClick={() => onCiteClick(cite.interaction_id)}
        className="mx-0.5 inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary font-bold hover:bg-primary/30">
        {cid}
      </button>
    );
  })}</>;
}
```

- [ ] **Step 2: Verify in dev**

Dashboard renders chatbot. Ask "Apa yang dia kerjakan?" → answer appears, citation pills clickable, clicking scrolls the timeline below.

- [ ] **Step 3: Commit**

```bash
git add src/app/parent/components/ParentChatbot.tsx
git commit -m "feat(parent): chatbot UI with citation pills"
```

---

## Phase 6: Crons

### Task 6.1: Weekly report cron

**Files:**
- Create: `src/app/api/cron/weekly-reports/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Implement endpoint**

```ts
// src/app/api/cron/weekly-reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateWeeklyReport } from '@/lib/weekly-report';

export async function GET(req: NextRequest) {
  // Vercel cron sends a special header; allow manual invocation only with CRON_SECRET.
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = getSupabase();
  const weekStart = mondayISO();
  const since = new Date(weekStart); since.setUTCDate(since.getUTCDate() - 7);

  const { data: active } = await db.from('interactions')
    .select('student_id')
    .gte('created_at', since.toISOString())
    .limit(10_000);

  const ids = [...new Set((active ?? []).map((r: any) => r.student_id))];

  let ok = 0, err = 0;
  for (const studentId of ids) {
    try {
      const r = await generateWeeklyReport(studentId, weekStart);
      await db.from('weekly_reports').upsert({
        student_id: studentId, week_start: weekStart, report_text: JSON.stringify(r),
      });
      ok++;
    } catch (e) { console.error('weekly cron', studentId, e); err++; }
  }
  return NextResponse.json({ processed: ids.length, ok, err });
}

function mondayISO(): string {
  const d = new Date(); const day = d.getUTCDay(); const offset = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 2: Register in `vercel.json`**

Replace the existing crons block:

```json
{
  "crons": [
    { "path": "/api/health", "schedule": "0 2 * * *" },
    { "path": "/api/cron/weekly-reports", "schedule": "0 23 * * 0" },
    { "path": "/api/cron/retention", "schedule": "15 2 * * *" }
  ]
}
```

(Monday 06:00 WIB = Sunday 23:00 UTC.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/weekly-reports vercel.json
git commit -m "feat(cron): weekly reports generator"
```

---

### Task 6.2: Retention cron

**Files:**
- Create: `src/app/api/cron/retention/route.ts`
- Create: `tests/integration/retention-cron.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestSupabase, createTestStudent, cleanupStudent } from '../helpers/supabase-test';
import { runRetention } from '@/lib/retention';

describe('retention job', () => {
  const db = getTestSupabase();
  let student: any;
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

  beforeAll(async () => {
    student = await createTestStudent(db);
    await db.from('interactions').insert([
      { student_id: student.id, kind: 'photo', content: 'old photo', photo_url: 'x', photo_path: `${student.id}/a.jpg`, created_at: daysAgo(40) },
      { student_id: student.id, kind: 'chat_user', content: 'old chat', created_at: daysAgo(400) },
      { student_id: student.id, kind: 'quiz', subject: 'math', score: 8, total: 10, content: 'old quiz text', created_at: daysAgo(400) },
      { student_id: student.id, kind: 'chat_user', content: 'recent', created_at: daysAgo(5) },
    ]);
  });
  afterAll(async () => { await cleanupStudent(db, student.id); });

  it('nulls photo_url on rows > 30 days', async () => {
    await runRetention();
    const { data } = await db.from('interactions').select('*').eq('student_id', student.id).eq('kind', 'photo');
    expect(data?.[0].photo_url).toBeNull();
    expect(data?.[0].photo_path).toBeNull();
  });

  it('deletes chat rows > 365 days without scores', async () => {
    const { data } = await db.from('interactions').select('*').eq('student_id', student.id).eq('content', 'old chat');
    expect(data).toHaveLength(0);
  });

  it('preserves quiz rows > 365 days but nulls content', async () => {
    const { data } = await db.from('interactions').select('*').eq('student_id', student.id).eq('kind', 'quiz');
    expect(data).toHaveLength(1);
    expect(data?.[0].content).toBeNull();
    expect(data?.[0].score).toBe(8);
  });

  it('keeps recent rows untouched', async () => {
    const { data } = await db.from('interactions').select('*').eq('student_id', student.id).eq('content', 'recent');
    expect(data).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run — FAIL (module missing)**

- [ ] **Step 3: Implement `src/lib/retention.ts`**

```ts
import { getSupabase } from './supabase';

export async function runRetention(now = new Date()) {
  const db = getSupabase();
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
  const d365 = new Date(now.getTime() - 365 * 86400000).toISOString();

  // 1. Photo purge: >30d old photo rows with photo_url set.
  const { data: oldPhotos } = await db.from('interactions')
    .select('id, photo_path')
    .not('photo_url', 'is', null)
    .lt('created_at', d30)
    .limit(1000);

  for (const row of oldPhotos ?? []) {
    if (row.photo_path) {
      await db.storage.from('kid-photos').remove([row.photo_path]).catch(() => {});
    }
    await db.from('interactions').update({ photo_url: null, photo_path: null }).eq('id', row.id);
  }

  // 2. Delete >365d rows without score data.
  await db.from('interactions')
    .delete()
    .lt('created_at', d365)
    .is('score', null);

  // 3. Null content on >365d rows with score data (preserve the score metric).
  await db.from('interactions')
    .update({ content: null, embedding: null })
    .lt('created_at', d365)
    .not('score', 'is', null);
}
```

- [ ] **Step 4: Implement endpoint**

`src/app/api/cron/retention/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { runRetention } from '@/lib/retention';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  await runRetention();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Run — PASS**

- [ ] **Step 6: Commit**

```bash
git add src/lib/retention.ts src/app/api/cron/retention tests/integration/retention-cron.test.ts
git commit -m "feat(cron): retention job for photos and stale rows"
```

---

## Phase 7: Kid-side Visibility

### Task 7.1: 👀 badge on student home

**Files:**
- Modify: `src/app/home/page.tsx` (or wherever the student avatar renders)

- [ ] **Step 1: Add API endpoint**

`src/app/api/students/[id]/parent-linked/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getSupabase();
  const { count } = await db.from('parent_student_links')
    .select('parent_id', { count: 'exact', head: true })
    .eq('student_id', Number(id));
  return NextResponse.json({ linked: (count ?? 0) > 0 });
}
```

- [ ] **Step 2: Render badge**

In `src/app/home/page.tsx`, next to the student avatar:

```tsx
{/* at the top of the component */}
const [parentLinked, setParentLinked] = useState(false);
useEffect(() => {
  if (!student?.id) return;
  fetch(`/api/students/${student.id}/parent-linked`)
    .then(r => r.json()).then(d => setParentLinked(!!d.linked));
}, [student?.id]);

{/* inside the avatar render */}
{parentLinked && (
  <span title="Orang tuamu terhubung — belajar jujur ya!"
    className="absolute -top-1 -right-1 text-xs bg-white rounded-full px-1 shadow">
    👀
  </span>
)}
```

(If `student?.id` is not already available, use the existing state variable name — grep the file first to confirm.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/students/[id]/parent-linked src/app/home/page.tsx
git commit -m "feat(student): show parent-linked badge on home"
```

---

### Task 7.2: One-time pair notice banner

**Files:**
- Modify: `src/app/home/page.tsx`

- [ ] **Step 1: Extend the parent-linked endpoint to return the latest link timestamp**

```ts
// replace inside the GET handler
const { data } = await db.from('parent_student_links')
  .select('linked_at')
  .eq('student_id', Number(id))
  .order('linked_at', { ascending: false })
  .limit(1);
return NextResponse.json({ linked: (data?.length ?? 0) > 0, linked_at: data?.[0]?.linked_at ?? null });
```

- [ ] **Step 2: Show banner once**

In `src/app/home/page.tsx`, top of the main content:

```tsx
const [banner, setBanner] = useState<string | null>(null);
useEffect(() => {
  if (!student?.id) return;
  fetch(`/api/students/${student.id}/parent-linked`).then(r => r.json()).then(d => {
    if (!d.linked_at) return;
    const key = `parent_notice_seen_${student.id}_${d.linked_at}`;
    if (!localStorage.getItem(key)) {
      setBanner('Orang tuamu sekarang bisa lihat ringkasan belajarmu di Kawabel. Belajar jujur, tidak apa salah!');
      localStorage.setItem(key, '1');
    }
  });
}, [student?.id]);

{banner && (
  <div className="mx-4 mb-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 flex items-start gap-2">
    <span>👀</span>
    <div className="flex-1">{banner}</div>
    <button onClick={() => setBanner(null)} className="text-amber-700 font-bold">OK</button>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/home/page.tsx src/app/api/students/[id]/parent-linked/route.ts
git commit -m "feat(student): one-time banner when a parent first pairs"
```

---

## Phase 8: E2E + Polish

### Task 8.1: E2E golden-path

**Files:**
- Create: `tests/e2e/parent-golden-path.spec.ts`

- [ ] **Step 1: Write spec**

```ts
import { test, expect } from '@playwright/test';

test('parent signs in, pairs, asks a question, clicks citation', async ({ page, request }) => {
  // Seed: create student + a parent account via service role.
  // (Assumes a small test seed endpoint; otherwise use `getTestSupabase` equivalent from Node.)
  const email = `e2e_${Date.now()}@test.local`;
  const { student, parentCode, fakeToken } = await (await request.post('http://localhost:3000/api/test/seed', {
    data: { email },
  })).json();

  // Stub the Google tokeninfo endpoint via a route interceptor.
  await page.route('https://oauth2.googleapis.com/tokeninfo?**', route =>
    route.fulfill({ status: 200, body: JSON.stringify({ email, sub: `g_${email}` }) }));

  // Manually inject the id_token into localStorage (skips the real Google popup for the E2E path).
  await page.addInitScript(tok => localStorage.setItem('parent_id_token', tok), fakeToken);

  await page.goto('/parent/pair');
  await page.getByPlaceholder(/Kode anak/).fill(parentCode);
  await page.getByRole('button', { name: /Tautkan/ }).click();

  await expect(page).toHaveURL(new RegExp(`/parent/${student.id}$`));
  await expect(page.getByRole('heading', { name: new RegExp(student.name) })).toBeVisible();

  await page.getByPlaceholder(/Tanya apa saja/).fill('Apa yang dia kerjakan?');
  await page.keyboard.press('Enter');

  await expect(page.getByText(/Kawi sedang berpikir/)).toBeVisible();
  await expect(page.getByText(/Kawi sedang berpikir/)).toHaveCount(0, { timeout: 30_000 });

  // Click first citation pill if any.
  const pill = page.locator('button:has-text("1")').first();
  if (await pill.isVisible().catch(() => false)) {
    await pill.click();
    // Timeline should scroll/highlight — we assert a class gets added briefly.
    await expect(page.locator('.ring-primary')).toHaveCount(1);
  }
});
```

- [ ] **Step 2: Add a minimal test-seed endpoint (gated by NODE_ENV !== 'production')**

`src/app/api/test/seed/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { email } = await req.json();
  const db = getSupabase();
  const parentCode = `E2E-${Math.floor(Math.random()*9000+1000)}`;
  const { data: student } = await db.from('students').insert({
    name: 'E2E Kid', email: `kid_${email}`, parent_code: parentCode, grade: 'SD',
  }).select().single();
  await db.from('interactions').insert([
    { student_id: student.id, kind: 'chat_user', content: 'bantu perkalian dua digit' },
    { student_id: student.id, kind: 'chat_assistant', content: 'baik, kita coba 23 × 4 dulu ya' },
    { student_id: student.id, kind: 'quiz', subject: 'math', topic: 'perkalian', score: 8, total: 10, content: 'soal perkalian dua digit' },
  ]);
  return NextResponse.json({ student, parentCode, fakeToken: 'e2e_fake' });
}
```

- [ ] **Step 3: Run**

```bash
npm run dev &
DEV_PID=$!
sleep 5
npm run test:e2e
kill $DEV_PID
```

Expected: one passing test.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/parent-golden-path.spec.ts src/app/api/test/seed
git commit -m "test(e2e): parent golden path (pair → ask → cite → scroll)"
```

---

### Task 8.2: Settings drawer (unlink + delete)

**Files:**
- Modify: `src/app/parent/[studentId]/page.tsx`

- [ ] **Step 1: Add drawer state + UI**

Above the header usage, add:

```tsx
const [drawer, setDrawer] = useState(false);

async function unlink() {
  const token = localStorage.getItem('parent_id_token');
  await fetch('/api/parent/unlink', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ student_id: Number(studentId) }),
  });
  router.push('/parent');
}

function signOut() { localStorage.removeItem('parent_id_token'); router.push('/parent'); }
```

Wire `onSettings={() => setDrawer(true)}` and render:

```tsx
{drawer && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setDrawer(false)}>
    <div className="bg-background w-full rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
      <h3 className="font-bold">Pengaturan</h3>
      <p className="text-xs text-muted-foreground">
        Retensi data: chat disimpan 1 tahun, foto 30 hari, nilai selamanya.
      </p>
      <button onClick={unlink} className="w-full py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold">
        Putuskan tautan dengan {student.name}
      </button>
      <button onClick={signOut} className="w-full py-2 rounded-lg border border-border text-sm">
        Keluar
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify — click settings, unlink redirects to `/parent`.**

- [ ] **Step 3: Commit**

```bash
git add src/app/parent/[studentId]/page.tsx
git commit -m "feat(parent): settings drawer with unlink and sign-out"
```

---

## Phase 9: Environment & Deploy

### Task 9.1: Env vars and secrets

**Files:**
- Modify: `.env.example` (create if absent)

- [ ] **Step 1: Document required env**

Create/update `.env.example`:

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
CRON_SECRET=
```

- [ ] **Step 2: Add secrets on Vercel**

```bash
cd ~/Documents/kawabel-web
npx vercel env add CRON_SECRET production
# paste a random 32-char string
npx vercel env add CRON_SECRET preview
```

(All other vars are already set on Vercel — verify with `npx vercel env ls`.)

- [ ] **Step 3: Apply migrations to production Supabase**

```bash
supabase link --project-ref <prod-ref>
supabase db push
```

Confirm the five new migrations applied cleanly.

- [ ] **Step 4: Commit example env**

```bash
git add .env.example
git commit -m "chore: document required env vars"
```

---

### Task 9.2: Deploy

- [ ] **Step 1: Push and deploy**

```bash
git push origin main
cd ~/Documents/kawabel-web && npx vercel --prod
```

- [ ] **Step 2: Smoke test on production**

1. Sign in as a parent with a real Google account.
2. Pair with a real student's `parent_code`.
3. Ask "Apa yang dia pelajari minggu ini?".
4. Confirm the activity timeline renders.
5. Confirm retention cron is visible in Vercel crons dashboard.

- [ ] **Step 3: If any test fails, file a follow-up issue and patch.**

---

## Self-Review

**Spec coverage:**
- Capture (chat, photo, progress/quiz/test/dictation): Tasks 2.3, 2.4, 2.5 ✓
- `parent_accounts` + `parent_student_links` + `interactions` + pgvector: Task 1.1 ✓
- RLS: Task 1.2 ✓
- Storage bucket + RLS for photos: Task 1.3 ✓
- Parent Google sign-in + pair: Tasks 3.2, 4.1, 4.2 ✓
- Kid picker / multi-child: Task 4.3 ✓
- Dashboard shell + header: Task 4.4 ✓
- Weekly card + on-demand fallback: Task 4.5 ✓
- Activity timeline with filters stub: Task 4.6 (note: filters API supports `kinds` + `subject`; UI filter chips deferred — tracked as a minor follow-up)
- RAG retrieval (hybrid): Task 5.1 ✓
- `/api/parent/ask` + citations: Task 5.2 ✓
- Chatbot UI + citation pills → timeline scroll: Tasks 5.3 + 4.6 ✓
- Weekly cron: Task 6.1 ✓
- Retention cron (30d photos, 365d text, forever scores): Task 6.2 ✓
- Kid-visibility banner + 👀 badge: Tasks 7.1, 7.2 ✓
- Old unauthenticated `/api/parent` removal: Task 3.4 ✓
- Consent timestamp on linked_at: stored automatically by DB default in Task 1.1 ✓
- E2E: Task 8.1 ✓
- Settings drawer (unlink + sign-out): Task 8.2 ✓
- Deploy + env: Tasks 9.1, 9.2 ✓

**Follow-ups deferred (not v1 blockers):**
- Filter chips in ActivityTimeline — API supports them; UI chips to be added once real usage reveals what filters parents actually want.
- "Delete my parent account" button (spec mentions it; the `Keluar` sign-out plus RLS makes this low-priority; plan as a v1.1 patch).

**Placeholder scan:** No "TBD" / "implement later" / "similar to Task N" found. Every code block is complete.

**Type consistency:** `RetrievedRow.cite_id` (Task 5.1) is read in Task 5.2's context builder and Task 5.3's `Answer` component — matching property name. `Citation.interaction_id` (Task 5.3) matches the return from Task 5.2. `logChatTurn` signature in Task 2.2 matches the caller in Task 2.3.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-04-16-parent-view-kid-interactions.md` in the `kawabel-web` repo.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
