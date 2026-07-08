# State Management Guidelines

The Sauron Platform avoids storing core operational state in local UI component scopes (`useState`), preferring centralized, testable core engines and manager singletons.

## Directives

1. **State Isolation**: UI components should strictly render properties and call manager methods.
2. **Deterministic Rules**: Complex business logic must remain in dedicated Engines (DRE models, quality scores, lineage mappings) or Managers (e.g. `consultantWorkspaceManager`, `peopleManager`).
3. **Reactive Binding**: Components can subscribe to changes using our `EventBus` or standard React Hooks bound to the manager singletons.
