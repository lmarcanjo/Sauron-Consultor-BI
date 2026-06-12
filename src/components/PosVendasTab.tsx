import React from "react";
import { Sliders, Wrench, Clock, ShieldCheck, Heart } from "lucide-react";
import { MetricasConsolidadas } from "../types";

interface PosVendasTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (v: number) => string;
}

export const PosVendasTab: React.FC<PosVendasTabProps> = ({ metrics, formatCurrency }) => {
  const oficinaReceita = metrics.receitaTotal * 0.16;
  const passagensEstimadas = Math.round(oficinaReceita / 850);
  const horasFaturadas = Math.round(oficinaReceita / 220);
  
  return (
    <div className="space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <Wrench size={15} className="text-blue-500 animate-pulse" />
          <span>Indicadores Logísticos de Pós-Vendas &amp; Oficina Especializada</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Faturamento de Serviços</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">{formatCurrency(oficinaReceita)}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Mão de obra e serviços gerais</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Passagens em Oficina (OS)</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">{passagensEstimadas}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Ordens de serviço abertas no período</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Tempo Técnico Faturado</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">{horasFaturadas} hrs</p>
            <p className="text-[10px] text-emerald-650 dark:text-emerald-400 mt-0.5 font-bold">Horas de mecânicos aproveitadas</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">NPS Pós-Venda</span>
            <p className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">94.5%</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Índice de Retenção e Qualidade</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Productive mechanics workload */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Eficiência da Linha de Mecânicos e Técnicos</h4>
          <div className="space-y-3 pt-1">
            {[
              { name: "Alisson Silva (Líder Mecânica Pleno)", rate: 91, hours: 142, status: "Alta Produtividade" },
              { name: "Felipe G. Santos (Mecânico Alinhamento)", rate: 86, hours: 135, status: "Otimizado" },
              { name: "Bruno Oliveira (Mecânico Auxiliar)", rate: 78, hours: 120, status: "Conforme" },
              { name: "Mateus Ribeiro (Técnico Diagnóstico)", rate: 95, hours: 148, status: "Destaque Período" }
            ].map((tech, idx) => (
              <div key={idx} className="space-y-1 block border-b border-slate-50 dark:border-slate-850/65 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{tech.name}</span>
                    <span className="text-[9px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold ml-2 font-sans">{tech.status}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-500">{tech.rate}% ({tech.hours}h)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded overflow-hidden">
                  <div className="h-full bg-blue-600 dark:bg-blue-700 rounded" style={{ width: `${tech.rate}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nature of workshop entries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Segmento de Ordens em Aberto</h4>
            <div className="space-y-3.5 pt-2">
              {[
                { type: "Revisão Periódica Sistemática (Fidelizado)", share: 44 },
                { type: "Mecânica Geral Corretiva (Freios, Motor)", share: 29 },
                { type: "Funilaria e Estética Pintura", share: 18 },
                { type: "Instalação de Acessórios Homologados", share: 9 }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-650 dark:text-slate-300">{item.type}</span>
                  <span className="font-mono font-bold text-indigo-650 dark:text-indigo-400">{item.share}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-850/40 p-2 border border-slate-150 dark:border-slate-800/80 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 mt-4">
            ℹ️ <strong>Rastreabilidade de Garantia:</strong> Todas as passagens de garantia de montadora estão integradas de forma direta para reembolso contábil.
          </div>
        </div>
      </div>
    </div>
  );
};
