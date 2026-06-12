import React from "react";
import { FolderOpen, Package, Flame, ShieldAlert, BarChart3 } from "lucide-react";
import { MetricasConsolidadas } from "../types";

interface EstoqueTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (v: number) => string;
}

export const EstoqueTab: React.FC<EstoqueTabProps> = ({ metrics, formatCurrency }) => {
  const valuationEstoqueVal = metrics.receitaTotal * 1.45;
  const carryingCost = valuationEstoqueVal * 0.007; // 0.7% holding/carrying cost per month (interest, security, space)

  return (
    <div className="space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <Package size={15} className="text-blue-500" />
          <span>Monitor de Giro Financeiro do Estoque de Veículos (Yard Asset Ageing)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Valor do Estoque (Valuation)</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">{formatCurrency(valuationEstoqueVal)}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Investimento parado em pátios</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Idade Média de Pátio</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">38 dias</p>
            <p className="text-[10px] text-emerald-650 dark:text-emerald-400 mt-0.5 font-bold">Excelente liquidez consolidada</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Custo Ocupação p/ Dia</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">{formatCurrency(carryingCost)}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Carregamento financeiro acumulado</p>
          </div>

          <div className="bg-white dark:bg-slate-900 shadow-sm border border-rose-200 dark:border-rose-900/60 p-3 rounded-lg">
            <span className="text-[10px] font-black uppercase text-rose-500 block tracking-wider">Meta Redução Estoque Velho</span>
            <p className="text-lg font-mono font-black text-rose-600 dark:text-rose-400 mt-1">- R$ 45,000</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Vender 22 unidades de giro lento</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ageing categories list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Ageing List de Veículos (Giro e Envelhecimento)</h4>
          <div className="space-y-3.5 pt-1">
            {[
              { label: "0 a 30 dias - Saudável (Novidade)", share: 58, color: "bg-emerald-500" },
              { label: "31 a 60 dias - Atenção (Giro Médio)", share: 26, color: "bg-blue-500" },
              { label: "61 a 90 dias - Alerta (Análise de Demanda)", share: 11, color: "bg-amber-500" },
              { label: "90+ dias - Crítico (Urgência Liquidação/Feirão)", share: 5, color: "bg-rose-500" }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1 block">
                <div className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-350 font-bold">
                  <span>{item.label}</span>
                  <span>{item.share}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded overflow-hidden">
                  <div className={`h-full ${item.color} rounded`} style={{ width: `${item.share}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Division of storage allocation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Composição Operacional do Estoque</h4>
            <div className="space-y-4 pt-2">
              {[
                { name: "Veículos Novos Faturados de fábrica", share: 48, val: valuationEstoqueVal * 0.48 },
                { name: "Seminovos de Pátio (Retomados/Troca)", share: 36, val: valuationEstoqueVal * 0.36 },
                { name: "Showroom / Demonstração Concessionárias", share: 12, val: valuationEstoqueVal * 0.12 },
                { name: "Imobilizados das Filiais (Apoio)", share: 4, val: valuationEstoqueVal * 0.04 }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs text-slate-705 dark:text-slate-350 border-b border-slate-50 dark:border-slate-850/50 pb-1.5 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">{item.share}% do estoque</p>
                  </div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
