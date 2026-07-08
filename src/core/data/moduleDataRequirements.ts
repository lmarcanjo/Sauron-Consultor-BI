import { ActiveDataset } from "../../types/dataSource";
import { activeDatasetStore } from "./ActiveDatasetStore";

export type ModuleKey = "dre" | "people" | "commercial" | "financial";

export interface ModuleRequirementResult {
  module: ModuleKey;
  requiredColumns: string[];
  detectedColumns: string[];
  missingColumns: string[];
  mapped: boolean;
  rows: Record<string, any>[];
}

const REQUIRED_PATTERNS: Record<ModuleKey, RegExp[]> = {
  dre: [/receita|venda|valor/i, /custo|despesa|imposto|margem/i, /data|mes|m[eê]s|periodo/i],
  people: [/vendedor|funcion[aá]rio|colaborador|mecanico|mec[aâ]nico|nome/i],
  commercial: [/produto|pe[cç]a|marca|venda|cliente|vendedor|departamento|depto/i],
  financial: [/valor|venda|receita|custo|despesa|imposto|margem|data/i],
};

export const MODULE_REQUIRED_COLUMNS: Record<ModuleKey, string[]> = {
  dre: ["receita/venda/valor", "custo/despesa/imposto/margem", "data/período"],
  people: ["vendedor/funcionário/colaborador/nome"],
  commercial: ["produto/peça/marca/venda/cliente/vendedor/departamento"],
  financial: ["valor/venda/receita", "custo/despesa/imposto/margem", "data"],
};

export function getActiveDatasetRows(dataset: ActiveDataset | null = activeDatasetStore.getActiveDataset()) {
  if (!dataset) return [];
  const rows = activeDatasetStore.getActiveRows();
  if (rows.length > 0) return rows as Record<string, any>[];
  return dataset.previewRows.map(row => row.raw);
}

export function getDetectedColumns(rows: Record<string, any>[]) {
  const columns = new Set<string>();
  rows.slice(0, 100).forEach(row => {
    Object.keys(row).forEach(key => {
      if (!key.startsWith("__")) columns.add(key);
    });
  });
  return Array.from(columns);
}

export function evaluateModuleRequirements(module: ModuleKey, dataset: ActiveDataset | null = activeDatasetStore.getActiveDataset()): ModuleRequirementResult {
  const rows = getActiveDatasetRows(dataset);
  const detectedColumns = getDetectedColumns(rows);
  const patterns = REQUIRED_PATTERNS[module];
  const missingColumns = MODULE_REQUIRED_COLUMNS[module].filter((_, index) => {
    const pattern = patterns[Math.min(index, patterns.length - 1)];
    return !detectedColumns.some(column => pattern.test(column));
  });

  return {
    module,
    requiredColumns: MODULE_REQUIRED_COLUMNS[module],
    detectedColumns,
    missingColumns,
    mapped: missingColumns.length === 0,
    rows,
  };
}

export function findFirstColumn(columns: string[], patterns: RegExp[]) {
  return columns.find(column => patterns.some(pattern => pattern.test(column)));
}
