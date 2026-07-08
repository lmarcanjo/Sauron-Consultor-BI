# Sauron Platform Architecture Map

The Sauron platform is designed as an Enterprise Consulting Operating System. It separates visual presentation from deterministic business engines and operational lifecycle controllers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
│     App.tsx ──> ExecutiveWorkspace ──> WidgetRenderer (Widgets)          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Consumes / Renders)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DESIGN SYSTEM                                │
│       Tokens, Spacing, Typography, Radius, Animations, Prebuilt Classes │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Uses Decoupled Modules)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            OPERATIONAL CORE                             │
│  WidgetEngine   │  LayoutEngine  │  SearchEngine   │   FeatureFlagEngine│
│  EventBus       │  Persistence   │  PluginSDK      │   PeopleManager    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Architectural Principles
1. **Separation of Concerns**: React components must render only. Business rules live inside specialized Managers, Engines, and Services.
2. **Dynamic UI Rendering**: Dashboard layouts and visual blocks are decoupled into independent **Widgets** registered dynamically.
3. **Decoupled Messaging**: Components communicate via the asynchronous decoupled **EventBus**, allowing feature plugins to hook into domain events cleanly.
4. **Abstract Persistence**: Persistent states are isolated under a unified abstraction, permitting runtime swaps between client-side indexers and cloud backends without front-end modifications.
