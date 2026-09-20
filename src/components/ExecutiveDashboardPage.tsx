/** MVP-3 executive projection page. */

import React, { useEffect, useState } from "react";
import { BarChart3, FileSpreadsheet, RefreshCw } from "lucide-react";
import type { ActiveDataset } from "../types/dataSource";
import type { PlatformUser } from "../core/identity/types";
import type { PreliminaryFinancialAnalysisArtifact } from "../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ModuleActivationProjection } from "../core/module-activation/ModuleActivationContracts";
import type { WorkspaceProject } from "../modules/consultant-workspace/types";
import { executiveDeliverablesService } from "../core/executive-deliverables";
import { identityEngine } from "../core/identity/IdentityEngine";
import { PreliminaryFinancialDashboard } from "./PreliminaryFinancialDashboard";
import { ExecutiveSummaryPanel } from "./ExecutiveSummaryPanel";
import { ExecutiveDeliverablesCenter } from "./ExecutiveDeliverablesCenter";

interface ExecutiveDashboardPageProps {
  activeDataset?: ActiveDataset | null;
  onOpenPresentation?: () => void;
  onOpenAnalysis?: () => void;
}

export const ExecutiveDashboardPage: React.FC<ExecutiveDashboardPageProps> = ({ activeDataset, onOpenPresentation, onOpenAnalysis }) => {
  const [artifact, setArtifact] = useState<PreliminaryFinancialAnalysisArtifact | null>(null);
  const [project, setProject] = useState<WorkspaceProject | null>(null);
  const [moduleProjections, setModuleProjections] = useState<ModuleActivationProjection[]>([]);
  const [hasOutdatedPresentation, setHasOutdatedPresentation] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const currentUser = identityEngine.getCurrentUser() as PlatformUser | null;

  useEffect(() => {
    let mounted = true;
    setState("loading");
    setError(null);
    setHasOutdatedPresentation(false);
    void executiveDeliverablesService.loadActiveArtifact(activeDataset || null, currentUser).then(async result => {
      if (!mounted) return;
      if (!result.artifact) { setProject(result.project); setArtifact(null); setModuleProjections([]); setState("empty"); return; }
      const projections = await executiveDeliverablesService.resolveModuleProjections(result.artifact, currentUser);
      if (!mounted) return;
      setProject(result.project);
      setHasOutdatedPresentation(Boolean(result.project?.presentations?.some(item => item.status === "OUTDATED")));
      setArtifact(result.artifact);
      setModuleProjections(projections);
      setState("ready");
    }).catch(caught => {
      if (!mounted) return;
      setError(caught instanceof Error ? caught.message : "Não foi possível abrir a análise executiva.");
      setState("error");
    });
    return () => { mounted = false; };
  }, [activeDataset?.datasetId, activeDataset?.importedAt]);

  if (!activeDataset) return <EmptyState message="Nenhuma fonte de dados ativa." />;
  if (state === "loading") return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950" role="status">Abrindo a análise executiva...</div>;
  if (state === "error") return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-bold text-rose-700" role="alert"><p>{error}</p>{onOpenAnalysis && <button type="button" onClick={onOpenAnalysis} className="mt-4 rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white">ABRIR ANÁLISE DA FONTE</button>}</div>;
  if (state === "empty" || !artifact) return <EmptyState message="A fonte está ativa, mas ainda não existe uma análise concluída. Abra a análise da fonte para continuar." onAction={onOpenAnalysis} />;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="executive-dashboard-page">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-600"><BarChart3 size={14} /> DASHBOARD EXECUTIVO · PRELIMINARY</div><h1 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{project?.client || artifact.sourceFileName}</h1><p className="mt-1 text-xs font-semibold text-slate-500">{artifact.sourceFileName} · atualização {new Date(artifact.generatedAt).toLocaleString("pt-BR")}</p></div>
          <div className="flex gap-2">{onOpenPresentation && <button type="button" onClick={onOpenPresentation} className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white" data-testid="dashboard-open-presentation">ABRIR APRESENTAÇÃO</button>}</div>
        </div>
      </header>
      {hasOutdatedPresentation && <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200" data-testid="outdated-presentation-notice"><span>Existe uma análise mais recente. Atualizar apresentação?</span>{onOpenPresentation && <button type="button" onClick={onOpenPresentation} className="self-start rounded-lg bg-amber-700 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white">ATUALIZAR APRESENTAÇÃO</button>}</div>}
      <ExecutiveSummaryPanel artifact={artifact} project={project} moduleProjections={moduleProjections} onOpenPresentation={onOpenPresentation} />
      <section data-testid="executive-financial-dashboard"><PreliminaryFinancialDashboard artifact={artifact} onNavigateToAnalysis={onOpenAnalysis} /></section>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-testid="executive-visualization-grid">
        {artifact.temporalSeries.map(series => <ArtifactVisualization key={series.seriesCode} title={series.seriesLabel} values={series.items.map(item => ({ label: item.periodKey, value: item.valueTotal }))} kind="temporal" />)}
        {artifact.groupings.map(group => <ArtifactVisualization key={group.dimensionCode} title={group.dimensionLabel} values={group.items.slice(0, 10).map(item => ({ label: item.displayName, value: item.valueTotal }))} kind="grouping" />)}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950" data-testid="executive-source-inventory">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><FileSpreadsheet size={16} /> Inventário da Fonte</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-4"><Fact label="Arquivo" value={artifact.sourceFileName} /><Fact label="Formato" value={artifact.sourceFileName.split(".").pop()?.toUpperCase() || "Arquivo"} /><Fact label="Aba" value={artifact.containerId} /><Fact label="Linhas" value={artifact.physicalRowCount.toLocaleString("pt-BR")} /><Fact label="Colunas" value={String(artifact.columnCount)} /><Fact label="Fonte" value={artifact.dataSourceId} /><Fact label="Schema" value={String(artifact.schemaVersionNumber)} /><Fact label="Escopo" value={`${artifact.organizationalScope.scopeType}: ${artifact.organizationalScope.targetId}`} /></div>
        <p className="mt-3 text-[10px] font-semibold text-slate-500">Campos físicos: {artifact.physicalFields.map(field => field.displayName || field.physicalName).join(", ") || "Nenhum campo registrado"}</p>
        <p className="mt-3 break-all text-[10px] font-mono text-slate-500">Fingerprint: {artifact.sourceFingerprint} · Artefato: {artifact.fingerprint}</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950" data-testid="executive-data-quality-report">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">Relatório de Qualidade da Base</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-5"><Fact label="Linhas físicas" value={String(artifact.physicalRowCount)} /><Fact label="Linhas válidas" value={String(artifact.validRowCount)} /><Fact label="Linhas excluídas" value={String(artifact.excludedRowCount)} /><Fact label="Achados" value={String(artifact.qualityFindings.length)} /><Fact label="Limitações" value={String(artifact.limitations.length)} /></div>
        <ul className="mt-3 grid grid-cols-1 gap-1 text-[11px] font-semibold text-slate-500 md:grid-cols-2"><li>Campos sem cabeçalho: {artifact.physicalFields.filter(field => !field.physicalName.trim()).length}</li><li>Campos não utilizados: {artifact.physicalFields.filter(field => field.usageStatus !== "USED").length}</li><li>Valores inválidos registrados: {artifact.qualityFindings.filter(item => /VALUE|VALOR/i.test(item.code)).length}</li><li>Datas inválidas registradas: {artifact.qualityFindings.filter(item => /DATE|DATA/i.test(item.code)).length}</li></ul>
      </section>
      <ExecutiveDeliverablesCenter artifact={artifact} project={project} moduleProjections={moduleProjections} onOpenPresentation={onOpenPresentation} />
    </div>
  );
};

const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => <div><p className="font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate font-bold text-slate-700 dark:text-slate-300" title={value}>{value}</p></div>;
const ArtifactVisualization: React.FC<{ title: string; values: Array<{ label: string; value: number }>; kind: "temporal" | "grouping" }> = ({ title, values, kind }) => <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" data-testid={`executive-visualization-${kind}-${title}`}><h2 className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</h2><div className="mt-3 space-y-2">{values.length === 0 ? <p className="text-xs font-semibold text-slate-400">Nenhum registro disponível no artefato.</p> : values.map((item, index) => <div key={`${title}-${item.label}-${index}`} className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold text-slate-600 dark:text-slate-300">{item.label}</span><span className="font-black text-slate-900 dark:text-white">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value)}</span></div>)}</div></div>;
const EmptyState: React.FC<{ message: string; onAction?: () => void }> = ({ message, onAction }) => <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950" data-testid="executive-dashboard-empty"><FileSpreadsheet className="mx-auto text-slate-400" size={36} /><p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">{message}</p>{onAction && <button type="button" onClick={onAction} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white"><RefreshCw size={13} /> ABRIR ANÁLISE DA FONTE</button>}</div>;

export default ExecutiveDashboardPage;
