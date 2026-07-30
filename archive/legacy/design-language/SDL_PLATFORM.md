# SDL Platform (Sauron Design Language)

Welcome to the official **Sauron Design Language Platform (SDL)** architectural blueprint. 

The SDL Platform is not merely a styling guide or a static collection of UI guidelines; it is a live, robust engineering layer that ensures design consistency, enterprise accessibility, performance optimization, and seamless integration with our core analytical Engines.

---

## 1. Core Principles

Our design language centers on **Architectural Honesty**, avoiding unnecessary telemetry fluff or larping elements. It aims to deliver a high-productivity workspace tailored specifically to enterprise consulting professionals.

- **Desktop-First Precision**: Interfaces are highly detailed, utilizing dense data views, while remaining fully responsive.
- **Theme Integrity**: Implements high-contrast, professional, accessibility-compliant palettes without relying on unrequested visual modes or presets.
- **Component Sanctity**: Strict separation of concerns between layout/display elements and business rule engines.

---

## 2. Architecture & Directory Mapping

The SDL Platform consists of three major layers:

```
src/
├── design-system/          # Core Styling Foundations
│   ├── tokens/             # Design Tokens (colors, spacing, typography)
│   ├── factory/            # Component Creation Factories & Class Composers
│   └── index.ts            # Entrypoint exposing Theme and core styling helpers
│
├── sauron-sdk/             # Live UI & Domain Component SDK
│   ├── ui/                 # Reusable Base Layout & Form components
│   └── domain/             # Context-aware Domain-specific components
│
└── components/             # High-level Pages and Consultant Workspaces
```

---

## 3. Usage Guidelines

1. **Imports**: Always import UI elements from `@sauron-sdk` or standard layout helpers from our design system.
2. **Class Names**: Minimize custom Tailwind class names in local page layouts. Instead, utilize standard variables from our global Theme and class composers.
3. **Responsive Sizing**: Use container-relative dimensions and robust layout patterns (e.g., Grid, Flex) with touch targets of at least `44px` on mobile.

---

*Document version: 1.1.0*
*Last updated: June 2026*
