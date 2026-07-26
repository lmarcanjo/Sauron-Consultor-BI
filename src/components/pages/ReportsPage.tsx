import React from "react";
import { ArrowRight, CheckCircle2, FileText, Info, LockKeyhole } from "lucide-react";
import { activeDatasetStore } from "../../core/data/ActiveDatasetStore";
import { getDefaultProjectId, listModuleMappings } from "../../core/data/moduleMapping";
import { chaosProfilingRepository } from "../../core/chaos-data-profiling/ChaosProfilingRepository";
import { PLATFORM_EVENTS, subscribePlatformEvent } from "../../core/events/PlatformEvents";

interface ReportsPageProps {
  setActivePage?: (id: string) => void;
}

type ReportStatus = "DISPONÍVEL" | "REQUER INFORMAÇÃO" | "NÃO APLICÁVEL";

interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  mappingNames: string[];
}

const REPORTS: ReportDefinition[] = [
  { id: "resumo", title: "Visão Executiva", description: "Resumo da fonte confirmada e dos indicadores disponíveis.", mappingNames: [] },
  { id: "financeiro", title: "Financeiro", description: "Valores financeiros confirmados na fonte.", mappingNames: ["Financeiro"] },
  { id: "comercial", title: "Comercial", description: "Vendas, produtos, clientes e responsáveis encontrados.", mappingNames: ["Comercial"] },
  { id: "comissoes", title: "Pessoas", description: "Pessoas e vendedores confirmados na fonte.", mappingNames: ["Pessoas", "Comissão"] },
  { id: "dre_inteligente", title: "Resultado financeiro", description: "Receita, custos e despesas somente quando confirmados.", mappingNames: ["DRE"] },
];

function getReportStatus(report: ReportDefinition, hasSource: boolean, hasConfirmedView: boolean, mappings: string[]): ReportStatus {
  if (!hasSource) return "NÃO APLICÁVEL";
  if (report.mappingNames.length === 0) return hasConfirmedView ? "DISPONÍVEL" : "REQUER INFORMAÇÃO";
  if (!hasConfirmedView) return "REQUER INFORMAÇÃO";
  return report.mappingNames.some(name => mappings.includes(name)) ? "DISPONÍVEL" : "REQUER INFORMAÇÃO";
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ setActivePage }) => {
  const [revision, setRevision] = React.useState(0);
  const activeDataset = activeDatasetStore.getActiveDataset();
  const sourceId = activeDataset?.sourceIdentity?.sourceId || activeDataset?.datasetId || "";
  const confirmedView = sourceId ? chaosProfilingRepository.getConfirmedViewSync(sourceId) : null;
  const mappings = activeDataset
    ? listModuleMappings(activeDataset.datasetId, getDefaultProjectId(activeDataset)).map(mapping => mapping.moduleName)
    : [];

  React.useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    const unsubscribeDataset = activeDatasetStore.subscribe(refresh);
    const unsubscribeSource = subscribePlatformEvent(PLATFORM_EVENTS.SOURCE_CONFIGURED, refresh);
    const unsubscribeProfiling = chaosProfilingRepository.subscribe(refresh);
    return () => {
      unsubscribeDataset();
      unsubscribeSource();
      unsubscribeProfiling();
    };
  }, []);

  void revision;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <header className="flex items-start gap-3 border-b border-slate-200 pb-5 dark:border-slate-800">
        <FileText className="mt-0.5 text-blue-600" size={20} aria-hidden="true" />
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Resultados disponíveis</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cada resultado informa a fonte utilizada e o que ainda precisa ser confirmado.
          </p>
        </div>
      </header>

      {!activeDataset && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Nenhuma fonte de dados ativa.</p>
          <button type="button" onClick={() => setActivePage?.("central_dados")} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase text-white">
            Abrir Fontes de Dados <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(report => {
          const status = getReportStatus(report, Boolean(activeDataset), Boolean(confirmedView), mappings);
          const available = status === "DISPONÍVEL";
          const needsReview = status === "REQUER INFORMAÇÃO";
          return (
            <article key={report.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{report.title}</h3>
                {available ? <CheckCircle2 className="text-emerald-600" size={16} aria-label="Disponível" /> : needsReview ? <Info className="text-amber-600" size={16} aria-label="Requer informação" /> : <LockKeyhole className="text-slate-400" size={16} aria-label="Não aplicável" />}
              </div>
              <span className={`mt-3 w-fit rounded px-2 py-1 text-[9px] font-black uppercase tracking-wider ${available ? "bg-emerald-50 text-emerald-700" : needsReview ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                {status}
              </span>
              <p className="mt-3 flex-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">{report.description}</p>
              <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {available ? `Fonte: ${activeDataset?.sourceName || "fonte selecionada"}` : needsReview ? "Confirme esta informação em Análise da fonte." : "Não encontramos dados suficientes nesta fonte."}
              </p>
              {available ? (
                <button type="button" onClick={() => setActivePage?.(report.id)} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black uppercase text-white">
                  Abrir resultado <ArrowRight size={12} aria-hidden="true" />
                </button>
              ) : needsReview ? (
                <button type="button" onClick={() => setActivePage?.("analise_estrutura")} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-[10px] font-black uppercase text-amber-800 dark:border-amber-800 dark:text-amber-300">
                  Revisar análise da fonte <ArrowRight size={12} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" onClick={() => setActivePage?.("resumo")} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-black uppercase text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Voltar aos resultados disponíveis <ArrowRight size={12} aria-hidden="true" />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
