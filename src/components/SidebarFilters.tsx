/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Filter, ChevronDown, ChevronRight, Check, Search, X, Plus, Trash2 } from "lucide-react";
import { FiltrosDashboard, ActiveDataSourceType } from "../types";
import { ClientFilterManager } from "../services/clientFilterManager";

interface SidebarFiltersProps {
  available: FiltrosDashboard;
  selected: FiltrosDashboard;
  onChange: (updated: FiltrosDashboard) => void;
  onReset: () => void;
  activeDataSource: ActiveDataSourceType;
  actualKeys?: string[];
}

const mapColumnToKey = (col: string): string => {
  const c = col.toLowerCase();
  if (c === "grupo") return "grupos";
  if (c === "cnpj") return "cnpjs";
  if (c === "marca") return "marcas";
  if (c === "mês" || c === "mes") return "meses";
  if (c === "razão" || c === "razao") return "razoes";
  return col;
};

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  available,
  selected,
  onChange,
  onReset,
  activeDataSource,
  actualKeys = []
}) => {
  // Listen for filter configuration updates from consultant
  const [, setTick] = useState(0);
  React.useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener("sauron_filters_updated", handleUpdate);
    return () => window.removeEventListener("sauron_filters_updated", handleUpdate);
  }, []);

  // Fully dynamic open sections & search tags matching any filter key
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    grupos: true,
    cnpjs: false,
    marcas: false,
    meses: false,
    razoes: false
  });

  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  
  // Local state to add dynamic column filters directly from the sidebar on the fly
  const [newColName, setNewColName] = useState("");
  const [showQuickCreator, setShowQuickCreator] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleToggleItem = (key: string, value: string) => {
    const list = selected[key] || [];
    let updated: string[];
    if (list.includes(value)) {
      updated = list.filter(item => item !== value);
    } else {
      updated = [...list, value];
    }
    onChange({ ...selected, [key]: updated });
  };

  const handleSelectAll = (key: string) => {
    onChange({ ...selected, [key]: [...(available[key] || [])] });
  };

  const handleClearAll = (key: string) => {
    onChange({ ...selected, [key]: [] });
  };

  const handleAddCustomSidebarFilter = () => {
    if (!newColName) return;
    const cleanKey = newColName.trim();
    // Add via ClientFilterManager to maintain unified state
    ClientFilterManager.addFilter(cleanKey, cleanKey, "multi", "standard");
    setOpenSections(prev => ({ ...prev, [cleanKey]: true }));
    setNewColName("");
    setShowQuickCreator(false);
  };

  const handleRemoveCustomSidebarFilter = (key: string) => {
    ClientFilterManager.removeFilter(key);
    const nextSelected = { ...selected };
    delete nextSelected[key];
    onChange(nextSelected);
  };

  // Helper to render filter group
  const renderFilterCategory = (
    label: string, 
    key: string, 
    isCustom = false
  ) => {
    const items = available[key] || [];
    const selItems = selected[key] || [];
    const isOpen = !!openSections[key];
    const searchTerm = searchTerms[key] || "";
    
    // Filter items based on search term (if present)
    const filteredItems = items.filter(item => 
      !searchTerm || String(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="border-b border-slate-800/60 py-2.5 font-sans" key={key}>
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => toggleSection(key)}
            className="flex items-center gap-1.5 text-left font-bold text-slate-300 text-xs hover:text-blue-400 transition-colors flex-1"
          >
            {isOpen ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronRight size={13} className="text-slate-500" />}
            <span className="uppercase tracking-wider text-[10px] text-slate-400">{label}</span>
            <span className="text-[9px] bg-slate-800 text-slate-405 rounded px-1.5 py-0.5 font-semibold font-mono">
              {selItems.length}/{items.length}
            </span>
          </button>

          {isCustom && (
            <button 
              onClick={() => handleRemoveCustomSidebarFilter(key)}
              title="Excluir este Filtro Livre"
              className="p-1 text-slate-505 hover:text-red-400 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="mt-2 ml-1 px-1.5 border-l border-slate-800 space-y-1.5">
            {/* Direct Select All / Deselect buttons */}
            <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <button 
                onClick={() => handleSelectAll(key)} 
                className="hover:text-blue-400 transition-colors cursor-pointer"
              >
                Selecionar Todos
              </button>
              <span>•</span>
              <button 
                onClick={() => handleClearAll(key)} 
                className="hover:text-rose-400 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>

            <div className="relative my-1.5">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerms(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full text-[11px] py-1 pl-7 pr-6 bg-slate-800 border border-slate-700/60 rounded text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
              />
              <Search size={10} className="absolute left-2.5 top-2 text-slate-500" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerms(prev => ({ ...prev, [key]: "" }))}
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            <div className="max-h-32 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">Nenhum item encontrado</p>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = selItems.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => handleToggleItem(key, item)}
                      className={`flex items-center gap-1.5 w-full text-left py-0.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-700 bg-slate-800"}`}>
                        {isChecked && <Check size={9} className="stroke-[3.5]" />}
                      </div>
                      <span className="truncate text-[11px] font-medium text-slate-300">{item}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const shouldRenderSection = (key: string) => {
    // Map standard category keys back to row properties:
    let rowProperty = key;
    if (key === "grupos") rowProperty = "grupo";
    if (key === "cnpjs") rowProperty = "cnpj";
    if (key === "marcas") rowProperty = "marca";
    if (key === "meses") rowProperty = "mês";
    if (key === "razoes") rowProperty = "razão";
    
    const lowerKeys = actualKeys.map(k => k.toLowerCase());
    if (rowProperty === "grupo") {
      return ["grupo", "grupo economico", "grupo econômico"].some(v => lowerKeys.includes(v));
    }
    if (rowProperty === "cnpj") {
      return ["cnpj"].some(v => lowerKeys.includes(v));
    }
    if (rowProperty === "marca") {
      return ["marca", "bandeira"].some(v => lowerKeys.includes(v));
    }
    if (rowProperty === "mês") {
      return ["mês", "mes", "competência", "competencia"].some(v => lowerKeys.includes(v));
    }
    if (rowProperty === "razão") {
      return ["razão", "razao"].some(v => lowerKeys.includes(v));
    }
    return lowerKeys.includes(rowProperty.toLowerCase());
  };

  const activeConfigs = ClientFilterManager.getActiveFilters();

  return (
    <div className="bg-slate-900 border border-slate-800 shadow-md p-3.5 rounded-xl h-full flex flex-col font-sans text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-850">
        <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
          <Filter size={14} className="text-blue-500" />
          <span>Filtros Corporativos</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickCreator(!showQuickCreator)}
            className="p-1 bg-slate-850 hover:bg-slate-800 rounded transition-colors text-blue-400 hover:text-blue-300"
            title="Adicionar filtro livre a partir de qualquer coluna"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={onReset}
            className="text-[10px] text-blue-400 font-bold uppercase hover:text-blue-300 transition-colors cursor-pointer border border-blue-500/30 px-1.5 py-0.5 rounded bg-blue-500/5"
          >
            Resetar
          </button>
        </div>
      </div>

      {/* Quick dynamic filter creator right inside the Sidebar */}
      {showQuickCreator && (
        <div className="mt-2 p-2 bg-slate-850 rounded border border-slate-750 space-y-2 text-xs">
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-slate-400 block">Nome exato da coluna na Planilha</label>
            <input 
              type="text" 
              placeholder="Ex: Vendedor, etc." 
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono font-bold"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => setShowQuickCreator(false)}
              className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddCustomSidebarFilter}
              className="text-[10px] uppercase font-black text-blue-400 hover:text-blue-350"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-1 space-y-0.5 custom-scrollbar">
        {activeConfigs.map((config) => {
          const key = mapColumnToKey(config.column);
          const label = config.label || config.column;
          if (!shouldRenderSection(key)) return null;
          return renderFilterCategory(
            label, 
            key, 
            !["grupos", "cnpjs", "marcas", "meses", "razoes"].includes(key)
          );
        })}
        {activeConfigs.length === 0 && (
          <p className="text-slate-500 italic text-[11px] text-center pt-8">Nenhum filtro ativo configurado pelo consultor.</p>
        )}
      </div>
    </div>
  );
};
