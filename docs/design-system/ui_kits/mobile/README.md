# Chefitu — Mobile UI kit

Interactive HTML prototype for mobile screens. Open in a browser (local server recommended because of Babel script tags).

## Quick start

From this folder:

```bash
cd docs/design-system/ui_kits/mobile
npx serve .
```

Open **`http://localhost:3000`** in Chrome.

### Export screenshots (rounded iPhone frame)

1. Select the screen in the sidebar
2. Click **Export PNG** (sidebar button, or floating button in screenshot mode)
3. A PNG downloads with the device frame, rounded corners, mascot, and shadow

Screenshot mode (phone only, no sidebar):

```
http://localhost:3000/?screenshot=1
http://localhost:3000/?screenshot=1&screen=recipe
```

Avoid macOS `Cmd+Shift+4` or DevTools *Capture node screenshot* — they clip rounded corners or drop PNG assets. **Export PNG** uses `html-to-image` and is the reliable path for README assets.

Asset paths use a symlink `assets` → `../../assets` (mascot PNGs, stickers, food photos). `colors_and_type.css` is a copy of the parent file — re-copy after token changes:

```bash
ln -sfn ../../assets assets
cp ../../colors_and_type.css colors_and_type.css
```

Paths expect `docs/design-system/colors_and_type.css` and `docs/design-system/assets/` (one level up from `ui_kits/mobile`).

## Files

| File | Role |
|------|------|
| `index.html` | Shell + screen navigator |
| `screens.jsx` | Screen bodies |
| `components.jsx` | Shared UI primitives |
| `ios-frame.jsx` | Device frame |

**Note:** `index.html` lists `ScreenProfile`; add or update `ScreenProfile` in `screens.jsx` when the Perfil mock is finalized (CHE-18).
