# Plugin SDK Architecture

The Plugin SDK allows future system extensions to register advanced features without affecting the core engine codebase.

## Extensions Matrix
Plugins can extend the platform at designated points:
- **Widgets**: Register custom dashboard cards.
- **Menu Items**: Mount navigation triggers.
- **Custom KPIs**: Inject client-specific calculation formulas.
- **Custom Routes**: Register modular pages.

## Blueprint
```typescript
interface SauronPlugin {
  metadata: {
    id: string;
    name: string;
    version: string;
  };
  initialize(): void;
  getExtensions(): ExtensionPointRegistry;
}
```
