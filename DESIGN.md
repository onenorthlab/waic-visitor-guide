# WAIC Visitor Guide Design System

## Brand relationship

This visitor guide is a WaytoAGI companion to `https://waic.waytoagi.com/`. It keeps its own data-heavy information architecture while sharing the visual language of the Side Events site. It remains clearly labeled as an independent visitor planning tool rather than the official WAIC website.

## Visual direction

The design direction is a warm event editorial: cream paper, near-black typography, confident raspberry actions, generous white space, and friendly WaytoAGI branding. The experience should feel like a premium printed festival guide translated into a responsive data product.

### Color tokens

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--page` | `#f7f6f1` | `#171916` | Page background |
| `--surface` | `#fffefa` | `#20231f` | Primary cards and dialogs |
| `--canvas` | `#f1eadb` | `#2a2e28` | Secondary panels and controls |
| `--ink` | `#171916` | `#f7f6f1` | Primary text |
| `--muted` | `#6f706b` | `#b6b8b0` | Secondary text |
| `--line` | `#e5e1d8` | `#3a3e37` | Borders and dividers |
| `--accent` | `#d92d52` | `#f04a6e` | Primary action and active state |
| `--accent-strong` | `#bd183e` | `#ff718d` | Hover and emphasized data |
| `--accent-soft` | `#f9dce3` | `#502330` | Decorative tint and selected background |

Do not use purple as the primary brand color. Blue and cyan may appear only as supporting data colors when the chart needs categorical separation.

### Typography

- Use the same pragmatic multilingual system stack as Side Events: `-apple-system`, `BlinkMacSystemFont`, `PingFang SC`, `Noto Sans SC`, `Microsoft YaHei`, `system-ui`, `sans-serif`.
- Hierarchy comes from size and spacing, not boldness (Side Events `docs/DESIGN.md` alignment): display headings at 40px and above use weight `300`, other headings default `400`, UI emphasis tops out at `500`. No `600+` bold except browser-default emphasis inside body copy.
- Negative letter spacing applies to Latin words and digits only. CJK text never gets negative tracking.
- Supporting labels use uppercase or letter spacing only for short English editorial markers.
- Data values use a monospaced system stack for scanning speed.

### Shape and depth

- Buttons, tags, badges, and standalone controls: full capsule (`999px`).
- Inputs and small containers: 16px radius minimum.
- Data cards: 24px radius. Hero and modal surfaces: 28 to 32px radius.
- Elevation is flat: cards separate with a 1px border and whitespace, not shadows. The primary CTA carries the only glow (`--glow`, a 4px brand halo). Overlays (menus, sheets, carousels) keep one soft `--overlay-shadow` for legibility.
- Borders remain visible so data groups are understandable without relying on color alone.
- The hero never forces a full-viewport height; the insight spine should be visible within the first desktop screen.

## Logo and imagery

- The navigation brand uses the WaytoAGI deer logo from `https://waic.waytoagi.com/brand/logo.png` beside the text `WAIC Visitor Guide`.
- `WaytoAGI` appears as a secondary wordmark, matching the relationship shown on the Side Events site.
- The existing WAIC data terrain remains the hero's analytical signature. It is placed inside a warm cream frame rather than replaced by Side Events marketing imagery.
- Do not imply that the deer logo or this guide is the official WAIC identity.

## Component rules

### Header

- Warm translucent background with a subtle bottom border.
- Brand group on the left, scrollable section navigation in the middle, language and theme controls on the right.
- The language control opens a menu listing all eight supported languages by native name.

### Buttons and filters

- Primary actions use raspberry fill and white text.
- Secondary actions use warm white, ink text, and a visible neutral border.
- Active chart nodes use raspberry borders or pale raspberry fills, never a purple glow.
- Selects and search inputs use warm white surfaces with 12px radius.

### Data visualizations

- Heat intensity progresses from cream to pale rose to raspberry.
- Topic and venue nodes keep their spatial hierarchy but use the brand palette and restrained supporting hues.
- Every visualization remains readable in monochrome through labels, counts, borders, and geometry.

### Activity carousel

- The dialog uses a warm editorial surface with a pale rose corner glow.
- It provides date, topic, and venue filters above the event card.
- Filters narrow the activity set opened from the selected chart node; they never invent or broaden source data.
- Changing a filter resets the carousel to the first matching activity.
- Autoplay pauses after manual navigation and respects `prefers-reduced-motion`.

## Internationalization

Supported locales:

1. Simplified Chinese `zh-CN`
2. English `en`
3. Japanese `ja`
4. Korean `ko`
5. French `fr`
6. German `de`
7. Spanish `es`
8. Arabic `ar`

Interface controls, navigation, planner guidance, filters, venue guidance, categories, identities, and goals are localized. The schedule source contains only Chinese and English official titles and locations. Chinese uses the Chinese source; all other locales use the English source so unofficial machine-translated forum names are not presented as authoritative. Arabic uses `dir="rtl"`, while numeric times remain left-to-right.

UI dictionaries must be declared for all eight `Locale` values through the typed `defineTranslations` helper. UI components may not call `contentLanguage`; that fallback is reserved exclusively for selecting Chinese or English official source data through `sourceText`. This makes a missing locale a TypeScript error instead of silently rendering English interface copy.

## Accessibility and motion

- Preserve semantic buttons, labels, focus traps, focus restoration, and `aria-live` announcements.
- All text and interactive controls must meet WCAG AA contrast.
- Autoplay has an explicit pause control and is disabled when reduced motion is requested.
- Empty heatmap cells remain disabled.
- All eight language names are written in their native scripts.
