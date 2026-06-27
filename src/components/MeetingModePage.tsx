import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, X, Maximize, Play, Save, Download, 
  Eye, EyeOff, Plus, Trash2, ArrowUp, ArrowDown, CheckSquare, 
  ClipboardList, Clock, ShieldAlert, Users, TrendingUp, DollarSign, 
  BarChart3, User, Calendar, Check, Edit3, HelpCircle, Activity, 
  CheckCircle2, AlertTriangle, FileText, Printer, BookOpen, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { caseHistoryEngine } from '../core/workspace-intelligence/CaseHistoryEngine';
import { WorkspaceProject, ActionPlan, Meeting } from '../modules/consultant-workspace/types';

interface MeetingModePageProps {
  onExit: () => void;
  activeProject?: WorkspaceProject | null;
  onUpdateProject?: (project: WorkspaceProject) => Promise<void>;
  filteredData?: any[];
  formatCurrency?: (value: number) => string;
  widgetContext?: any;
}

interface AgendaItem {
  id: string;
  title: string;
  completed: boolean;
  visible: boolean;
  chapterKey: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
  present: boolean;
}

interface SessionDecision {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
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
    // Remove the line from notes
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

      // Trigger callback if defined
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
            className="p-2 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
            title="Tela Cheia"
          >
            <Maximize size={15} />
          </button>
          <button 
            onClick={() => {
              // Mark final chapter completed before summary
              const updated = [...agenda];
              const lastIdx = updated.findIndex(item => item.chapterKey === 'encerramento');
              if (lastIdx !== -1) updated[lastIdx].completed = true;
              setAgenda(updated);
              setShowSummaryModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black tracking-wider uppercase rounded-lg shadow-lg hover:shadow-emerald-950 transition-all flex items-center gap-1.5 border border-emerald-500/30"
          >
            <CheckCircle2 size={13} /> Encerrar Reunião
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. Agenda Inteligente Drawer / Sidebar (E1.2) */}
        <aside className="w-72 border-r border-slate-900 bg-slate-950/40 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/60">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <ClipboardList size={13} className="text-blue-400" /> ROTEIRO / CAPÍTULOS
            </span>
            <button 
              onClick={saveAgendaModel}
              className="p-1 text-[9px] font-bold text-slate-500 hover:text-slate-300 border border-slate-800 rounded hover:bg-slate-900 transition-all uppercase"
              title="Salvar modelo de agenda para este caso"
            >
              Salvar Modelo
            </button>
          </div>

          {/* Agenda Items List */}
          <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {agenda.map((item, idx) => {
              const isSelected = item.chapterKey === currentChapter.chapterKey;
              return (
                <div 
                  key={item.id}
                  className={`group flex flex-col rounded-xl border p-2.5 transition-all ${
                    isSelected 
                      ? 'bg-slate-900/90 border-blue-500/60 shadow-md' 
                      : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <button 
                      onClick={() => {
                        // Navigate to chapter (need to find index in visibleChapters)
                        const visIdx = visibleChapters.findIndex(c => c.chapterKey === item.chapterKey);
                        if (visIdx !== -1) {
                          setActiveChapterIndex(visIdx);
                        } else {
                          // If hidden, make visible first
                          const updated = agenda.map(a => a.id === item.id ? { ...a, visible: true } : a);
                          setAgenda(updated);
                          setTimeout(() => {
                            setActiveChapterIndex(updated.filter(a => a.visible).findIndex(c => c.chapterKey === item.chapterKey));
                          }, 50);
                        }
                      }}
                      className="flex-1 text-left flex items-center gap-2 cursor-pointer text-xs font-semibold"
                    >
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={(e) => {
                          e.stopPropagation();
                          setAgenda(prev => prev.map(a => a.id === item.id ? { ...a, completed: e.target.checked } : a));
                        }}
                        className="rounded border-slate-800 text-blue-600 bg-slate-900 focus:ring-0 cursor-pointer"
                      />
                      <span className={`${item.completed ? 'line-through text-slate-500' : isSelected ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                        {item.title}
                      </span>
                    </button>
                    
                    {/* Inline Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => moveAgendaItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-20"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button 
                        onClick={() => moveAgendaItem(idx, 'down')}
                        disabled={idx === agenda.length - 1}
                        className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-20"
                      >
                        <ArrowDown size={11} />
                      </button>
                      <button 
                        onClick={() => {
                          setAgenda(prev => prev.map(a => a.id === item.id ? { ...a, visible: !a.visible } : a));
                        }}
                        className="p-0.5 text-slate-500 hover:text-slate-300"
                      >
                        {item.visible ? <Eye size={11} /> : <EyeOff size={11} className="text-rose-500" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Custom Agenda Creator */}
            <div className="pt-4 border-t border-slate-900 space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Novo Capítulo Personalizado</label>
              <div className="flex gap-1">
                <input 
                  type="text" 
                  value={newCustomAgendaTitle}
                  onChange={e => setNewCustomAgendaTitle(e.target.value)}
                  placeholder="Ex: Alinhamento de Metas"
                  className="flex-1 bg-slate-900 border border-slate-850 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-600"
                />
                <button 
                  onClick={addCustomAgendaItem}
                  className="p-1 bg-blue-600 hover:bg-blue-500 rounded text-white flex items-center justify-center cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Footer inside Agenda */}
          <div className="p-4 border-t border-slate-900 bg-slate-950/60 space-y-1.5">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Metas Concluídas</span>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-500" 
                style={{ width: `${(completedObjectivesCount / agenda.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Progresso</span>
              <span>{Math.round((completedObjectivesCount / agenda.length) * 100)}%</span>
            </div>
          </div>
        </aside>

        {/* 3. Main Stage: Chapter Content & Visualizations (E1.3) */}
        <section className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
          
          {/* Active Chapter Presentation Window */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col justify-between custom-scrollbar">
            
            {/* Upper Info Header of slide */}
            <div className="flex justify-between items-start border-b border-slate-900 pb-4 mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 font-mono">Sessão Executiva • Capítulo Ativo</span>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">{currentChapter.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-2.5 py-1 rounded font-mono font-bold">
                  CAPÍTULO {activeChapterIndex + 1} DE {visibleChapters.length}
                </span>
                <button 
                  onClick={() => {
                    // Toggle current chapter completion
                    setAgenda(prev => prev.map(a => a.chapterKey === currentChapter.chapterKey ? { ...a, completed: !a.completed } : a));
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold border transition-all ${
                    currentChapter.completed 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Check size={11} /> {currentChapter.completed ? 'Concluído' : 'Concluir'}
                </button>
              </div>
            </div>

            {/* Dynamic Stage Render based on Chapter Key */}
            <div className="flex-1 flex flex-col justify-center py-4">
              {currentChapter.chapterKey === 'abertura' && (
                <div className="max-w-3xl mx-auto w-full space-y-6 text-center md:text-left">
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
                      COMITÊ EXECUTIVO DE OPERAÇÕES
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                      Análise estratégica do caso de consultoria e aprovação dos planos de ação táticos.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                    <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">CLIENTE PARCEIRO</span>
                      <p className="text-sm font-bold text-slate-200">{project.client}</p>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">SEGMENTO DE MERCADO</span>
                      <p className="text-sm font-bold text-blue-400">{project.segment || 'Automotivo'}</p>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">LÍDER CONSULTOR</span>
                      <p className="text-sm font-bold text-slate-200">Lennon Marcanjo</p>
                    </div>
                  </div>

                  {/* Meeting Mission / Ritual Objectives */}
                  <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Objetivos Centrais do Comitê</span>
                    <ul className="text-xs text-slate-300 space-y-2.5">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Validar desvios de receita e queda observada na margem operacional de seminovos.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Revisar estrutura de CMV, comissão de vendas e despesas corporativas correntes.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Aprovar as 5 ações táticas prioritárias no Plano de Ação Estratégico.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {currentChapter.chapterKey === 'receita' && (
                <div className="space-y-6 w-full max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                        <TrendingUp size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Receita Acumulada</span>
                        <p className="text-base font-black text-white">{formatCurrency(5400000)}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <Check size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Meta Consolidada</span>
                        <p className="text-base font-black text-white">{formatCurrency(5800000)}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                        <AlertTriangle size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Defasagem Operacional</span>
                        <p className="text-base font-black text-rose-400">- 6,90%</p>
                      </div>
                    </div>
                  </div>

                  {/* High Quality Visualization Chart */}
                  <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 h-72">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-4">Curva de Faturamento vs Meta Acumulada</span>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart data={chartDataRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                        <Line type="monotone" dataKey="Receita" stroke="#3b82f6" strokeWidth={3} name="Faturamento Real" />
                        <Line type="monotone" dataKey="Meta" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Meta Estabelecida" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {currentChapter.chapterKey === 'margem' && (
                <div className="space-y-6 w-full max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-center space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Margem Bruta Consolidada</span>
                        <h3 className="text-5xl font-black text-white font-mono">41.20%</h3>
                        <p className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <span>+ 1.5% vs Ciclo Anterior</span>
                        </p>
                      </div>
                      
                      <div className="space-y-2 border-t border-slate-850 pt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Venda de Veículos</span>
                          <span className="font-mono text-slate-200">12.5%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Oficina e Pós-Venda</span>
                          <span className="font-mono text-slate-200">52.3%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Acessórios & F&I</span>
                          <span className="font-mono text-slate-200">48.0%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase">
                          <ShieldAlert size={14} /> Alerta de Alavanca de Margem
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          A margem bruta de seminovos caiu 3.4 pontos percentuais devido ao excesso de descontos na venda cruzada. É necessário frear a comissão em modelos Nissan.
                        </p>
                      </div>

                      {/* Margin Progress Bar Indicators */}
                      <div className="bg-slate-900/30 border border-slate-900 p-4 rounded-xl space-y-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Atingimento de Margem Alvo</span>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span>Veículos Novos</span>
                              <span>92%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full" style={{ width: '92%' }} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span>Oficina Geral</span>
                              <span>105%</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentChapter.chapterKey === 'custos' && (
                <div className="space-y-6 w-full max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 h-72 flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-4">Composição Estrutural de Despesas</span>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartDataCosts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" stroke="#64748b" fontSize={9} />
                            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={90} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                              {chartDataCosts.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl flex flex-col justify-center space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Oportunidade de Saving</span>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">Eficiência CMV Logística</p>
                        <h4 className="text-3xl font-black text-emerald-400 font-mono">R$ 180.000</h4>
                        <p className="text-slate-300 text-xs">Identificada possibilidade de centralizar compras de suprimentos na matriz, obtendo 15% de desconto em lote fechado.</p>
                      </div>
                      
                      <div className="border-t border-slate-850 pt-4 text-xs text-slate-400 flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>Ação correspondente: Centralizar compras de autopeças de giro na matriz com Carlos Henrique.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentChapter.chapterKey === 'comercial' && (
                <div className="space-y-6 w-full max-w-4xl mx-auto">
                  <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-4">Leaderboard Comercial - Performance</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                            <th className="pb-2.5">Vendedor</th>
                            <th className="pb-2.5 text-right">Volume de Vendas</th>
                            <th className="pb-2.5 text-right">Atingimento Meta</th>
                            <th className="pb-2.5 text-right">Comissão Estimada</th>
                            <th className="pb-2.5 text-right">Morale / Prod</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-300">
                          <tr>
                            <td className="py-3 font-semibold text-white flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-blue-500 text-slate-950 font-black text-[9px] flex items-center justify-center">1º</span>
                              Carlos Santos
                            </td>
                            <td className="py-3 text-right font-mono">{formatCurrency(1250000)}</td>
                            <td className="py-3 text-right text-emerald-400 font-bold font-mono">104%</td>
                            <td className="py-3 text-right font-mono">{formatCurrency(18750)}</td>
                            <td className="py-3 text-right">
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded">Alto</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 font-semibold text-white flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-black text-[9px] flex items-center justify-center">2º</span>
                              Ana Paula Silva
                            </td>
                            <td className="py-3 text-right font-mono">{formatCurrency(980000)}</td>
                            <td className="py-3 text-right text-slate-300 font-mono">98%</td>
                            <td className="py-3 text-right font-mono">{formatCurrency(14700)}</td>
                            <td className="py-3 text-right">
                              <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase rounded">Médio</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 font-semibold text-white flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-black text-[9px] flex items-center justify-center">3º</span>
                              Roberto Melo
                            </td>
                            <td className="py-3 text-right font-mono">{formatCurrency(710000)}</td>
                            <td className="py-3 text-right text-rose-400 font-bold font-mono">71%</td>
                            <td className="py-3 text-right font-mono">{formatCurrency(10650)}</td>
                            <td className="py-3 text-right">
                              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase rounded">Crítico</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {currentChapter.chapterKey === 'pessoas' && (
                <div className="space-y-6 w-full max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Satisfação Geral do Time</span>
                      <h4 className="text-4xl font-black text-white font-mono">78%</h4>
                      <p className="text-[10px] text-emerald-400 font-bold">Excelente / Saudável</p>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Rotatividade (Turnover)</span>
                      <h4 className="text-4xl font-black text-white font-mono">4.1%</h4>
                      <p className="text-[10px] text-slate-400">Sob controle setorial</p>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-5 text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Produtividade Média</span>
                      <h4 className="text-4xl font-black text-white font-mono">R$ 48K</h4>
                      <p className="text-[10px] text-emerald-400 font-bold">+ 12% vs meta técnica</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-2xl space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Diagnóstico de Gestão de Equipes</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Identificada alta sobrecarga no pós-venda, impulsionada pelo crescimento na demanda de serviços da concessionária. A contratação emergencial de 2 técnicos mecânicos plenos é necessária para aliviar o gargalo.
                    </p>
                  </div>
                </div>
              )}

              {currentChapter.chapterKey === 'plano' && (
                <div className="space-y-6 w-full max-w-4xl mx-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Acompanhamento e Status das Ações</span>
                    <button 
                      onClick={() => setIsCreatingAction(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <Plus size={12} /> Nova Ação
                    </button>
                  </div>

                  {/* Active/Pending Action Plans List */}
                  <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                    {activePlans.length > 0 ? (
                      activePlans.map((plan) => (
                        <div key={plan.id} className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                plan.priority === 'high' 
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                  : plan.priority === 'medium'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}>
                                {plan.priority.toUpperCase()}
                              </span>
                              <p className="text-xs font-bold text-white leading-snug">{plan.description}</p>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                              <span>Responsável: <strong className="text-slate-300">{plan.responsible}</strong></span>
                              <span>Prazo: <strong className="text-slate-300">{plan.deadline}</strong></span>
                            </div>
                          </div>

                          {/* Quick status cycle toggle */}
                          <div className="flex items-center gap-2">
                            <select 
                              value={plan.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as any;
                                setActivePlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: newStatus } : p));
                              }}
                              className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[10px] font-bold text-slate-300 focus:outline-none"
                            >
                              <option value="pending">Pendente</option>
                              <option value="in-progress">Em Andamento</option>
                              <option value="completed">Concluído</option>
                            </select>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 border border-slate-900 border-dashed rounded-xl text-center text-slate-500 text-xs">
                        Nenhum plano de ação tático listado para este caso.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentChapter.chapterKey === 'encerramento' && (
                <div className="max-w-2xl mx-auto w-full space-y-6 text-center">
                  <div className="space-y-2">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Sessão Executiva Concluída</h2>
                    <p className="text-slate-400 text-sm max-w-lg mx-auto">
                      Todas as discussões de capítulos foram encerradas e as deliberações de pauta foram devidamente validadas pelo comitê.
                    </p>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl max-w-md mx-auto space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Assinatura Digital de Aprovação (Ata)</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Assine abaixo digitando o nome do representante legal do conselho para autenticar formalmente a ata de decisões:</p>
                    <input 
                      type="text" 
                      placeholder="Nome do Diretor / Proprietário"
                      defaultValue="Roberto de Arcanjo"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-center font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Handler for custom chapters added in running time */}
              {currentChapter.chapterKey.startsWith('custom_') && (
                <div className="max-w-xl mx-auto w-full text-center space-y-4">
                  <BookOpen size={48} className="text-blue-500 mx-auto" />
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">{currentChapter.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Tópico estratégico adicionado dinamicamente durante a sessão. Use as ferramentas de anotações inteligentes no painel direito para registrar observações, decisões deliberadas ou novos planos de ação específicos sobre este assunto.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Navigation of Story (E1.3) */}
            <div className="flex items-center justify-between border-t border-slate-900 pt-5 mt-6 shrink-0">
              <button 
                onClick={() => {
                  if (activeChapterIndex > 0) setActiveChapterIndex(activeChapterIndex - 1);
                }}
                disabled={activeChapterIndex === 0}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} /> Capítulo Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {visibleChapters.map((ch, idx) => (
                  <button 
                    key={ch.id}
                    onClick={() => setActiveChapterIndex(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === activeChapterIndex 
                        ? 'w-6 bg-blue-500' 
                        : ch.completed 
                          ? 'w-2.5 bg-emerald-500' 
                          : 'w-2.5 bg-slate-800 hover:bg-slate-700'
                    }`}
                    title={ch.title}
                  />
                ))}
              </div>

              <button 
                onClick={() => {
                  // Mark current completed before proceeding
                  const updated = [...agenda];
                  const curIdx = updated.findIndex(item => item.chapterKey === currentChapter.chapterKey);
                  if (curIdx !== -1) updated[curIdx].completed = true;
                  setAgenda(updated);

                  if (activeChapterIndex < visibleChapters.length - 1) {
                    setActiveChapterIndex(activeChapterIndex + 1);
                  } else {
                    setShowSummaryModal(true);
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black flex items-center gap-1 transition-all"
              >
                {activeChapterIndex === visibleChapters.length - 1 ? 'Concluir Reunião' : 'Próximo Capítulo'} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* 4. Smart Right Panel: Contextual Insights & Notes sync (E1.4 & E1.5) */}
        {isRightPanelOpen ? (
          <aside className="w-80 border-l border-slate-900 bg-slate-950/60 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            
            {/* Contextual Recommendation / Guidelines Header */}
            <div className="p-4 border-b border-slate-900 bg-slate-950/80">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5 mb-2">
                <Activity size={13} /> INSIGHT CONTEXTUAL DA PAUTA
              </span>

              {/* Conditional help description based on chapter */}
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                {currentChapter.chapterKey === 'abertura' && (
                  <span>Certifique-se de validar a presença de todos os stakeholders fundamentais antes de iniciar as discussões de números.</span>
                )}
                {currentChapter.chapterKey === 'receita' && (
                  <span>Foque em identificar quais filiais ou marcas da holding acumularam o maior desvio no ciclo corrente.</span>
                )}
                {currentChapter.chapterKey === 'margem' && (
                  <span>Explore a venda de acessórios de alto valor agregado como alavanca corretiva imediata para elevar a margem de veículos novos.</span>
                )}
                {currentChapter.chapterKey === 'custos' && (
                  <span>CMV e logística agregam 62% das despesas. Recomende a renegociação de prazos logísticos com transportadoras.</span>
                )}
                {currentChapter.chapterKey === 'comercial' && (
                  <span>Vendedores C e D continuam 18% abaixo do patamar de produtividade mínima. Alinhar reciclagem e treinamento técnico.</span>
                )}
                {currentChapter.chapterKey === 'pessoas' && (
                  <span>A satisfação geral caiu 2 p.p. no pós-venda. O estresse no atendimento precisa ser endereçado.</span>
                )}
                {currentChapter.chapterKey === 'plano' && (
                  <span>Revisar e reatribuir prazos de entregas vencidas. Cada ação concluída gera impacto positivo na pontuação de maturidade.</span>
                )}
                {currentChapter.chapterKey === 'encerramento' && (
                  <span>Revise as anotações geradas no Quick Notes Parser e as decisões aprovadas para exportação final da ata do comitê.</span>
                )}
                {currentChapter.chapterKey.startsWith('custom_') && (
                  <span>Pauta complementar sugerida. Mantenha os registros estruturados para alimentar a memória histórica do caso.</span>
                )}
              </div>
            </div>

            {/* Tab Accordion or Panels */}
            <div className="flex-1 p-4 space-y-5 overflow-y-auto custom-scrollbar">
              
              {/* Participant manager inside opening (Chapter Abertura) */}
              {currentChapter.chapterKey === 'abertura' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block flex items-center gap-1">
                    <Users size={12} className="text-blue-400" /> Presença e Comitê
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs bg-slate-900 px-2.5 py-1.5 rounded border border-slate-850">
                        <span className="font-semibold text-slate-200">{p.name} <strong className="text-[9px] text-slate-500 font-mono">({p.role})</strong></span>
                        <input 
                          type="checkbox" 
                          checked={p.present}
                          onChange={(e) => {
                            setParticipants(prev => prev.map(item => item.id === p.id ? { ...item, present: e.target.checked } : item));
                          }}
                          className="rounded border-slate-850 text-blue-600 bg-slate-950 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    <input 
                      type="text" 
                      placeholder="Nome do Stakeholder"
                      value={newParticipantName}
                      onChange={e => setNewParticipantName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      <input 
                        type="text" 
                        placeholder="Cargo (Diretor, Sócio, etc)"
                        value={newParticipantRole}
                        onChange={e => setNewParticipantRole(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                      />
                      <button 
                        onClick={addParticipant}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Notes Area with live conversion actions */}
              <div className="space-y-2 border-t border-slate-900 pt-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center justify-between">
                  <span>BLOCO DE NOTAS RÁPIDO</span>
                  <span className="text-[8px] font-mono text-slate-600">UMA LINHA POR ANOTAÇÃO</span>
                </label>
                <textarea 
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="Ex: João vai renegociar frete&#10;Reduzir margem de carros novos..."
                  className="w-full h-24 bg-slate-900 border border-slate-850 rounded-xl text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-600 font-mono resize-none leading-normal"
                />

                {/* Parsed note action converting triggers (E1.5) */}
                {parsedNotesLines.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-900 bg-slate-900/10 p-2.5 rounded-xl border border-slate-900">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Anotações Capturadas (Sincronizar)</span>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {parsedNotesLines.map(line => (
                        <div key={line.id} className="bg-slate-950 p-2 rounded border border-slate-850 space-y-2">
                          <p className="text-[11px] font-serif italic text-slate-300 leading-snug">"{line.text}"</p>
                          <div className="flex flex-wrap gap-1">
                            <button 
                              onClick={() => convertNoteToObservation(line.text)}
                              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[9px] font-black uppercase flex items-center gap-0.5"
                            >
                              💡 Obs
                            </button>
                            <button 
                              onClick={() => convertNoteToDecision(line.text)}
                              className="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded text-[9px] font-black uppercase flex items-center gap-0.5"
                            >
                              ⚖️ Decisão
                            </button>
                            <button 
                              onClick={() => convertNoteToActionForm(line.text)}
                              className="px-1.5 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-[9px] font-black uppercase flex items-center gap-0.5"
                            >
                              🔨 Ação
                            </button>
                            <button 
                              onClick={() => convertNoteToPending(line.text)}
                              className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-[9px] font-black uppercase flex items-center gap-0.5"
                            >
                              📌 Pend
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Action Plan Builder Form (E1.7) */}
              <div className="space-y-3 pt-4 border-t border-slate-900">
                <button 
                  onClick={() => setIsCreatingAction(!isCreatingAction)}
                  className="w-full py-1.5 bg-slate-900 border border-slate-850 text-slate-300 hover:text-white hover:bg-slate-850 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={12} /> {isCreatingAction ? 'Ocultar Formulário' : 'Novo Plano de Ação'}
                </button>

                {isCreatingAction && (
                  <form onSubmit={saveQuickActionPlan} className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 space-y-2.5">
                    <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider block">Cadastrar Nova Ação Tática</span>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Descrição da Ação</label>
                      <input 
                        type="text" 
                        value={actDescription}
                        onChange={e => setActDescription(e.target.value)}
                        placeholder="Ex: João vai renegociar frete"
                        required
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Responsável</label>
                        <input 
                          type="text" 
                          value={actResponsible}
                          onChange={e => setActResponsible(e.target.value)}
                          placeholder="Nome"
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Prazo / Limite</label>
                        <input 
                          type="text" 
                          value={actDeadline}
                          onChange={e => setActDeadline(e.target.value)}
                          placeholder="Data"
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Prioridade Estratégica</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['low', 'medium', 'high'] as const).map(p => (
                          <button 
                            key={p}
                            type="button"
                            onClick={() => setActPriority(p)}
                            className={`py-1 text-[9px] font-bold uppercase rounded border transition-all ${
                              actPriority === p 
                                ? 'bg-blue-600 text-white border-blue-500' 
                                : 'bg-slate-950 text-slate-400 border-slate-850'
                            }`}
                          >
                            {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow cursor-pointer transition-all"
                    >
                      Salvar Ação
                    </button>
                  </form>
                )}
              </div>

              {/* Live Decisions Logged Panel (E1.6) */}
              <div className="space-y-2 pt-4 border-t border-slate-900">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <CheckSquare size={12} className="text-amber-500" /> Decisões Aprovadas ({sessionDecisions.length})
                </span>
                <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                  {sessionDecisions.length > 0 ? (
                    sessionDecisions.map(d => (
                      <div key={d.id} className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg space-y-1">
                        <p className="text-[11px] font-bold text-slate-200 leading-snug">{d.description}</p>
                        <span className="text-[9px] text-slate-500 font-mono">Resp: {d.responsible}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-600 text-[10px] italic border border-dashed border-slate-900 rounded-lg">
                      Nenhuma decisão firmada ainda.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </aside>
        ) : null}

        {/* Right Collapsible Tab Handle */}
        <button 
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 bg-slate-900 hover:bg-slate-850 border border-slate-800 border-r-0 rounded-l-md flex items-center justify-center text-slate-500 hover:text-slate-300 z-10 cursor-pointer"
        >
          {isRightPanelOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 5. FULL-SCREEN SUMMARY REPORT MODAL / PRINT PREVIEW (E1.8 & E1.9) */}
      {/* ========================================================================= */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in overflow-y-auto select-text">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest font-mono">REUNIÃO ENCONTRANDO DESFECHO</span>
                <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
                  <FileText size={18} className="text-emerald-500" /> RESUMO EXECUTIVO DA REUNIÃO
                </h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAtaPrintView(!isAtaPrintView)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} /> {isAtaPrintView ? 'Fechar Impressão' : 'Visualizar Ata'}
                </button>
                <button 
                  onClick={() => setShowSummaryModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
              
              {isAtaPrintView ? (
                /* Print Preview Mode with elegant printable stylesheet */
                <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-inner space-y-6 font-serif max-w-2xl mx-auto border border-slate-300" id="printable-ata-area">
                  <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight font-sans">ATA DE REUNIÃO DE CONSELHO EXECUTIVO</h2>
                    <p className="text-xs uppercase font-mono tracking-widest text-slate-500">Sauron OS Consultant Core Platform</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans pb-4 border-b border-slate-200">
                    <div>
                      <p><strong>Caso:</strong> {project.client}</p>
                      <p><strong>Grupo:</strong> {project.group}</p>
                      <p><strong>Segmento:</strong> {project.segment}</p>
                    </div>
                    <div>
                      <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                      <p><strong>Duração Registrada:</strong> {formatTime(timerSeconds)}</p>
                      <p><strong>Consultor:</strong> Lennon Marcanjo</p>
                    </div>
                  </div>

                  {/* Present Stakeholders */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-wider font-sans border-b border-slate-200 pb-1 text-slate-800">1. Participantes Presentes</h4>
                    <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
                      {participants.filter(p => p.present).map(p => (
                        <li key={p.id}><strong>{p.name}</strong> — {p.role}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Deliberations & Decisions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-wider font-sans border-b border-slate-200 pb-1 text-slate-800">2. Decisões Estratégicas Tomadas</h4>
                    {sessionDecisions.length > 0 ? (
                      <ol className="list-decimal pl-5 text-xs space-y-2 text-slate-700">
                        {sessionDecisions.map(d => (
                          <li key={d.id}><strong>{d.description}</strong> <span className="text-[10px] font-sans text-slate-500 font-bold">(Deliberado pelo comitê executivo)</span></li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs italic text-slate-500">Nenhuma decisão formal registrada.</p>
                    )}
                  </div>

                  {/* New Actions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-wider font-sans border-b border-slate-200 pb-1 text-slate-800">3. Novos Planos de Ação táticos</h4>
                    {newActionPlans.length > 0 ? (
                      <div className="space-y-2">
                        {newActionPlans.map((a, idx) => (
                          <div key={a.id} className="text-xs text-slate-700">
                            <p><strong>3.{idx + 1}. {a.description}</strong></p>
                            <p className="text-[10px] font-sans text-slate-500 pl-3">Responsável: {a.responsible} | Prazo Alvo: {a.deadline} | Prioridade: {a.priority.toUpperCase()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-500">Nenhum plano de ação de negócio desenhado.</p>
                    )}
                  </div>

                  {/* Technical Indicators Reviewed */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-wider font-sans border-b border-slate-200 pb-1 text-slate-800">4. Indicadores e Capítulos Vistos</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      O comitê executivo declara ter analisado com critério profissional e de alta governança corporativa os seguintes tópicos e indicadores chaves durante a reunião: 
                      {visibleChapters.filter(c => c.completed).map(c => c.title).join(', ') || 'Nenhum indicador concluído'}.
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                    <div className="space-y-1">
                      <div className="border-b border-slate-400 mx-auto w-3/4 h-5" />
                      <p className="font-bold text-slate-700">Lennon Marcanjo</p>
                      <p className="text-[10px] text-slate-500">Sauron OS Consulting</p>
                    </div>
                    <div className="space-y-1">
                      <div className="border-b border-slate-400 mx-auto w-3/4 h-5" />
                      <p className="font-bold text-slate-700">Representante do Conselho</p>
                      <p className="text-[10px] text-slate-500">Assinatura do Cliente</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Interactive Layout Summary View */
                <div className="space-y-6">
                  
                  {/* General Stats and Timer */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Tempo de Reunião</span>
                      <p className="text-2xl font-black text-white font-mono">{formatTime(timerSeconds)}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Presentes</span>
                      <p className="text-2xl font-black text-emerald-400 font-mono">
                        {participants.filter(p => p.present).length} de {participants.length}
                      </p>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Decisões Aprovadas</span>
                      <p className="text-2xl font-black text-amber-500 font-mono">{sessionDecisions.length}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Ações Criadas</span>
                      <p className="text-2xl font-black text-blue-400 font-mono">{newActionPlans.length}</p>
                    </div>
                  </div>

                  {/* Split Lists of outputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Decisions taking block */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block flex items-center gap-1.5">
                        <CheckSquare size={13} className="text-amber-500" /> Decisões Estabelecidas
                      </span>
                      <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                        {sessionDecisions.length > 0 ? (
                          sessionDecisions.map((d, i) => (
                            <div key={d.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
                              <p className="text-xs font-semibold text-slate-200 leading-normal">{i + 1}. {d.description}</p>
                              <span className="text-[9px] text-slate-500 font-mono">Aprovado de forma unânime</span>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-600 text-xs italic">Nenhuma decisão formal firmada nesta sessão.</div>
                        )}
                      </div>
                    </div>

                    {/* Action plans created block */}
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block flex items-center gap-1.5">
                        <Activity size={13} className="text-blue-400" /> Novos Planos de Ação Criados
                      </span>
                      <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                        {newActionPlans.length > 0 ? (
                          newActionPlans.map((a, i) => (
                            <div key={a.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1.5">
                              <p className="text-xs font-semibold text-slate-200 leading-normal">{i + 1}. {a.description}</p>
                              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                <span>Resp: {a.responsible}</span>
                                <span>Prazo: {a.deadline}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-600 text-xs italic">Nenhum plano de ação desenhado nesta sessão.</div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Observations list */}
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Observações do Caso permanentemente registradas</span>
                    <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                      {sessionObservations.length > 0 ? (
                        sessionObservations.map((o, i) => (
                          <p key={i} className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2 rounded-xl border border-slate-850/60">- {o}</p>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-6">Nenhuma observação isolada registrada.</p>
                      )}
                    </div>
                  </div>

                  {/* Pending items */}
                  {sessionPendingItems.length > 0 && (
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-3">
                      <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block">Pendências Corporativas Mapeadas</span>
                      <div className="space-y-1.5">
                        {sessionPendingItems.map((p, idx) => (
                          <div key={idx} className="text-xs text-slate-300 bg-rose-500/5 p-2 rounded-xl border border-rose-500/10 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <button 
                onClick={exportAtaAsTextFile}
                className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={13} /> Exportar Arquivo de Texto (Ata)
              </button>

              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setShowSummaryModal(false)}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleFinalizeSession}
                  disabled={isSyncing}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-55"
                >
                  {isSyncing ? 'Sincronizando Base...' : 'Sincronizar e Concluir'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
