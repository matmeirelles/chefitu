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
- **Linear comments only.** All interaction with the PM happens as comments on the issue. Never expect IDE chat input.
- **Read the full comment thread** to determine which phase you are in.
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

- Issue title, description, attachments, and full comment history (via Linear MCP or context already provided).
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

Post a Linear comment using this structure:

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

Post a Linear comment:

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

Update the issue description with the full spec.

- **Preferred:** Linear MCP `issueUpdate` mutation.
- **Fallback:** `npm run linear:update -- CHE-XX --file .spec-work/CHE-XX/spec.md`

### 3. Post completion comment

```markdown
## Spec Writer — Concluído

Spec escrita na descrição da issue. Pronta para dev.

Próximo passo: criar branch a partir da issue no Linear (`[username]/[issue-id]-[short-description]`).
```

## Linear integration

| Action | Method |
|--------|--------|
| Read issue + comments | Linear MCP (primary) |
| Post comments | Linear MCP `commentCreate` |
| Update description | Linear MCP `issueUpdate` |
| Download HTML mock | Fetch attachment URL; save to `.spec-work/CHE-XX/` if needed |
| Fallback read/update | `npm run linear:fetch` / `npm run linear:update` |

## Chefitu-specific checks

See [analysis-checklist.md](analysis-checklist.md) for the full checklist. Always verify:

- `RecipeRecord` fields in `packages/shared/src/index.ts` — no `difficulty`, no pantry linkage today
- Existing DS components before proposing new ones
- Filter/search logic in `apps/mobile/src/utils/filter.ts`
- Branch naming: `[username]/[issue-id]-[short-description]` per `CLAUDE.md`
