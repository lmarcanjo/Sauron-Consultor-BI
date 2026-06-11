/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
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
import { MetricasConsolidadas } from "../types";

interface ChartsGridProps {
  metrics: MetricasConsolidadas;
}

const COLORS_ACCENTS = [
  "#4d7c0f", // emerald green
  "#1d4ed8", // royal blue
  "#be123c", // rose red
  "#b45309", // golden amber
  "#6d28d9", // deep violet
  "#0f766e", // dark teal
  "#0369a1", // light ocean blue
  "#e11d48", // pinkish crimson
];

export const ChartsGrid: React.FC<ChartsGridProps> = ({ metrics }) => {
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
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-3 shadow-lg rounded-xl text-xs font-sans">
          <p className="font-bold text-slate-700 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium font-mono">
              {entry.name}: {formatCurrency(entry.value)}
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
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-3 shadow-lg rounded-xl text-xs font-sans">
          <p className="font-bold text-slate-700 mb-1">{data.razao}</p>
          <p className="font-medium text-indigo-600 font-mono">
            Despesa: {formatCurrency(data.despesa)}
          </p>
          <p className="text-[10px] text-slate-400">
            Fração: {data.participacao.toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
      {/* Chart 1: Receita por marca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all duration-150">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Faturamento Bruto por Marca</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Total acumulado segmentado por marca de automóveis</p>
          </div>
          <span className="text-[9px] bg-slate-100 font-bold uppercase text-slate-500 px-2 py-0.5 rounded">Bandeiras</span>
        </div>
        <div className="h-64 w-full flex-1">
          {metrics.porMarca.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">Nenhum dado ativo</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.porMarca} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all duration-150">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Lucratividade por Empresa (CNPJ)</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Resultado operacional líquido por CNPJ registrado</p>
          </div>
          <span className="text-[9px] bg-slate-100 font-bold uppercase text-slate-500 px-2 py-0.5 rounded">Rendimento</span>
        </div>
        <div className="h-64 w-full flex-1">
          {metrics.porCnpj.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">Nenhum dado ativo</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.porCnpj}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all duration-150">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Despesas por Razão Contábil</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Participação de despesas por conta/rubrica (Foco Principal)</p>
          </div>
          <span className="text-[9px] bg-slate-100 font-bold uppercase text-slate-500 px-2 py-0.5 rounded">Gasto Real</span>
        </div>
        <div className="h-64 w-full flex-1 flex flex-col sm:flex-row items-center gap-2">
          {metrics.porRazao.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-[11px] italic">Nenhum dado ativo</div>
          ) : (
            <>
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.porRazao}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
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
              <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-[11px]">
                {metrics.porRazao.slice(0, 7).map((item, index) => (
                  <div key={item.razao} className="flex items-center justify-between font-sans">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS_ACCENTS[index % COLORS_ACCENTS.length] }} />
                      <span className="text-slate-600 font-bold text-[11px] truncate" title={item.razao}>{item.razao}</span>
                    </div>
                    <span className="text-slate-500 font-semibold font-mono text-right shrink-0">
                      {item.participacao.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {metrics.porRazao.length > 7 && (
                  <p className="text-[9px] text-slate-400 italic text-center">+ {metrics.porRazao.length - 7} outras rubricas</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart 4: Evolução mensal do lucro */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-all duration-150">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">Evolução Mensal do Resultado</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Curva histórica de lucros líquidos e receitas mensais</p>
          </div>
          <span className="text-[9px] bg-slate-100 font-bold uppercase text-slate-500 px-2 py-0.5 rounded">Histórico</span>
        </div>
        <div className="h-64 w-full flex-1">
          {metrics.porMes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">Nenhum dado ativo</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.porMes} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
