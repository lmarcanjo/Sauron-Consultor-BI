import React from "react";
import { GitBranch, Box, Activity, ShoppingBag } from "lucide-react";
import { MetricasConsolidadas } from "../types";

interface PecasTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (v: number) => string;
}

export const PecasTab: React.FC<PecasTabProps> = ({ metrics, formatCurrency }) => {
  const pecasReceita = metrics.receitaTotal * 0.12;
  const pecasCusto = pecasReceita * 0.68; // standard cogs
  const pecasMargem = pecasReceita > 0 ? ((pecasReceita - pecasCusto) / pecasReceita * 100) : 32.0;

  return (
    <div className="space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <Box size={15} className="text-blue-500" />
          <span>Faturamento de Autopeças e Giro de Componentes</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Faturamento Autopeças</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">{formatCurrency(pecasReceita)}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Vendas balcão, atacado e interna</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Margem Bruta Peças</span>
            <p className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{pecasMargem.toFixed(2)}%</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Alta rentabilidade sobre custo de aquisição</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Giro do Estoque de Peças</span>
            <p className="text-lg font-mono font-black text-slate-800 dark:text-white mt-1">4.6x/Ano</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Rotação média do catálogo ativo</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">SKUs Ativos Cadastrados</span>
            <p className="text-lg font-mono font-black text-blue-600 dark:text-blue-400 mt-1">15,420</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Códigos originais catalogados</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parts sales channels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Distribuição de Receita por Canal de Escoamento</h4>
          <div className="space-y-4 pt-1">
            {[
              { label: "Venda Balcão (Clientes Varejo)", pct: 45, val: pecasReceita * 0.45 },
              { label: "Fornecimento Interno (Serviços e Oficina)", pct: 35, val: pecasReceita * 0.35 },
              { label: "Atacado Distribuidor (Outros Reparadores)", pct: 20, val: pecasReceita * 0.20 }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850/50 pb-2 last:border-0 last:pb-0 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <p className="font-extrabold text-slate-705 dark:text-white">{item.label}</p>
                  <span className="text-[10px] text-slate-450">{item.pct}% de participação direta</span>
                </div>
                <div className="text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                  <p>{formatCurrency(item.val)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top selling parts categories */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Curva ABC de Peças (Mais Vendidas no Período)</h4>
          <div className="space-y-2.5 pt-2">
            {[
              { name: "Lubrificantes e Aditivos Genuínos", sales: "Altíssimo Giro" },
              { name: "Pastilhas e Discos de Freio Homologados", sales: "Giro Frequente" },
              { name: "Filtros (Ar, Óleo e Cabine)", sales: "Giro Frequente" },
              { name: "Pneus e Amortecedores Originais", sales: "Giro Moderado" }
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs text-slate-705 dark:text-slate-350 bg-slate-50 dark:bg-slate-850 p-2 rounded-md">
                <span className="font-bold">{item.name}</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase font-mono">{item.sales}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
