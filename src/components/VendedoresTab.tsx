import React, { useMemo, useState } from "react";
import { Users, TrendingUp, Award, Target, Coins, ShieldAlert, Sparkles, Filter, ChevronRight, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LancamentoFinanceiro } from "../types";

interface VendedoresTabProps {
  dataOrigem: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
}

export const VendedoresTab: React.FC<VendedoresTabProps> = ({
  dataOrigem,
  formatCurrency
}) => {
  const [selectedSellerLeft, setSelectedSellerLeft] = useState("João Silva");
  const [selectedSellerRight, setSelectedSellerRight] = useState("Maria Santos");

  // Fictional list of 20 sellers
  const vendedoresIniciais = [
    "João Silva", "Maria Santos", "Pedro Oliveira", "Lucas Souza", "Ana Costa",
    "Carlos Rodrigues", "Bruna Pereira", "Gabriel Alves", "Mariana Lima", "Ricardo Santos",
    "Juliana Gomes", "Vitor Fernandes", "Renata Ribeiro", "Thiago Martins", "Amanda Barbosa",
    "Felipe Castro", "Camila Azevedo", "Guilherme Cardoso", "Larissa Melo", "Paula Carvalho"
  ];

  // Derive dynamic metrics per seller by splitting overall revenue/profit in deterministic proportional ways
  // this guarantees they respond dynamically to the sidebar filters of months/brands/cnpjs!
  const performanceVendedores = useMemo(() => {
    // calculate general revenue/lucro of active database
    const generalReceita = dataOrigem.reduce((sum, d) => sum + d.Receita, 0) * 0.72; // assume 72% represents showroom sales
    const generalLucro = dataOrigem.reduce((sum, d) => sum + d.Lucro, 0) * 0.72;

    // Distribute with custom seasonal distributions (so they aren't identical)
    return vendedoresIniciais.map((name, index) => {
      // Deterministic factor per seller
      const factor = 1 + Math.sin(index * 1.7) * 0.35; // ranges from 0.65 to 1.35
      const numSales = Math.round(18 * factor * (dataOrigem.length > 0 ? (dataOrigem.length / 96) : 1));
      
      const receitaVendedor = Math.round((generalReceita / vendedoresIniciais.length) * factor);
      const lucroVendedor = Math.round((generalLucro / vendedoresIniciais.length) * factor);
      
      const ticketMedio = numSales > 0 ? Math.round(receitaVendedor / numSales) : 0;
      const margem = receitaVendedor > 0 ? Math.round((lucroVendedor / receitaVendedor) * 100 * 10) / 10 : 0;
      
      // commissions: average 1.5% commission rate
      const comissao = Math.round(receitaVendedor * 0.015 + numSales * 180);
      
      // conversion rate ranges from 8% to 16% deterministic
      const conversao = Math.round((10 + Math.cos(index * 2.3) * 4) * 10) / 10;
      
      // Target monthly ranges from 120k to 220k depending on factor
      const meta = Math.round(152000 * factor);
      const pctMeta = meta > 0 ? Math.round((receitaVendedor / meta) * 100) : 0;

      return {
        name,
        receita: receitaVendedor,
        salesCount: numSales,
        ticketMedio,
        margem,
        comissao,
        conversao,
        meta,
        pctMeta
      };
    }).sort((a, b) => b.receita - a.receita); // Sorted by ranking of absolute sales
  }, [dataOrigem]);

  // Derived analysis highlights
  const topPerformer = performanceVendedores[0];
  const lowPerformer = performanceVendedores[performanceVendedores.length - 1];
  const maxMargemPerformer = [...performanceVendedores].sort((a,b) => b.margem - a.margem)[0];
  const maxVolumePerformer = [...performanceVendedores].sort((a,b) => b.salesCount - a.salesCount)[0];
  const belowMetaPerformers = performanceVendedores.filter((s) => s.pctMeta < 95);

  const leftData = useMemo(() => {
    return performanceVendedores.find((s) => s.name === selectedSellerLeft) || performanceVendedores[0];
  }, [performanceVendedores, selectedSellerLeft]);

  const rightData = useMemo(() => {
    return performanceVendedores.find((s) => s.name === selectedSellerRight) || performanceVendedores[1];
  }, [performanceVendedores, selectedSellerRight]);

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-150 animate-fade-in" id="vendedores-tab-container">
      {/* Upper overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block pb-1 tracking-wider">Top Performer</span>
            <p className="text-xs font-extrabold text-slate-700 dark:text-white truncate max-w-[125px]">{topPerformer?.name}</p>
            <p className="text-sm font-mono font-black text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(topPerformer?.receita || 0)}</p>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <Award size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block pb-1 tracking-wider">Maior Margem Unitária</span>
            <p className="text-xs font-extrabold text-slate-700 dark:text-white truncate max-w-[125px]">{maxMargemPerformer?.name}</p>
            <p className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{maxMargemPerformer?.margem}% Margem</p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block pb-1 tracking-wider">Maior Volume (Vendas)</span>
            <p className="text-xs font-extrabold text-slate-700 dark:text-white truncate max-w-[125px]">{maxVolumePerformer?.name}</p>
            <p className="text-sm font-mono font-black text-purple-600 dark:text-purple-400 mt-1">{maxVolumePerformer?.salesCount} Faturados</p>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
            <Activity size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 block pb-1 tracking-wider">Abaixo da Meta (&lt;95%)</span>
            <p className="text-xs font-extrabold text-slate-700 dark:text-white">Alerta de Ociosidade</p>
            <p className="text-sm font-mono font-black text-red-650 dark:text-red-400 mt-1">{belowMetaPerformers.length} Vendedores</p>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-955/40 text-red-600 dark:text-red-400 rounded-lg">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table list left (span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2 mb-3 gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 animate-pulse">
              <Users size={14} className="text-blue-500" />
              <span>Ranking Geral de Performance Comercial dos Vendedores</span>
            </h3>
            <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
              Atualizado: Automático
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-400">
                  <th className="py-2.5">Pos</th>
                  <th>Vendedor</th>
                  <th className="text-right">Total Faturado</th>
                  <th className="text-right">Vendas</th>
                  <th className="text-right">Ticket Médio</th>
                  <th className="text-right">Margem</th>
                  <th className="text-right">Comissão</th>
                  <th className="text-right">Conversão</th>
                  <th className="text-right">Atingido %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {performanceVendedores.map((item, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 font-mono font-bold">
                        {isTop3 ? (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-center min-w-[20px] inline-block ${
                            idx === 0 ? "bg-amber-100 dark:bg-amber-950 text-amber-800" :
                            idx === 1 ? "bg-slate-200 text-slate-800" : "bg-orange-100 text-orange-850"
                          }`}>
                            #{idx + 1}
                          </span>
                        ) : (
                          <span className="text-slate-400 ml-1">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="font-extrabold text-slate-800 dark:text-white font-sans">{item.name}</td>
                      <td className="text-right font-mono font-bold text-[11px]">{formatCurrency(item.receita)}</td>
                      <td className="text-right font-mono font-bold text-slate-500">{item.salesCount}</td>
                      <td className="text-right font-mono text-slate-500">{formatCurrency(item.ticketMedio)}</td>
                      <td className="text-right font-mono text-blue-600 dark:text-blue-400 font-bold">{item.margem}%</td>
                      <td className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.comissao)}</td>
                      <td className="text-right font-mono font-medium">{item.conversao}%</td>
                      <td className="text-right">
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          item.pctMeta >= 100 ? "bg-emerald-50 text-emerald-850 dark:bg-emerald-950/60 dark:text-emerald-300" :
                          item.pctMeta >= 90 ? "bg-amber-50 text-amber-850 dark:bg-amber-955/65 dark:text-amber-300" :
                          "bg-red-50 text-red-800 dark:bg-red-955/60 dark:text-red-300"
                        }`}>
                          {item.pctMeta}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual performance comparison & suggestions (span 1) */}
        <div className="space-y-4">
          {/* Diagnostic technical actions suggested */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3 text-xs">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Sparkles size={13} className="text-yellow-500" />
              <span>Diagnóstico Automático da Equipe</span>
            </h4>
            
            <div className="space-y-3">
              <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                <span className="text-[8px] font-extrabold uppercase text-emerald-600 tracking-wider block">Estrela de Varejo</span>
                <p className="font-extrabold text-slate-700 dark:text-white text-[11px]">{topPerformer?.name}</p>
                <p className="text-[10px] text-slate-505">Maximizou faturamento liderando vendas consultivas digitais com ticket médio elevado.</p>
              </div>

              <div className="p-2 rounded bg-red-500/5 border border-red-500/10 space-y-1">
                <span className="text-[8px] font-extrabold uppercase text-red-650 tracking-wider block">Gargalo Crítico de Vendas</span>
                <p className="font-extrabold text-slate-700 dark:text-white text-[11px]">{lowPerformer?.name}</p>
                <p className="text-[10px] text-slate-550 leading-snug">Menor faturamento e conversão de propostas. Apresentou queda de performance recorrente vs o trimestre passado.</p>
                <div className="pt-1.5 border-t border-red-500/10 text-[9px] text-red-650 font-bold">
                  Sugestão: Realizar pareamento com {maxMargemPerformer?.name} para reaproveitar técnicas de pitch de margem elevada.
                </div>
              </div>
            </div>
          </div>

          {/* Core head to head comparator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3 text-xs">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Simulador Comparador Lado a Lado</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-extrabold text-slate-500 uppercase block mb-1">Perfil A</label>
                <select
                  value={selectedSellerLeft}
                  onChange={(e) => setSelectedSellerLeft(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 p-1 py-1 px-1.5 border border-slate-200/50 rounded font-bold text-[10px]"
                >
                  {vendedoresIniciais.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-extrabold text-slate-500 uppercase block mb-1">Perfil B</label>
                <select
                  value={selectedSellerRight}
                  onChange={(e) => setSelectedSellerRight(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 p-1 py-1 px-1.5 border border-slate-200/50 rounded font-bold text-[10px]"
                >
                  {vendedoresIniciais.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparisons grid stats */}
            <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800/80">
              {[
                { title: "Total Faturado", metric: "receita", type: "currency" },
                { title: "Margem de Contribuição", metric: "margem", type: "pct" },
                { title: "Aproveitamento Leads", metric: "conversao", type: "pct" },
                { title: "Comissões Acumuladas", metric: "comissao", type: "currency" }
              ].map((comp, i) => {
                const valA = (leftData as any)[comp.metric];
                const valB = (rightData as any)[comp.metric];

                const formattedA = comp.type === "currency" ? formatCurrency(valA) : `${valA}%`;
                const formattedB = comp.type === "currency" ? formatCurrency(valB) : `${valB}%`;

                return (
                  <div key={i} className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 block text-center uppercase tracking-wider">{comp.title}</span>
                    <div className="flex items-center justify-between text-[11px] font-mono leading-none py-1">
                      <span className={`font-black ${valA >= valB ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600"}`}>
                        {formattedA}
                      </span>
                      <ChevronRight size={10} className="text-slate-400" />
                      <span className={`font-black ${valB >= valA ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600"}`}>
                        {formattedB}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
