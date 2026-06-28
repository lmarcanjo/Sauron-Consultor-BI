import React, { useState, useEffect, useMemo } from 'react';
import { 
  Maximize, Clock, CheckCircle2, Layers, ChevronRight, ChevronLeft
} from 'lucide-react';
import { caseHistoryEngine } from '../core/workspace-intelligence/CaseHistoryEngine';
import { WorkspaceProject, ActionPlan, Meeting } from '../modules/consultant-workspace/types';
import { ExecutiveSessionAgenda, AgendaItem } from './ExecutiveSessionAgenda';
import { ExecutiveSessionStage } from './ExecutiveSessionStage';
import { ExecutiveSessionRightPanel, Participant, SessionDecision } from './ExecutiveSessionRightPanel';
import { ExecutiveSessionSummary } from './ExecutiveSessionSummary';

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
  formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`,
  widgetContext
}) => {
  // --- Timer State ---
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalS: number) => {
    const hrs = Math.floor(totalS / 3600);
    const mins = Math.floor((totalS % 3600) / 60);
    const secs = totalS % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Fallback Project Mock (if none provided) ---
  const project = useMemo(() => {
    if (activeProject) return activeProject;
    return {
      id: 'case_fallback',
      client: 'Cliente Corporativo Exemplo',
      group: 'Grupo Empresarial Alpha',
      segment: 'Automotivo',
      actionPlans: [
        { id: 'ap_1', description: 'Reavaliar comissionamento de vendas indiretas', priority: 'high', responsible: 'Carlos Henrique', deadline: '15/07/2026', status: 'pending', origin: 'Meeting' },
        { id: 'ap_2', description: 'Reduzir custos de frete em autopeças de reposição', priority: 'medium', responsible: 'Ana Luiza', deadline: '30/07/2026', status: 'in-progress', origin: 'Meeting' }
      ] as ActionPlan[],
      meetings: [] as Meeting[]
    } as unknown as WorkspaceProject;
  }, [activeProject]);

  // --- Agenda & Chapters State (E1.2) ---
  const defaultAgenda: AgendaItem[] = [
    { id: 'ag_1', title: '1. Abertura da Sessão', completed: false, visible: true, chapterKey: 'abertura' },
    { id: 'ag_2', title: '2. Receita e Crescimento', completed: false, visible: true, chapterKey: 'receita' },
    { id: 'ag_3', title: '3. Margem e Lucratividade', completed: false, visible: true, chapterKey: 'margem' },
    { id: 'ag_4', title: '4. Estrutura de Custos', completed: false, visible: true, chapterKey: 'custos' },
    { id: 'ag_5', title: '5. Desempenho Comercial', completed: false, visible: true, chapterKey: 'comercial' },
    { id: 'ag_6', title: '6. Pessoas e Talentos', completed: false, visible: true, chapterKey: 'pessoas' },
    { id: 'ag_7', title: '7. Plano de Ação Tático', completed: false, visible: true, chapterKey: 'plano' },
    { id: 'ag_8', title: '8. Encerramento formal', completed: false, visible: true, chapterKey: 'encerramento' },
  ];

  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    const saved = localStorage.getItem(`agenda_config_${project.id}`);
    return saved ? JSON.parse(saved) : defaultAgenda;
  });

  const [newCustomAgendaTitle, setNewCustomAgendaTitle] = useState('');

  const saveAgendaModel = () => {
    localStorage.setItem(`agenda_config_${project.id}`, JSON.stringify(agenda));
    alert('Modelo de Agenda salvo e sincronizado com sucesso para este caso.');
  };

  const visibleChapters = useMemo(() => agenda.filter(a => a.visible), [agenda]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const currentChapter = visibleChapters[activeChapterIndex] || visibleChapters[0] || agenda[0];

  // Progress metrics
  const completedObjectivesCount = useMemo(() => {
    return agenda.filter(a => a.completed).length;
  }, [agenda]);

  // Handle reordering agenda
  const moveAgendaItem = (index: number, direction: 'up' | 'down') => {
    const newAgenda = [...agenda];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
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
      chapterKey: `custom_${Date.now()}`
    };
    setAgenda([...agenda, newItem]);
    setNewCustomAgendaTitle('');
  };

  // --- Right Panel & Sidebar Collapse State ---
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // --- Quick Notes & Parser State (E1.5) ---
  const [notesText, setNotesText] = useState('');
  const [sessionObservations, setSessionObservations] = useState<string[]>([]);
  const [sessionDecisions, setSessionDecisions] = useState<SessionDecision[]>([]);
  const [sessionPendingItems, setSessionPendingItems] = useState<string[]>([]);
  const [newActionPlans, setNewActionPlans] = useState<ActionPlan[]>([]);
  const [activePlans, setActivePlans] = useState<ActionPlan[]>(() => project.actionPlans || []);

  const parsedNotesLines = useMemo(() => {
    return notesText
      .split('\n')
      .map((line, idx) => ({ id: `line_${idx}`, text: line.trim() }))
      .filter(line => line.text.length > 0);
  }, [notesText]);

  // Note conversions helper (without copying text!)
  const convertNoteToObservation = (lineText: string) => {
    setSessionObservations(prev => [...prev, lineText]);
    setNotesText(prev => prev.split('\n').filter(l => l.trim() !== lineText).join('\n'));
  };

  const convertNoteToDecision = (lineText: string) => {
    const newDecision: SessionDecision = {
      id: `dec_${Date.now()}`,
      description: lineText,
      responsible: 'Conselho Executivo',
      deadline: 'Imediato',
      priority: 'high'
    };
    setSessionDecisions(prev => [...prev, newDecision]);
    setNotesText(prev => prev.split('\n').filter(l => l.trim() !== lineText).join('\n'));
  };

  const convertNoteToPending = (lineText: string) => {
    setSessionPendingItems(prev => [...prev, lineText]);
    setNotesText(prev => prev.split('\n').filter(l => l.trim() !== lineText).join('\n'));
  };

  // --- Inline Form states for Action Plan (E1.7) ---
  const [isCreatingAction, setIsCreatingAction] = useState(false);
  const [actDescription, setActDescription] = useState('');
  const [actResponsible, setActResponsible] = useState('');
  const [actDeadline, setActDeadline] = useState('');
  const [actPriority, setActPriority] = useState<'low' | 'medium' | 'high'>('medium');

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
      responsible: actResponsible.trim() || 'Não Atribuído',
      deadline: actDeadline.trim() || 'Próximo comitê',
      status: 'pending',
      origin: `Sessão Executiva - ${currentChapter.title}`
    };

    setNewActionPlans(prev => [...prev, newAction]);
    setActivePlans(prev => [newAction, ...prev]);

    // Cleanup form
    setActDescription('');
    setActResponsible('');
    setActDeadline('');
    setActPriority('medium');
    setIsCreatingAction(false);

    // If it was parsed from notes, remove it
    setNotesText(prev => prev.split('\n').filter(l => l.trim() !== actDescription).join('\n'));
  };

  // --- Participant Tracker State (E1.1) ---
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'p_1', name: 'Lennon Marcanjo', role: 'Consultor Líder', present: true },
    { id: 'p_2', name: 'Diretor Geral', role: 'Cliente Executivo', present: true },
    { id: 'p_3', name: 'Gerente Financeiro', role: 'Cliente Operações', present: true },
    { id: 'p_4', name: 'Conselho de Administração', role: 'Sócio', present: false }
  ]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantRole, setNewParticipantRole] = useState('Stakeholder');

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;
    const newP: Participant = {
      id: `part_${Date.now()}`,
      name: newParticipantName.trim(),
      role: newParticipantRole.trim(),
      present: true
    };
    setParticipants([...participants, newP]);
    setNewParticipantName('');
  };

  // --- Fullscreen Toggle ---
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // --- End Session Summary Modal (E1.8) ---
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isAtaPrintView, setIsAtaPrintView] = useState(false);

  // Sync and finalize (E1.10)
  const [isSyncing, setIsSyncing] = useState(false);

  const handleFinalizeSession = async () => {
    setIsSyncing(true);
    try {
      // Create meeting model
      const completedMeeting: Meeting = {
        id: `meet_${Date.now()}`,
        presentationId: 'pres_conselho_executivo',
        selectedCharts: visibleChapters.map(c => c.chapterKey),
        observations: [
          `Sessão Executiva Finalizada.`,
          `Capítulos revisados: ${visibleChapters.filter(c => c.completed).map(c => c.title).join(', ')}`,
          ...sessionObservations
        ].join('\n'),
        decisions: sessionDecisions.map(d => `${d.description} (Resp: ${d.responsible})`).join('\n') || 'Sessão de alinhamento tático executivo.',
        actionPlans: newActionPlans,
        responsible: participants.filter(p => p.present).map(p => p.name).join(', ') || 'Consultor',
        pendingItems: sessionPendingItems
      };

      // Sync into project action plans
      const updatedActionPlans = [...activePlans];

      // Build updated project
      const updatedProject: WorkspaceProject = {
        ...project,
        meetings: [completedMeeting, ...(project.meetings || [])],
        actionPlans: updatedActionPlans,
        observations: `${project.observations || ''}\n[Sessão Executiva ${new Date().toLocaleDateString()}] ${sessionObservations.join(' | ')}`
      };

      // Logging inside CaseHistoryEngine
      caseHistoryEngine.logNarrativeEvent(
        project.id,
        "Reunião executiva realizada",
        `Sessão de ${formatTime(timerSeconds)} finalizada com ${sessionDecisions.length} decisões e ${newActionPlans.length} novos planos de ação.`,
        "session_realized"
      );

      if (onUpdateProject) {
        await onUpdateProject(updatedProject);
      }

      alert('Sessão Executiva Sincronizada com sucesso! A base permanente do caso foi atualizada.');
      onExit();
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao sincronizar os dados da sessão.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Plain text report download helper
  const exportAtaAsTextFile = () => {
    const textReport = `
