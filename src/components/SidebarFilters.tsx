/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Filter, ChevronDown, ChevronRight, Check, Square, Search, X } from "lucide-react";
import { FiltrosDashboard } from "../types";

interface SidebarFiltersProps {
  available: FiltrosDashboard;
  selected: FiltrosDashboard;
  onChange: (updated: FiltrosDashboard) => void;
  onReset: () => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  available,
  selected,
  onChange,
  onReset
}) => {
  const [openSections, setOpenSections] = useState({
    grupos: true,
    cnpjs: true,
    marcas: true,
    meses: true,
    razoes: true
  });

  const [searchTerms, setSearchTerms] = useState<Record<keyof FiltrosDashboard, string>>({
    grupos: "",
    cnpjs: "",
    marcas: "",
    meses: "",
    razoes: ""
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleToggleItem = (key: keyof FiltrosDashboard, value: string) => {
    const list = selected[key];
    let updated: string[];
    if (list.includes(value)) {
      updated = list.filter(item => item !== value);
    } else {
      updated = [...list, value];
    }
    onChange({ ...selected, [key]: updated });
  };

  const handleSelectAll = (key: keyof FiltrosDashboard) => {
    onChange({ ...selected, [key]: [...available[key]] });
  };

  const handleClearAll = (key: keyof FiltrosDashboard) => {
    onChange({ ...selected, [key]: [] });
  };

  // Helper to render filter group
  const renderFilterCategory = (
    label: string, 
    key: keyof FiltrosDashboard, 
    isOpen: boolean,
    hasSearch = true
  ) => {
    const items = available[key];
    const selItems = selected[key];
    const searchTerm = hasSearch ? searchTerms[key] : "";
    
    // Filter items based on search term (if present)
    const filteredItems = items.filter(item => 
      !searchTerm || String(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="border-b border-slate-800/60 py-2.5 font-sans">
        <button
          onClick={() => toggleSection(isOpen ? key as any : key as any)}
          className="flex items-center justify-between w-full text-left font-bold text-slate-300 text-xs hover:text-blue-400 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            {isOpen ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronRight size={13} className="text-slate-500" />}
            <span className="uppercase tracking-wider text-[10px] text-slate-400">{label}</span>
            <span className="text-[9px] bg-slate-800 text-slate-400 rounded px-1.5 py-0.5 font-semibold font-mono">
              {selItems.length}/{items.length}
            </span>
          </div>
        </button>

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

            {hasSearch && (
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
            )}

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

  return (
    <div className="bg-slate-900 border border-slate-800 shadow-md p-3.5 rounded-xl h-full flex flex-col font-sans text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
          <Filter size={14} className="text-blue-500" />
          <span>Filtros Corporativos</span>
        </div>
        <button
          onClick={onReset}
          className="text-[10px] text-blue-400 font-bold uppercase hover:text-blue-300 transition-colors cursor-pointer"
        >
          Resetar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pt-1 space-y-0.5 custom-scrollbar">
        {renderFilterCategory("Grupo Econômico", "grupos", openSections.grupos)}
        {renderFilterCategory("CNPJs do Grupo", "cnpjs", openSections.cnpjs)}
        {renderFilterCategory("Marcas / Bandeiras", "marcas", openSections.marcas)}
        {renderFilterCategory("Mês de Competência", "meses", openSections.meses)}
        {renderFilterCategory("Razão Contábil (Foco)", "razoes", openSections.razoes, true)}
      </div>
    </div>
  );
};
