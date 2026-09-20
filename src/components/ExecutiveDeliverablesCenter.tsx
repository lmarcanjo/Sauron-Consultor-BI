import React, { useEffect, useState } from "react";
import { CheckCircle2, Download, FileDown, History, Presentation, Save, ShieldAlert } from "lucide-react";
import type { PreliminaryFinancialAnalysisArtifact } from "../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ModuleActivationProjection } from "../core/module-activation/ModuleActivationContracts";
import type { WorkspaceProject } from "../modules/consultant-workspace/types";
import type { ExecutivePresentation } from "../core/business-intelligence/ExecutivePresentationEngine";
import { executiveDeliverablesService, executivePdfExportService, executivePresentationExportService, executiveSnapshotService } from "../core/executive-deliverables";
import { identityEngine } from "../core/identity/IdentityEngine";

interface ExecutiveDeliverablesCenterProps {
  artifact: PreliminaryFinancialAnalysisArtifact;
  project: WorkspaceProject | null;
  moduleProjections: readonly ModuleActivationProjection[];
  onOpenPresentation?: () => void;
}

type OperationState = "idle" | "running" | "success" | "error";

function downloadFile(file: { bytes: Uint8Array; fileName: string; mimeType: string }): void {
  const blob = new Blob([file.bytes as BlobPart], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export const ExecutiveDeliverablesCenter: React.FC<ExecutiveDeliverablesCenterProps> = ({ artifact, project, moduleProjections, onOpenPresentation }) => {
  const [presentation, setPresentation] = useState<ExecutivePresentation | null>(null);
  const [snapshots, setSnapshots] = useState<Awaited<ReturnType<typeof executiveSnapshotService.listSnapshots>>>([]);
  const [pdfState, setPdfState] = useState<OperationState>("idle");
  const [pptxState, setPptxState] = useState<OperationState>("idle");
  const [snapshotState, setSnapshotState] = useState<OperationState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [label, setLabel] = useState(`Análise ${new Date().toLocaleDateString("pt-BR")}`);
  const currentUser = identityEngine.getCurrentUser();

  useEffect(() => {
    let mounted = true;
    void executiveDeliverablesService.getPersistedPresentation(artifact, project).then(value => { if (mounted) setPresentation(value); });
    void executiveSnapshotService.listSnapshots(artifact.engagementId, currentUser).then(value => { if (mounted) setSnapshots(value); }).catch(() => { if (mounted) setSnapshots([]); });
    return () => { mounted = false; };
  }, [artifact.artifactId, artifact.fingerprint, project?.id]);

  const context = presentation && project ? { artifact, project, presentation, moduleProjections } : null;

  const exportPdf = async () => {
    if (!context) { setMessage("A apresentação desta análise ainda não está disponível."); return; }
    setPdfState("running"); setMessage(null);
    try { const file = await executivePdfExportService.export(context, currentUser); downloadFile(file); setPdfState("success"); setMessage(`PDF GERADO COM SUCESSO: ${file.fileName}`); }
    catch (error) { setPdfState("error"); setMessage(error instanceof Error ? error.message : "NÃO FOI POSSÍVEL GERAR O PDF"); }
  };

  const exportPptx = async () => {
    if (!context) { setMessage("A apresentação desta análise ainda não está disponível."); return; }
    setPptxState("running"); setMessage(null);
    try { const file = await executivePresentationExportService.export(context, currentUser); downloadFile(file); setPptxState("success"); setMessage(`POWERPOINT GERADO COM SUCESSO: ${file.fileName}`); }
    catch (error) { setPptxState("error"); setMessage(error instanceof Error ? error.message : "NÃO FOI POSSÍVEL GERAR O POWERPOINT"); }
  };

  const saveSnapshot = async () => {
    if (!presentation) { setMessage("A apresentação precisa estar disponível antes de salvar um snapshot."); return; }
    setSnapshotState("running"); setMessage(null);
    try { await executiveSnapshotService.createSnapshot({ artifact, presentationId: presentation.id, label }, currentUser); setSnapshots(await executiveSnapshotService.listSnapshots(artifact.engagementId, currentUser)); setSnapshotState("success"); setMessage("SNAPSHOT SALVO COM SUCESSO"); }
    catch (error) { setSnapshotState("error"); setMessage(error instanceof Error ? error.message : "NÃO FOI POSSÍVEL SALVAR O SNAPSHOT"); }
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950" data-testid="executive-deliverables-center">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-600"><FileDown size={14} /> Centro de Entregáveis</div><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Materiais disponíveis</h2><p className="mt-1 text-xs font-semibold text-slate-500">Arquivos derivados da análise persistida, sem registros individuais.</p></div>
        {onOpenPresentation && <button type="button" onClick={onOpenPresentation} className="rounded-lg border border-slate-300 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:text-slate-200" data-testid="deliverables-open-presentation"><Presentation size={13} className="mr-1 inline" /> EDITAR APRESENTAÇÃO</button>}
      </header>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">{["Resumo Executivo", "Dashboard Financeiro", "Qualidade dos Dados", "Inventário da Fonte", "Apresentação Executiva"].map(item => <div key={item} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[10px] font-black text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 size={14} />{item}</div>)}</div>
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800" data-testid="deliverables-unavailable-modules"><h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><ShieldAlert size={14} /> Módulos e motivos</h3><div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-5">{moduleProjections.map(module => <div key={module.moduleId} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"><p className="text-[10px] font-black text-slate-600 dark:text-slate-300">{module.moduleId}</p><p className="mt-1 text-xs font-black text-slate-900 dark:text-white">{module.status}</p>{module.status !== "ACTIVE" && <p className="mt-1 text-[10px] font-semibold text-slate-500">{module.missingRequirements.join(", ") || module.limitations[0] || "Dados não disponíveis"}</p>}</div>)}</div></div>
      <div className="flex flex-wrap gap-2" data-testid="deliverables-actions"><button type="button" onClick={exportPdf} disabled={pdfState === "running"} className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-50" data-testid="export-executive-pdf"><Download size={13} /> {pdfState === "running" ? "GERANDO PDF..." : "EXPORTAR RELATÓRIO PDF"}</button><button type="button" onClick={exportPptx} disabled={pptxState === "running"} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-50" data-testid="export-executive-pptx"><Presentation size={13} /> {pptxState === "running" ? "GERANDO POWERPOINT..." : "EXPORTAR POWERPOINT"}</button><input aria-label="Nome do snapshot" value={label} onChange={event => setLabel(event.target.value)} className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /><button type="button" onClick={saveSnapshot} disabled={snapshotState === "running"} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-50" data-testid="save-executive-snapshot"><Save size={13} /> {snapshotState === "running" ? "SALVANDO..." : "SALVAR SNAPSHOT"}</button></div>
      {message && <p className={`text-xs font-bold ${pdfState === "error" || pptxState === "error" || snapshotState === "error" ? "text-rose-600" : "text-emerald-700"}`} role="status" data-testid="deliverables-operation-status">{message}</p>}
      <div className="border-t border-slate-200 pt-4 dark:border-slate-800" data-testid="executive-snapshot-history"><h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><History size={14} /> Histórico</h3>{snapshots.length === 0 ? <p className="mt-2 text-xs font-semibold text-slate-400">Nenhum snapshot salvo ainda.</p> : <div className="mt-2 space-y-2">{snapshots.map(snapshot => <div key={snapshot.snapshotId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800"><span className="font-black text-slate-800 dark:text-slate-200">{snapshot.label}</span><span className="text-slate-500">{new Date(snapshot.createdAt).toLocaleString("pt-BR")} · v{snapshot.version} · {snapshot.status}</span></div>)}</div>}</div>
    </section>
  );
};

export default ExecutiveDeliverablesCenter;
