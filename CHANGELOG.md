# Changelog

All notable changes to Chefitu are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

## [0.5.0] — 2026-05-29

### Changed
- Renamed project from `my-recipes` to `Chefitu` across all packages, configs, imports, and git remote

### Fixed
- Added `apps/api/uploads` to `.gitignore` — runtime images were being tracked by git

---

## [0.4.0] — 2026-05-28

### Changed
- Recipe detail screen redesigned: new layout with cover image hero, ingredient chips, step cards, and action footer (CHE-12)

---

## [0.3.0] — 2026-05-27

### Changed
- Bottom navigation replaced with 5-tab bar: Início, Descobrir, Importar, Ajustes, Perfil (CHE-9)
- Home screen redesigned with mascot header and 2-column recipe grid (CHE-8)

---

## [0.2.0] — 2026-05-18

### Added
- Design system built from scratch: tokens, `Text`, `Button`, `Tag`, `Chip`, `Icon`, `SearchBar`, `RecipeCard`, `MetricCard`, `StateCard`, `BottomNav`
- Baloo 2 + Nunito fonts via `expo-google-fonts`
- `lucide-react-native` for icons
- AI recipe generation: new prompt, response parser, and API routes
- Langfuse instrumentation and tracing for all AI calls
- Image proxy module with download utility for cover images
- Eval pipeline for recipe adjustment: LLM-as-judge + Jaccard scoring, dataset v1 with 5 adjustment cases
- `AdjustRecipePanel` bottom sheet: drag-to-close, keyboard avoidance, suggestion chips
- Adjustment endpoint with session-based chat history and AI diff generation
- `RecipeDetailScreen` integration: compare original vs adjusted, apply and save flow
- AI adjustment log: session tracking and token usage via Prisma migration

### Changed
- App renamed from "My Recipes" to "Chefitu" in `app.json`
- `react-native-paper` removed; all screens and components migrated to custom DS
- Chefitu brand assets added: logo e mascot
- Multi-provider AI abstraction expanded: Anthropic + Ollama com stubs para OpenAI/Gemini
- `RECIPE_CATEGORIES` e `RECIPE_CUISINES` centralizados no `shared` package, usados tanto nos filtros quanto no prompt de extração

### Fixed
- Keyboard avoidance no `AdjustRecipePanel`: `height`/`marginBottom` separados em JS-driver e `transform` em native-driver, eliminando conflito de driver do `Animated`

### Optimized
- JSON extraction no `AnthropicProvider`: strip de texto fora das chaves antes do parse, eliminando falhas em respostas com prefixo de texto
- `prepTimeMinutes` e `cookTimeMinutes` removidos do schema, tipos e prompt — campos que o LLM alucinava com frequência

---

## [0.1.0] — 2026-04-30

### Added
- Monorepo com Turborepo: `apps/api`, `apps/mobile`, `packages/shared`
- Backend Fastify + TypeScript com endpoints REST para receitas e imports
- Prisma + PostgreSQL: schema inicial, seed e migrations
- App mobile Expo SDK 54: telas Library, Queue e Detail
- Navegação por tabs com bottom bar (Home / Queue)
- Pipeline de importação via Instagram: fetch de `og:description` + `og:image`, extração de receita com Claude via tool calling
- Eval pipeline para extração: Jaccard + LLM-as-judge, dataset v1 com 5 casos
- `RECIPE_TAGS` no `shared` package sincronizado com o prompt de extração
- Watchdog de processamento: limpa imports travados no startup e a cada 5 minutos
- DELETE endpoints para receitas e imports
- Dockerfile, `railway.toml` e EAS config para deploy
- Checklist de ingredientes, steps e fluxo de delete na tela de detalhe

---

[Unreleased]: https://github.com/matmeirelles/chefitu/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/matmeirelles/chefitu/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/matmeirelles/chefitu/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/matmeirelles/chefitu/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/matmeirelles/chefitu/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/matmeirelles/chefitu/releases/tag/v0.1.0
