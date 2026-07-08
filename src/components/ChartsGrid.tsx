/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Info, ChevronDown, ChevronUp, Sparkles, AlertCircle } from "lucide-react";
import { MetricasConsolidadas } from "../types";

interface ChartsGridProps {
  metrics: MetricasConsolidadas;
}

const COLORS_ACCENTS = [
  "#2563eb", // Royal Blue
  "#0ea5e9", // Sky Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#14b8a6", // Teal
];

export const ChartsGrid: React.FC<ChartsGridProps> = ({ metrics }) => {
  // Expose toggle states for visual dashboard explanations for each chart card
  const [showExpMarca, setShowExpMarca] = useState(true);
  const [showExpCnpj, setShowExpCnpj] = useState(true);
  const [showExpRazao, setShowExpRazao] = useState(true);
  const [showExpMes, setShowExpMes] = useState(true);

  const formatCompactCurrency = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
      return `R$ ${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `R$ ${(value / 1_000).toFixed(0)}k`;
    }
    return `R$ ${value}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-850 p-2.5 shadow-xl rounded-lg text-[10px] font-sans text-slate-100">
          <p className="font-extrabold text-blue-450 border-b border-slate-800 pb-1 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-semibold font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: entry.fill || entry.color }} />
              {entry.name}: <span className="font-extrabold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-850 p-2.5 shadow-xl rounded-lg text-[10px] font-sans text-slate-100">
          <p className="font-bold border-b border-slate-800 pb-1 mb-1">{data.razao}</p>
          <p className="font-extrabold text-red-400 font-mono">
            Despesa: {formatCurrency(data.despesa)}
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">
            Participação: {data.participacao.toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  // Helper dynamic insights to enrich explanations
  const melhorMarcaInfo = metrics.porMarca && metrics.porMarca[0] 
    ? `A marca líder é a **${metrics.porMarca[0].marca}** com faturamento bruto de **${formatCompactCurrency(metrics.porMarca[0].receita)}**.`
    : "Não há dados suficientes.";

  const piorCnpjInfo = metrics.porCnpj && metrics.porCnpj.length > 0
    ? (() => {
        const pCnpj = metrics.porCnpj[metrics.porCnpj.length - 1];
        if (pCnpj && pCnpj.lucro < 0) {
          return `A unidade **${pCnpj.empresa} (CNPJ: ${pCnpj.cnpj})** opera com déficit líquido de **${formatCompactCurrency(Math.abs(pCnpj.lucro))}**, exigindo atenção comercial imediata.`;
        }
        return "Nenhuma unidade possui déficit de margem de contribuição nesta visão filtrada.";
      })()
    : "Não há dados suficientes.";

  const maiorRazaoInfo = metrics.porRazao && metrics.porRazao[0]
    ? `A conta **${metrics.porRazao[0].razao}** é o principal gargalo contábil de despesa, drenando **${formatCompactCurrency(metrics.porRazao[0].despesa)}** (${metrics.porRazao[0].participacao.toFixed(1)}% das despesas totais).`
    : "Não há dados suficientes.";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
      {/* Chart 1: Receita por marca */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-md transition-all duration-150">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Faturamento Bruto por Marca</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Faturamento total acumulado estruturado por marca/bandeira</p>
          </div>
          <button 
            onClick={() => setShowExpMarca(!showExpMarca)}
            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
            title="Ver explicação técnica"
          >
            <Info size={14} className={showExpMarca ? "text-blue-600" : ""} />
          </button>
        </div>

        {/* Dynamic Dashboard Explanation panel */}
        {showExpMarca && (
          <div className="mb-3 px-2.5 py-2 bg-blue-50/30 dark:bg-blue-955/20 border border-blue-200 dark:border-blue-900/60 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 leading-normal font-sans shadow-inner">
            <p className="flex items-start gap-1 font-medium">
              <Sparkles size={11} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>Resumo & Análise:</strong> Este gráfico de barras analisa a força de mercado de cada marca. Auxilia a diretoria a decidir onde alocar investimentos promocionais. <span className="text-blue-800 dark:text-blue-400 font-semibold">{melhorMarcaInfo}</span>
              </span>
            </p>
          </div>
        )}

        <div className="h-48 w-full flex-1">
          {metrics.porMarca.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">Nenhum dado ativo</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.porMarca} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis dataKey="marca" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="receita" name="Receita Bruta" radius={[3, 3, 0, 0]}>
                  {metrics.porMarca.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_ACCENTS[index % COLORS_ACCENTS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: Lucro por CNPJ */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-md transition-all duration-150">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Lucratividade por Empresa (CNPJ)</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Resultado consolidado por CNPJ e razão social integrada</p>
          </div>
          <button 
            onClick={() => setShowExpCnpj(!showExpCnpj)}
            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
            title="Ver explicação técnica"
          >
            <Info size={14} className={showExpCnpj ? "text-blue-600" : ""} />
          </button>
        </div>

        {/* Dynamic Dashboard Explanation panel */}
        {showExpCnpj && (
          <div className="mb-3 px-2.5 py-2 bg-blue-50/30 dark:bg-blue-955/20 border border-blue-200 dark:border-blue-900/60 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 leading-normal font-sans shadow-inner">
            <p className="flex items-start gap-1 font-medium">
              <Sparkles size={11} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>Resumo & Análise:</strong> Gráfico de rendimento por subsidiária legal. Essencial para verificar a saúde fiscal do grupo. Barras em <span className="text-red-650 dark:text-red-400 font-bold">vermelho</span> mostram as empresas que estão operando em prejuízo operacional secundário. <span className="text-blue-800 dark:text-blue-400 font-semibold">{piorCnpjInfo}</span>
              </span>
            </p>
          </div>
        )}

        <div className="h-48 w-full flex-1">
          {metrics.porCnpj.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">Nenhum dado ativo</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.porCnpj}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} />
                <YAxis dataKey="cnpj" type="category" stroke="#94a3b8" fontSize={8} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="lucro" name="Resultado Líquido" radius={[0, 3, 3, 0]}>
                  {metrics.porCnpj.map((entry, index) => {
                    const isPositive = entry.lucro >= 0;
                    return <Cell key={`cell-${index}`} fill={isPositive ? "#3b82f6" : "#ef4444"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 3: Despesas por razão */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-md transition-all duration-150">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Despesas por Razão Contábil</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Proporção por conta de despesa operacional (Razão)</p>
          </div>
          <button 
            onClick={() => setShowExpRazao(!showExpRazao)}
            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
            title="Ver explicação técnica"
          >
            <Info size={14} className={showExpRazao ? "text-blue-600" : ""} />
          </button>
        </div>

        {/* Dynamic Dashboard Explanation panel */}
        {showExpRazao && (
          <div className="mb-3 px-2.5 py-2 bg-blue-50/30 dark:bg-blue-955/20 border border-blue-200 dark:border-blue-900/60 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 leading-normal font-sans shadow-inner">
            <p className="flex items-start gap-1 font-medium">
              <Sparkles size={11} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>Resumo & Análise:</strong> Gráfico de rosca focado na classification fiscal "Razão". Permite identificar desvios e estruturação ineficiente de custos fixos indiretos de administração. <span className="text-blue-800 dark:text-blue-400 font-semibold">{maiorRazaoInfo}</span>
              </span>
            </p>
          </div>
        )}

        <div className="h-48 w-full flex-1 flex flex-col sm:flex-row items-center gap-2">
          {metrics.porRazao.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-[11px] italic animate-pulse">Nenhum dado ativo</div>
          ) : (
            <>
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.porRazao}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="despesa"
                    >
                      {metrics.porRazao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_ACCENTS[index % COLORS_ACCENTS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 max-h-44 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-[10px]">
                {metrics.porRazao.slice(0, 6).map((item, index) => (
                  <div key={item.razao} className="flex items-center justify-between font-sans">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS_ACCENTS[index % COLORS_ACCENTS.length] }} />
                      <span className="text-slate-600 dark:text-slate-300 font-bold truncate" title={item.razao}>{item.razao}</span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold font-mono text-right shrink-0">
                      {item.participacao.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {metrics.porRazao.length > 6 && (
                  <p className="text-[8px] text-slate-400 italic text-center font-semibold">+ {metrics.porRazao.length - 6} outras rubricas</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart 4: Evolução mensal do lucro */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col hover:shadow-md transition-all duration-150">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Evolução Mensal do Resultado</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Alinhamento temporal do faturamento bruto contra lucro consolidado</p>
          </div>
          <button 
            onClick={() => setShowExpMes(!showExpMes)}
            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
            title="Ver explicação técnica"
          >
            <Info size={14} className={showExpMes ? "text-blue-600" : ""} />
          </button>
        </div>

        {/* Dynamic Dashboard Explanation panel */}
        {showExpMes && (
          <div className="mb-3 px-2.5 py-2 bg-blue-50/30 dark:bg-blue-955/20 border border-blue-200 dark:border-blue-900/60 rounded-lg text-[10px] text-slate-600 dark:text-slate-300 leading-normal font-sans shadow-inner">
            <p className="flex items-start gap-1 font-medium">
              <Sparkles size={11} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-pulse" />
              <span>
                <strong>Resumo & Análise:</strong> Gráfico de linhas duplo focado na sazonalidade de competência. Permite auditar se o encarecimento de CMV/Custo acompanhou linearmente o aumento de escala ou se houve otimização de margens de lucro.
              </span>
            </p>
          </div>
        )}

        <div className="h-48 w-full flex-1">
          {metrics.porMes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">Nenhum dado ativo</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.porMes} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                <Line
                  type="monotone"
                  dataKey="receita"
                  name="Faturamento Bruto"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  name="Resultado Líquido"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
