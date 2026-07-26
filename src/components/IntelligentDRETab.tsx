import React from "react";
import { Calculator } from "lucide-react";
import { LancamentoFinanceiro } from "../types";
import { ActiveDataset } from "../types/dataSource";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { getDefaultProjectId, listModuleMappings } from "../core/data/moduleMapping";
import { buildModuleDashboard, ExecutiveDashboard } from "../core/dashboard-engine";
import { DashboardBlocksRenderer } from "./DashboardBlocksRenderer";
import { ReviewSourceAnalysisAction } from "./ReviewSourceAnalysisAction";
import { platformLogger } from "../core/platform/PlatformLogger";
import { getEnterpriseContext } from "../core/enterprise-consolidation";

interface IntelligentDRETabProps {
  filteredData: LancamentoFinanceiro[];
  formatCurrency: (v: number) => string;
  activeIndustryTemplateId: string;
  activeDataset?: ActiveDataset | null;
  onOpenSourceAnalysis?: () => void;
}

export const IntelligentDRETab: React.FC<IntelligentDRETabProps> = ({
  activeDataset: activeDatasetProp,
  onOpenSourceAnalysis,
}) => {
  const [activeDatasetState, setActiveDataset] = React.useState(activeDatasetStore.getActiveDataset());
  const activeDataset = activeDatasetProp || activeDatasetState;
  const [dashboard, setDashboard] = React.useState<ExecutiveDashboard | null>(null);
  const [hasMapping, setHasMapping] = React.useState(false);
  const [mappingRevision, setMappingRevision] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = activeDatasetStore.subscribe((event) => {
      if (event.type === "DATASET_ACTIVATED" || event.type === "DATASET_REHYDRATED" || event.type === "DATASET_REMOVED") {
        setActiveDataset(activeDatasetStore.getActiveDataset());
      }
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (activeDataset) {
      platformLogger.info(`[Sauron Instrumentation] DRE_RECEIVED_ACTIVE_DATASET - datasetId: ${activeDataset.datasetId}, sourceName: ${activeDataset.sourceName}, rowCount: ${activeDataset.rowCount}, columnCount: ${activeDataset.columnCount}, sourceType: ${activeDataset.sourceType}`);
    } else {
      platformLogger.info("[Sauron Instrumentation] DRE_RECEIVED_ACTIVE_DATASET - datasetId: null, sourceName: null, rowCount: 0, columnCount: 0, sourceType: null");
    }
  }, [activeDataset]);

  React.useEffect(() => {
    let isMounted = true;

    if (!activeDataset) {
      setDashboard(null);
      return;
    }

    const projectId = getDefaultProjectId(activeDataset);
    const moduleMappings = listModuleMappings(activeDataset.datasetId, projectId);
    setHasMapping(moduleMappings.some(mapping => mapping.moduleName === "DRE"));
    const context = getEnterpriseContext();
    buildModuleDashboard("DRE", {
      activeDataset,
      moduleMappings,
      contextType: context.scope,
      contextId: context.unitId || context.companyId || context.groupId || activeDataset.datasetId,
      workspaceId: context.workspaceId,
      period: context.period,
    }).then(result => {
      if (isMounted) setDashboard(result);
    });

    return () => {
      isMounted = false;
    };
  }, [activeDataset?.datasetId, activeDataset?.importedAt, mappingRevision]);

  if (!activeDataset) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
        <Calculator className="text-emerald-500 w-12 h-12" />
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Configuração Pendente</h3>
        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Nenhuma fonte de dados ativa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans animate-fade-in text-slate-800 dark:text-slate-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <Calculator size={15} className="text-blue-500" />
          <span>Resultado financeiro</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-4">
          O resultado só é calculado quando Receita, Custos e Despesas forem identificados na planilha. Confirme as informações abaixo.
        </p>
      </div>

      {!dashboard ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm font-sans">
          <Calculator className="text-emerald-500 w-12 h-12" />
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Preparando seu resultado financeiro</h3>
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Lendo os valores da planilha.</p>
        </div>
      ) : hasMapping ? (
        <DashboardBlocksRenderer blocks={dashboard.blocks} />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs font-semibold text-amber-800 dark:text-amber-200">
          <p>Esta análise precisa de uma informação ainda não confirmada.</p>
          <div className="mt-3"><ReviewSourceAnalysisAction onOpen={onOpenSourceAnalysis} /></div>
        </div>
      )}
    </div>
  );
};
