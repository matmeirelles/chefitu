# My Recipes — Design Spec

## Overview
Mobile recipe app (React Native + Expo). Saves Instagram recipes and displays them in a structured library. Warm, food-forward aesthetic using Material Design 3.

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| primary | #8E4D22 | Buttons, active states, icons |
| onPrimary | #FFFFFF | Text on primary |
| primaryContainer | #FFDBC9 | Step number circles, metric cards |
| onPrimaryContainer | #341000 | Text on primaryContainer |
| secondary | #76574A | Secondary actions |
| secondaryContainer | #FFDBC9 | Active tab/chip fill |
| onSecondaryContainer | #2C160B | Text on active tab |
| surface | #FFF8F5 | Screen backgrounds, body cards |
| surfaceVariant | #F3E5DD | Tag backgrounds, ingredient dividers |
| onSurface | #221A16 | Primary text |
| onSurfaceVariant | #52443D | Secondary text, meta info |
| outline | #D6C3BA | Borders, dividers, dot separators |
| background | #FFF8F5 | App background |
| error | #BA1A1A | Error states |

Card background (not a theme token): `#FEF1EB`

---

## Typography
React Native Paper variants (Material Design 3):
- **headlineSmall** — Recipe title on detail screen
- **titleMedium** — Section headings
- **bodyLarge** — Ingredient names, step instructions
- **bodySmall** — Sub-labels (e.g. "For 2 servings")
- **labelLarge** — Tab labels
- Custom: card title 16px/500, meta 12px, tags 11px/500

---

## Screens

### 1. Library Screen
**Layout:** FlatList of recipe cards, vertical scroll.

**Header (LibraryHeader):**
- App name "My Recipes" — large title, onSurface
- Subtitle "X recipes" — bodySmall, onSurfaceVariant
- Horizontal scrollable filter chips below title
- Chip (unselected): outline border, surfaceVariant bg, 32px height, 8px radius
- Chip (selected): secondaryContainer bg, check icon + label, same size

**Recipe Card:**
- Horizontal layout: photo left, content right
- Card bg: `#FEF1EB`, borderRadius 16, padding 12, no elevation
- Photo: 80×80px, borderRadius 12
- Title: 16px/500, max 2 lines
- Meta row: clock icon + "X min" · person icon + "X serv." · category — all 12px, onSurfaceVariant
- Tags row: pill badges, 11px/500, surfaceVariant bg, 6px radius
- Press animation: card scales down to 0.97 on press (spring), returns to 1.0 on release

---

### 2. Recipe Detail Screen
**Layout:** ScrollView with floating AI bar at bottom.

**Hero:**
- Full-width image, 320px height
- Overlay nav bar (absolute): back arrow left, bookmark + share + more-options right
- Nav buttons: 40×40 glass pill, rgba(255,248,245,0.90) bg, thin border rgba(26,22,18,0.10)

**Body card:**
- Overlaps hero by 20px (marginTop: -20)
- borderTopRadius 28, surface bg
- Padding 24px horizontal, 28px top
- Gap 20 between sections

**Inside body card (top to bottom):**
1. Eyebrow: "CATEGORY · CUISINE" — 11px/500, primary color, uppercase, letter-spacing
2. Title: headlineSmall, onSurface
3. Stats row: 3 metric cards side by side
   - Each: value (22px/500) + label (bodySmall) — surfaceVariant bg, rounded pill
4. Segmented control (Ingredients / Instructions):
   - Outer: full-width pill, outline border, 48px height, padding 4
   - Each tab: flex:1
   - Active pill: fills tab area, secondaryContainer bg, check icon + label, borderRadius 999
   - Inactive: label only, onSurface color
5. Section heading: title + sub-label (e.g. "For 2 servings" or "4 steps")
6. Content list (ingredients OR steps)

**Ingredient row:**
- Horizontal: checkbox (18×18, 3px radius) — primary when checked, outline when not
- Ingredient name: flex:1, bodyLarge — strikethrough + muted when checked
- Quantity: right-aligned, 13px/500, onSurfaceVariant
- Divider: bottom border surfaceVariant (except last)

**Step row (timeline layout):**
- Left column (32px wide): circle (32×32, primaryContainer bg) with step number, vertical connector line (1.5px, outline color) connecting to next circle
- Right column: step title (16px/700) + instruction (bodyLarge, onSurfaceVariant)
- Padding bottom 24 between steps

**AI bar (floating):**
- Absolute bottom, 16px from edges, 56px height
- borderRadius 28, surfaceVariant bg, elevation 2
- Left: auto-fix icon (primary) + "Adjust this recipe…" placeholder text
- Right: circular send button (36×36, primary bg, up-arrow icon)

---

## Navigation
Simple stack: Library → Detail. No tab bar. Back button in detail hero nav.

State shape:
```
{ kind: "library" }
{ kind: "detail", recipe: RecipeRecord }
```

---

## Component Inventory
- `RecipeCard` — horizontal card with press animation
- `LibraryHeader` — FlatList header with title + filter chips
- `MetricCard` — stat pill (value + label)
- `StateCard` — empty/error state with retry button
- `RecipeDetailScreen` — hero + tabbed detail
- `LibraryScreen` — searchable, filterable recipe list
- `AppShell` — top-level navigator

---

## Data Shape (for prototyping)
```json
{
  "id": "rec_1",
  "title": "Banana Oat Pancakes",
  "coverImageUrl": "https://images.unsplash.com/...",
  "category": "Breakfast",
  "cuisine": "Healthy",
  "totalTimeMinutes": 15,
  "servings": "2 servings",
  "tags": ["Quick", "Healthy"],
  "ingredients": [
    { "amount": "2", "item": "eggs" },
    { "amount": "2", "unit": "tbsp", "item": "oats" }
  ],
  "steps": [
    { "order": 1, "title": "Blend", "instruction": "Blend all ingredients." }
  ]
}
```
