/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Layers, Database, Search, FileText, Download, BarChart2, Calendar, User, TrendingUp } from "lucide-react";
import { ConsultingModelConfiguration } from "../core/business-intelligence/ConsultingModelRepository";
import { LancamentoFinanceiro } from "../types";

interface CustomAreaTabProps {
  areaId: string;
  activeConfig: ConsultingModelConfiguration | null;
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
}

export const CustomAreaTab: React.FC<CustomAreaTabProps> = ({
  areaId,
  activeConfig,
  dataOrigem,
  formatCurrency
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const area = useMemo(() => {
    if (!activeConfig?.businessAreas) return null;
    return activeConfig.businessAreas.find(a => a.id === areaId);
  }, [activeConfig, areaId]);

  // Determine physical columns for this area
  const columns = useMemo(() => {
    if (!area) return [];
    return area.relatedFields || [];
  }, [area]);

  // Find column display labels from terminology/config
  const getColLabel = (colName: string): string => {
    if (!activeConfig) return colName;
    const fieldConfig = activeConfig.selectedFields[colName];
    if (fieldConfig?.consultantLabel) {
      return fieldConfig.consultantLabel;
    }
    return colName;
  };

  // Helper to check if a column's values are mostly numeric
  const isNumericColumn = (colName: string): boolean => {
    let numericCount = 0;
    let nonNumericCount = 0;
    const sample = dataOrigem.slice(0, 100);
    sample.forEach(row => {
      const val = row[colName as keyof LancamentoFinanceiro];
      if (val !== undefined && val !== null && val !== "") {
        const num = Number(val);
        if (!isNaN(num)) {
          numericCount++;
        } else {
          nonNumericCount++;
        }
      }
    });
    return numericCount > nonNumericCount && numericCount > 0;
  };

  // Calculations for numeric columns
  const numericStats = useMemo(() => {
    const stats: Record<string, { sum: number; avg: number; count: number }> = {};
    columns.forEach(col => {
      if (isNumericColumn(col)) {
        let sum = 0;
        let count = 0;
        dataOrigem.forEach(row => {
          const val = row[col as keyof LancamentoFinanceiro];
          if (val !== undefined && val !== null && val !== "") {
            const num = Number(val);
            if (!isNaN(num)) {
              sum += num;
              count++;
            }
          }
        });
        stats[col] = {
          sum,
          avg: count > 0 ? sum / count : 0,
          count
        };
      }
    });
    return stats;
  }, [columns, dataOrigem]);

  // Filtered rows matching search search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return dataOrigem;
    const term = searchTerm.toLowerCase();
    return dataOrigem.filter(row => {
      return columns.some(col => {
        const val = row[col as keyof LancamentoFinanceiro];
        if (val !== undefined && val !== null) {
          return String(val).toLowerCase().includes(term);
        }
        return false;
      });
    });
  }, [dataOrigem, columns, searchTerm]);

  if (!area) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500 font-sans">
        <Layers size={36} className="text-slate-400 mb-4 animate-bounce" />
        <p className="text-xs font-semibold uppercase tracking-wider">Área não configurada ou inativa</p>
        <p className="text-[10px] text-slate-400 mt-1">Configure esta área no painel para iniciar as análises.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Layers className="text-blue-500 animate-pulse" size={18} />
            <span>{area.name}</span>
          </h2>
          <p className="text-xs text-slate-450 mt-1 max-w-xl">{area.description}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Database size={13} className="text-slate-400" />
          <span className="text-[10px] font-mono text-slate-300 font-extrabold">{dataOrigem.length} registros ativos</span>
        </div>
      </div>

      {/* Stats Cards Row */}
      {Object.keys(numericStats).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(numericStats).map(([colName, stats]) => (
            <div key={colName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <TrendingUp size={48} className="text-blue-500" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider mb-1">
                {getColLabel(colName)} (Total)
              </span>
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">
                {formatCurrency(stats.sum)}
              </h3>
              <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                <span>Média: <strong>{formatCurrency(stats.avg)}</strong></span>
                <span>Registros: <strong>{stats.count}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Records Table and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar nesta área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 font-bold"
            />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 shrink-0 self-center">
            Exibindo {filteredRows.length} de {dataOrigem.length} registros
          </span>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {columns.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-xs font-semibold">Nenhuma coluna associada a esta área.</p>
              <p className="text-[10px] text-slate-400 mt-1">Acesse a aba "Construtor de Áreas" para adicionar colunas.</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-xs font-semibold">Nenhum resultado encontrado.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-450 select-none">
                  {columns.map(col => (
                    <th key={col} className="p-3 font-extrabold">{getColLabel(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    {columns.map(col => {
                      const rawVal = row[col as keyof LancamentoFinanceiro];
                      const isNum = isNumericColumn(col);
                      const formatted = (isNum && rawVal !== undefined) ? formatCurrency(Number(rawVal)) : String(rawVal ?? "-");
                      return (
                        <td key={col} className="p-3 font-medium text-slate-700 dark:text-slate-350">
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredRows.length > 100 && (
          <div className="p-3 bg-slate-55/30 border-t border-slate-100 dark:border-slate-800/80 text-center text-[10px] text-slate-450 font-bold uppercase">
            Exibindo os primeiros 100 registros. Use a busca para filtrar resultados específicos.
          </div>
        )}
      </div>

    </div>
  );
};
export default CustomAreaTab;
