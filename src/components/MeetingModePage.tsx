/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { WorkspaceProject } from "../modules/consultant-workspace/types";
import { useExecutiveSessionState } from "./useExecutiveSessionState";
import { ExecutiveSessionHeader } from "./ExecutiveSessionHeader";
import { ExecutiveSessionFooter } from "./ExecutiveSessionFooter";
import { ExecutiveSessionAgenda } from "./ExecutiveSessionAgenda";
import { ExecutiveSessionStage } from "./ExecutiveSessionStage";
import { ExecutiveSessionRightPanel } from "./ExecutiveSessionRightPanel";
import { ExecutiveSessionSummary } from "./ExecutiveSessionSummary";

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
    activeProject,
    onUpdateProject,
    onExit,
  });

  // --- Dynamic Mock Chart Data for Presentation ---
  const chartDataRevenue = useMemo(() => [
    { name: "Jan", Receita: 420000, Meta: 450000 },
    { name: "Fev", Receita: 490000, Meta: 460000 },
    { name: "Mar", Receita: 580000, Meta: 500000 },
    { name: "Abr", Receita: 510000, Meta: 520000 },
    { name: "Mai", Receita: 640000, Meta: 550000 },
    { name: "Jun", Receita: 780000, Meta: 600000 },
  ], []);

  const chartDataCosts = useMemo(() => [
    { name: "CMV Autopeças", valor: 1200000, fill: "#3b82f6" },
    { name: "Despesas com Pessoal", valor: 850000, fill: "#10b981" },
    { name: "Custos Operacionais", valor: 450000, fill: "#f59e0b" },
    { name: "Marketing & Comercial", valor: 300000, fill: "#ef4444" },
    { name: "Despesas Tributárias", valor: 250000, fill: "#8b5cf6" },
  ], []);

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
