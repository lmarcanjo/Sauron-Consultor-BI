# Sauron OS: Token System

The **Token System** acts as the single source of truth for all visual values inside the Sauron Operating Platform, including color, spacing, borders, shadows, and typography styles.

---

## 1. Typography Hierarchy

Sauron pairs two distinct font families to convey a technical yet professional consulting atmosphere:

- **Display & Headings**: `"Inter"`, `"Outfit"`, or system sans-serif. Used for prominent headers, case selectors, and executive card titles. It features tight letter tracking (`tracking-tight`) and strong weights (`font-black`, `font-extrabold`).
- **Data & Mono Accents**: `"JetBrains Mono"`, `"Fira Code"`, or system monospace. Used for database tables, financial cells, CNPJs, timestamps, audit logs, and technical status tags.

---

## 2. Color Tokens

The visual theme is dominated by soft, high-contrast off-whites and deep charcoal slates. It maintains eye-safety and accessibility (WCAG AA compliant contrast ratio).

| Token Category | Variable Name | Default Value (Light) | Default Value (Dark) |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `bg-canvas` | `#f8fafc` | `#020617` |
| **Surface (Card)** | `bg-surface` | `#ffffff` | `#0f172a` |
| **Borders** | `border-dim` | `#e2e8f0` | `#1e293b` |
| **Primary Accent** | `color-primary` | `#2563eb` (Blue) | `#3b82f6` (Blue) |
| **Success Indicator** | `color-success`| `#10b981` (Green) | `#34d399` (Green) |
| **Warning Indicator** | `color-warning`| `#f59e0b` (Amber) | `#fbbf24` (Amber) |
| **Danger Indicator** | `color-danger` | `#ef4444` (Red) | `#f87171` (Red) |

---

## 3. Spacing & Density Scales

Consulting dashboards require high information density. However, readability must be protected via deliberate rhythm variations.

- **Extreme Compactness**: `p-1.5`, `py-1`, `px-2` — Used for table cells, inline status badges, and sub-headings.
- **Card Padding**: `p-5`, `p-6` — The standard layout padding for widgets, lists, and form inputs.
- **Section Spacing**: `space-y-6`, `gap-6` — Standard gaps between primary grid layouts.

---

*Document version: 1.1.0*
*Last updated: June 2026*
