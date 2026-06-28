/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { WorkspaceProject, ActionPlan, Meeting } from "../modules/consultant-workspace/types";
import { AgendaItem } from "./ExecutiveSessionAgenda";
import { Participant, SessionDecision } from "./ExecutiveSessionRightPanel";
import { caseHistoryEngine } from "../core/workspace-intelligence/CaseHistoryEngine";

interface UseExecutiveSessionStateProps {
  activeProject?: WorkspaceProject | null;
  onUpdateProject?: (project: WorkspaceProject) => Promise<void>;
  onExit: () => void;
}

export const useExecutiveSessionState = ({
  activeProject,
  onUpdateProject,
  onExit,
}: UseExecutiveSessionStateProps) => {
  // --- Timer State ---
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalS: number) => {
    const hrs = Math.floor(totalS / 3600);
    const mins = Math.floor((totalS % 3600) / 60);
    const secs = totalS % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, "0") + ":" : ""}${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Fallback Project Mock (if none provided) ---
  const project = useMemo(() => {
    if (activeProject) return activeProject;
    return {
      id: "case_fallback",
      client: "Cliente Corporativo Exemplo",
      group: "Grupo Empresarial Alpha",
      segment: "Automotivo",
      actionPlans: [
        {
          id: "ap_1",
          description: "Reavaliar comissionamento de vendas indiretas",
          priority: "high",
          responsible: "Carlos Henrique",
          deadline: "15/07/2026",
          status: "pending",
          origin: "Meeting",
        },
        {
          id: "ap_2",
          description: "Reduzir custos de frete em autopeças de reposição",
          priority: "medium",
          responsible: "Ana Luiza",
          deadline: "30/07/2026",
          status: "in-progress",
          origin: "Meeting",
        },
      ] as ActionPlan[],
      meetings: [] as Meeting[],
    } as unknown as WorkspaceProject;
  }, [activeProject]);

  // --- Agenda & Chapters State ---
  const defaultAgenda: AgendaItem[] = [
    { id: "ag_1", title: "1. Abertura da Sessão", completed: false, visible: true, chapterKey: "abertura" },
    { id: "ag_2", title: "2. Receita e Crescimento", completed: false, visible: true, chapterKey: "receita" },
    { id: "ag_3", title: "3. Margem e Lucratividade", completed: false, visible: true, chapterKey: "margem" },
    { id: "ag_4", title: "4. Estrutura de Custos", completed: false, visible: true, chapterKey: "custos" },
    { id: "ag_5", title: "5. Desempenho Comercial", completed: false, visible: true, chapterKey: "comercial" },
    { id: "ag_6", title: "6. Pessoas e Talentos", completed: false, visible: true, chapterKey: "pessoas" },
    { id: "ag_7", title: "7. Plano de Ação Tático", completed: false, visible: true, chapterKey: "plano" },
    { id: "ag_8", title: "8. Encerramento formal", completed: false, visible: true, chapterKey: "encerramento" },
  ];

  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    const saved = localStorage.getItem(`agenda_config_${project.id}`);
    return saved ? JSON.parse(saved) : defaultAgenda;
  });

  const [newCustomAgendaTitle, setNewCustomAgendaTitle] = useState("");

  const saveAgendaModel = () => {
    localStorage.setItem(`agenda_config_${project.id}`, JSON.stringify(agenda));
    alert("Modelo de Agenda salvo e sincronizado com sucesso para este caso.");
  };

  const visibleChapters = useMemo(() => agenda.filter((a) => a.visible), [agenda]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const currentChapter = visibleChapters[activeChapterIndex] || visibleChapters[0] || agenda[0];

  // Progress metrics
  const completedObjectivesCount = useMemo(() => {
    return agenda.filter((a) => a.completed).length;
  }, [agenda]);

  // Handle reordering agenda
  const moveAgendaItem = (index: number, direction: "up" | "down") => {
    const newAgenda = [...agenda];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newAgenda.length) {
      const temp = newAgenda[index];
      newAgenda[index] = newAgenda[targetIndex];
      newAgenda[targetIndex] = temp;
      setAgenda(newAgenda);
    }
  };

  // Add custom item
  const addCustomAgendaItem = () => {
    if (!newCustomAgendaTitle.trim()) return;
    const newItem: AgendaItem = {
      id: `ag_custom_${Date.now()}`,
      title: `${agenda.length + 1}. ${newCustomAgendaTitle.trim()}`,
      completed: false,
      visible: true,
      chapterKey: `custom_${Date.now()}`,
    };
    setAgenda([...agenda, newItem]);
    setNewCustomAgendaTitle("");
  };

  // --- Right Panel & Sidebar Collapse State ---
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // --- Quick Notes & Parser State ---
  const [notesText, setNotesText] = useState("");
  const [sessionObservations, setSessionObservations] = useState<string[]>([]);
  const [sessionDecisions, setSessionDecisions] = useState<SessionDecision[]>([]);
  const [sessionPendingItems, setSessionPendingItems] = useState<string[]>([]);
  const [newActionPlans, setNewActionPlans] = useState<ActionPlan[]>([]);
  const [activePlans, setActivePlans] = useState<ActionPlan[]>(() => project.actionPlans || []);

  const parsedNotesLines = useMemo(() => {
    return notesText
      .split("\n")
      .map((line, idx) => ({ id: `line_${idx}`, text: line.trim() }))
      .filter((line) => line.text.length > 0);
  }, [notesText]);

  // Note conversions helpers
  const convertNoteToObservation = (lineText: string) => {
    setSessionObservations((prev) => [...prev, lineText]);
    setNotesText((prev) => prev.split("\n").filter((l) => l.trim() !== lineText).join("\n"));
  };

  const convertNoteToDecision = (lineText: string) => {
    const newDecision: SessionDecision = {
      id: `dec_${Date.now()}`,
      description: lineText,
      responsible: "Conselho Executivo",
      deadline: "Imediato",
      priority: "high",
    };
    setSessionDecisions((prev) => [...prev, newDecision]);
    setNotesText((prev) => prev.split("\n").filter((l) => l.trim() !== lineText).join("\n"));
  };

  const convertNoteToPending = (lineText: string) => {
    setSessionPendingItems((prev) => [...prev, lineText]);
    setNotesText((prev) => prev.split("\n").filter((l) => l.trim() !== lineText).join("\n"));
  };

  // --- Inline Form states for Action Plan ---
  const [isCreatingAction, setIsCreatingAction] = useState(false);
  const [actDescription, setActDescription] = useState("");
  const [actResponsible, setActResponsible] = useState("");
  const [actDeadline, setActDeadline] = useState("");
  const [actPriority, setActPriority] = useState<"low" | "medium" | "high">("medium");

  const convertNoteToActionForm = (lineText: string) => {
    setActDescription(lineText);
    setIsCreatingAction(true);
  };

  const saveQuickActionPlan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!actDescription.trim()) return;

    const newAction: ActionPlan = {
      id: `ap_session_${Date.now()}`,
      description: actDescription.trim(),
      priority: actPriority,
      responsible: actResponsible.trim() || "Não Atribuído",
      deadline: actDeadline.trim() || "Próximo comitê",
      status: "pending",
      origin: `Sessão Executiva - ${currentChapter.title}`,
    };

    setNewActionPlans((prev) => [...prev, newAction]);
    setActivePlans((prev) => [newAction, ...prev]);

    // Cleanup form
    setActDescription("");
    setActResponsible("");
    setActDeadline("");
    setActPriority("medium");
    setIsCreatingAction(false);

    // Remove from notes
    setNotesText((prev) => prev.split("\n").filter((l) => l.trim() !== actDescription).join("\n"));
  };

  // --- Participant Tracker State ---
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "p_1", name: "Lennon Marcanjo", role: "Consultor Líder", present: true },
    { id: "p_2", name: "Diretor Geral", role: "Cliente Executivo", present: true },
    { id: "p_3", name: "Gerente Financeiro", role: "Cliente Operações", present: true },
    { id: "p_4", name: "Conselho de Administração", role: "Sócio", present: false },
  ]);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantRole, setNewParticipantRole] = useState("Stakeholder");

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;
    const newP: Participant = {
      id: `part_${Date.now()}`,
      name: newParticipantName.trim(),
      role: newParticipantRole.trim(),
      present: true,
    };
    setParticipants([...participants, newP]);
    setNewParticipantName("");
  };

  // --- End Session Summary Modal ---
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isAtaPrintView, setIsAtaPrintView] = useState(false);

  // Sync and finalize
  const [isSyncing, setIsSyncing] = useState(false);

  const handleFinalizeSession = async () => {
    setIsSyncing(true);
    try {
      const completedMeeting: Meeting = {
        id: `meet_${Date.now()}`,
        presentationId: "pres_conselho_executivo",
        selectedCharts: visibleChapters.map((c) => c.chapterKey),
        observations: [
          `Sessão Executiva Finalizada.`,
          `Capítulos revisados: ${visibleChapters
            .filter((c) => c.completed)
            .map((c) => c.title)
            .join(", ")}`,
          ...sessionObservations,
        ].join("\n"),
        decisions:
          sessionDecisions.map((d) => `${d.description} (Resp: ${d.responsible})`).join("\n") ||
          "Sessão de alinhamento tático executivo.",
        actionPlans: newActionPlans,
        responsible: participants
          .filter((p) => p.present)
          .map((p) => p.name)
          .join(", ") || "Consultor",
        pendingItems: sessionPendingItems,
      };

      const updatedActionPlans = [...activePlans];

      const updatedProject: WorkspaceProject = {
        ...project,
        meetings: [completedMeeting, ...(project.meetings || [])],
        actionPlans: updatedActionPlans,
        observations: `${project.observations || ""}\n[Sessão Executiva ${new Date().toLocaleDateString()}] ${sessionObservations.join(
          " | "
        )}`,
      };

      caseHistoryEngine.logNarrativeEvent(
        project.id,
        "Reunião executiva realizada",
        `Sessão de ${formatTime(timerSeconds)} finalizada com ${sessionDecisions.length} decisões e ${
          newActionPlans.length
        } novos planos de ação.`,
        "session_realized"
      );

      if (onUpdateProject) {
        await onUpdateProject(updatedProject);
      }

      alert("Sessão Executiva Sincronizada com sucesso! A base permanente do caso foi atualizada.");
      onExit();
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao sincronizar os dados da sessão.");
    } finally {
      setIsSyncing(false);
    }
  };

  const exportAtaAsTextFile = () => {
    const textReport = `
=========================================
  SAURON OS - EXECUTIVE SESSION REPORT
=========================================
Caso: ${project.client} (${project.group})
Segmento: ${project.segment}
Data de Realização: ${new Date().toLocaleDateString("pt-BR")}
Duração Total: ${formatTime(timerSeconds)}
Capítulos Vistos: ${completedObjectivesCount} de ${agenda.length}

PARTICIPANTES:
${participants.map((p) => `- [${p.present ? "X" : " "}] ${p.name} (${p.role})`).join("\n")}

DECISÕES TOMADAS:
${
  sessionDecisions.length > 0
    ? sessionDecisions.map((d, i) => `${i + 1}. ${d.description} | Resp: ${d.responsible}`).join("\n")
    : "Nenhuma decisão formal registrada."
}

NOVOS PLANOS DE AÇÃO CRIADOS:
${
  newActionPlans.length > 0
    ? newActionPlans
        .map(
          (a, i) =>
            `${i + 1}. ${a.description} | Resp: ${
              a.responsible
            } | Prazo: ${a.deadline} | Prioridade: ${a.priority.toUpperCase()}`
        )
        .join("\n")
    : "Nenhum novo plano de ação cadastrado."
}

PENDÊNCIAS REGISTRADAS:
${sessionPendingItems.length > 0 ? sessionPendingItems.map((p, i) => `- ${p}`).join("\n") : "Nenhuma pendência mapeada."}

OBSERVAÇÕES DO CONSULTOR:
${sessionObservations.length > 0 ? sessionObservations.map((o, i) => `- ${o}`).join("\n") : "Nenhuma observação geral anotada."}

-----------------------------------------
Ata gerada automaticamente via Sauron Operating Platform.
`;

    const blob = new Blob([textReport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ATA_REUNIAO_${project.client.replace(/\s+/g, "_")}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    timerSeconds,
    setTimerSeconds,
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
  };
};
