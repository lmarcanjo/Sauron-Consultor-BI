/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, FileSpreadsheet, Settings, Filter, Check, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(0);

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

  // Reset page when search or sheet changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, activeSheet, pageSize]);

  // Pagination bounds
  const totalRecords = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageSafe = Math.min(currentPage, pageCount - 1);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = currentPageSafe * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPageSafe, pageSize]);

  // Virtualization Setup
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 450;
  const containerRef = useRef<HTMLDivElement>(null);
  
  const rowHeight = 36; // px
  const buffer = 8;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
  const endIndex = Math.min(paginatedRows.length, Math.ceil((scrollTop + containerHeight) / rowHeight) + buffer);

  const visibleRows = paginatedRows.slice(startIndex, endIndex);
  const paddingTop = startIndex * rowHeight;
  const paddingBottom = (paginatedRows.length - endIndex) * rowHeight;

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
      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-sm"
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

      {/* Main Grid View - Virtualized and Scrollable */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto relative" 
        data-testid="spreadsheet-grid"
        style={{ height: "450px" }}
      >
        <table className="w-full border-collapse text-left text-xs font-sans table-fixed min-w-max">
          {/* Header */}
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-sm">
            <tr>
              {/* Row index header */}
              <th className="w-16 bg-slate-200 dark:bg-slate-700 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 select-none py-2 sticky left-0 z-20">
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
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="p-12 text-center text-slate-400 dark:text-slate-600 italic bg-white dark:bg-slate-950"
                >
                  Nenhum dado encontrado para os critérios de busca atuais.
                </td>
              </tr>
            ) : (
              <>
                {/* Virtual Top Spacer */}
                {paddingTop > 0 && (
                  <tr style={{ height: `${paddingTop}px` }}>
                    <td colSpan={columns.length + 1} style={{ padding: 0, height: `${paddingTop}px` }} />
                  </tr>
                )}

                {/* Visible Rows */}
                {visibleRows.map((row, idx) => {
                  const absoluteIndex = startIndex + idx;
                  const rowNum = currentPageSafe * pageSize + absoluteIndex + 1;
                  return (
                    <tr
                      key={absoluteIndex}
                      data-testid="spreadsheet-row"
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      style={{ height: `${rowHeight}px` }}
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
                })}

                {/* Virtual Bottom Spacer */}
                {paddingBottom > 0 && (
                  <tr style={{ height: `${paddingBottom}px` }}>
                    <td colSpan={columns.length + 1} style={{ padding: 0, height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer Controls */}
      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs text-slate-500 select-none">
        {/* Left: Records and sizing */}
        <div className="flex items-center gap-4">
          <div>
            Mostrando <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(totalRecords, (currentPageSafe * pageSize) + 1)}-{Math.min(totalRecords, (currentPageSafe + 1) * pageSize)}</span> de{" "}
            <span className="font-bold text-slate-700 dark:text-slate-300">{totalRecords}</span> registros
          </div>
          <div className="flex items-center gap-1.5">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
            >
              <option value={100}>100 linhas</option>
              <option value={500}>500 linhas</option>
              <option value={1000}>1000 linhas</option>
            </select>
          </div>
        </div>

        {/* Right: Pagination buttons */}
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPageSafe === 0}
              className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Página Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-xs">
              Pág <span className="font-bold text-slate-700 dark:text-slate-300">{currentPageSafe + 1}</span> de <span className="font-bold">{pageCount}</span>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPageSafe === pageCount - 1}
              className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Próxima Página"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
