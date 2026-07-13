import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Zap,
  BookOpen,
  GitMerge,
  PieChart,
  Calendar,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { workspaceIntelligenceEngine } from "../core/workspace-intelligence/WorkspaceIntelligenceEngine";
import { Workspace } from "../core/workspace-intelligence/WorkspaceIntelligenceTypes";
import { businessDomainEngine } from "../core/business-domains";

const DOMAIN_LABELS: Record<string, string> = {
  shared: "Geral / Compartilhado",
  automotive: "Automotivo",
  agribusiness: "Agronegócio",
  retail: "Varejo",
  industry: "Indústria",
  construction: "Construção Civil",
  healthcare: "Saúde",
  education: "Educação",
  services: "Serviços"
};

export const DomainContextPanel: React.FC = () => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("");

  useEffect(() => {
    return workspaceIntelligenceEngine.contextManager.subscribe(ctx => {
      if (ctx.currentWorkspace) {
        const allWorkspaces = workspaceIntelligenceEngine.getWorkspaceRegistry().workspaces;
        const latestWorkspace = (allWorkspaces[ctx.currentWorkspace.id] || ctx.currentWorkspace) as Workspace;
        setWorkspace(latestWorkspace);
        setSelectedDomain(latestWorkspace.manualDomain || latestWorkspace.detectedDomain || latestWorkspace.businessDomain || "shared");
      } else {
        setWorkspace(null);
      }
    });
  }, []);

  if (!workspace) return null;

  const detectedDomain = workspace.detectedDomain || workspace.businessDomain || "shared";
  const manualDomain = workspace.manualDomain;
  const confidence = workspace.domainConfidence ?? 1.0;
  
  const activeDomain = manualDomain || detectedDomain;
  const isConfidenceLow = confidence < 0.60 && !manualDomain;

  const vocabulary = businessDomainEngine.getVocabulary(activeDomain);
  const hierarchy = businessDomainEngine.getHierarchy(activeDomain);
  const kpis = businessDomainEngine.getKPIs(activeDomain);
  const meeting = businessDomainEngine.getMeetingTemplate(activeDomain);

  const handleSaveDomain = (domainId: string) => {
    workspaceIntelligenceEngine.updateWorkspaceDomain(workspace.id, domainId);
    setSelectedDomain(domainId);
    setIsReviewing(false);
    // Reload mappings and reload page logic
    window.location.reload();
  };

  return (
    <section className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 font-sans">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Segmento de Atuação
              </span>
              {manualDomain ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  Manual
                </span>
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConfidenceLow 
                    ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                }`}>
                  Identificado ({Math.round(confidence * 100)}%)
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {DOMAIN_LABELS[activeDomain] || DOMAIN_LABELS.shared}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsReviewing(!isReviewing)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-black uppercase tracking-wider self-start lg:self-center"
        >
          <Settings size={15} />
          Revisar Domínio
        </button>
      </div>

      {/* Low Confidence Warning Alert */}
      {isConfidenceLow && !isReviewing && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300">
          <AlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={18} />
          <div className="text-xs space-y-1">
            <p className="font-extrabold">Domínio não confirmado</p>
            <p className="font-bold opacity-90">
              A confiança na detecção automática é baixa. Selecione manualmente o domínio abaixo para obter as melhores sugestões e rotulagens.
            </p>
            <button
              onClick={() => setIsReviewing(true)}
              className="mt-2 text-xs font-black underline hover:no-underline"
            >
              Escolher domínio agora
            </button>
          </div>
        </div>
      )}

      {/* Review manual override selection */}
      {isReviewing && (
        <div className="bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 animate-fade-in">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Selecione o domínio do negócio
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(DOMAIN_LABELS).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedDomain(id)}
                className={`p-3 rounded-lg text-left text-xs font-bold border transition-all ${
                  selectedDomain === id
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReviewing(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSaveDomain(selectedDomain)}
              className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-black uppercase tracking-wider transition-colors"
            >
              <CheckCircle2 size={14} />
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Main Grid display details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Vocabulary & Hierarchy (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Vocabulary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <BookOpen className="text-blue-500" size={18} />
              <h3 className="text-xs font-black uppercase tracking-wider">Vocabulário Técnico</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {vocabulary?.terms.slice(0, 5).map(term => (
                <div key={term.term} className="flex items-start justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{term.term}</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {term.synonyms.map(syn => (
                      <span key={syn} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {!vocabulary?.terms.length && (
                <p className="text-xs text-slate-500 font-bold">Nenhum vocabulário customizado.</p>
              )}
            </div>
          </div>

          {/* Hierarchy Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <GitMerge className="text-blue-500 rotate-90" size={18} />
              <h3 className="text-xs font-black uppercase tracking-wider">Hierarquia Corporativa</h3>
            </div>
            {hierarchy && (
              <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-950">
                {hierarchy.levels.map((lvl, idx) => (
                  <React.Fragment key={lvl}>
                    {idx > 0 && <ChevronRight className="text-slate-400" size={14} />}
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 px-2.5 py-1 rounded-lg">
                      {lvl}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
            {!hierarchy && (
              <p className="text-xs text-slate-500 font-bold">Estrutura organizacional padrão.</p>
            )}
          </div>
        </div>

        {/* Right column: KPIs & Meeting (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Suggested KPIs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <PieChart className="text-blue-500" size={18} />
              <h3 className="text-xs font-black uppercase tracking-wider">Sugestões de KPIs</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {kpis.slice(0, 4).map(kpi => (
                <div key={kpi.code} className="p-3 border border-slate-100 dark:border-slate-800/80 rounded-lg bg-slate-50 dark:bg-slate-950/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{kpi.name}</span>
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {kpi.unit}
                    </span>
                  </div>
                  {kpi.description && (
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-2">
                      {kpi.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Script */}
          {meeting && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Calendar className="text-blue-500" size={18} />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Roteiro de Reunião Sugerido</h3>
                </div>
              </div>

              <div className="space-y-4">
                {/* Subject Timeline */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ordem do Dia / Tópicos</h4>
                  <div className="flex flex-col gap-2">
                    {meeting.subjectOrder.map((subj, idx) => (
                      <div key={subj} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span className="font-extrabold">{subj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KPIs & Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 block">
                      KPIs Obrigatórios
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {meeting.mandatoryKpis.map(k => (
                        <span key={k} className="text-[9px] font-extrabold text-indigo-700 bg-indigo-500/10 px-2 py-0.5 rounded">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 block">
                      KPIs Opcionais
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {meeting.optionalKpis.map(k => (
                        <span key={k} className="text-[9px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Questions & Risks */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 block">
                    Perguntas Estratégicas e Riscos
                  </span>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-bold">
                    {meeting.suggestedQuestions.map(q => (
                      <li key={q}>{q}</li>
                    ))}
                    {meeting.riscos.map(r => (
                      <li key={r} className="text-amber-600 dark:text-amber-400 list-none flex items-start gap-1">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                        <span>Risco: {r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
