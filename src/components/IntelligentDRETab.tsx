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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart, Line, Cell } from 'recharts';
import { dataSourceManager } from "../services/dataSourceManager";

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
  const [contaFilter, setContaFilter] = useState<string | null>(null);

  const activeTemplate = useMemo(() => {
    return (
      availableTemplates.find((t) => t.id === activeIndustryTemplateId) ||
      availableTemplates[0]
    );
  }, [activeIndustryTemplateId]);

  const activeDataset = dataSourceManager.getActiveDataset();
  const isPendingConfiguration = useMemo(() => {
    if (dataSourceManager.getActiveSource() !== "SPREADSHEET_DATA") return false;
    if (activeDataset && activeDataset.columnProfiles) {
      const hasDRECol = activeDataset.columnProfiles.some((p: any) => p.isDRE || p.isKPI);
      return !hasDRECol;
    }
    return true; // if no profiles, pending
  }, [activeDataset]);

  if (isPendingConfiguration) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Calculator className="text-slate-300 dark:text-slate-700 w-16 h-16 mb-4" />
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wider">Configuração Pendente</h2>
        <p className="text-xs text-slate-500 text-center max-w-sm mb-6">
          Esta fonte de dados (planilha) não possui nenhuma coluna mapeada para "DRE" ou financeira (Receita, Custo, Despesa). 
          Configure no Assistente de Importação ou verifique suas colunas.
        </p>
      </div>
    );
  }

  // Motor Inteligente DRE - Automatically trying to categorize Receitas, Despesas, Custos based on standard names
  const dreData = useMemo(() => {
//...(the dreData variable computation will go below)
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

  // Gráficos Aggregation
  const evolucaoMensal = useMemo(() => {
    const mesesMap: Record<string, { mes: string; Receita: number; Despesa: number; Lucro: number }> = {};
    filteredData.forEach(d => {
      const k = d.Data ? d.Data.substring(0,7) : d.Mês;
      if(!k) return;
      if (!mesesMap[k]) mesesMap[k] = { mes: k, Receita: 0, Despesa: 0, Lucro: 0 };
      
      const val = (d.Receita || 0) - ((d.Despesa || 0) + (d.Custo || 0)) || (d.Valor || 0);

      if (d.Receita || val > 0) mesesMap[k].Receita += Math.abs(d.Receita || val);
      if (d.Despesa || d.Custo || val < 0) mesesMap[k].Despesa += Math.abs(d.Despesa || d.Custo || val);
    });
    
    return Object.values(mesesMap).map(m => ({
        ...m,
        Lucro: m.Receita - m.Despesa
    })).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filteredData]);

  const porCentroCusto = useMemo(() => {
     const ccMap: Record<string, { nome: string; Resultado: number }> = {};
     filteredData.forEach(d => {
       const k = d.CentroDeCusto || "Geral";
       if (!ccMap[k]) ccMap[k] = { nome: k, Resultado: 0 };
       const val = (d.Receita || 0) - ((d.Despesa || 0) + (d.Custo || 0)) || (d.Valor || 0);
       ccMap[k].Resultado += val;
     });
     return Object.values(ccMap).sort((a,b) => b.Resultado - a.Resultado).slice(0, 10);
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
                  className={`flex flex-col gap-1 text-sm border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 cursor-pointer group px-2 py-1 rounded ${contaFilter === conta ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => {
                    setContaFilter(contaFilter === conta ? null : conta);
                    document.getElementById('tabela-analitica-documental')?.scrollIntoView({ behavior: 'smooth' });
                  }}
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
      
      {/* Visão Gráfica DRE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Gráfico 1: Receita x Despesa x Lucro Mensal */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-xs mb-4">
            Evolução de ResultadoMensal (Receita x Custo x Lucro)
          </h3>
          <div className="flex-1 min-h-[0]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolucaoMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Receita" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" name="Despesa/Custo" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Lucro" name="Resultado Líquido" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#FFF' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Resultado por Centro de Custo */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-xs mb-4">
            Top Resultados por Centro de Custo
          </h3>
          <div className="flex-1 min-h-[0]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porCentroCusto} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="nome" type="category" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="Resultado" name="Resultado" radius={[0, 4, 4, 0]}>
                  {porCentroCusto.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.Resultado >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table Section */}
      <div id="tabela-analitica-documental" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-8">
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide text-xs flex items-center gap-2">
              Tabela Analítica Documental 
              {contaFilter && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">Filtrado: {contaFilter}</span>
              )}
            </h3>
            {contaFilter && (
               <button onClick={() => setContaFilter(null)} className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-700">Limpar Filtro</button>
            )}
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Data Contábil</th>
                  <th className="p-3">Competência</th>
                  <th className="p-3">Grupo</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">CNPJ</th>
                  <th className="p-3">Marca</th>
                  <th className="p-3">Loja/Filial</th>
                  <th className="p-3">Departamento</th>
                  <th className="p-3">Centro de Custo</th>
                  <th className="p-3">Código Conta</th>
                  <th className="p-3">Nome Conta</th>
                  <th className="p-3 max-w-[200px]">Descrição Movimento</th>
                  <th className="p-3 text-right">Valor Operacional</th>
                  <th className="p-3 text-right">Tipo de Movimento</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Doc. Fiscal</th>
                  <th className="p-3">Usuário Int.</th>
                  <th className="p-3">Observações Adic.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData
                 .filter(r => {
                   if (!contaFilter) return true;
                   const contaId = r.ContaContabil || r.Razão || "Sem Conta";
                   return contaId === contaFilter;
                 })
                 .slice(0, 50).map((r, i) => {
                   const val = r.Valor !== undefined ? r.Valor : ((r.Receita || 0) - ((r.Despesa || 0) + (r.Custo || 0)));
                   const typeMov = r.TipoMovimento || (val >= 0 ? "Credito" : "Debito");

                   return (
                     <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                       <td className="p-3">{r.Data || r.Mês || "-"}</td>
                       <td className="p-3 text-slate-500">{r.Competencia || r.Mês || "-"}</td>
                       <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded">{r.Grupo || "-"}</span></td>
                       <td className="p-3 font-semibold text-slate-700">{r.Empresa || "-"}</td>
                       <td className="p-3 font-mono text-[10px] text-slate-500">{r.CNPJ || "-"}</td>
                       <td className="p-3">{r.Marca || "-"}</td>
                       <td className="p-3">{r.Loja || r.Filial || "-"}</td>
                       <td className="p-3">{r.Departamento || "-"}</td>
                       <td className="p-3 font-mono text-[10px] text-slate-500">{r.CentroDeCusto || "-"}</td>
                       <td className="p-3 font-mono text-[10px] font-bold">{r.CodigoConta || (r.ContaContabil ? r.ContaContabil.split("-")[0].trim() : "-")}</td>
                       <td className="p-3">{r.NomeConta || r.Razão || "-"}</td>
                       <td className="p-3 text-slate-500 text-[10px] truncate max-w-[200px]" title={r.DescricaoLancamento}>{r.DescricaoLancamento || "-"}</td>
                       <td className={`p-3 text-right font-mono font-bold ${val >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCurrency(val)}</td>
                       <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeMov === 'Credito' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{typeMov}</span>
                       </td>
                       <td className="p-3 text-slate-500">{r.Origem || "-"}</td>
                       <td className="p-3 text-slate-500 font-mono text-[10px]">{r.DocumentoFiscal || "-"}</td>
                       <td className="p-3 text-slate-500">{r.Usuario || "-"}</td>
                       <td className="p-3 text-slate-500 text-[10px] truncate max-w-[150px]">{r.Observacoes || "-"}</td>
                     </tr>
                   )
                })}
              </tbody>
            </table>
            {filteredData.filter(r => !contaFilter || (r.ContaContabil || r.Razão || "Sem Conta") === contaFilter).length > 50 && (
               <div className="p-3 text-center text-xs text-slate-500 bg-slate-50">
                 Mostrando 50 de {filteredData.filter(r => !contaFilter || (r.ContaContabil || r.Razão || "Sem Conta") === contaFilter).length} registros. Use os filtros globais para detalhar mais.
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
