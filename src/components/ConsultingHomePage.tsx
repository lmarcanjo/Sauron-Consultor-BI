/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  Briefcase, Building2, Database, BarChart3, Presentation,
  FileDown, MonitorPlay, ArrowRight, CheckCircle2, AlertTriangle,
  XCircle, Clock, ShieldCheck, ChevronRight, RefreshCw, Plus, Users, CheckSquare, Layers
} from "lucide-react";
import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { identityEngine } from "../core/identity/IdentityEngine";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { executiveDeliverablesService, executiveSnapshotService } from "../core/executive-deliverables";
import { enterpriseRepository, BusinessGroup, Company, Unit } from "../core/persistence/EnterpriseRepository";
import { projectConsultingProgress, ConsultingProgressContext, ConsultingProgressProjection } from "../core/consulting-journey/ConsultingProgressProjection";
import { projectMeetingReadiness, MeetingReadinessProjection } from "../core/consulting-journey/MeetingReadinessProjection";
import type { WorkspaceProject, ClientEntity } from "../modules/consultant-workspace/types";
import type { PreliminaryFinancialAnalysisArtifact } from "../core/preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ModuleActivationProjection } from "../core/module-activation/ModuleActivationContracts";
import type { ExecutivePresentation } from "../core/business-intelligence/ExecutivePresentationEngine";

interface ConsultingHomePageProps {
  onNavigateTab: (tab: string) => void;
}

