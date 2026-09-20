/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { enterpriseRepository } from "../core/persistence/EnterpriseRepository";
import { useExecutiveSessionState } from "./useExecutiveSessionState";
import { ExecutiveSessionHeader } from "./ExecutiveSessionHeader";
import { ExecutiveSessionFooter } from "./ExecutiveSessionFooter";
import { ExecutiveSessionAgenda } from "./ExecutiveSessionAgenda";
import { ExecutiveSessionStage } from "./ExecutiveSessionStage";
import { ExecutiveSessionRightPanel } from "./ExecutiveSessionRightPanel";
import { ExecutiveSessionSummary } from "./ExecutiveSessionSummary";
import { activeDatasetStore } from "../core/data/ActiveDatasetStore";
import { getDefaultProjectId, listModuleMappings } from "../core/data/moduleMapping";
import { calculatePresentationMetricValues } from "../core/business-intelligence/BusinessIntelligenceEngine";
import { buildMeetingChartData, PresentationMetricValues } from "../core/business-intelligence/PresentationMetricContext";
import { getEnterpriseContext } from "../core/enterprise-consolidation";
import { certifiedMetricSnapshotStore } from "../core/financial-consistency";
import type { CertifiedMetricSnapshot } from "../core/financial-consistency";

import { consultantWorkspaceManager } from "../modules/consultant-workspace/ConsultantWorkspaceManager";
import { identityEngine } from "../core/identity/IdentityEngine";

interface MeetingModePageProps {
  onExit: () => void;
  activeProject?: WorkspaceProject | null;
  onUpdateProject?: (project: WorkspaceProject) => Promise<void>;
  filteredData?: any[];
  formatCurrency?: (value: number) => string;
  widgetContext?: any;
}

