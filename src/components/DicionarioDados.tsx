/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Table, CheckCircle2, AlertCircle, Database, HelpCircle, Columns, HelpCircle as HelpIcon, FileSpreadsheet } from "lucide-react";
import { LancamentoFinanceiro, FiltrosDashboard } from "../types";

interface DicionarioDadosProps {
  dataOrigem: LancamentoFinanceiro[];
  filtros: FiltrosDashboard;
  visibleFilters: string[];
  fieldMappings?: Record<string, string>; // Optional mapping configuration
}

export const DicionarioDados: React.FC<DicionarioDadosProps> = ({
  dataOrigem,
  filtros,
  visibleFilters,
  fieldMappings = {},
}) => {
  const dictionary = useMemo(() => {
    if (!dataOrigem || dataOrigem.length === 0) return [];

    const keys = new Set<string>();
    dataOrigem.forEach((item) => {
      Object.keys(item).forEach((k) => {
        if (k !== "id") {
          keys.add(k);
        }
      });
    });

    // Standard fields of Sauron to check mapping matching
    const standardKeys = [
      "Grupo",
      "CNPJ",
      "Marca",
      "Empresa",
      "Mês",
      "Razão",
      "Categoria",
      "Receita",
      "Custo",
      "Despesa",
      "Lucro",
      "Margem",
      "Vendedor"
    ];

    return Array.from(keys).map((key) => {
      // Collect valid values
      const nonNullValues = dataOrigem
        .map((d) => d[key])
        .filter((v) => v !== undefined && v !== null && v !== "");

      const uniqueValuesCount = new Set(nonNullValues).size;
      const emptyCount = dataOrigem.length - nonNullValues.length;
      const sampleVal = nonNullValues[0] !== undefined ? String(nonNullValues[0]) : "N/D";

      // Detect type
      let type = "string";
      if (nonNullValues.length > 0) {
        const allNums = nonNullValues.every((v) => !isNaN(Number(String(v).replace(/\./g, "").replace(",", "."))));
        if (allNums && typeof nonNullValues[0] === "number") {
          type = "number";
        } else {
          const allDates = nonNullValues.every((v) => {
            const str = String(v);
            return /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/.test(str);
          });
          if (allDates) {
            type = "date";
          }
        }
      }

      // Check if used as filter
      const isUsedAsFilter = visibleFilters.includes(key) || (filtros[key] && filtros[key].length > 0);

      // Check if used in reports (common key in standard groupings or selected as a filter/view)
      const isUsedInReports = [
        "Grupo", "CNPJ", "Marca", "Empresa", "Mês", "Razão", "Categoria", "Vendedor"
      ].includes(key) || key.toLowerCase().includes("vendedor") || key.toLowerCase().includes("regiao");

      // Check if mapped to core Sauron column
      const mappedToStandard = standardKeys.includes(key) || Object.values(fieldMappings).includes(key);

      return {
        columnName: key,
        type,
        uniqueCount: uniqueValuesCount,
        emptyCount,
        sample: sampleVal,
        isUsedAsFilter,
        isUsedInReports,
        mappedToStandard,
      };
    });
  }, [dataOrigem, filtros, visibleFilters, fieldMappings]);

  if (!dataOrigem || dataOrigem.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <Database size={24} className="mx-auto text-slate-400 mb-2 animate-bounce" />
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Nenhum dado ativo para listar o Dicionário de Dados.</p>
        <p className="text-slate-400 text-[10px] mt-1">Carregue ou importe planilhas para gerar o dicionário automaticamente.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="text-blue-600 dark:text-blue-400 shrink-0" size={18} />
          <div>
            <h3 className="text-xs font-black uppercase text-slate-805 dark:text-slate-200 tracking-wider">
              Dicionário de Dados Inteligente (Data Dictionary)
            </h3>
            <p className="text-[10px] text-slate-450">
              Mapeamento automático de tipos, nulidades e integridade de todas as colunas carregadas
            </p>
          </div>
        </div>
        <span className="text-[9px] font-black uppercase font-mono px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-lg">
          {dictionary.length} Colunas Detectadas
        </span>
      </div>

      <div className="overflow-x-auto max-h-[350px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-805 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider select-none sticky top-0 bg-opacity-100 z-10">
              <th className="py-2.5 px-3">Nome da Coluna</th>
              <th className="py-2.5 px-3">Tipo Detectado</th>
              <th className="py-2.5 px-3 text-center">Valores Únicos</th>
              <th className="py-2.5 px-3 text-center">Vazios/Nulos</th>
              <th className="py-2.5 px-3">Amostra do Valor</th>
              <th className="py-2.5 px-3 text-center">Como Filtro?</th>
              <th className="py-2.5 px-3 text-center">Em Relatório?</th>
              <th className="py-2.5 px-3 text-center">Mapeado Core?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {dictionary.map((col) => (
              <tr 
                key={col.columnName} 
                className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100">
                  {col.columnName}
                </td>
                <td className="py-2 px-3">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                    col.type === "number" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                    col.type === "date" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                    "bg-slate-100 text-slate-605 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {col.type}
                  </span>
                </td>
                <td className="py-2 px-3 text-center font-mono font-bold">
                  {col.uniqueCount}
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`font-mono font-semibold ${col.emptyCount > 0 ? "text-red-500 font-bold" : "text-slate-400"}`}>
                    {col.emptyCount}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                  "{col.sample}"
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-full w-5 h-5 ${
                    col.isUsedAsFilter 
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600" 
                      : "text-slate-300 dark:text-slate-700"
                  }`}>
                    {col.isUsedAsFilter ? <CheckCircle2 size={13} className="stroke-[3]" /> : <AlertCircle size={13} />}
                  </span>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-full w-5 h-5 ${
                    col.isUsedInReports 
                      ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600" 
                      : "text-slate-300 dark:text-slate-700"
                  }`}>
                    {col.isUsedInReports ? <CheckCircle2 size={13} className="stroke-[3]" /> : <AlertCircle size={13} />}
                  </span>
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`inline-flex items-center justify-center rounded-full w-5 h-5 ${
                    col.mappedToStandard 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" 
                      : "text-slate-300 dark:text-slate-700"
                  }`}>
                    {col.mappedToStandard ? <CheckCircle2 size={13} className="stroke-[3]" /> : <AlertCircle size={13} />}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
