import React, { useState, useMemo } from "react";
import {
  Calculator,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Search,
  Layers,
  Briefcase,
  Factory,
  Tractor,
  Car,
} from "lucide-react";
import { LancamentoFinanceiro } from "../types";
import { availableTemplates } from "../utils/industryTemplates";

interface IntelligentDRETabProps {
  filteredData: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
  activeIndustryTemplateId: string;
}

export const IntelligentDRETab: React.FC<IntelligentDRETabProps> = ({
  filteredData,
  formatCurrency,
  activeIndustryTemplateId,
}) => {
  const [drillDownLevel, setDrillDownLevel] = useState<
    "grupo" | "empresa" | "conta" | "detalhe"
  >("grupo");
  const [drillDownFilter, setDrillDownFilter] = useState<string>("");

  const activeTemplate = useMemo(() => {
    return (
      availableTemplates.find((t) => t.id === activeIndustryTemplateId) ||
      availableTemplates[0]
    );
  }, [activeIndustryTemplateId]);

  // Motor Inteligente DRE - Automatically trying to categorize Receitas, Despesas, Custos based on standard names
  const dreData = useMemo(() => {
    let receitaBruta = 0;
    let deducoes = 0;
    let custosOperacionais = 0;
    let despesasOperacionais = 0;
    let despesasFinanceiras = 0;
    let receitasFinanceiras = 0;
    let impostos = 0;

    const contasList: Record<string, { total: number; type: string }> = {};

    filteredData.forEach((item) => {
      // Intelligently infer based on "Categoria" or "Razão", falling back to the Receita/Despesa fields
      const cat = (item.Categoria || "").toLowerCase();
      const razao = (item.Razão || "").toLowerCase();
      const val =
        (item.Receita || 0) - ((item.Despesa || 0) + (item.Custo || 0)) ||
        item.Valor ||
        0;

      // Simple heuristic for DRE Engine
      let accType = "Outros";
      if (
        cat.includes("venda") ||
        cat.includes("receita") ||
        razao.includes("receita operacional")
      ) {
        receitaBruta += item.Receita || val;
        accType = "Receita Bruta";
      } else if (cat.includes("deduç") || cat.includes("imposto sobre venda")) {
        deducoes += item.Despesa || Math.abs(val);
        accType = "Deduções/Impostos";
      } else if (
        cat.includes("custo") ||
        razao.includes("cmv") ||
        razao.includes("cpv")
      ) {
        custosOperacionais += item.Custo || Math.abs(val);
        accType = "Custos Operacionais";
      } else if (cat.includes("financeir") && (item.Despesa || val < 0)) {
        despesasFinanceiras += item.Despesa || Math.abs(val);
        accType = "Despesas Financeiras";
      } else if (cat.includes("financeir") && (item.Receita || val > 0)) {
        receitasFinanceiras += item.Receita || val;
        accType = "Receitas Financeiras";
      } else if (cat.includes("imposto de renda") || cat.includes("csll")) {
        impostos += item.Despesa || Math.abs(val);
        accType = "IR/CSLL";
      } else {
        despesasOperacionais += item.Despesa || Math.abs(val);
        accType = "Despesas Operacionais";
      }

      const contaId = item.ContaContabil || item.Razão || "Sem Conta";
      if (!contasList[contaId])
        contasList[contaId] = { total: 0, type: accType };
      contasList[contaId].total += Math.abs(
        item.Receita ? item.Receita : item.Despesa || item.Custo || val,
      );
    });

    const receitaLiquida = receitaBruta - deducoes;
    const lucroBruto = receitaLiquida - custosOperacionais;
    const ebitda = lucroBruto - despesasOperacionais; // simplify for now, generally ebitda adds back depreciation
    const resultadoOperacional =
      ebitda + receitasFinanceiras - despesasFinanceiras;
    const lucroLiquido = resultadoOperacional - impostos;

    return {
      receitaBruta,
      deducoes,
      receitaLiquida,
      custosOperacionais,
      lucroBruto,
      despesasOperacionais,
      ebitda,
      receitasFinanceiras,
      despesasFinanceiras,
      resultadoOperacional,
      impostos,
      lucroLiquido,
      contasList,
    };
  }, [filteredData]);

  const IconMap: any = {
    automotive: Car,
    agro: Tractor,
    services: Briefcase,
    industry: Factory,
  };
  const SegmentIcon = IconMap[activeIndustryTemplateId] || Layers;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <SegmentIcon size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            DRE Inteligente
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {activeTemplate.name}
            </span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Classificação Automática Assistida por IA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-xs">
                Demonstrativo de Resultados
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody>
                  {/* Receitas */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                      Receita Bruta de Vendas/Serviços
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(dreData.receitaBruta)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      100.0%
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400 pl-6">
                      (-) Deduções e Impostos S/ Vendas
                    </td>
                    <td className="p-3 text-right text-rose-600 dark:text-rose-400">
                      -{formatCurrency(dreData.deducoes)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      {dreData.receitaBruta
                        ? (
                            (dreData.deducoes / dreData.receitaBruta) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      (=) Receita Operacional Líquida
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(dreData.receitaLiquida)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      {dreData.receitaBruta
                        ? (
                            (dreData.receitaLiquida / dreData.receitaBruta) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>

                  {/* Custos e Lucro Bruto */}
                  <tr className="border-b border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400 pl-6">
                      (-) Custos Operacionais (CPV/CMV/CSV)
                    </td>
                    <td className="p-3 text-right text-rose-600 dark:text-rose-400">
                      -{formatCurrency(dreData.custosOperacionais)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      {dreData.receitaLiquida
                        ? (
                            (dreData.custosOperacionais /
                              dreData.receitaLiquida) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      (=) Lucro Bruto
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(dreData.lucroBruto)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      {dreData.receitaLiquida
                        ? (
                            (dreData.lucroBruto / dreData.receitaLiquida) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>

                  {/* Despesas */}
                  <tr className="border-b border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400 pl-6">
                      (-) Despesas Operacionais (SG&A)
                    </td>
                    <td className="p-3 text-right text-rose-600 dark:text-rose-400">
                      -{formatCurrency(dreData.despesasOperacionais)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      {dreData.receitaLiquida
                        ? (
                            (dreData.despesasOperacionais /
                              dreData.receitaLiquida) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      (=) EBITDA Estimado
                    </td>
                    <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(dreData.ebitda)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      {dreData.receitaLiquida
                        ? (
                            (dreData.ebitda / dreData.receitaLiquida) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>

                  {/* Financeiro */}
                  <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400 pl-6">
                      (+) Receitas Financeiras
                    </td>
                    <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(dreData.receitasFinanceiras)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      -
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400 pl-6">
                      (-) Despesas Financeiras
                    </td>
                    <td className="p-3 text-right text-rose-600 dark:text-rose-400">
                      -{formatCurrency(dreData.despesasFinanceiras)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      -
                    </td>
                  </tr>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      (=) Resultado Antes IR/CSLL
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(dreData.resultadoOperacional)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      {dreData.receitaLiquida
                        ? (
                            (dreData.resultadoOperacional /
                              dreData.receitaLiquida) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>

                  {/* Final Net Income */}
                  <tr className="border-b border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400 pl-6">
                      (-) Provisão IR / CSLL
                    </td>
                    <td className="p-3 text-right text-rose-600 dark:text-rose-400">
                      -{formatCurrency(dreData.impostos)}
                    </td>
                    <td className="p-3 text-right text-slate-400 text-xs text-center">
                      -
                    </td>
                  </tr>
                  <tr className="bg-slate-800 dark:bg-slate-850 text-white">
                    <td className="p-4 font-bold text-sm uppercase tracking-wide">
                      (=) Lucro Líquido do Exercício
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400 text-base">
                      {formatCurrency(dreData.lucroLiquido)}
                    </td>
                    <td className="p-4 text-right text-slate-300 text-xs text-center">
                      {dreData.receitaLiquida
                        ? (
                            (dreData.lucroLiquido / dreData.receitaLiquida) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Drill Down Side Menu */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col h-full max-h-[600px] overflow-y-auto">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-xs mb-4 flex items-center justify-between">
            Drill Down Contábil
            <Search size={14} className="text-slate-400" />
          </h3>
          <div className="space-y-4">
            {Object.entries(dreData.contasList)
              .slice(0, 10)
              .map(([conta, info]: any, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 text-sm border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 cursor-pointer group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate max-w-[180px] group-hover:text-blue-500 transition-colors">
                      {conta}
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold text-xs">
                      {formatCurrency(info.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase">
                    <span>{info.type}</span>
                    <span className="flex items-center gap-1 group-hover:text-blue-400">
                      <ArrowRight size={10} /> DETALHAR
                    </span>
                  </div>
                </div>
              ))}
            {Object.keys(dreData.contasList).length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">
                Nenhum dado contábil disponível para drill down neste filtro.
              </p>
            )}
            {Object.keys(dreData.contasList).length > 10 && (
              <button className="w-full text-xs text-blue-600 dark:text-blue-400 font-bold p-2 text-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded">
                VER TODAS AS {Object.keys(dreData.contasList).length} CONTAS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
