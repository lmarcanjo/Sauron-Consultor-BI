# SDL Studio: Sauron Design Language Interactive Sandbox

The **SDL Studio** is an interactive, real-time playground built to inspect, validate, and preview components of the Sauron Design Language and the Sauron SDK.

---

## 1. Role-Based Access Control (RBAC)

Due to its powerful ability to configure lookups, preview themes, and audit component behaviors, **SDL Studio is strictly restricted to users with the "Super Admin" role**.

Any rendering or navigation pathway attempting to mount SDL Studio for other profiles must be blocked at both the sidebar navigation and component layout levels.

---

## 2. Main Capabilities & Sections

### Component Preview
- Visualizes base primitive UI controls (`SauronCard`, `SauronButton`, `SauronBadge`, etc.) across multiple active configurations.
- Demonstrates responsive layouts under varying device simulation presets.

### Token Inspector
- Displays colors, spacing, typography styles, and border-radius presets in a scannable grid.
- Allows real-time verification of Tailwind `@theme` extensions.

### Domain Engine Integrations
- Displays simulation bars for testing context changes, user permissions, and database connections.
- Validates structural layouts of `SauronActionCard`, `SauronAgendaItem`, and `SauronMeetingNote` using mock/live data integration points.

---

## 3. Maintenance Guide

When adding new components to the Sauron SDK, developers **must** add a corresponding preview block inside the `SDLStudio.tsx` component. This ensures that the component remains discoverable, visually documented, and auditable by the product and development teams.

---

*Document version: 1.1.0*
*Last updated: June 2026*
