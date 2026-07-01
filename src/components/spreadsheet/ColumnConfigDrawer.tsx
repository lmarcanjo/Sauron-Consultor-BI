/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Tag, Eye, EyeOff, Save, ListFilter, PieChart, FileText, Users, Percent, Presentation, BookOpen, Sparkles } from "lucide-react";

import { SpreadsheetColumn } from "../../types/dataSource";

interface ColumnConfigDrawerProps {
  isOpen: boolean;
  column: SpreadsheetColumn | null;
  onClose: () => void;
  onSave: (columnName: string, updatedFields: Partial<SpreadsheetColumn>) => void;
}

export const ColumnConfigDrawer: React.FC<ColumnConfigDrawerProps> = ({
  isOpen,
  column,
  onClose,
  onSave,
}) => {
  const [alias, setAlias] = useState("");
  const [ignored, setIgnored] = useState(false);
  const [dataType, setDataType] = useState("text");
  const [isFilter, setIsFilter] = useState(false);
  const [isKPI, setIsKPI] = useState(false);
  const [isDRE, setIsDRE] = useState(false);
  const [isPessoas, setIsPessoas] = useState(false);
  const [isComissao, setIsComissao] = useState(false);
  const [isApresentacao, setIsApresentacao] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (column) {
      setAlias(column.alias || column.name);
      setIgnored(column.ignored || false);
      setDataType(column.dataType || "text");
      setIsFilter(column.isFilter || false);
      setIsKPI(column.isKPI || false);
      setIsDRE(column.isDRE || false);
      setIsPessoas(column.isPessoas || false);
      setIsComissao(column.isComissao || false);
      setIsApresentacao(column.isApresentacao || false);
      setDescription(column.description || "");
    }
  }, [column, isOpen]);

  if (!isOpen || !column) return null;

  const isUnnamed = column.name.startsWith("__EMPTY");
  const defaultPlaceholder = isUnnamed ? "Coluna sem nome" : column.name;

  const handleSave = () => {
    onSave(column.name, {
      alias: alias.trim() || column.name,
      ignored,
      dataType,
      isFilter,
      isKPI,
      isDRE,
      isPessoas,
      isComissao,
      isApresentacao,
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
              <Tag size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                Configurar Coluna
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {column.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Identity & Alias */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Nome Amigável (Alias)
            </label>
            <input
              type="text"
              value={alias}
              placeholder={defaultPlaceholder}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {isUnnamed && (
              <p className="text-[10px] text-amber-500 flex items-center gap-1">
                <Sparkles size={10} /> Esta coluna veio sem cabeçalho no arquivo original. Defina um nome acima.
              </p>
            )}
          </div>

          {/* Active / Inactive Status */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Status da Coluna no Workspace
            </label>
            <button
              type="button"
              onClick={() => setIgnored(!ignored)}
              className={`w-full flex items-center justify-between p-3 border rounded-xl text-xs transition-colors cursor-pointer ${
                ignored
                  ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <span className="font-bold flex items-center gap-2">
                {ignored ? <EyeOff size={16} /> : <Eye size={16} />}
                {ignored ? "Coluna Ignorada (Inativa)" : "Coluna Ativa"}
              </span>
              <span className="text-[10px] opacity-75">
                {ignored ? "Ignorar nas análises" : "Incluir nas análises"}
              </span>
            </button>
          </div>

          {/* Data Type Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Tipo do Dado
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="text">Texto / Descritivo</option>
              <option value="number">Moeda / Valor Numérico</option>
              <option value="date">Data / Período</option>
              <option value="category">Fator / Categoria</option>
              <option value="cnpj">CNPJ / Identificador</option>
            </select>
          </div>

          {/* Target Modules mapping (Multi-selection checkboxes style) */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Mapeamento de Recursos e Filtros
            </label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/30 dark:bg-slate-950/20 space-y-2">
              
              {/* Filter switch */}
              <label className="flex items-center gap-3 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={isFilter}
                  onChange={(e) => setIsFilter(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <ListFilter size={14} className="text-slate-400" /> Usar como Filtro Dinâmico
                </span>
              </label>

              {/* KPI mapping */}
              <label className="flex items-center gap-3 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={isKPI}
                  onChange={(e) => setIsKPI(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <PieChart size={14} className="text-slate-400" /> Mapear para Painel de KPIs
                </span>
              </label>

              {/* DRE module */}
              <label className="flex items-center gap-3 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={isDRE}
                  onChange={(e) => setIsDRE(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <FileText size={14} className="text-slate-400" /> Mapear para Demonstração de Resultado (DRE)
                </span>
              </label>

              {/* Pessoas Module */}
              <label className="flex items-center gap-3 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={isPessoas}
                  onChange={(e) => setIsPessoas(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Users size={14} className="text-slate-400" /> Mapear para People Intelligence (RH)
                </span>
              </label>

              {/* Comissao module */}
              <label className="flex items-center gap-3 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={isComissao}
                  onChange={(e) => setIsComissao(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Percent size={14} className="text-slate-400" /> Mapear para Comissões de Vendas
                </span>
              </label>

              {/* Apresentacao module */}
              <label className="flex items-center gap-3 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={isApresentacao}
                  onChange={(e) => setIsApresentacao(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <Presentation size={14} className="text-slate-400" /> Mapear para Apresentações Executivas
                </span>
              </label>

            </div>
          </div>

          {/* Column Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Descrição / Notas de Uso
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Armazena o código secundário da unidade contábil para o rateio das despesas administrativas..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2.5 bg-slate-50 dark:bg-slate-950">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Save size={14} /> Aplicar Alterações
          </button>
        </div>

      </div>
    </div>
  );
};
