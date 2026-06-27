import React, { useState } from 'react';
import { 
  Users, Database, Presentation, MonitorPlay, Settings, Briefcase, FolderOpen,
  ShieldCheck, BarChart3, Target, Award, FileText, BrainCircuit, Calculator,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Network, ShieldAlert,
  ClipboardList, CheckCircle2, History, Shield, HelpCircle, Activity, Key, CheckSquare, Layers, Lock
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (p: string) => void;
  activeIndustryTemplateId?: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (v: boolean) => void;
  userRole?: string;
}

export const AppSidebar: React.FC<SidebarProps> = ({ 
  activePage, 
  setActivePage, 
  activeIndustryTemplateId = "automotive",
  isMobileOpen,
  setIsMobileOpen,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  userRole = "Super Admin"
}) => {
  const isAutomotive = activeIndustryTemplateId === "automotive";

  // Accordion states for the 9 premium flow groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    centro_comando: true,
    conhecer_cliente: true,
    conectar_dados: false,
    diagnosticar_negocio: false,
    preparar_decisao: false,
    conduzir_sessao: false,
    executar_plano: false,
    evoluir_resultado: false,
    administracao: false
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Helper to determine if user role has access to a group
  const hasGroupAccess = (groupKey: string): boolean => {
    const role = userRole || "Super Admin";
    const isAdmin = ["Super Admin", "Consultant Admin", "Consultant"].includes(role);
    
    if (isAdmin) return true;
    
    if (role === "Client Director" || role === "Controller") {
      return ["centro_comando", "conhecer_cliente", "diagnosticar_negocio", "preparar_decisao", "conduzir_sessao", "executar_plano", "evoluir_resultado"].includes(groupKey);
    }
    if (role === "Client Manager") {
      return ["centro_comando", "diagnosticar_negocio", "conduzir_sessao", "executar_plano", "evoluir_resultado"].includes(groupKey);
    }
    if (role === "Financial User") {
      return ["centro_comando", "diagnosticar_negocio", "conduzir_sessao", "evoluir_resultado"].includes(groupKey);
    }
    if (role === "Auditor") {
      return ["centro_comando", "conhecer_cliente", "conectar_dados", "diagnosticar_negocio", "evoluir_resultado", "administracao"].includes(groupKey);
    }
    if (role === "Guest" || role === "Viewer") {
      return ["centro_comando", "diagnosticar_negocio"].includes(groupKey);
    }
    return true;
  };

  // Helper to determine if user role has access to a sub-item
  const hasSubItemAccess = (groupKey: string, subId: string): boolean => {
    const role = userRole || "Super Admin";
    const isAdmin = ["Super Admin", "Consultant Admin", "Consultant"].includes(role);
    
    if (isAdmin) return true;

    // Auditor has read-only access to specific sub-items
    if (role === "Auditor") {
      if (groupKey === "conhecer_cliente") return ["digital_twin", "area_consultor"].includes(subId);
      if (groupKey === "conectar_dados") return ["importacao", "banco_connector", "vpn_gateway"].includes(subId);
      if (groupKey === "diagnosticar_negocio") return ["resumo", "dre_inteligente", "obstaculos"].includes(subId);
      if (groupKey === "evoluir_resultado") return ["historico_executivo", "resultados_consolidados"].includes(subId);
      if (groupKey === "administracao") return ["auditoria_logs", "admin_lgpd"].includes(subId);
      return false;
    }

    if (role === "Client Director" || role === "Controller") {
      if (groupKey === "conhecer_cliente") return ["digital_twin", "area_consultor"].includes(subId);
      if (groupKey === "diagnosticar_negocio") return ["resumo", "dre_inteligente", "obstaculos", "modelo_consultivo", "comercial", "financeiro", "relatorios"].includes(subId);
      if (groupKey === "preparar_decisao") return ["apresentacoes", "apresentacoes_templates", "consultor_ia_decision"].includes(subId);
      if (groupKey === "conduzir_sessao") return true;
      if (groupKey === "executar_plano") return true;
      if (groupKey === "evoluir_resultado") return true;
      return false;
    }

    if (role === "Client Manager") {
      if (groupKey === "diagnosticar_negocio") return ["resumo", "obstaculos", "comercial"].includes(subId);
      if (groupKey === "conduzir_sessao") return ["modo_reuniao", "reuniao_decisoes"].includes(subId);
      if (groupKey === "executar_plano") return ["plano_executivo", "plano_prazos", "plano_pendencias"].includes(subId);
      if (groupKey === "evoluir_resultado") return ["resultados_consolidados", "comissoes"].includes(subId);
      return false;
    }

    if (role === "Financial User") {
      if (groupKey === "diagnosticar_negocio") return ["resumo", "dre_inteligente", "financeiro"].includes(subId);
      if (groupKey === "conduzir_sessao") return ["modo_reuniao"].includes(subId);
      if (groupKey === "evoluir_resultado") return ["fechamento_mensal", "comissoes"].includes(subId);
      return false;
    }

    if (role === "Guest" || role === "Viewer") {
      if (groupKey === "centro_comando") return ["executive_workspace"].includes(subId);
      if (groupKey === "diagnosticar_negocio") return ["resumo"].includes(subId);
      return false;
    }

    return true;
  };

  // Structured menu matching the 9 flows of consulting
  const consultingFlowStructure = getConsultingFlowStructure(isAutomotive);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-50 transition-all duration-300 ${
        isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
      } ${isDesktopCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        
        {/* Header Area */}
        <div className="p-4 flex flex-row items-center justify-between border-b border-slate-800 shrink-0 h-[68px]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              S
            </div>
            {!isDesktopCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="font-extrabold text-white text-sm tracking-tight">Sauron OS</span>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Consulting OS</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {isDesktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar overflow-x-hidden px-2.5 space-y-3">
          {consultingFlowStructure.map((group) => {
            if (!hasGroupAccess(group.groupKey)) return null;

            const isExpanded = expandedGroups[group.groupKey];
            const visibleSubItems = group.subItems.filter(item => hasSubItemAccess(group.groupKey, item.id));

            if (visibleSubItems.length === 0) return null;

            return (
              <div key={group.groupKey} className="flex flex-col">
                {/* Group Title Accordion Header */}
                {!isDesktopCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.groupKey)}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-300 select-none cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <group.icon size={12} className="text-slate-500" />
                      <span>{group.title}</span>
                    </div>
                    <div>
                      {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </div>
                  </button>
                ) : (
                  <div className="w-full flex justify-center py-2 border-b border-slate-800/40" title={group.title}>
                    <group.icon size={16} className="text-slate-400" />
                  </div>
                )}

                {/* Group Items */}
                {(!isDesktopCollapsed && isExpanded) ? (
                  <ul className="mt-1 pl-2 space-y-0.5 border-l border-slate-800/60 ml-2 animate-fade-in">
                    {visibleSubItems.map((sub) => {
                      const isItemActive = activePage === sub.id || 
                        (sub.id === "apresentacoes_deck" && activePage === "apresentacoes") ||
                        (sub.id === "narrativa_executiva" && activePage === "apresentacoes") ||
                        (sub.id === "story_builder" && activePage === "apresentacoes") ||
                        (sub.id === "apresentacoes_templates" && activePage === "apresentacoes") ||
                        (sub.id === "consultor_ia_decision" && activePage === "consultor_ia") ||
                        (sub.id === "banco_connector" && activePage === "importacao") ||
                        (sub.id === "etl_pipeline" && activePage === "importacao") ||
                        (sub.id === "sincronizacao" && activePage === "importacao") ||
                        (sub.id === "fonte_ativa" && activePage === "importacao") ||
                        (sub.id === "validacao_dados" && activePage === "importacao") ||
                        (sub.id === "apis_feed" && activePage === "importacao") ||
                        (sub.id === "reuniao_ata" && activePage === "modo_reuniao") ||
                        (sub.id === "reuniao_decisoes" && activePage === "modo_reuniao") ||
                        (sub.id === "reuniao_perguntas" && activePage === "modo_reuniao") ||
                        (sub.id === "reuniao_notas" && activePage === "modo_reuniao") ||
                        (sub.id === "plano_executivo" && activePage === "area_consultor") ||
                        (sub.id === "plano_responsaveis" && activePage === "area_consultor") ||
                        (sub.id === "plano_prazos" && activePage === "area_consultor") ||
                        (sub.id === "plano_followup" && activePage === "area_consultor") ||
                        (sub.id === "plano_pendencias" && activePage === "area_consultor") ||
                        (sub.id === "historico_executivo" && activePage === "relatorios") ||
                        (sub.id === "resultados_consolidados" && activePage === "resumo") ||
                        (sub.id === "comparativos_mensais" && activePage === "resumo") ||
                        (sub.id === "auditoria_logs" && activePage === "perfis") ||
                        (sub.id === "admin_flags" && activePage === "perfis") ||
                        (sub.id === "admin_security" && activePage === "perfis") ||
                        (sub.id === "admin_lgpd" && activePage === "perfis") ||
                        (sub.id === "usuarios_twin" && activePage === "perfis") ||
                        (sub.id === "permissoes_twin" && activePage === "perfis") ||
                        (sub.id === "admin_invites" && activePage === "perfis") ||
                        (sub.id === "admin_shares" && activePage === "perfis") ||
                        (sub.id === "organizacao_twin" && activePage === "perfis");

                      return (
                        <li key={sub.id}>
                          <button
                            onClick={() => {
                              setActivePage(sub.id);
                              if (window.innerWidth < 1024) setIsMobileOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                              isItemActive 
                                ? "bg-blue-600/15 text-blue-400 font-extrabold border-l-2 border-blue-500 pl-2" 
                                : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <sub.icon size={13} className="shrink-0" />
                            <span className="truncate">{sub.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : isDesktopCollapsed && (
                  <ul className="mt-1 space-y-1 flex flex-col items-center">
                    {visibleSubItems.map((sub) => {
                      const isItemActive = activePage === sub.id;
                      return (
                        <li key={sub.id} className="w-full">
                          <button
                            onClick={() => {
                              setActivePage(sub.id);
                            }}
                            title={sub.title}
                            className={`w-full flex justify-center py-2 rounded-lg transition-colors cursor-pointer ${
                              isItemActive 
                                ? "bg-blue-600/20 text-blue-400" 
                                : "hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <sub.icon size={16} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        
        {!isDesktopCollapsed && (
          <div className="p-4 border-t border-slate-800 text-center shrink-0">
            <span className="text-[9px] font-mono text-slate-600 tracking-wider">SAURON OS v0.6.8</span>
          </div>
        )}
      </aside>
    </>
  );
};

// Structured menu matching the 9 flows of consulting
export const getConsultingFlowStructure = (isAutomotive: boolean) => [
  {
    groupKey: "centro_comando",
    title: "Centro de Comando",
    icon: Briefcase,
    subItems: [
      { title: "Centro de Comando", id: "executive_workspace", icon: Briefcase }
    ]
  },
  {
    groupKey: "conhecer_cliente",
    title: "Conhecer Cliente",
    icon: Users,
    subItems: [
      { title: "Gêmeo Digital", id: "digital_twin", icon: Network },
      { title: "Projetos de Consultoria", id: "area_consultor", icon: FolderOpen }
    ]
  },
  {
    groupKey: "conectar_dados",
    title: "Conectar Dados",
    icon: Database,
    subItems: [
      { title: "Central de Dados", id: "importacao", icon: FileText },
      { title: "Banco de Dados", id: "banco_connector", icon: Database },
      { title: "VPN", id: "vpn_gateway", icon: ShieldAlert },
      { title: "APIs", id: "apis_feed", icon: Activity },
      { title: "LGPD", id: "admin_lgpd", icon: ShieldCheck },
      { title: "Sincronização", id: "sincronizacao", icon: History },
      { title: "Fonte Ativa", id: "fonte_ativa", icon: Users },
      { title: "Validação", id: "validacao_dados", icon: CheckCircle2 }
    ]
  },
  {
    groupKey: "diagnosticar_negocio",
    title: "Diagnosticar Negócio",
    icon: Target,
    subItems: [
      { title: "Diagnóstico Executivo", id: "resumo", icon: BarChart3 },
      { title: "KPIs Comerciais", id: "comercial", icon: Target },
      ...(isAutomotive ? [
        { title: "KPIs Pós-Vendas", id: "posvendas", icon: Target },
        { title: "Peças & Acessórios", id: "pecas", icon: Target },
        { title: "Gestão de Estoque", id: "estoque", icon: Target }
      ] : []),
      { title: "KPIs Financeiros", id: "financeiro", icon: Calculator },
      { title: "DRE Inteligente", id: "dre_inteligente", icon: Calculator },
      { title: "Benchmarks Industriais", id: "modelo_consultivo", icon: Award },
      { title: "Diagnóstico de Anomalias", id: "obstaculos", icon: ShieldAlert },
      { title: "Recomendações de IA", id: "consultor_ia", icon: BrainCircuit },
      { title: "Dossiês Executivos", id: "relatorios", icon: FileText }
    ]
  },
  {
    groupKey: "preparar_decisao",
    title: "Preparar Decisão",
    icon: Presentation,
    subItems: [
      { title: "Narrativa Executiva", id: "narrativa_executiva", icon: FileText },
      { title: "Deck de Apresentações", id: "apresentacoes", icon: Presentation },
      { title: "Story Builder", id: "story_builder", icon: Layers },
      { title: "Templates de Decks", id: "apresentacoes_templates", icon: Layers },
      { title: "Insights Selecionados", id: "consultor_ia_decision", icon: BrainCircuit }
    ]
  },
  {
    groupKey: "conduzir_sessao",
    title: "Conduzir Sessão",
    icon: MonitorPlay,
    subItems: [
      { title: "Sessão Executiva", id: "modo_reuniao", icon: MonitorPlay },
      { title: "Ata da Reunião", id: "reuniao_ata", icon: ClipboardList },
      { title: "Decisões Estratégicas", id: "reuniao_decisoes", icon: CheckCircle2 },
      { title: "Perguntas de Negócio", id: "reuniao_perguntas", icon: HelpCircle },
      { title: "Notas e Transcrições", id: "reuniao_notas", icon: FileText }
    ]
  },
  {
    groupKey: "executar_plano",
    title: "Executar Plano",
    icon: CheckSquare,
    subItems: [
      { title: "Plano Executivo", id: "plano_executivo", icon: CheckSquare },
      { title: "Responsáveis", id: "plano_responsaveis", icon: Users },
      { title: "Prazos e Metas", id: "plano_prazos", icon: History },
      { title: "Pendências de Caixa", id: "plano_pendencias", icon: ShieldAlert },
      { title: "Follow-up Semanal", id: "plano_followup", icon: Activity }
    ]
  },
  {
    groupKey: "evoluir_resultado",
    title: "Evoluir Resultado",
    icon: History,
    subItems: [
      { title: "Histórico Executivo", id: "historico_executivo", icon: History },
      { title: "Resultados Consolidados", id: "resultados_consolidados", icon: BarChart3 },
      { title: "Comparativos Mensais", id: "comparativos_mensais", icon: Layers },
      { title: "Evolução Mensal", id: "fechamento_mensal", icon: Calculator },
      { title: "People Intelligence", id: "comissoes", icon: Users }
    ]
  },
  {
    groupKey: "administracao",
    title: "Administração",
    icon: Settings,
    subItems: [
      { title: "Usuários", id: "usuarios_twin", icon: Users },
      { title: "Organizações", id: "organizacao_twin", icon: ShieldCheck },
      { title: "Permissões", id: "permissoes_twin", icon: Key },
      { title: "Convites", id: "admin_invites", icon: FileText },
      { title: "Compartilhamentos", id: "admin_shares", icon: Layers },
      { title: "Configurações", id: "perfis", icon: Settings },
      { title: "Auditoria", id: "auditoria_logs", icon: History },
      { title: "Segurança", id: "admin_security", icon: Lock }
    ]
  }
];
