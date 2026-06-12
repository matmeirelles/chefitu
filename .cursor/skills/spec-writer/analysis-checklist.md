# Spec Writer — Analysis Checklist (Chefitu)

Apply every section relevant to the issue. Surface findings as red flags (block spec) or yellow flags (need PM decision).

## Data model

- [ ] Does the design require fields not in `RecipeRecord` (`packages/shared/src/index.ts`)? Known gaps: `difficulty`, pantry linkage, dietary tags beyond `tags[]`.
- [ ] Does it need a Prisma migration (`prisma/schema.prisma`)?
- [ ] Does the API need new endpoints or changes to existing ones (`apps/api/src/`)?
- [ ] Will AI extraction (`apps/api` import pipeline) need prompt/schema updates?

## Mobile UI

- [ ] Which screen(s) are affected? (Home/Library = `LibraryScreen`, Recipe detail, tabs in `AppShell`)
- [ ] Can existing DS components cover it? Check `apps/mobile/src/design-system/` and `docs/design-system.md`.
- [ ] Is a new component justified, or should an existing one be extended?
- [ ] Does copy need i18n entries (`apps/mobile/src/i18n/`)?
- [ ] Safe area / tab bar / FAB overlap considerations?

## Search and filters

- [ ] Current filter logic: `apps/mobile/src/utils/filter.ts` (category chip + text search, client-side only).
- [ ] Does the feature change filter behavior (instant vs. apply button, sheet vs. inline)?
- [ ] Do horizontal category chips on Home conflict with a new filter sheet?

## Features not yet built

Flag as yellow unless PM explicitly includes in scope:

- Pantry / "ingredientes disponíveis"
- Recipe difficulty level
- Server-side search or filter API
- Multi-user / sharing

## Design fidelity

- [ ] Screenshots attached? Spec must require pixel-perfect match.
- [ ] HTML mock attached? Use for interaction details, copy, and states.
- [ ] Design shows components not in DS? Flag and propose DS mapping.

## Edge cases to probe

- [ ] Empty states (no recipes, no filter results)
- [ ] Loading and error states
- [ ] Offline / API failure
- [ ] Concurrent actions (import in progress + filter change)
- [ ] Favorite patches from other screens (`favoritePatches` in `LibraryScreen`)

## Out of scope discipline

- [ ] Does the design show features that don't exist in the codebase? List explicitly in Out of scope unless PM confirms otherwise.

## Performance

- [ ] Client-side filter on large recipe lists — acceptable or needs pagination/API?
- [ ] New bottom sheet / modal — re-render impact on FlatList?

## Security and privacy

- [ ] Any new user data stored? Local only vs. server?
- [ ] PII in new fields?

## Red flag examples

- Design requires DB field + migration but issue says "front only"
- Design references pantry but no pantry module exists and PM hasn't confirmed scope
- New API endpoint needed but issue has no backend mention

## Yellow flag examples

- Difficulty filter shown but `RecipeRecord` has no `difficulty`
- "Aplicar" button suggests deferred filter apply vs. current instant search
- Category chips may be replaced by filter sheet — UX decision needed
- Filter icon badge when filters active — not implemented today
