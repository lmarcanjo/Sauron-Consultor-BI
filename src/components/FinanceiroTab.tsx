import React from "react";
import { Database, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { MetricasConsolidadas } from "../types";

interface FinanceiroTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (v: number) => string;
}

export const FinanceiroTab: React.FC<FinanceiroTabProps> = ({ metrics, formatCurrency }) => {
  const totalReceivables = metrics.receitaTotal * 0.28;
  const overdueUnpaid = totalReceivables * 0.082; // 8.2% delinquency rate
  const automakerCredits = metrics.receitaTotal * 0.052; // manufacturer bonuses pending reimbursement

  return (
    <div className="space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <Database size={15} className="text-blue-500" />
          <span>Acompanhamento e Amortização de Contas a Receber</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Saldo Total a Receber</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">{formatCurrency(totalReceivables)}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Faturamento parcelado no período</p>
          </div>

          <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/60 p-3 rounded-lg">
            <span className="text-[10px] font-black uppercase text-rose-500 block tracking-wider">Títulos Vencidos (Inadimplência)</span>
            <p className="text-lg font-mono font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(overdueUnpaid)}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Cobrança ativa e protesto cartório</p>
          </div>

          <div className="bg-stone-50 dark:bg-slate-850 p-3 rounded-lg border border-stone-200 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-stone-500 block tracking-wider">Bônus Montadoras Pendentes</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">{formatCurrency(automakerCredits)}</p>
            <p className="text-[10px] text-indigo-650 dark:text-indigo-400 mt-0.5 font-bold">Créditos de campanhas faturadas</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Prazo Médio Recebimento</span>
            <p className="text-lg font-mono font-black text-blue-600 dark:text-blue-400 mt-1">12 Dias</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Excelente liquidez operacional</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aging Receivables metrics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Previsibilidade de Caixa (Aging Receivables)</h4>
          <div className="space-y-4 pt-3.5">
            {[
              { label: "A vencer (Próximos 15 dias)", share: 64, val: totalReceivables * 0.64, color: "bg-emerald-500" },
              { label: "A vencer (De 16 a 30 dias)", share: 21, val: totalReceivables * 0.21, color: "bg-blue-500" },
              { label: "A vencer (Acima de 30 dias)", share: 9, val: totalReceivables * 0.09, color: "bg-indigo-500" },
              { label: "Vencido em cobrança jurídica", share: 6, val: totalReceivables * 0.06, color: "bg-rose-500" }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1 block">
                <div className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-350 font-bold">
                  <span>{item.label}</span>
                  <span className="font-mono">{formatCurrency(item.val)} ({item.share}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded overflow-hidden">
                  <div className={`h-full ${item.color} rounded`} style={{ width: `${item.share}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core financial logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Canais de Recebimento de duplicatas e parcelários</h4>
            <div className="space-y-3.5 pt-2">
              {[
                { source: "Boleto Bancário (Banco Itaú S.A.)", share: 42, val: totalReceivables * 0.42 },
                { source: "Pix Parcelado Integrado (Telas)", share: 31, val: totalReceivables * 0.31 },
                { source: "Financiamentos Gravame (CDC)", share: 19, val: totalReceivables * 0.19 },
                { source: "Cartões de Crédito (Rede/Cielo)", share: 8, val: totalReceivables * 0.08 }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs text-slate-705 dark:text-slate-350 border-b border-slate-50 dark:border-slate-850/50 pb-1.5 last:border-0 last:pb-0">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-205">{item.source}</span>
                    <p className="text-[10px] text-slate-400 font-bold font-mono">{item.share}% dos fluxos</p>
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
