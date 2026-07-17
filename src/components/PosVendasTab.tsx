import React from "react";
import { Wrench } from "lucide-react";
import { MetricasConsolidadas } from "../types";
import { dataSourceManager } from "../services/dataSourceManager";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";

interface PosVendasTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (v: number) => string;
}

export const PosVendasTab: React.FC<PosVendasTabProps> = () => {
  const hasRealDataset = dataSourceManager.getActiveSource() === "SPREADSHEET_DATA" && !!activeDatasetStore.getActiveDataset();

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
      <Wrench className={hasRealDataset ? "text-emerald-500 w-12 h-12" : "text-slate-400 w-12 h-12"} />
      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
        {hasRealDataset ? "Configuração Pendente" : "Nenhuma fonte de dados ativa."}
      </h3>
      <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
        {hasRealDataset
          ? "Configure colunas de atendimento, serviços, itens, responsável, valor e período antes de gerar Pós-vendas."
          : "Adicione uma planilha para visualizar análises de Pós-vendas."}
      </p>
    </div>
  );
};
