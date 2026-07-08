import React, { useEffect } from "react";
import { Database, FileSpreadsheet, TableProperties } from "lucide-react";
import { LancamentoFinanceiro } from "../../types";
import { ActiveDataset } from "../../types/dataSource";
import { activeDatasetStore } from "../../core/data/ActiveDatasetStore";
import { getDefaultProjectId, listModuleMappings, subscribeModuleMappings } from "../../core/data/moduleMapping";
import { buildExecutiveDashboard, ExecutiveDashboard } from "../../core/dashboard-engine";
import { ActiveDatasetRawPreview } from "../ActiveDatasetRawPreview";
import { DashboardBlocksRenderer } from "../DashboardBlocksRenderer";

interface DashboardPageProps {
  filteredData: LancamentoFinanceiro[];
  formatCurrency: (value: number) => string;
  activeDataset?: ActiveDataset | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ activeDataset: activeDatasetProp }) => {
  const activeDataset = activeDatasetProp || activeDatasetStore.getActiveDataset();
  const [dashboard, setDashboard] = React.useState<ExecutiveDashboard | null>(null);
  const [mappingRevision, setMappingRevision] = React.useState(0);

  useEffect(() => {
    return subscribeModuleMappings(() => setMappingRevision(revision => revision + 1));
  }, []);

  useEffect(() => {
    if (activeDataset) {
      console.log(`[Sauron Instrumentation] DASHBOARD_RECEIVED_ACTIVE_DATASET - datasetId: ${activeDataset.datasetId}, sourceName: ${activeDataset.sourceName}, rowCount: ${activeDataset.rowCount}, columnCount: ${activeDataset.columnCount}, sourceType: ${activeDataset.sourceType}`);
    } else {
      console.log(`[Sauron Instrumentation] DASHBOARD_RECEIVED_ACTIVE_DATASET - datasetId: null, sourceName: null, rowCount: 0, columnCount: 0, sourceType: null`);
    }
  }, [activeDataset]);

  useEffect(() => {
    let isMounted = true;

    if (!activeDataset) {
      setDashboard(null);
      return;
    }

    const projectId = getDefaultProjectId(activeDataset);
    const moduleMappings = listModuleMappings(activeDataset.datasetId, projectId);

    buildExecutiveDashboard({ activeDataset, moduleMappings }).then(result => {
      if (isMounted) setDashboard(result);
    });

    return () => {
      isMounted = false;
    };
  }, [activeDataset?.datasetId, activeDataset?.importedAt, mappingRevision]);

  if (!activeDataset) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
          <FileSpreadsheet className="text-emerald-500 w-12 h-12" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Nenhuma fonte de dados ativa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in bg-white dark:bg-slate-950">
      <ActiveDatasetRawPreview />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <Database className="text-blue-500 mb-3" size={18} />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fonte ativa</span>
          <p className="text-sm font-black text-slate-900 dark:text-white mt-1 truncate">{activeDataset.sourceName}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <TableProperties className="text-blue-500 mb-3" size={18} />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Linhas</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeDataset.rowCount.toLocaleString("pt-BR")}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <TableProperties className="text-blue-500 mb-3" size={18} />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Colunas</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeDataset.columnCount.toLocaleString("pt-BR")}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <FileSpreadsheet className="text-blue-500 mb-3" size={18} />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Abas</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeDataset.sheets.length.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {!dashboard ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">Preparando blocos executivos auditáveis...</p>
        </div>
      ) : (
        <DashboardBlocksRenderer blocks={dashboard.blocks} />
      )}
    </div>
  );
};
