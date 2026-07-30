# Layout Engine Architecture

The Layout Engine governs how the Sauron Platform organizes visual widgets based on user roles and customization preferences.

## Structures

### 1. `WorkspaceLayout`
Defines the state of enabled widgets and layout configurations:
```typescript
interface WorkspaceLayout {
  id: string;
  name: string;
  role: string;
  enabledWidgets: string[];
  gridConfig: Record<string, { x: number; y: number; w: number; h: number }>;
}
```

## Presets Included
- **Diretoria**: Focused on executive maturity score and high-level decisions.
- **Financeiro**: Focused on margins, ledger, and cash positions.
- **Comercial**: Focused on client pulses and sales trends.
- **Customizado**: Allows users to enable/disable specific widgets dynamically.
