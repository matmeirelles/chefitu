# Chefitu Design System

> Receitas que acolhem, ingredientes que conectam.

Chefitu is a warm, playful, AI‑powered recipe app — a friendly little chef in your pocket. It helps people save, organize, adapt and cook recipes from any source: websites, YouTube, photos, social posts. AI interprets recipes, adapts them to taste, suggests dishes based on what's in the pantry, and builds the missing‑ingredients shopping list.

Mobile‑first, web‑responsive. The brand voice is Portuguese‑first (BR), affectionate, and home‑cook friendly — never technical, never premium, never cold.

---

## What's in this design system

| File / Folder | What it is |
|---|---|
| `README.md` | This file — brand overview, content + visual + iconography foundations, index |
| `SKILL.md` | Agent skill manifest, so this folder works as a Claude Code / Claude.ai skill |
| `colors_and_type.css` | Single source of truth for color + type tokens (CSS custom properties) |
| `fonts/` | Webfont files (Baloo 2 display + Nunito UI), with Google Fonts CDN fallback documented |
| `assets/brand/` | Original brand reference boards (logos, palettes, components, screen recipes) |
| `assets/illustrations/` | Cropped mascot + food character stickers from the brand boards |
| `assets/icons/` | Rounded outline icon set (Lucide via CDN) — see ICONOGRAPHY |
| `preview/` | Small HTML cards that populate the Design System tab |
| `ui_kits/mobile/` | Mobile (iOS frame) UI kit — splash, onboarding, home, recipe, pantry, list |
| `ui_kits/web/` | Web UI kit — landing, library, recipe detail, pantry |

---

## Sources

- **Figma file:** `Chefitu.fig` (mounted virtually) — 7 reference frames, each a rendered ChatGPT‑generated brand board (logo, palette, components, mascot, screens, landing, packaging). The brand boards are the canonical reference.
- No external codebase or production Figma library was supplied — the entire system is reconstructed from the brand boards and the written brief.

---

## CONTENT FUNDAMENTALS

**Language.** Portuguese (Brasil) first. English copy only when explicitly needed.

**Voice.** A friendly, encouraging little chef sitting next to the user. Always warm, never instructional, never corporate. The product talks like a relative who loves to cook, not like a tool. Greeting users by name and ending sentences with a small affectionate punctuation feels right.

**Person.** Second person, informal ("você"). The app refers to itself as "Chefitu" or "o Chefitu" (third person, like a small character). When Chefitu is "speaking," include a small mascot avatar instead of a faceless system voice.

**Casing.**
- Titles + buttons: Sentence case ("Salvar receita", "Adaptar ao meu gosto") — never ALL CAPS.
- Section labels in boards / dashboards may use small caps for hierarchy ("PALETA DE CORES") but never inside the product.
- Brand name is always **Chefitu** with a capital C, never CHEFITU or chefitu.

**Vibe.** Cozy, playful, practical. Encouragement is implicit in word choice — "Vamos cozinhar juntos!", "Pronto para cozinhar algo incrível hoje?" — not in exclamation marks. One emoji‑style accent per message at most (usually a 👋 or ❤️), and only when the brand mascot would naturally wink.

**Examples** (the canonical voice):
- Welcome line: *"Olá, Chefitu! Pronto para cozinhar algo incrível hoje?"*
- Tagline: *"Receitas que acolhem, ingredientes que conectam."*
- Empty state: *"Você ainda não salvou nenhuma receita. Salve suas favoritas para encontrar depois."*
- CTA: *"Vamos começar!"* / *"Começar receita"* / *"Adaptar ao meu gosto"*
- Pantry CTA: *"Tire uma foto da sua despensa"*
- Toast (success): *"Receita salva com sucesso! Você pode ver suas receitas salvas."*
- Toast (error): *"Ops! Algo deu errado. Tente novamente em alguns minutos."*

**Don'ts.**
- ❌ "AI‑powered", "leverage", "smart algorithm" — never sell the tech.
- ❌ Imperatives without warmth ("Click here", "Submit").
- ❌ ALL‑CAPS, exclamation chains (!!), tech jargon, formal "senhor/senhora".
- ❌ Emoji clusters or random emoji decoration. The product has illustrated stickers — use them instead.

---

## VISUAL FOUNDATIONS

**Palette.** Warm, edible, low‑saturation. Six core swatches:

| Token | Hex | Use |
|---|---|---|
| `--marrom` (Chocolate Brown) | `#4A2C1A` | Outlines, primary text, mascot strokes |
| `--creme` (Cream) | `#FFF6E9` | App background, surface fill |
| `--laranja` (Warm Orange) | `#FF8A2B` | Primary CTAs, hot/cooking accents |
| `--verde-folha` (Leaf Green) | `#7DBA4D` | Ingredients, fresh tags, success |
| `--salvia` (Soft Sage) | `#CFE2CF` | Pantry chips, calm/healthy backgrounds |
| `--bege` (Warm Beige) | `#F6EAD7` | Card surfaces, secondary panels |
| `--coracao` (Heart Orange/Red) | `#FF6B2C` | Favorites, hearts, love accents |

The chocolate brown does the heavy lifting — it's the stroke color of every illustration AND the body text color. This creates the hand‑drawn‑notebook feel. Pure black is forbidden. Pure white is also forbidden — surfaces are always cream or beige.

**Typography.**
- **Display:** Baloo 2 (ExtraBold 800 for the wordmark + section eyebrows; Bold 700 for screen titles). Rounded, friendly, slight italic feel — used SPARINGLY, never for paragraphs.
- **UI / body:** Nunito (Regular 400 body, SemiBold 600 labels + chips, Bold 700 emphasis). Rounded sans‑serif with great legibility at small sizes.
- Minimum mobile size: 14px (chip labels). Body 16px. Section titles 20–24px. Hero 28–36px on mobile, 56–72px on web. Line height generous (1.4–1.55).

