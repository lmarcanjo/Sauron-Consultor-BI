import React, { useEffect } from "react";
import { Coins } from "lucide-react";
import { MetricasConsolidadas } from "../types";
import { ActiveDataset } from "../types/dataSource";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { getDefaultProjectId, listModuleMappings } from "../core/data/moduleMapping";
import { buildModuleDashboard, ExecutiveDashboard } from "../core/dashboard-engine";
import { DashboardBlocksRenderer } from "./DashboardBlocksRenderer";
import { ModuleFieldMappingPanel } from "./ModuleFieldMappingPanel";

interface ComercialTabProps {
  metrics: MetricasConsolidadas;
  formatCurrency: (v: number) => string;
  activeDataset?: ActiveDataset | null;
}

export const ComercialTab: React.FC<ComercialTabProps> = ({ activeDataset: activeDatasetProp }) => {
  const activeDataset = activeDatasetProp || activeDatasetStore.getActiveDataset();
  const [dashboard, setDashboard] = React.useState<ExecutiveDashboard | null>(null);
  const [mappingRevision, setMappingRevision] = React.useState(0);

  useEffect(() => {
    if (activeDataset) {
      console.log(`[Sauron Instrumentation] COMERCIAL_RECEIVED_ACTIVE_DATASET - datasetId: ${activeDataset.datasetId}, sourceName: ${activeDataset.sourceName}, rowCount: ${activeDataset.rowCount}, columnCount: ${activeDataset.columnCount}, sourceType: ${activeDataset.sourceType}`);
    } else {
      console.log(`[Sauron Instrumentation] COMERCIAL_RECEIVED_ACTIVE_DATASET - datasetId: null, sourceName: null, rowCount: 0, columnCount: 0, sourceType: null`);
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
    buildModuleDashboard("Comercial", { activeDataset, moduleMappings }).then(result => {
      if (isMounted) setDashboard(result);
    });

    return () => {
      isMounted = false;
    };
  }, [activeDataset?.datasetId, activeDataset?.importedAt, mappingRevision]);

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <Coins className="text-emerald-500 w-12 h-12" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Nenhuma fonte de dados ativa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <Coins size={15} className="text-blue-500" />
          <span>Dashboard comercial com dados reais</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-4">
          Blocos calculados pelo Executive Dashboard Engine a partir do ActiveDataset e dos campos mapeados.
        </p>
        <ModuleFieldMappingPanel
          moduleName="Comercial"
          activeDataset={activeDataset}
          onSaved={() => setMappingRevision(revision => revision + 1)}
        />
      </div>

      {!dashboard ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
          <Coins className="text-emerald-500 w-12 h-12" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Carregando Dados Reais</h3>
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Preparando blocos comerciais auditáveis.</p>
        </div>
      ) : (
        <DashboardBlocksRenderer blocks={dashboard.blocks} />
      )}
    </div>
  );
};
