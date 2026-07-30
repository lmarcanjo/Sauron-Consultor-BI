# SDL Component Migration Guide

This guide details the strategy, instructions, and audit requirements for migrating legacy page components with manual Tailwind CSS configurations into cohesive structures backed by the **Sauron SDK**.

---

## 1. Migration Strategy

To protect our system's architecture and avoid breaking features:
1. **Rely on Engines**: Never mix raw business logic or math operations (e.g., `Math.random`) within visual rendering paths.
2. **Standardize Styles**: Replace manual Tailwind containers (e.g., `<div className="bg-white border rounded-2xl p-5 shadow-xs">`) with `<SauronCard>`.
3. **Traceability**: Always wrap data status messages with `<SauronLineageBadge>` to track active sources.

---

## 2. Component Migration Checklist

Below is the status of the migration executed during the **Experience E0.5.1 — SDL Platform Hardening** milestone:

### Fully Migrated & Broken Down
* **CaseHub.tsx**: 
  - Reduced size from 900+ lines to under 350 lines.
  - Giant sections extracted to modular components: `CaseOverview`, `CaseTabs`, `CaseDossierPanel`, `CaseHistoryPanel`, and `CaseDataPanel`.
* **MeetingModePage.tsx**:
  - Reduced size from 1500+ lines to under 450 lines.
  - Modularized into: `ExecutiveSessionStage`, `ExecutiveSessionAgenda`, `ExecutiveSessionRightPanel`, `ExecutiveSessionNotes`, and `ExecutiveSessionSummary`.

### Design Language Alignments (reduced className manual)
* **IdentitySimulationBar.tsx**: Converted to utilize `SauronUserContext` and `SauronBadge`.
* **CommandPalette.tsx**: Standardized text overlays and buttons using the Sauron SDK.
* **PeopleIntelligenceTab.tsx**: Cleaned custom tables and inputs using `SauronTable`.

---

## 3. How to Migrate a Legacy Component (Step-by-Step)

### Legacy Code (Manual HTML + raw classNames):
```tsx
<div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
  <span className="text-sm font-bold text-slate-800">Status do Servidor</span>
  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Ativo</span>
</div>
```

### Compliant SDK Code:
```tsx
import { SauronCard, SauronBadge } from "../sauron-sdk";

<SauronCard title="Status do Servidor">
  <div className="flex justify-between items-center">
    <span className="text-sm text-slate-600 dark:text-slate-300">Conexão Principal</span>
    <SauronBadge variant="success">Ativo</SauronBadge>
  </div>
</SauronCard>
```

---

*Document version: 1.1.0*
*Last updated: June 2026*
