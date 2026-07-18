# Consulting Model Configuration Contract

**Status:** Aprovado  
**Escopo:** Workspace / Empresa  

Este documento especifica o contrato técnico de persistência e a lógica de resolução de nomenclaturas do Construtor de Modelo de Consultoria no Sauron.

---

## 1. Contrato da Configuração

A configuração é persistida no IndexedDB com o prefixo `sauron_consulting_model_{workspaceId}_{companyId}` usando o seguinte esquema:

```typescript
export interface SelectedFieldConfig {
  fieldId: string;
  physicalName: string;
  sheetName: string;
  detectedType: string;
  interpretation?: string;
  confidence?: number;
  use: "compare_values" | "group_results" | "filter_analyses" | "show_indicator" | "show_tables" | "auxiliary_detail" | "do_not_use";
  displayLabel: string;
  consultantLabel?: string;
  visible: boolean;
}

export interface BusinessAreaConfig {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  relatedFields: string[];
  relatedMetrics: string[];
  order: number;
  visible: boolean;
}

export interface CustomMetricConfig {
  id: string;
  name: string;
  fieldId: string;
  operation: "sum" | "average" | "count" | "distinct_count" | "min" | "max" | "percentage" | "difference";
  groupBy?: string;
  format: "currency" | "number" | "percentage";
  visibleIn: string[];
}

export interface ConsultingModelConfiguration {
  workspaceId: string;
  groupId: string;
  companyId?: string;
  enabledModules: string[];
  businessAreas: BusinessAreaConfig[];
  selectedFields: Record<string, SelectedFieldConfig>;
  customMetrics: CustomMetricConfig[];
  displayDictionary: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Ordem de Resolução de Nomes Visíveis (Labels)

A nomenclatura apresentada ao usuário final segue a seguinte ordem de prioridade decrescente:

1. `consultantLabel` (definido manualmente pelo consultor).
2. `displayLabel` (sugestão cognitiva do sistema confirmada pelo consultor).
3. `physicalName` (nome original da coluna na planilha).
4. Termo amigável neutro.
