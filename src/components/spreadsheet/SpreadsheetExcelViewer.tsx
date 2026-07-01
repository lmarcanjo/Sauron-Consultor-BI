/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Search, FileSpreadsheet, Settings, Filter, Check, ShieldAlert } from "lucide-react";

import { SpreadsheetColumn, SpreadsheetSheet } from "../../types/dataSource";

interface SpreadsheetExcelViewerProps {
  sheets: SpreadsheetSheet[];
  activeSheet: string;
  onSelectSheet?: (sheetName: string) => void;
  columnProfiles?: Record<string, SpreadsheetColumn>;
  onSelectColumn: (columnName: string) => void;
  onRenameColumn: (columnName: string, newAlias: string) => void;
  onToggleColumnUsage: (columnName: string, ignored: boolean) => void;
  onToggleFilter: (columnName: string, isFilter: boolean) => void;
  onSaveProfile?: () => void;
}

export const SpreadsheetExcelViewer: React.FC<SpreadsheetExcelViewerProps> = ({
  sheets,
  activeSheet,
  onSelectSheet,
  columnProfiles = {},
  onSelectColumn,
  onRenameColumn,
  onToggleColumnUsage,
  onToggleFilter,
  onSaveProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const currentSheet = useMemo(() => {
    return sheets.find((s) => s.sheetName === activeSheet) || sheets[0];
  }, [sheets, activeSheet]);

  const columns = useMemo(() => {
    if (!currentSheet) return [];
    return currentSheet.columns || [];
  }, [currentSheet]);

  const rows = useMemo(() => {
    if (!currentSheet) return [];
    return currentSheet.rows || [];
  }, [currentSheet]);

  // Handle local searching of row values
  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const lower = searchTerm.toLowerCase();
    return rows.filter((row) => {
      return Object.values(row).some((val) =>
        String(val || "").toLowerCase().includes(lower)
      );
    });
  }, [rows, searchTerm]);

  if (!currentSheet) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
        <ShieldAlert className="mx-auto text-amber-500 mb-3" size={32} />
        <p className="text-sm font-semibold">Nenhuma aba disponível para visualização.</p>
      </div>
    );
  }

  // Helper to get formatted column name (alias or "__EMPTY" handle)
  const getColLabel = (colName: string) => {
    const profile = columnProfiles[colName] || columns.find(c => c.name === colName);
    const alias = profile?.alias || colName;
    if (alias.startsWith("__EMPTY")) {
      return "Coluna sem nome";
    }
    return alias;
  };

  const getColNameSub = (colName: string) => {
    if (colName.startsWith("__EMPTY")) {
      return colName;
    }
    return null;
  };

  return (
    <div
      id="spreadsheet-viewer-container"
      data-testid="spreadsheet-viewer"
      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-sm"
    >
      {/* Search and Metadata Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 p-2 rounded-xl">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Grade Interativa de Dados
              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full font-mono">
                {rows.length} linhas x {columns.length} colunas
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Clique em qualquer cabeçalho para renomear colunas, marcar como filtros ou mapear módulos.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar nesta grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {onSaveProfile && (
            <button
              onClick={onSaveProfile}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Check size={14} /> Salvar Perfil
            </button>
          )}
        </div>
      </div>

      {/* Sheet Tabs */}
      {sheets.length > 1 && (
        <div
          data-testid="spreadsheet-sheet-tabs"
          className="flex bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 overflow-x-auto gap-1"
        >
          {sheets.map((s) => {
            const isActive = s.sheetName === activeSheet;
            return (
              <button
                key={s.sheetName}
                onClick={() => onSelectSheet && onSelectSheet(s.sheetName)}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-950 font-black"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {s.sheetName}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Grid View */}
      <div className="flex-1 overflow-auto relative" data-testid="spreadsheet-grid">
        <table className="w-full border-collapse text-left text-xs font-sans table-fixed min-w-max">
          {/* Header */}
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-sm">
            <tr>
              {/* Row index header */}
              <th className="w-12 bg-slate-200 dark:bg-slate-700 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 select-none py-2 sticky left-0 z-20">
                #
              </th>
              {columns.map((col) => {
                const profile = columnProfiles[col.name] || col;
                const isIgnored = profile?.ignored;
                const isFilter = profile?.isFilter;
                const label = getColLabel(col.name);
                const sub = getColNameSub(col.name);

                return (
                  <th
                    key={col.name}
                    data-testid="spreadsheet-column-header"
                    onClick={() => onSelectColumn(col.name)}
                    className={`group cursor-pointer border border-slate-300 dark:border-slate-600 px-3 py-2.5 transition-all text-[11px] font-bold relative min-w-[150px] select-none ${
                      isIgnored
                        ? "bg-slate-100/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 line-through"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="truncate flex flex-col">
                        <span className="truncate flex items-center gap-1">
                          {label}
                          {isFilter && (
                            <Filter size={10} className="text-blue-500 flex-shrink-0" />
                          )}
                        </span>
                        {sub && (
                          <span className="text-[9px] text-slate-400 font-mono font-normal tracking-tight">
                            {sub}
                          </span>
                        )}
                      </div>
                      <Settings
                        size={12}
                        className="text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0"
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="p-12 text-center text-slate-400 dark:text-slate-600 italic bg-white dark:bg-slate-950"
                >
                  Nenhum dado encontrado para os critérios de busca atuais.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => {
                const rowNum = idx + 1;
                return (
                  <tr
                    key={idx}
                    data-testid="spreadsheet-row"
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Index Column */}
                    <td className="sticky left-0 bg-slate-100 dark:bg-slate-800 text-center font-mono font-bold text-[10px] text-slate-500 border border-slate-200 dark:border-slate-700 py-1.5 select-none z-10 shadow-sm">
                      {rowNum}
                    </td>

                    {/* Data Cells */}
                    {columns.map((col) => {
                      const val = row[col.name];
                      const profile = columnProfiles[col.name] || col;
                      const isIgnored = profile?.ignored;

                      return (
                        <td
                          key={col.name}
                          data-testid="spreadsheet-cell"
                          className={`border border-slate-200 dark:border-slate-800 px-3 py-1.5 font-mono text-[11px] truncate ${
                            isIgnored
                              ? "text-slate-350 dark:text-slate-700 bg-slate-50/30 dark:bg-slate-900/10 italic"
                              : "text-slate-650 dark:text-slate-350 bg-white dark:bg-slate-950"
                          }`}
                          title={String(val !== undefined && val !== null ? val : "")}
                        >
                          {val !== undefined && val !== null ? String(val) : ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer statistics */}
      <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 select-none">
        <div>
          Mostrando <span className="font-bold text-slate-600 dark:text-slate-300">{filteredRows.length}</span> de{" "}
          <span className="font-bold text-slate-600 dark:text-slate-300">{rows.length}</span> linhas
        </div>
        <div className="font-mono">
          Pressione nos títulos das colunas para configurar seus perfis individuais de análise.
        </div>
      </div>
    </div>
  );
};
