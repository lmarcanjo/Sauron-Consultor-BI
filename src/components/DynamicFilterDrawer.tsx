/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Sliders, X, Check, Eye, EyeOff, Search, Settings, Grid, Tag, Calendar, DollarSign, Filter } from "lucide-react";
import { LancamentoFinanceiro, FiltrosDashboard, ActiveDataSourceType } from "../types";

interface DynamicFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataOrigem: LancamentoFinanceiro[];
  filtros: FiltrosDashboard;
  onChangeFiltros: (novosFiltros: FiltrosDashboard) => void;
  visibleFilters: string[]; // List of keys that are selected to be visible
  onChangeVisibleFilters: (keys: string[]) => void;
  activeDataSource: ActiveDataSourceType;
  actualKeys?: string[];
}

export const DynamicFilterDrawer: React.FC<DynamicFilterDrawerProps> = ({
  isOpen,
  onClose,
  dataOrigem,
  filtros,
  onChangeFiltros,
  visibleFilters,
  onChangeVisibleFilters,
  activeDataSource,
  actualKeys = []
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Detect all unique columns and try to guess their types (string/number/date)
  const columnsInfo = useMemo(() => {
    if (!dataOrigem || dataOrigem.length === 0) return [];

    const keys = new Set<string>();
    dataOrigem.forEach((item) => {
      Object.keys(item).forEach((k) => {
        if (k !== "id") {
          keys.add(k);
        }
      });
    });

    let keysArray = Array.from(keys);

    // Filter columns based on actualKeys if datasource isn't DEMO_DATA to avoid fallback artifacts
    if (activeDataSource !== "DEMO_DATA" && actualKeys.length > 0) {
      const lowerKeys = actualKeys.map(k => k.toLowerCase());
      keysArray = keysArray.filter(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey === "grupo") {
          return ["grupo", "grupo economico", "grupo econômico"].some(v => lowerKeys.includes(v));
        }
        if (lowerKey === "cnpj") {
          return ["cnpj"].some(v => lowerKeys.includes(v));
        }
        if (lowerKey === "marca") {
          return ["marca", "bandeira"].some(v => lowerKeys.includes(v));
        }
        if (lowerKey === "mês") {
          return ["mês", "mes", "competência", "competencia"].some(v => lowerKeys.includes(v));
        }
        if (lowerKey === "razão") {
          return ["razão", "razao"].some(v => lowerKeys.includes(v));
        }
        return lowerKeys.includes(lowerKey);
      });
    }

    return keysArray.map((key) => {
      // Analyze values to detect types
      let nonNullValues = dataOrigem
        .map((d) => d[key])
        .filter((v) => v !== undefined && v !== null && v !== "");
      
      let type: "number" | "date" | "boolean" | "string" = "string";
      let uniqueValuesCount = new Set(nonNullValues).size;
      let emptyCount = dataOrigem.length - nonNullValues.length;
      let sampleVal = nonNullValues[0] !== undefined ? String(nonNullValues[0]) : "N/A";

      if (nonNullValues.length > 0) {
        // Test for number
        const allNums = nonNullValues.every((v) => !isNaN(Number(String(v).replace(/\./g, "").replace(",", "."))));
        if (allNums && typeof nonNullValues[0] === "number") {
          type = "number";
        } else {
          // Check for date formats (simple check)
          const allDates = nonNullValues.every((v) => {
            const str = String(v);
            return /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/.test(str);
          });
          if (allDates) {
            type = "date";
          }
        }
      }

      return {
        name: key,
        type,
        uniqueValuesCount,
        emptyCount,
        sampleVal,
      };
    });
  }, [dataOrigem]);

  // Filter column info based on user search
  const filteredColumns = useMemo(() => {
    return columnsInfo.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [columnsInfo, searchTerm]);

  const toggleFilterVisibility = (colName: string) => {
    if (visibleFilters.includes(colName)) {
      onChangeVisibleFilters(visibleFilters.filter((k) => k !== colName));
    } else {
      onChangeVisibleFilters([...visibleFilters, colName]);
      // Ensure the column is initialized in the active filters if not present
      if (!(colName in filtros)) {
        // Collect all unique values of this column as preselected
        const uniqueValues = Array.from(
          new Set(
            dataOrigem
              .map((d) => (d[colName] !== undefined && d[colName] !== null ? String(d[colName]) : ""))
              .filter((v) => v !== "")
          )
        ).sort();
        onChangeFiltros({
          ...filtros,
          [colName]: uniqueValues,
        });
      }
    }
  };

  const handleToggleSelectAllColumns = () => {
    const defaultCoreKeys = ["Grupo", "CNPJ", "Marca", "Empresa", "Mês", "Razão"];
    const allNames = columnsInfo.map((c) => c.name);
    // If all are visible, reset to core keys. Else make all visible
    if (visibleFilters.length === columnsInfo.length) {
      onChangeVisibleFilters(defaultCoreKeys.filter(k => allNames.includes(k)));
    } else {
      onChangeVisibleFilters(allNames);
    }
  };

  // Get active filters summary
  const appliedFiltersSummary = useMemo(() => {
    return Object.entries(filtros)
      .filter(([key, values]) => {
        // Ignore filters that are empty or have everything selected
        const colVals = Array.from(new Set(dataOrigem.map(d => d[key] !== undefined ? String(d[key]) : ""))).filter(v => v !== "");
        return values && values.length > 0 && values.length < colVals.length;
      })
      .map(([key, values]) => ({
        key,
        count: values.length,
        values: values.slice(0, 3).join(", ") + (values.length > 3 ? "..." : ""),
      }));
  }, [filtros, dataOrigem]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden font-sans">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">Painel de Configuração de Filtros</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Habilite, oculte e configure filtros para qualquer coluna</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Applied filters bar */}
          {appliedFiltersSummary.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900 text-[10px] space-y-1">
              <span className="font-extrabold text-blue-800 dark:text-blue-400 flex items-center gap-1 uppercase">
                <Filter size={10} /> Filtros Ativos e Restritivos ({appliedFiltersSummary.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {appliedFiltersSummary.map((f) => (
                  <div key={f.key} className="bg-blue-100 dark:bg-blue-900/50 text-blue-850 dark:text-blue-300 px-2 py-0.5 rounded font-semibold font-mono flex items-center gap-1 border border-blue-200/40">
                    <span className="font-bold">{f.key}:</span>
                    <span>{f.count} sel. ({f.values})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-850">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar colunas da planilha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs py-2 pl-8 pr-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-105 placeholder-slate-450 focus:outline-none focus:border-blue-500 font-sans font-medium"
              />
              <Search size={13} className="absolute left-3 top-3 text-slate-400" />
              <button
                onClick={handleToggleSelectAllColumns}
                className="absolute right-2.5 top-2 px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-755 text-[9px] font-bold uppercase rounded text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                Inverter Tudo
              </button>
            </div>
          </div>

          {/* Column List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/40">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Colunas Identificadas no Dataset ({filteredColumns.length})</h3>
            
            {filteredColumns.length === 0 ? (
              <div className="py-8 text-center text-slate-450 text-xs font-semibold">
                Nenhuma coluna encontrada para o termo pesquisado.
              </div>
            ) : (
              filteredColumns.map((col) => {
                const isVisible = visibleFilters.includes(col.name);
                let colIcon = <Tag size={12} className="text-slate-400" />;
                if (col.type === "number") colIcon = <DollarSign size={12} className="text-emerald-500" />;
                if (col.type === "date") colIcon = <Calendar size={12} className="text-amber-500" />;

                return (
                  <div 
                    key={col.name} 
                    className={`p-3 rounded-lg border transition-all flex items-start gap-3 bg-white dark:bg-slate-950 ${
                      isVisible 
                        ? "border-blue-500/50 shadow-xs ring-1 ring-blue-500/10" 
                        : "border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-750"
                    }`}
                  >
                    <button 
                      onClick={() => toggleFilterVisibility(col.name)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 mt-0.5 ${
                        isVisible 
                          ? "bg-blue-500 text-white" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      }`}
                      title={isVisible ? "Ocultar este filtro" : "Habilitar como filtro"}
                    >
                      {isVisible ? <Check size={14} strokeWidth={3} /> : <Sliders size={14} />}
                    </button>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 font-mono truncate">
                          {col.name}
                        </span>
                        <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded font-mono ${
                          col.type === "number" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                          col.type === "date" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {col.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 mt-1.5 text-[9px] font-medium text-slate-450 font-mono">
                        <div>Únicos: <span className="font-bold text-slate-700 dark:text-slate-300">{col.uniqueValuesCount}</span></div>
                        <div>Vazios: <span className="font-bold text-slate-700 dark:text-slate-300">{col.emptyCount}</span></div>
                        <div className="col-span-2 mt-0.5 truncate">Exemplo: <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">"{col.sampleVal}"</span></div>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleFilterVisibility(col.name)}
                      className={`text-xs p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer ${
                        isVisible ? "text-blue-500" : "text-slate-400"
                      }`}
                    >
                      {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all cursor-pointer w-full"
            >
              Aplicar e Atualizar Layout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
