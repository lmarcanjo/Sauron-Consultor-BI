# Widget Engine Architecture

The Sauron Widget Engine enables the decoupling of operational panels and visual elements into pluggable modules.

## Structures

### 1. `WidgetDefinition`
An interface representing the metadata and component structure of a widget:
```typescript
interface WidgetDefinition {
  id: string;
  title: string;
  category: "analytics" | "operations" | "decisions" | "meta";
  defaultSize: "sm" | "md" | "lg" | "full";
  component: React.ComponentType<{ context: WidgetContext }>;
}
```

### 2. `WidgetRegistry`
A central registry for managing all available widgets inside the platform:
- `registerWidget(definition)`
- `unregisterWidget(id)`
- `getWidget(id)`
- `getAllWidgets()`

## Dynamic Execution
Widgets are self-registering. When their module loads, they register themselves into the central registry. This decouples the presentation workspace layout from the widgets themselves.