export const MeetingModePage: React.FC<MeetingModePageProps> = ({
  onExit,
  activeProject,
  onUpdateProject,
  filteredData = [],
  formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`,
  widgetContext,
}) => {
  const activeDataset = activeDatasetStore.getActiveDataset();
  const [contextProject, setContextProject] = useState<WorkspaceProject | null>(null);
  const [certifiedSnapshot, setCertifiedSnapshot] = useState<CertifiedMetricSnapshot | null>(null);

  useEffect(() => {
    let mounted = true;
    void consultantWorkspaceManager.getActiveProject().then(async activeEngagement => {
      if (!mounted) return;
      if (activeEngagement) {
        setContextProject(activeEngagement);
        return;
      }
      const context = getEnterpriseContext();
      const entities = await enterpriseRepository.getAll();
      if (!mounted) return;
      const company = entities.find(entity => entity.id === context.companyId);
      const group = entities.find(entity => entity.id === context.groupId);
      const client = company?.name || group?.name || activeDataset?.sourceName || "Fonte selecionada";
      const groupName = group?.name || (company ? "Empresa selecionada" : client);
      setContextProject({
        id: context.companyId || context.groupId || activeDataset?.datasetId || "active-context",
        client,
        group: groupName,
        segment: "Geral",
        companies: company ? [company.id] : [],
        brands: [],
        cnpjs: [],
        dbConnections: [],
        spreadsheets: [],
        importProfile: null,
        filters: [],
        kpis: [],
        dashboards: [],
        presentations: [],
        actionPlans: [],
        meetings: [],
        observations: "",
        history: [],
        auditLog: [],
        lastUpdated: new Date().toISOString(),
        isArchived: false,
      });
    });
    return () => { mounted = false; };
  }, [activeDataset?.datasetId, activeDataset?.sourceName]);

  useEffect(() => {
    const context = getEnterpriseContext();
    if (!activeDataset) {
      setCertifiedSnapshot(null);
      return;
    }
    const contextId = context.scope === "GROUP"
      ? context.groupId
      : context.scope === "COMPANY"
        ? context.companyId
        : context.scope === "UNIT"
          ? context.unitId
          : activeDataset.datasetId;
    const datasetVersion = `${activeDataset.datasetId}:${activeDataset.importedAt}`;
    setCertifiedSnapshot(
      certifiedMetricSnapshotStore.get(`snapshot:${contextId || activeDataset.datasetId}:${datasetVersion}`)
    );
  }, [activeDataset?.datasetId, activeDataset?.importedAt]);

  const {
    timerSeconds,
    formatTime,
    project,
    agenda,
    setAgenda,
    newCustomAgendaTitle,
    setNewCustomAgendaTitle,
    saveAgendaModel,
    visibleChapters,
    activeChapterIndex,
    setActiveChapterIndex,
    currentChapter,
    completedObjectivesCount,
    moveAgendaItem,
    addCustomAgendaItem,
    isRightPanelOpen,
    setIsRightPanelOpen,
    notesText,
    setNotesText,
    sessionObservations,
    sessionDecisions,
    sessionPendingItems,
    newActionPlans,
    activePlans,
    setActivePlans,
    parsedNotesLines,
    convertNoteToObservation,
    convertNoteToDecision,
    convertNoteToPending,
    isCreatingAction,
    setIsCreatingAction,
    actDescription,
    setActDescription,
    actResponsible,
    setActResponsible,
    actDeadline,
    setActDeadline,
    actPriority,
    setActPriority,
    convertNoteToActionForm,
    saveQuickActionPlan,
    participants,
    setParticipants,
    newParticipantName,
    setNewParticipantName,
    newParticipantRole,
    setNewParticipantRole,
    addParticipant,
    showSummaryModal,
    setShowSummaryModal,
    isAtaPrintView,
    setIsAtaPrintView,
    isSyncing,
    handleFinalizeSession,
    exportAtaAsTextFile,
  } = useExecutiveSessionState({
    activeProject: activeProject || contextProject,
    onUpdateProject,
    onExit,
    certifiedSnapshot,
  });

  const meetingMappings = useMemo(() => {
    if (!activeDataset) return [];
    const saved = listModuleMappings(activeDataset.datasetId, getDefaultProjectId(activeDataset));
    return saved;
  }, [activeDataset?.datasetId, activeDataset?.importedAt]);
  const chartData = useMemo(() => buildMeetingChartData(filteredData, meetingMappings), [filteredData, meetingMappings]);
  const chartDataRevenue = chartData.revenue;
  const chartDataCosts = chartData.costs;
  const [metricValues, setMetricValues] = useState<PresentationMetricValues | null>(null);

  // The data manager can return equivalent arrays with different references while
  // IndexedDB metadata is synchronizing. Keep the metric effect tied to content,
  // otherwise each reconciliation can schedule another calculation/render cycle.
  const datasetKey = activeDataset ? `${activeDataset.datasetId}:${activeDataset.importedAt}` : "none";
  const rowsSignature = useMemo(() => {
    const sampleIndexes = [0, Math.floor(filteredData.length / 2), Math.max(0, filteredData.length - 1)];
    const sample = sampleIndexes
      .filter((index, position, indexes) => indexes.indexOf(index) === position && filteredData[index])
      .map(index => {
        const row = filteredData[index] as Record<string, unknown>;
        return Object.keys(row).slice(0, 8).map(key => `${key}:${String(row[key])}`).join("|");
      })
      .join(";");
    return `${filteredData.length}:${sample}`;
  }, [filteredData]);
  const mappingSignature = useMemo(
    () => meetingMappings.map(mapping => `${mapping.moduleName}:${mapping.sheetName}:${mapping.selectedColumns.join(",")}`).join(";"),
    [meetingMappings]
  );

  useEffect(() => {
    let mounted = true;
    if (!activeDataset) {
      setMetricValues(null);
      return () => { mounted = false; };
    }
    const timer = setTimeout(() => {
      calculatePresentationMetricValues({ activeDataset, rows: filteredData, moduleMappings: meetingMappings }).then(result => {
        if (mounted) setMetricValues(result.values);
      });
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [datasetKey, rowsSignature, mappingSignature]);

  if (!activeDataset) {
    return (
      <div className="min-h-[420px] flex items-center justify-center bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-8 text-center">
        <div className="max-w-md space-y-3">
          <h2 className="text-lg font-black">Não há itens selecionados para a reunião.</h2>
          <p className="text-sm text-slate-400">Escolha conteúdo na apresentação e confirme os campos antes de iniciar a reunião.</p>
          <button onClick={onExit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer">Escolher conteúdo</button>
        </div>
      </div>
    );
  }

  // --- Fullscreen Toggle ---
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleEndMeetingClick = () => {
    const updated = [...agenda];
    const lastIdx = updated.findIndex((item) => item.chapterKey === "encerramento");
    if (lastIdx !== -1) updated[lastIdx].completed = true;
    setAgenda(updated);
    setShowSummaryModal(true);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950 z-50 text-slate-100 flex flex-col font-sans select-none overflow-hidden"
      id="executive-session-root"
    >
      {/* 1. Elegant Header */}
      <ExecutiveSessionHeader
        project={project}
        completedObjectivesCount={completedObjectivesCount}
        totalObjectivesCount={agenda.length}
        formattedTime={formatTime(timerSeconds)}
        onToggleFullScreen={toggleFullScreen}
        onEndMeeting={handleEndMeetingClick}
      />

      {/* Main Grid Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Agenda Sidebar */}
        <ExecutiveSessionAgenda
          agenda={agenda}
          currentChapter={currentChapter}
          visibleChapters={visibleChapters}
          newCustomAgendaTitle={newCustomAgendaTitle}
          setNewCustomAgendaTitle={setNewCustomAgendaTitle}
          saveAgendaModel={saveAgendaModel}
          setActiveChapterIndex={setActiveChapterIndex}
          setAgenda={setAgenda}
          moveAgendaItem={moveAgendaItem}
          addCustomAgendaItem={addCustomAgendaItem}
          completedObjectivesCount={completedObjectivesCount}
        />

        {/* 3. Stage Slide Panel */}
        <ExecutiveSessionStage
          currentChapter={currentChapter}
          activeChapterIndex={activeChapterIndex}
          visibleChapters={visibleChapters}
          project={project}
          activePlans={activePlans}
          formatCurrency={formatCurrency}
          chartDataRevenue={chartDataRevenue}
          chartDataCosts={chartDataCosts}
          metricValues={metricValues}
          setActiveChapterIndex={setActiveChapterIndex}
          setAgenda={setAgenda}
          setIsCreatingAction={setIsCreatingAction}
          setShowSummaryModal={setShowSummaryModal}
          setActivePlans={setActivePlans}
          agenda={agenda}
        />

        {/* 4. Smart Right Panel */}
        {isRightPanelOpen && (
          <ExecutiveSessionRightPanel
            currentChapter={currentChapter}
            participants={participants}
            setParticipants={setParticipants}
            newParticipantName={newParticipantName}
            setNewParticipantName={setNewParticipantName}
            newParticipantRole={newParticipantRole}
            setNewParticipantRole={setNewParticipantRole}
            addParticipant={addParticipant}
            notesText={notesText}
            setNotesText={setNotesText}
            parsedNotesLines={parsedNotesLines}
            convertNoteToObservation={convertNoteToObservation}
            convertNoteToDecision={convertNoteToDecision}
            convertNoteToPending={convertNoteToPending}
            convertNoteToActionForm={convertNoteToActionForm}
            isCreatingAction={isCreatingAction}
            setIsCreatingAction={setIsCreatingAction}
            saveQuickActionPlan={saveQuickActionPlan}
            actDescription={actDescription}
            setActDescription={setActDescription}
            actResponsible={actResponsible}
            setActResponsible={setActResponsible}
            actDeadline={actDeadline}
            setActDeadline={setActDeadline}
            actPriority={actPriority}
            setActPriority={setActPriority}
            sessionDecisions={sessionDecisions}
          />
        )}

        {/* Right Collapsible Tab Handle */}
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 bg-slate-900 hover:bg-slate-850 border border-slate-800 border-r-0 rounded-l-md flex items-center justify-center text-slate-500 hover:text-slate-300 z-10 cursor-pointer"
        >
          {isRightPanelOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* 5. Summary Modal */}
      <ExecutiveSessionSummary
        showSummaryModal={showSummaryModal}
        setShowSummaryModal={setShowSummaryModal}
        isAtaPrintView={isAtaPrintView}
        setIsAtaPrintView={setIsAtaPrintView}
        project={project}
        timerSeconds={timerSeconds}
        formatTime={formatTime}
        participants={participants}
        sessionDecisions={sessionDecisions}
        newActionPlans={newActionPlans}
        sessionObservations={sessionObservations}
        sessionPendingItems={sessionPendingItems}
        completedObjectivesCount={completedObjectivesCount}
        agenda={agenda}
        visibleChapters={visibleChapters}
        exportAtaAsTextFile={exportAtaAsTextFile}
        handleFinalizeSession={handleFinalizeSession}
        isSyncing={isSyncing}
      />

      {/* 6. Secure Footer */}
      <ExecutiveSessionFooter clientName={project.client} />
    </div>
  );
};
