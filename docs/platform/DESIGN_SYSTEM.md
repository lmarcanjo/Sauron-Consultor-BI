# Design System Architecture

The Sauron Design System acts as the single source of truth for branding, tokens, layouts, and components styling across the platform.

## Design Tokens

- **Colors**: Standardized palette referencing corporate slate colors and action states (blue, emerald, amber, rose).
- **Typography**: Inter paired with Space Grotesk/Outfit for display headlines, and JetBrains Mono for financial tables and technical indexes.
- **Elevation**: Shadow presets mapping different layer depths.
- **Radius**: Consistent corner rounding tokens.

## Class Builders
The Design System provides high-fidelity, programmatic tailwind class builders to ensure consistent styling:
- `DesignSystem.Button.build(variant, size)`
- `DesignSystem.Badge.build(type)`
- `DesignSystem.Input.text`
- `DesignSystem.Card.container`