=========================================
  SAURON OS - EXECUTIVE SESSION REPORT
=========================================
Caso: ${project.client} (${project.group})
Segmento: ${project.segment}
Data de Realização: ${new Date().toLocaleDateString('pt-BR')}
Duração Total: ${formatTime(timerSeconds)}
Capítulos Vistos: ${completedObjectivesCount} de ${agenda.length}

PARTICIPANTES:
${participants.map(p => `- [${p.present ? 'X' : ' '}] ${p.name} (${p.role})`).join('\n')}

DECISÕES TOMADAS:
${sessionDecisions.length > 0 
  ? sessionDecisions.map((d, i) => `${i + 1}. ${d.description} | Resp: ${d.responsible}`).join('\n')
  : 'Nenhuma decisão formal registrada.'}

NOVOS PLANOS DE AÇÃO CRIADOS:
${newActionPlans.length > 0
  ? newActionPlans.map((a, i) => `${i + 1}. ${a.description} | Resp: ${a.responsible} | Prazo: ${a.deadline} | Prioridade: ${a.priority.toUpperCase()}`).join('\n')
  : 'Nenhum novo plano de ação cadastrado.'}

PENDÊNCIAS REGISTRADAS:
${sessionPendingItems.length > 0
  ? sessionPendingItems.map((p, i) => `- ${p}`).join('\n')
  : 'Nenhuma pendência mapeada.'}

