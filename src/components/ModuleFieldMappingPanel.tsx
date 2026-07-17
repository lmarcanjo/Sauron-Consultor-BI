import React from "react";
import { CheckCircle2, Save, Settings2 } from "lucide-react";
import { ActiveDataset } from "../types/dataSource";
import { getSheetRows, getWorkbookSheets } from "../core/data/businessViews";
import {
  getDefaultProjectId,
  getModuleMapping,
  MODULE_ROLE_DEFINITIONS,
  ModuleFieldMapping,
  ModuleName,
  saveModuleMapping,
} from "../core/data/moduleMapping";

interface ModuleFieldMappingPanelProps {
  moduleName: ModuleName;
  activeDataset: ActiveDataset | null;
  onSaved?: (mapping: ModuleFieldMapping) => void;
  defaultOpen?: boolean;
}

const SHEET_HINTS: Record<ModuleName, string[]> = {
  Financeiro: ["imp_vendas", "rvd", "importacao", "importação", "financeiro"],
  Comercial: ["imp_vendas_at", "imp_vendas", "importacao_detalhada", "importação_detalhada", "vendas"],
  Pessoas: ["imp_vendedores", "cadastros_vendedores", "cadastros_funcionarios", "cadastros_funcionários", "comissao"],
  DRE: ["dre", "rvd", "resultado", "financeiro", "imp_vendas"],
  Comissão: ["comissao", "comissão", "vendedores"],
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function collectColumns(rows: Record<string, unknown>[]): string[] {
  const columns = new Set<string>();
  rows.slice(0, 100).forEach(row => {
    Object.keys(row).forEach(column => {
      if (column !== "__sheetName" && column !== "__sourceRowNumber") columns.add(column);
    });
  });
  return Array.from(columns);
}

function patternMatches(column: string, pattern: string): boolean {
  return normalizeText(column).includes(normalizeText(pattern));
}

function suggestSheet(moduleName: ModuleName, sheets: string[]): string {
  const hints = SHEET_HINTS[moduleName] || [];
  return sheets.find(sheet => hints.some(hint => patternMatches(sheet, hint))) || sheets[0] || "";
}

function inferSemanticRoles(moduleName: ModuleName, columns: string[]): Record<string, string> {
  const roles: Record<string, string> = {};
  const usedColumns = new Set<string>();

  MODULE_ROLE_DEFINITIONS[moduleName].forEach(definition => {
    const column = columns.find(candidate => {
      if (usedColumns.has(candidate)) return false;
      return definition.patterns.some(pattern => patternMatches(candidate, pattern));
    });
    if (column) {
      roles[definition.role] = column;
      usedColumns.add(column);
    }
  });

  return roles;
}

function roleForColumn(semanticRoles: Record<string, string>, column: string): string {
  return Object.entries(semanticRoles).find(([, mappedColumn]) => mappedColumn === column)?.[0] || "";
}

function setRoleForColumn(semanticRoles: Record<string, string>, column: string, role: string): Record<string, string> {
  const next = Object.fromEntries(Object.entries(semanticRoles).filter(([currentRole, mappedColumn]) => (
    currentRole !== role && mappedColumn !== column
  )));
  if (role) next[role] = column;
  return next;
}

export const ModuleFieldMappingPanel: React.FC<ModuleFieldMappingPanelProps> = ({
  moduleName,
  activeDataset,
  onSaved,
  defaultOpen = false,
}) => {
  const sheets = React.useMemo(
    () => Array.from(new Set(getWorkbookSheets().map(sheet => sheet.sheetName))),
    [activeDataset?.datasetId, activeDataset?.importedAt]
  );
  const projectId = getDefaultProjectId(activeDataset);
  const persistedMapping = activeDataset
    ? getModuleMapping(moduleName, activeDataset.datasetId, projectId)
    : null;

  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [selectedSheet, setSelectedSheet] = React.useState("");
  const [availableColumns, setAvailableColumns] = React.useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([]);
  const [semanticRoles, setSemanticRoles] = React.useState<Record<string, string>>({});
  const [loadingColumns, setLoadingColumns] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(persistedMapping?.updatedAt || null);

  React.useEffect(() => {
    if (!activeDataset) return;
    const initialSheet = persistedMapping?.sheetName || suggestSheet(moduleName, sheets);
    setSelectedSheet(initialSheet);
    setSelectedColumns(persistedMapping?.selectedColumns || []);
    setSemanticRoles(persistedMapping?.semanticRoles || {});
    setSavedAt(persistedMapping?.updatedAt || null);
  }, [activeDataset?.datasetId, activeDataset?.importedAt, moduleName, sheets.join("|")]);

  React.useEffect(() => {
    let isMounted = true;

    async function loadColumns() {
      if (!selectedSheet) {
        setAvailableColumns([]);
        return;
      }

      setLoadingColumns(true);
      const rows = await getSheetRows(selectedSheet, 200);
      if (!isMounted) return;

      const columns = collectColumns(rows);
      const mappingAppliesToSheet = persistedMapping?.sheetName === selectedSheet;
      const inferredRoles = inferSemanticRoles(moduleName, columns);
      const inferredColumns = Object.values(inferredRoles);

      setAvailableColumns(columns);
      setSelectedColumns(mappingAppliesToSheet && persistedMapping
        ? persistedMapping.selectedColumns.filter(column => columns.includes(column))
        : inferredColumns.slice(0, 12)
      );
      setSemanticRoles(mappingAppliesToSheet && persistedMapping ? persistedMapping.semanticRoles : inferredRoles);
      setLoadingColumns(false);
    }

    loadColumns();
    return () => {
      isMounted = false;
    };
  }, [selectedSheet, moduleName]);

  if (!activeDataset) return null;

  const roleDefinitions = MODULE_ROLE_DEFINITIONS[moduleName];
  const canSave = Boolean(selectedSheet) && selectedColumns.length > 0;

  const toggleColumn = (column: string) => {
    setSelectedColumns(current => {
      if (current.includes(column)) {
        setSemanticRoles(roles => Object.fromEntries(Object.entries(roles).filter(([, mappedColumn]) => mappedColumn !== column)));
        return current.filter(item => item !== column);
      }
      return [...current, column];
    });
  };

  const handleSave = () => {
    if (!canSave) return;

    const mapping = saveModuleMapping({
      projectId,
      datasetId: activeDataset.datasetId,
      moduleName,
      sheetName: selectedSheet,
      selectedColumns,
      semanticRoles,
    });
    setSavedAt(mapping.updatedAt);
    setIsOpen(false);
    onSaved?.(mapping);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Encontramos estas informações</h4>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {savedAt ? `Informações confirmadas em ${new Date(savedAt).toLocaleString("pt-BR")}` : "Confirme a sugestão ou edite somente o que não estiver correto."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(current => !current)}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-black uppercase text-slate-700 dark:text-slate-200 hover:border-blue-400"
        >
          <Settings2 size={14} />
          <span>Editar informações</span>
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Em qual aba estão as informações?</label>
            <select
              value={selectedSheet}
              onChange={(event) => setSelectedSheet(event.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
            >
              {sheets.map(sheet => (
                <option key={sheet} value={sheet}>{sheet}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="block text-[10px] font-black uppercase text-slate-500">Informações encontradas</label>
              {loadingColumns && <span className="text-[10px] font-bold text-slate-400">Lendo os primeiros registros...</span>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-[360px] overflow-auto pr-1">
              {availableColumns.map(column => {
                const checked = selectedColumns.includes(column);
                return (
                  <div key={column} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
                    <label className="flex items-start gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColumn(column)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1 break-words">{column}</span>
                    </label>
                    {checked && (
                      <select
                        value={roleForColumn(semanticRoles, column)}
                        onChange={(event) => setSemanticRoles(current => setRoleForColumn(current, column, event.target.value))}
                        className="mt-2 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                      >
                        <option value="">Usar apenas nesta área</option>
                        {roleDefinitions.map(role => (
                          <option key={role.role} value={role.role}>{role.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {availableColumns.length === 0 && !loadingColumns && (
              <p className="text-xs font-semibold text-slate-500">Nenhuma coluna encontrada na prévia desta aba.</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {selectedColumns.length} informação(ões) selecionada(s). A planilha original não é alterada.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-[11px] font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savedAt ? <CheckCircle2 size={14} /> : <Save size={14} />}
              <span>Confirmar informações</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
