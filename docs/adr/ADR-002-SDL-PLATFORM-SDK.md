# ADR-002-SDL-PLATFORM-SDK: Sauron Design Language Platform & SDK

## Status
Accepted

## Context
As the Sauron Platform matures from an internal consulting workspace into an enterprise consulting operating platform SaaS product, visual consistency, rapid development, and architecture protection are vital. Having loose styling, magic values, or duplicate components spread across files harms maintainability and speed.

We need a structured, bulletproof design language-as-code platform with strict boundaries, containing fully typed design tokens, customizable Theme Engine, high-performance Motion Engine with timing protections, a Component Factory for safety HOC wrapping, and a complete suite of UI primitives and Domain-specific components.

## Decision
1. **SDL as Code (`src/design-system/tokens/`)**: Created typed design tokens for colors, typography, spacing, radius, shadows, motion, zIndex, and breakpoints to eliminate magic strings and values.
2. **Theme Engine (`src/design-system/theme/`)**: Created a centralized ThemeEngine and ThemeProvider with standard light, dark, and high-contrast templates.
3. **Motion Engine (`src/design-system/motion/`)**: Created central motion preset configurations, limiting animation durations strictly to below 250ms for maximum speed and minimum visual fatigue.
4. **Component Factory (`src/design-system/factory/`)**: Created wrapping factories and class composer builders to enforce aria-busy status, loading states, and disabled behaviors consistently.
5. **Sauron SDK UI Primitives (`src/sauron-sdk/ui/`)**: Implemented 18 polished, responsive, and robust components (Buttons, Cards, Drawers, Dialogs, Tables, Timelines, etc.) with touch targets and high-contrast accessibility.
6. **Sauron SDK Domain Components (`src/sauron-sdk/domain/`)**: Implemented 14 specialized consulting domain layouts (Case Header, Executive Brief, Decision Card, Action Card, Lineage Badge, Data Status, etc.).
7. **SDL Studio (`src/components/SDLStudio.tsx`)**: Created an internal, Super Admin-restricted interactive showcase page to audit, visualize, and explore all components.

## Consequences
- **Positive**: Absolute visual alignment, 10x faster prototyping speed, automatic dark mode compliance, protected focus and touch targets, and robust accessibility standards out of the box.
- **Negative**: Developers must use Sauron SDK components instead of raw HTML elements with custom styles. Any deviation requires approval from the lead architect.
