# Chefitu — Agent Instructions

## Stack

- Mobile: Expo SDK 54 + React Native
- Backend: Fastify + TypeScript (ESM)
- Database: PostgreSQL + Prisma ORM
- AI: Anthropic Claude (Haiku for extraction, Sonnet for evals judge)
- Monorepo: Turborepo + npm workspaces

## Before committing

Always update `CHANGELOG.md` before creating a commit. Add the change under `## [Unreleased]` using the appropriate tag:

- `[Added]` — new features
- `[Changed]` — changes to existing behavior
- `[Fixed]` — bug fixes
- `[Optimized]` — performance or cost improvements

## Changelog releases

During feature work, only update `## [Unreleased]`. Do **not** cut a dated version (e.g. `## [0.8.0] — YYYY-MM-DD`) until the user says the PR was merged.

**When opening a PR** (or when the user asks to create one), remind them explicitly:

> Quando você fizer o merge deste PR, me avise para eu cortar a nova versão no `CHANGELOG.md` (mover `[Unreleased]` → `[X.Y.Z] — data`).

**When the user confirms a PR was merged**, on `main`:

1. Move everything from `## [Unreleased]` into a new section `## [X.Y.Z] — YYYY-MM-DD` (bump patch by default unless they specify otherwise).
2. Leave `## [Unreleased]` empty.
3. Update the compare links at the bottom of `CHANGELOG.md`.
4. Commit with message `chore: update changelog for vX.Y.Z` and push to `main`.

## Design system

The project uses a custom design system. When making UI changes:
- Reference `docs/design-system.md` for tokens, components, and patterns
- Use existing DS components — never create new ones for things that already exist
- If the issue contains images, the implementation must match them exactly

## Branch naming

When starting work on a Linear issue, create a branch from the issue in Linear. This moves the task to In Progress automatically.
Format: `[username]/[issue-id]-[short-description]` (e.g. `matmeirelles1991/che-13-delete-flow`)