OBSERVAÇÕES DO CONSULTOR:
${sessionObservations.length > 0
  ? sessionObservations.map((o, i) => `- ${o}`).join('\n')
  : 'Nenhuma observação geral anotada.'}

-----------------------------------------
Ata gerada automaticamente via Sauron Operating Platform.
`;

    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATA_REUNIAO_${project.client.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- Dynamic Mock Chart Data for Presentation (E1.3) ---
  const chartDataRevenue = [
    { name: 'Jan', Receita: 420000, Meta: 450000 },
    { name: 'Fev', Receita: 490000, Meta: 460000 },
    { name: 'Mar', Receita: 580000, Meta: 500000 },
    { name: 'Abr', Receita: 510000, Meta: 520000 },
    { name: 'Mai', Receita: 640000, Meta: 550000 },
    { name: 'Jun', Receita: 780000, Meta: 600000 },
  ];

  const chartDataCosts = [
    { name: 'CMV Autopeças', valor: 1200000, fill: '#3b82f6' },
    { name: 'Despesas com Pessoal', valor: 850000, fill: '#10b981' },
    { name: 'Custos Operacionais', valor: 450000, fill: '#f59e0b' },
    { name: 'Marketing & Comercial', valor: 300000, fill: '#ef4444' },
    { name: 'Despesas Tributárias', valor: 250000, fill: '#8b5cf6' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 text-slate-100 flex flex-col font-sans select-none overflow-hidden" id="executive-session-root">
      
      {/* 1. Header Discreto e Elegante (E1.1) */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-sm font-black tracking-widest text-slate-100 font-mono">EXECUTIVE SESSION</h1>
          </div>
          <span className="h-4 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-300 leading-tight">{project.client}</span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">{project.group || 'Comitê Geral'} • Junho/2026</span>
          </div>
        </div>

        {/* Status Indicators in Header */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers size={13} className="text-blue-400" />
            <span>Objetivos:</span>
            <span className="font-mono font-bold text-slate-200">{completedObjectivesCount} de {agenda.length}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-md border border-slate-850">
            <Clock size={13} className="text-amber-500 animate-pulse" />
            <span className="text-amber-500 font-black">{formatTime(timerSeconds)}</span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullScreen}
            className="p-2 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-all cursor-pointer"
            title="Tela Cheia"
          >
            <Maximize size={15} />
          </button>
          <button 
            onClick={() => {
              const updated = [...agenda];
              const lastIdx = updated.findIndex(item => item.chapterKey === 'encerramento');
              if (lastIdx !== -1) updated[lastIdx].completed = true;
              setAgenda(updated);
              setShowSummaryModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black tracking-wider uppercase rounded-lg shadow-lg hover:shadow-emerald-950 transition-all flex items-center gap-1.5 border border-emerald-500/30 cursor-pointer"
          >
            <CheckCircle2 size={13} /> Encerrar Reunião
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. Agenda Inteligente Drawer / Sidebar (E1.2) */}
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

        {/* 3. Immersive Presentation Slide Panel (E1.3) */}
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

        {/* 4. Smart Right Panel: Contextual Insights & Notes sync (E1.4 & E1.5) */}
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

      {/* 5. FULL-SCREEN SUMMARY REPORT MODAL / PRINT PREVIEW (E1.8 & E1.9) */}
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

    </div>
  );
};