**Spacing.** 4px base scale. The product breathes at 16/20/24/32 — never tight. Cards have 16–20px interior padding on mobile, 24–32px on web.

**Border radius.** Everything rounds. Pill (999px) for buttons + chips. 16px for cards. 24px for large surfaces / sheets. 20px for inputs. 8–12px only for tiny inline hits. Sharp corners do not exist in this brand.

**Backgrounds.** Solid warm cream (`--creme`) on all screens. Decorative full‑bleed photos appear ONLY on recipe detail headers and selected landing hero blocks. No gradients as backgrounds, no patterned wallpaper inside the app. A subtle hand‑drawn outline motif (basil leaves, hearts, whisks) may sit at very low opacity on splash + onboarding screens — never in‑app.

**Cards.** Cream/beige fill, soft 16–20px rounded corners, no border by default, a low ambient shadow (`0 8px 24px rgba(74, 44, 26, 0.06)`). On hover/press, the shadow grows gently rather than the color changing. Some emphasis cards add a 1.5px chocolate‑brown stroke (e.g. the "destaque" recipe card).

**Shadows.** One ambient elevation system, brown‑tinted to feel like soft kitchen light:
- `--shadow-sm`: `0 2px 6px rgba(74, 44, 26, 0.06)` — chips, inputs.
- `--shadow-md`: `0 8px 24px rgba(74, 44, 26, 0.08)` — recipe cards, sheets.
- `--shadow-lg`: `0 16px 40px rgba(74, 44, 26, 0.12)` — modals, lifted CTAs.
No inner shadows. No neumorphism. No glassmorphism.

**Borders.** When a border appears, it is `1.5px solid var(--marrom)` (or its 10% alpha for subtle dividers). Never gray. Hairline 1px is reserved for table rows + list separators.

**Hover state.** Surfaces darken by ~4% in oklch, buttons get +1px shadow and slight upward translate (translateY(-1px)). Never opacity changes (it makes warm browns look dirty).

**Press state.** Buttons shrink to 0.97 scale and drop the shadow. Cards add a 1.5px brown stroke for a beat. Pills "pop" slightly with a 100ms ease‑out.

**Animation.** Bouncy + soft. Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for entrances (spring); `cubic-bezier(0.4, 0, 0.2, 1)` for transitions. Hearts pulse on favorite. Mascot blinks once every 6–9 seconds on splash. No long animations — everything resolves in 150–300ms. Reduced‑motion mode disables the spring + the blink.

**Layout rules.**
- Mobile: 16px outer gutter. Bottom nav fixed (64px). Top app bar 56px.
- Tablet/desktop web: 1200px content max width, 32px gutter. Sticky top nav (72px). Sidebar (when used) 280px.
- Always single‑column on mobile (recipe detail is the exception with a full‑bleed photo header).
- A "safe band" of 16–24px breathes between every card cluster.

**Transparency + blur.** Used only for ONE thing: the floating bottom‑nav protection gradient on the recipe detail screen, where a `--creme` → transparent gradient lifts content off the food photo. No frosted glass anywhere else — warmth requires opacity.

**Imagery vibe.** Food photography is warm, slightly desaturated, top‑down or 30° angle, natural light, no harsh shadows. Illustrations have **thick chocolate‑brown outlines (3–4px)**, cream fills, orange highlights, leaf‑green accents, tiny hearts and sparkles. Every illustration includes the cream chef‑hat mascot somewhere when possible. No 3D, no isometric, no flat tech illustration.

**Mascot.** "Chefitu" is a winking cream chef hat with a face, a tiny orange mouth/scarf, and one or two basil leaves. It's used as logo, app icon, empty‑state hero, loader, avatar, sticker, and toast attachment. The mascot is a CHARACTER — it never gets cropped to a square or recolored arbitrarily.

---

## ICONOGRAPHY

Chefitu uses **rounded outline icons** with a chocolate‑brown stroke at ~1.75px on a 24px grid. The look matches the mascot's thick outlines but at UI weight.

- **Primary set:** [Lucide](https://lucide.dev/) via CDN (`https://unpkg.com/lucide@latest`). Lucide is rounded, outline, free, and stroke‑width‑adjustable — a near‑perfect match for the brand's hand‑drawn feel. Stroke set to 1.75px, color `var(--marrom)`. *Flagged substitution: the brand boards show custom hand‑drawn icons that don't exist as a downloadable set; Lucide is the closest CDN match.*
- **Decorative icons / stickers** (tomato, avocado, basil, pancakes, pot, recipe book, the mascot itself) live in `assets/illustrations/` as PNG/SVG cropped from the brand boards. These are illustrations, not icons — use them at 48–128px and never at status‑bar sizes.
- **Brand glyphs:** the chef‑hat mascot SVG is the app icon, favicon, and is used inline in some titles as a stand‑in for a logo.
- **Emoji:** allowed sparingly in onboarding and the welcome line (👋, ❤️), never in functional UI labels. Categories use illustrated stickers, not emoji.
- **Unicode chars as icons:** no. Use Lucide or stickers.

When in doubt, reach for a sticker for emotional moments (empty states, success, onboarding) and a Lucide icon for functional moments (nav, search, settings).

---

## Index

- 🎨 **Foundations** → `colors_and_type.css`, `preview/`
- 📱 **Mobile UI kit** → `ui_kits/mobile/index.html`
- 🖥️ **Web UI kit** → `ui_kits/web/index.html`
- 🖼️ **Assets** → `assets/brand/` (boards), `assets/illustrations/` (stickers), `assets/icons/` (Lucide)
- 🤖 **Skill manifest** → `SKILL.md`
