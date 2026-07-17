/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { dataSourceManager } from "../../core/data/DataSourceManager";
import { IndexedSpreadsheetStorage } from "../../core/storage/IndexedSpreadsheetStorage";
import { Check, Shuffle, HelpCircle, AlertCircle, Save, Sparkles, Sliders, ChevronDown } from "lucide-react";

import { SpreadsheetColumn } from "../../types/dataSource";
import { PLATFORM_EVENTS, subscribePlatformEvent } from "../../core/events/PlatformEvents";

export const SpreadsheetFieldSelectionPanel: React.FC = () => {
  const [workspace, setWorkspace] = useState(dataSourceManager.getWorkspace());
  const [activeFileId, setActiveFileId] = useState<string>("");
  const [columns, setColumns] = useState<SpreadsheetColumn[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load workspace and active file on mount/update
  useEffect(() => {
    const handleUpdate = () => {
      const ws = dataSourceManager.getWorkspace();
      setWorkspace(ws);
      if (ws.activeFileIds.length > 0 && !activeFileId) {
        setActiveFileId(ws.activeFileIds[0]);
      }
    };

    const unsubscribe = subscribePlatformEvent(PLATFORM_EVENTS.DATA_SOURCE_STATE_CHANGED, handleUpdate);
    handleUpdate();

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync columns when activeFileId or workspace changes
  useEffect(() => {
    const activeFile = workspace.files.find((f) => f.id === activeFileId);
    if (activeFile && activeFile.sheets.length > 0) {
      const sheet = activeFile.sheets[0];
      setColumns(sheet.columns || []);
    } else {
      setColumns([]);
    }
  }, [activeFileId, workspace]);

  if (workspace.activeFileIds.length === 0 || workspace.files.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
        <AlertCircle className="mx-auto text-blue-500 mb-3" size={32} />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma fonte selecionada</h4>
        <p className="text-xs text-slate-400 mt-1">Importe ou selecione uma planilha na aba "Planilhas" para mapear os campos dinâmicos.</p>
      </div>
    );
  }

  const selectedFile = workspace.files.find((f) => f.id === activeFileId) || workspace.files[0];

  const handleFieldChange = (colName: string, fields: Partial<SpreadsheetColumn>) => {
    const updatedColumns = columns.map((col) => {
      if (col.name === colName) {
        return { ...col, ...fields };
      }
      return col;
    });
    setColumns(updatedColumns);

    // Save back to workspace in memory
    if (selectedFile && selectedFile.sheets.length > 0) {
      selectedFile.sheets[0].columns = updatedColumns;
    }
  };

  const handleSuggestMapping = () => {
    // Generate intelligent guesses based on column names (never blocks or forces, only suggests editables)
    const suggested = columns.map((col) => {
      const nameLower = col.name.toLowerCase();
      const aliasLower = (col.alias || "").toLowerCase();
      const searchStr = `${nameLower} ${aliasLower}`;

      let dataType = col.dataType || "text";
      let isFilter = col.isFilter || false;
      let isKPI = col.isKPI || false;
      let isDRE = col.isDRE || false;
      let isPessoas = col.isPessoas || false;
      let isComissao = col.isComissao || false;
      let isApresentacao = col.isApresentacao || false;

      // Type heuristic
      if (searchStr.includes("cnpj") || searchStr.includes("cpf")) {
        dataType = "cnpj";
        isFilter = true;
      } else if (
        searchStr.includes("valor") ||
        searchStr.includes("receita") ||
        searchStr.includes("custo") ||
        searchStr.includes("despesa") ||
        searchStr.includes("venda") ||
        searchStr.includes("comissao") ||
        searchStr.includes("salario") ||
        searchStr.includes("total")
      ) {
        dataType = "number";
      } else if (searchStr.includes("data") || searchStr.includes("mes") || searchStr.includes("periodo") || searchStr.includes("ano")) {
        dataType = "date";
        isFilter = true;
      } else if (searchStr.includes("grupo") || searchStr.includes("empresa") || searchStr.includes("marca") || searchStr.includes("filial") || searchStr.includes("canal") || searchStr.includes("categoria")) {
        dataType = "category";
        isFilter = true;
      }

      // Modules heuristic
      if (searchStr.includes("receita") || searchStr.includes("custo") || searchStr.includes("despesa") || searchStr.includes("dre")) {
        isDRE = true;
        isKPI = true;
      }
      if (searchStr.includes("vendedor") || searchStr.includes("comissao") || searchStr.includes("equipe")) {
        isComissao = true;
      }
      if (searchStr.includes("colaborador") || searchStr.includes("salario") || searchStr.includes("rh") || searchStr.includes("pessoa")) {
        isPessoas = true;
      }
      if (searchStr.includes("apresentacao") || searchStr.includes("slide") || searchStr.includes("executivo")) {
        isApresentacao = true;
      }

      return {
        ...col,
        dataType,
        isFilter,
        isKPI,
        isDRE,
        isPessoas,
        isComissao,
        isApresentacao,
      };
    });

    setColumns(suggested);
    if (selectedFile && selectedFile.sheets.length > 0) {
      selectedFile.sheets[0].columns = suggested;
    }
  };

  const handleSaveProfile = () => {
    dataSourceManager.saveToStorage();
    dataSourceManager.triggerUpdateEvent();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sliders size={20} className="text-blue-500" />
            Configuração de Atributos e Campos
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Defina apelidos, configure tipos de dados e selecione quais módulos do Sauron usarão cada coluna. Não há mapeamento fixo obrigatório.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Active file selector if there are multiple */}
          {workspace.activeFileIds.length > 1 && (
            <div className="relative">
              <select
                value={activeFileId}
                onChange={(e) => setActiveFileId(e.target.value)}
                className="pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl focus:outline-none appearance-none cursor-pointer"
              >
                {workspace.files
                  .filter((f) => workspace.activeFileIds.includes(f.id))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fileName}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 pointer-events-none text-slate-400" size={14} />
            </div>
          )}

          <button
            onClick={handleSuggestMapping}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Shuffle size={14} /> Sugerir Atributos
          </button>

          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Save size={14} /> Salvar Mapeamento
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-bold animate-fade-in">
          <Check size={16} /> Configurações de campos salvas com sucesso no perfil!
        </div>
      )}

      {/* Grid List of Columns */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 select-none">
                <th className="px-4 py-3">Coluna Original</th>
                <th className="px-4 py-3">Nome Amigável (Alias)</th>
                <th className="px-4 py-3">Tipo do Dado</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Filtro?</th>
                <th className="px-4 py-3 text-right pr-6">Módulos Destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {columns.map((col) => {
                const isUnnamed = col.name.startsWith("__EMPTY");
                const label = col.alias || col.name;

                return (
                  <tr
                    key={col.name}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors ${
                      col.ignored ? "opacity-60 bg-slate-50/20 dark:bg-slate-950/5" : ""
                    }`}
                  >
                    {/* Original Name */}
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-350">
                      {col.name}
                      {isUnnamed && (
                        <span className="block text-[9px] text-amber-500 font-sans font-normal mt-0.5">
                          Sem cabeçalho original
                        </span>
                      )}
                    </td>

                    {/* Alias Input */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={col.alias || ""}
                        placeholder={isUnnamed ? "Coluna sem nome" : col.name}
                        onChange={(e) => handleFieldChange(col.name, { alias: e.target.value })}
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 font-medium"
                      />
                    </td>

                    {/* Data Type */}
                    <td className="px-4 py-3">
                      <select
                        value={col.dataType || "text"}
                        onChange={(e) => handleFieldChange(col.name, { dataType: e.target.value })}
                        className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      >
                        <option value="text">Texto</option>
                        <option value="number">Moeda / Valor</option>
                        <option value="date">Data</option>
                        <option value="category">Categoria</option>
                        <option value="cnpj">CNPJ / ID</option>
                      </select>
                    </td>

                    {/* Active/Ignored */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleFieldChange(col.name, { ignored: !col.ignored })}
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg tracking-wider uppercase transition-colors cursor-pointer ${
                          col.ignored
                            ? "bg-amber-100/60 hover:bg-amber-200/60 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            : "bg-emerald-100/60 hover:bg-emerald-200/60 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                        }`}
                      >
                        {col.ignored ? "Inativa" : "Ativa"}
                      </button>
                    </td>

                    {/* Filter Toggle */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={col.isFilter || false}
                        onChange={(e) => handleFieldChange(col.name, { isFilter: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Destination Modules */}
                    <td className="px-4 py-3 text-right pr-6">
                      <div className="flex flex-wrap justify-end gap-1">
                        {[
                          { key: "isKPI", label: "KPI" },
                          { key: "isDRE", label: "DRE" },
                          { key: "isPessoas", label: "RH" },
                          { key: "isComissao", label: "COM" },
                          { key: "isApresentacao", label: "APR" },
                        ].map((mod) => {
                          const isActive = (col as any)[mod.key] === true;
                          return (
                            <button
                              key={mod.key}
                              onClick={() => handleFieldChange(col.name, { [mod.key]: !isActive })}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer ${
                                isActive
                                  ? "bg-blue-600 text-white shadow-sm scale-105"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-500"
                              }`}
                              title={`Mapear para módulo ${mod.label}`}
                            >
                              {mod.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