export const ConsultingHomePage: React.FC<ConsultingHomePageProps> = ({ onNavigateTab }) => {
  const currentUser = identityEngine.getCurrentUser();
  const [project, setProject] = useState<WorkspaceProject | null>(null);
  const [client, setClient] = useState<ClientEntity | null>(null);
  const [groups, setGroups] = useState<BusinessGroup[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeDataset, setActiveDataset] = useState(activeDatasetStore.getActiveDataset());
  const [artifact, setArtifact] = useState<PreliminaryFinancialAnalysisArtifact | null>(null);
  const [moduleProjections, setModuleProjections] = useState<ModuleActivationProjection[]>([]);
  const [presentation, setPresentation] = useState<ExecutivePresentation | null>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const activeProj = await consultantWorkspaceManager.getActiveProject();
      setProject(activeProj);

      if (activeProj) {
        // Load Client
        if (activeProj.clientId) {
          const clientData = await consultantWorkspaceManager.clientService.getClientById(activeProj.clientId, currentUser);
          setClient(clientData);
        } else {
          setClient(null);
        }

        // Load Org structure
        const orgService = consultantWorkspaceManager.organizationService;
        const nextGroups = await orgService.listGroupsByEngagement(activeProj.id, currentUser);
        const nextCompanies: Company[] = [];
        const nextUnits: Unit[] = [];
        for (const group of nextGroups) {
          const groupCompanies = await orgService.listCompaniesByGroup(group.id, currentUser);
          nextCompanies.push(...groupCompanies);
          for (const company of groupCompanies) {
            nextUnits.push(...await orgService.listUnitsByCompany(company.id, currentUser));
          }
        }
        setGroups(nextGroups);
        setCompanies(nextCompanies);
        setUnits(nextUnits);

        // Load Artifact & Deliverables
        const currentDataset = activeDatasetStore.getActiveDataset();
        setActiveDataset(currentDataset);

        if (currentDataset) {
          const artifactResult = await executiveDeliverablesService.loadActiveArtifact(currentDataset, currentUser);
          if (artifactResult.artifact) {
            setArtifact(artifactResult.artifact);
            const projections = await executiveDeliverablesService.resolveModuleProjections(artifactResult.artifact, currentUser);
            setModuleProjections(projections);

            const pres = await executiveDeliverablesService.getPersistedPresentation(artifactResult.artifact, activeProj);
            setPresentation(pres);

            const snapList = await executiveSnapshotService.listSnapshots(artifactResult.artifact.engagementId, currentUser);
            setSnapshots(snapList);
          } else {
            setArtifact(null);
            setModuleProjections([]);
            setPresentation(null);
            setSnapshots([]);
          }
        } else {
          setArtifact(null);
          setModuleProjections([]);
          setPresentation(null);
          setSnapshots([]);
        }
      } else {
        setClient(null);
        setGroups([]);
        setCompanies([]);
        setUnits([]);
        setArtifact(null);
        setModuleProjections([]);
        setPresentation(null);
        setSnapshots([]);
      }
    } catch (e) {
      console.error("Erro ao carregar dados da Consulting Home:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const unsubscribe = activeDatasetStore.subscribe(() => {
      void loadData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const progressContext: ConsultingProgressContext = useMemo(() => {
    const hasConducted = Boolean(project?.meetings && project.meetings.length > 0);
    const hasPending = Boolean(project?.meetings?.some(m => m.pendingItems && m.pendingItems.length > 0));
    return {
      client,
      project,
      groups,
      companies,
      units,
      activeDataset,
      artifact,
      moduleProjections,
      hasPresentation: Boolean(presentation && presentation.slides && presentation.slides.length > 0),
      hasPdfOrPptx: false, // Pure checklist
      hasSnapshot: snapshots.length > 0,
      hasConductedMeeting: hasConducted,
      hasPendingItems: hasPending
    };
  }, [client, project, groups, companies, units, activeDataset, artifact, moduleProjections, presentation, snapshots]);

  const progress = useMemo<ConsultingProgressProjection>(() => {
    return projectConsultingProgress(progressContext);
  }, [progressContext]);

  const readiness = useMemo<MeetingReadinessProjection>(() => {
    return projectMeetingReadiness(progressContext);
  }, [progressContext]);

  const lastMeeting = useMemo(() => {
    if (!project?.meetings || project.meetings.length === 0) return null;
    return project.meetings[0];
  }, [project?.meetings]);

  const getStepBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={11} /> Concluído</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"><Clock size={11} /> Em Andamento</span>;
      case "LIMITED":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><AlertTriangle size={11} /> Parcial</span>;
      case "BLOCKED":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"><XCircle size={11} /> Bloqueado</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">Não Iniciado</span>;
    }
  };

  const getReadinessBadge = (status: string) => {
    switch (status) {
      case "READY":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"><CheckCircle2 size={14} /> REUNIÃO PRONTA</span>;
      case "READY_WITH_LIMITATIONS":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"><AlertTriangle size={14} /> REUNIÃO PRONTA COM LIMITAÇÕES</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"><XCircle size={14} /> REUNIÃO NÃO PRONTA</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="consulting-home-loading">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-blue-600 mx-auto" size={28} />
          <p className="text-xs font-bold text-slate-500">Carregando jornada de consultoria...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm" data-testid="consulting-home-empty">
        <Briefcase className="mx-auto text-slate-400" size={36} />
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase">Nenhum Engajamento Selecionado</h2>
        <p className="text-xs text-slate-500">Selecione ou crie um engajamento na carteira para acessar a Home de Consultoria.</p>
        <button
          onClick={() => onNavigateTab("minha_carteira")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer inline-flex items-center gap-1.5"
          data-testid="home-open-portfolio"
        >
          <ArrowRight size={14} /> Acessar Carteira de Clientes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="consulting-home-page">
      {/* 1. Header & Identity */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Briefcase size={16} />
            <span>ASTERION — Home da Consultoria</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight" data-testid="consulting-client-name">
            {client?.legalName || project.client}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Engajamento: <strong className="text-slate-700 dark:text-slate-300" data-testid="consulting-engagement-name">{project.group}</strong></span>
            <span>·</span>
            <span>Consultor: <strong className="text-slate-700 dark:text-slate-300">{currentUser?.profile?.fullName || "Consultor Responsável"}</strong></span>
            <span>·</span>
            <span>Segmento: <strong className="text-slate-700 dark:text-slate-300">{project.segment}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab("minha_carteira")}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            data-testid="home-back-to-portfolio"
          >
            Voltar à Carteira
          </button>
        </div>
      </header>

      {/* 2. Próxima Ação & Jornada Banner (Highest Priority Section) */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-blue-800/50 space-y-4" data-testid="consulting-next-action-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 font-mono">JORNADA GUIADA · PRÓXIMA AÇÃO</span>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              {progress.nextAction.label}
            </h2>
            <p className="text-xs text-blue-100/80 max-w-2xl leading-relaxed">
              {progress.nextAction.description}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab(progress.nextAction.targetTab)}
            className="px-6 py-3 bg-white hover:bg-blue-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-transform active:scale-95 inline-flex items-center gap-2 shrink-0 cursor-pointer"
            data-testid="consulting-next-action-cta"
          >
            <span>{progress.nextAction.label}</span>
            <ArrowRight size={15} className="text-blue-600" />
          </button>
        </div>

        {/* Journey Progress Bar */}
        <div className="pt-2 border-t border-blue-800/60 flex items-center gap-4">
          <span className="text-xs font-bold text-blue-200 shrink-0">Progresso Geral: {progress.overallCompletion}%</span>
          <div className="flex-1 bg-blue-950/80 rounded-full h-2.5 overflow-hidden border border-blue-700/50">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.overallCompletion}%` }}
              data-testid="consulting-progress-bar"
            />
          </div>
        </div>
      </section>

      {/* 3. Operational Journey Matrix (9 steps) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm" data-testid="consulting-journey-matrix">
        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Layers size={16} className="text-blue-600" />
          Etapas da Consultoria
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Cliente */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">1. Cliente</span>
              {getStepBadge(progress.clientStatus)}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{client?.legalName || project.client}</p>
            <p className="text-[11px] text-slate-500">Status: {client?.status || "ACTIVE"}</p>
          </div>

          {/* 2. Engajamento */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">2. Consultoria</span>
              {getStepBadge(progress.engagementStatus)}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{project.group}</p>
            <p className="text-[11px] text-slate-500">Atualizado: {new Date(project.lastUpdated).toLocaleDateString("pt-BR")}</p>
          </div>

          {/* 3. Estrutura */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">3. Estrutura</span>
              {getStepBadge(progress.organizationStatus)}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {groups.length > 0 ? `${groups[0].name} (${companies.length} empresas)` : "Não configurada"}
            </p>
            <p className="text-[11px] text-slate-500">Unidades: {units.length}</p>
          </div>

          {/* 4. Dados */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">4. Dados</span>
              {getStepBadge(progress.sourceStatus)}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{activeDataset?.sourceName || "Nenhum arquivo ativo"}</p>
            <p className="text-[11px] text-slate-500">
              {activeDataset ? `${activeDataset.rowCount.toLocaleString("pt-BR")} linhas · ${activeDataset.columnCount} colunas` : "Importação pendente"}
            </p>
          </div>

          {/* 5. Análise */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">5. Análise</span>
              {getStepBadge(progress.analysisStatus)}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {artifact ? `Artefato ${artifact.artifactVersion}` : "Não executada"}
            </p>
            <p className="text-[11px] text-slate-500">
              {artifact ? `Gerado em ${new Date(artifact.generatedAt).toLocaleDateString("pt-BR")}` : "Aguardando análise"}
            </p>
          </div>

          {/* 6. Dashboards / Resultados */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">6. Resultados</span>
              {getStepBadge(progress.dashboardStatus)}
            </div>
            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
              {moduleProjections.map(m => (
                <span
                  key={m.moduleId}
                  className={`px-1.5 py-0.5 rounded ${m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  {m.moduleId}
                </span>
              ))}
            </div>
          </div>

          {/* 7. Apresentação */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">7. Apresentação</span>
              {getStepBadge(progress.presentationStatus)}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {presentation ? `${presentation.slides.length} slides prontos` : "Apresentação não gerada"}
            </p>
            <p className="text-[11px] text-slate-500">{presentation ? `v${presentation.version} · ${presentation.status}` : "Deck executivo"}</p>
          </div>

          {/* 8. Entregáveis */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">8. Entregáveis</span>
              {getStepBadge(progress.deliverablesStatus)}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">PDF, PowerPoint, Snapshots</p>
            <p className="text-[11px] text-slate-500">Histórico de snapshots: {snapshots.length} salvos</p>
          </div>

          {/* 9. Reunião */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">9. Reunião</span>
              {getStepBadge(progress.meetingStatus)}
            </div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {lastMeeting ? "Reunião realizada" : "Pronta para condução"}
            </p>
            <p className="text-[11px] text-slate-500">
              {lastMeeting ? `${lastMeeting.decisions.split("\n").filter(Boolean).length} decisões · ${lastMeeting.pendingItems.length} pendências` : "Sessão executiva limpa"}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Meeting Readiness & Status Cockpit */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meeting Readiness Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="consulting-readiness-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MonitorPlay size={16} className="text-blue-600" />
              Readiness da Reunião
            </h2>
            {getReadinessBadge(readiness.status)}
          </div>

          {/* Checklist Items */}
          <div className="space-y-2 pt-2">
            {readiness.items.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  {item.status === "OK" ? (
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  ) : item.status === "WARNING" ? (
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-rose-500 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                </div>
                {item.detail && <span className="text-[10px] text-slate-400 font-mono">{item.detail}</span>}
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab("preparacao_reuniao")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              data-testid="consulting-prep-meeting-btn"
            >
              Preparar Reunião
            </button>
            <button
              onClick={() => onNavigateTab("modo_reuniao")}
              disabled={!readiness.canStartMeeting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer disabled:opacity-40"
              data-testid="consulting-start-meeting-btn"
            >
              Iniciar Reunião
            </button>
          </div>
        </div>

        {/* Last Meeting & Decisions / Pending Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm" data-testid="consulting-last-meeting-panel">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <CheckSquare size={16} className="text-blue-600" />
            Última Reunião Realizada
          </h2>

          {lastMeeting ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ID da Sessão:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{lastMeeting.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Responsável:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{lastMeeting.responsible}</span>
                </div>
              </div>

              {/* Decisions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Decisões Registradas:</span>
                <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 whitespace-pre-line" data-testid="last-meeting-decisions">
                  {lastMeeting.decisions || "Nenhuma decisão registrada"}
                </div>
              </div>

              {/* Pending items */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Pendências Mapeadas:</span>
                {lastMeeting.pendingItems && lastMeeting.pendingItems.length > 0 ? (
                  <div className="space-y-1" data-testid="last-meeting-pending-list">
                    {lastMeeting.pendingItems.map((item, idx) => (
                      <div key={idx} className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhuma pendência registrada.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold space-y-2">
              <Clock size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p>Nenhuma reunião executiva finalizada ainda para este engajamento.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ConsultingHomePage;
