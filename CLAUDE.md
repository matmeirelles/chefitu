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

## Design system

The project uses a custom design system. When making UI changes:
- Reference `docs/design-system.md` for tokens, components, and patterns
- Use existing DS components — never create new ones for things that already exist
- If the issue contains images, the implementation must match them exactly

## Branch naming

When starting work on a Linear issue, create a branch from the issue in Linear. This moves the task to In Progress automatically.
Format: `[username]/[issue-id]-[short-description]` (e.g. `matmeirelles1991/che-13-delete-flow`)
