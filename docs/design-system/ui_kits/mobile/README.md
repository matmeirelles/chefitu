# Chefitu — Mobile UI kit

Interactive HTML prototype for mobile screens. Open in a browser (local server recommended because of Babel script tags).

## Quick start

From this folder:

```bash
npx serve .
# or: python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `:8080`) and select **10. Perfil** in the sidebar.

Paths expect `docs/design-system/colors_and_type.css` and `docs/design-system/assets/` (one level up from `ui_kits/mobile`).

## Files

| File | Role |
|------|------|
| `index.html` | Shell + screen navigator |
| `screens.jsx` | Screen bodies |
| `components.jsx` | Shared UI primitives |
| `ios-frame.jsx` | Device frame |

**Note:** `index.html` lists `ScreenProfile`; add or update `ScreenProfile` in `screens.jsx` when the Perfil mock is finalized (CHE-18).
