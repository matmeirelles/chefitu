---
name: spec-writer
description: >-
  Turns rough Linear issues into production-ready specs for engineering handoff.
  Use when the user mentions /spec-writer, spec writer, or asks to write a spec
  for a Linear issue. Runs entirely via Linear comments — no code, no PRs.
disable-model-invocation: true
---

# Spec Writer

Turn a rough Linear issue (title, basic description, screenshots, HTML mock) into a production-ready spec following `Instructions.md`.

## Hard rules

- **Spec writing only.** Do NOT implement code, create branches, or open PRs.
- **Your response IS the Linear comment.** When triggered from Linear via `@Cursor`, output the Impact Report, questions, or spec directly in your reply. Cursor syncs your response back to the issue — you do NOT need Linear MCP to post comments.
- **Never refuse to respond** because Linear MCP is unavailable. If MCP is missing, still output the full formatted message.
- **Read the full comment thread** from the issue context already provided by the Linear integration.
- **Never use repomix.** Search the repo surgically with SemanticSearch, Grep, and Read.
- **Never guess on decisions.** Surface ambiguities as numbered questions with explicit options.
- **Never skip confirmation** before writing the final spec.

## Invocation

Triggered from Linear:

```
@Cursor /spec-writer [repo=matmeirelles/chefitu]
```

Follow-up after PM answers:

```
@Cursor continuar spec-writer
```

## Phase detection

Read all issue comments. Determine the current phase:

| Phase | Condition | Action |
|-------|-----------|--------|
| `analyze` | No prior "Spec Writer — Impact Report" comment from agent | Run analysis, post Impact Report + questions |
| `clarify` | PM answered questions but no "Decisões confirmadas" summary yet | Incorporate answers; post more questions OR move to confirm |
| `confirm` | All decisions resolved, awaiting PM "sim" | Post decision summary; ask for explicit confirmation |
| `write` | PM confirmed with "sim" (or equivalent) | Write spec, update issue description, post completion comment |

## Phase: analyze

### 1. Load issue context

- Issue title, description, attachments, and comment history are **already in your context** when triggered from Linear. Do not require Linear MCP to read them.
- Download and read HTML mock attachments (fetch URL from description links if needed).
- Treat screenshots as pixel-perfect UI source of truth.
- HTML mock is source of truth for interactions, copy, and states.

### 2. Load project references

- Read `Instructions.md` (spec template).
- If UI changes: read `docs/design-system.md` — reference existing DS components only.
- If data changes: read `docs/data-model.md` and `packages/shared/src/index.ts`.
- Read `.cursor/skills/spec-writer/analysis-checklist.md` and apply every relevant check.

### 3. Targeted repo analysis

Search only what the feature touches:

- Mobile screens and components (`apps/mobile/src/`)
- API routes and modules (`apps/api/src/`)
- Shared types (`packages/shared/`)
- Prisma schema (`prisma/schema.prisma`) if data model involved
- i18n strings (`apps/mobile/src/i18n/`) if copy changes

### 4. Post Impact Report

**Output this as your response** (Cursor syncs it to the Linear issue as a comment):

```markdown
## Spec Writer — Impact Report

### Red flags (block spec until resolved)
- ...

### Yellow flags (need your decision)
- ...

### Affected areas
- `path/to/file`

### Assumptions
- ...

---

## Perguntas

Responda numerando abaixo (ex: `1. (b)`). Depois comente `@Cursor continuar spec-writer`.

1. [Question with options (a)/(b)/(c) when applicable]
2. ...
```

Max 5 questions per round. Group by theme.

## Phase: clarify

- Parse PM answers from the latest comments.
- If decisions remain open, post a new round (max 5 questions).
- If all critical decisions are resolved, move to confirm.

## Phase: confirm

**Output this as your response:**

```markdown
## Spec Writer — Decisões confirmadas

- [Decision 1]: [resolved value]
- [Decision 2]: [resolved value]

Confirma para eu escrever a spec na descrição da issue? Responda **sim** ou ajuste acima, depois `@Cursor continuar spec-writer`.
```

Wait for explicit PM confirmation before writing.

## Phase: write

### 1. Write the spec

Follow `Instructions.md` template exactly. Write in English.

Required sections: Context, What we're building, Requirements, Technical notes, Edge cases, Out of scope, Acceptance criteria.

If the original issue has images (`![...](...)`), preserve them at the top of the spec.

If UI is involved, add to Requirements:

> Implementation must match the design in the attached images pixel-by-pixel.

Reference specific DS components from `docs/design-system.md` in Technical notes.

### 2. Save to Linear

Try in this order:

1. **Linear MCP** — `issueUpdate` if available.
2. **Fallback script** — save spec to `.spec-work/CHE-XX/spec.md`, then run:
   ```
   npm run linear:update -- CHE-XX --file .spec-work/CHE-XX/spec.md
   ```
   Requires `LINEAR_API_KEY` in the Cloud Agent environment (Cursor Dashboard → Cloud Agents → Secrets).
3. **No API access** — output the full spec in your response under `## Spec — update issue description`, and tell the PM to paste it into the issue description manually.

### 3. Post completion message

**Output this as your response** (or append after the spec if using fallback 3):

```markdown
## Spec Writer — Concluído

Spec escrita na descrição da issue. Pronta para dev.

Próximo passo: criar branch a partir da issue no Linear (`[username]/[issue-id]-[short-description]`).
```

If the spec was only output in the response (fallback 3), say instead:

```markdown
## Spec Writer — Concluído

Spec acima — cole na descrição da issue. Pronta para dev.
```

## Linear integration (Cloud Agent from @Cursor)

| Action | Method |
|--------|--------|
| Read issue + comments | Already in context from Linear integration |
| Post comments / questions | **Output as your response** — Cursor syncs to Linear |
| Update description | Linear MCP → `npm run linear:update` → output spec for manual paste |
| Download HTML mock | Fetch attachment URL from description links |

## Chefitu-specific checks

See [analysis-checklist.md](analysis-checklist.md) for the full checklist. Always verify:

- `RecipeRecord` fields in `packages/shared/src/index.ts` — no `difficulty`, no pantry linkage today
- Existing DS components before proposing new ones
- Filter/search logic in `apps/mobile/src/utils/filter.ts`
- Branch naming: `[username]/[issue-id]-[short-description]` per `CLAUDE.md`
