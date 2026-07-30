# Sauron SDK: Enterprise UI & Domain Component Layer

The **Sauron SDK** is the official implementation layer of the Sauron Design Language (SDL). It provides pre-built, type-safe, performance-optimized, and aesthetically polished React components.

These components are divided into two main categories: **Generic UI Components** (`sauron-sdk/ui`) and **Domain-Specific Components** (`sauron-sdk/domain`).

---

## 1. Generic UI Components (`sauron-sdk/ui`)

Generic UI components are layout, interactive, and formatting primitives that do not possess intrinsic domain business logic. They are fully customizable via props and support our consistent semantic tokens.

* **SauronCard**: Standard rounded container with structural header, action hooks, and elegant borders.
* **SauronButton**: Interactive button supporting multiple intents (`primary`, `secondary`, `destructive`) with robust micro-interactions.
* **SauronBadge**: Pill indicator for category tags, priorities, or status labels.
* **SauronDrawer / SauronDialog**: Seamless overlay wrappers for modals, detail cards, or dynamic forms.
* **SauronTable**: Type-safe paginated or dense tables with built-in empty states and interactive rows.

---

## 2. Domain-Specific Components (`sauron-sdk/domain`)

Domain components are tightly coupled with the Sauron Consulting Platform's logical entities, such as Actions Plans, Meetings, KPIs, and Customer Pulses. They integrate natively with our analytical Engines.

* **SauronActionCard**: Dedicated visualization for `ActionPlan` entities.
* **SauronAgendaItem**: Interactive task list item supporting reordering and visibility flags for executive sessions.
* **SauronMeetingNote**: Clean display format for meeting observation lines, decisions, and outcomes.
* **SauronUserContext**: Identity display bar indicating user roles, permissions, and active case scopes.
* **SauronLineageBadge**: Traceability indicator displaying data source provenance.

---

## 3. Best Practices & Code Sample

When developing a new tab, prefer composing elements from the Sauron SDK rather than recreating raw HTML elements or manually copy-pasting styling utility chains.

```tsx
import React from "react";
import { SauronCard, SauronBadge, SauronButton } from "../sauron-sdk";

export const SampleDashboardSection: React.FC = () => {
  return (
    <SauronCard 
      title="Plano de Ação Corrente" 
      subtitle="Revisão de CMV Logística"
      actions={<SauronBadge variant="high">Urgente</SauronBadge>}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Centralizar compras de insumos para obter desconto comercial em volume de atacado.
        </p>
        <SauronButton variant="primary">Aprovar Medida</SauronButton>
      </div>
    </SauronCard>
  );
};
```

---

*Document version: 1.1.0*
*Last updated: June 2026*
