import React, { useState } from 'react';
import { 
  BarChart3, Database, Presentation, MonitorPlay, Users, Store, Tag, Calculator, Target,
  FileText, Award, BookMarked, ShieldAlert, Settings, BrainCircuit, ChevronRight, ChevronLeft, Menu,
  Briefcase, FolderOpen, Network, ChevronDown, ChevronUp
} from 'lucide-react';

export const AppSidebar = ({ 
  activePage, 
  setActivePage, 
  activeIndustryTemplateId = "automotive",
  isMobileOpen,
  setIsMobileOpen,
  isDesktopCollapsed,
  setIsDesktopCollapsed
}: { 
  activePage: string, 
  setActivePage: (p: string) => void, 
  activeIndustryTemplateId?: string,
  isMobileOpen: boolean,
  setIsMobileOpen: (v: boolean) => void,
  isDesktopCollapsed: boolean,
  setIsDesktopCollapsed: (v: boolean) => void
}) => {
  const isAutomotive = activeIndustryTemplateId === "automotive";

  // Accordion states for sub-groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    dados: false,
    analytics: false
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Structured menu matching the 7 premium large areas
  const menuStructure = [
    { 
      title: "Workspace", 
      id: "executive_workspace", 
      icon: Briefcase 
    },
    { 
      title: "Dados", 
      id: "importacao", 
      icon: Database,
      groupKey: "dados",
      subItems: [
        { title: "Central de Ingestão", id: "importacao", icon: Database },
        { title: "VPN Gateway", id: "vpn_gateway", icon: ShieldAlert },
        { title: "Contábil & Filiais", id: "contabil", icon: Database }
      ]
    },
    { 
      title: "Analytics", 
      id: "resumo", 
      icon: BarChart3,
      groupKey: "analytics",
      subItems: [
        { title: "Executive Overview", id: "resumo", icon: BarChart3 },
        { title: "DRE Inteligente", id: "dre_inteligente", icon: Calculator },
        { title: "Fechamento Mensal", id: "fechamento_mensal", icon: Calculator },
        { title: "Comercial e Vendas", id: "comercial", icon: Store },
        { title: "Performance Vendedores", id: "vendedores", icon: Users },
        { title: "Comissões", id: "comissoes", icon: Calculator },
        { title: "Modelo Consultivo", id: "modelo_consultivo", icon: FileText },
        { title: "Sauron OS AI", id: "consultor_ia", icon: BrainCircuit },
        { title: "Obstáculos", id: "obstaculos", icon: ShieldAlert },
        ...(isAutomotive ? [
          { title: "Pós-Vendas (Oficina)", id: "posvendas", icon: Target },
          { title: "Peças & Acessórios", id: "pecas", icon: Target },
          { title: "Gestão de Estoque", id: "estoque", icon: Target }
        ] : []),
        { title: "Financeiro & Tesouraria", id: "financeiro", icon: Calculator }
      ]
    },
    { 
      title: "Apresentações", 
      id: "apresentacoes", 
      icon: Presentation 
    },
    { 
      title: "Reuniões", 
      id: "modo_reuniao", 
      icon: MonitorPlay 
    },
    { 
      title: "Projetos", 
      id: "area_consultor", 
      icon: FolderOpen 
    },
    { 
      title: "Configurações", 
      id: "perfis", 
      icon: Settings 
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
                <span className="font-bold text-white text-sm tracking-tight">Sauron OS</span>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Consulting OS</span>
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
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar overflow-x-hidden px-2.5">
          <ul className="space-y-1">
            {menuStructure.map((item) => {
              const hasSubItems = !!item.subItems;
              const isExpanded = !!(item.groupKey && expandedGroups[item.groupKey]);
              
              // Highlight if current active tab matches the item or any of its sub-items
              const isPageActive = activePage === item.id || (item.subItems?.some(s => s.id === activePage));

              return (
                <li key={item.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center w-full">
                    <button
                      onClick={() => {
                        setActivePage(item.id);
                        if (item.groupKey) {
                          toggleGroup(item.groupKey);
                        }
                        if (window.innerWidth < 1024) setIsMobileOpen(false);
                      }}
                      title={isDesktopCollapsed ? item.title : undefined}
                      className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-all ${
                        isPageActive
                          ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-black"
                          : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon size={isDesktopCollapsed ? 18 : 15} className="shrink-0" />
                        {!isDesktopCollapsed && <span>{item.title}</span>}
                      </div>

                      {!isDesktopCollapsed && hasSubItems && (
                        <div className="text-slate-500 hover:text-slate-300">
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Render Accordion Sub-items */}
                  {!isDesktopCollapsed && hasSubItems && isExpanded && (
                    <ul className="mt-1 pl-6 space-y-1 border-l border-slate-800 ml-5 animate-fade-in">
                      {item.subItems.map((sub) => (
                        <li key={sub.id}>
                          <button
                            onClick={() => {
                              setActivePage(sub.id);
                              if (window.innerWidth < 1024) setIsMobileOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                              activePage === sub.id 
                                ? "text-blue-400 font-extrabold" 
                                : "hover:text-slate-200 text-slate-500"
                            }`}
                          >
                            <sub.icon size={11} className="shrink-0" />
                            <span>{sub.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        
        {!isDesktopCollapsed && (
          <div className="p-4 border-t border-slate-800 text-center shrink-0">
            <span className="text-[9px] font-mono text-slate-600 tracking-wider">SAURON v2.0.0-rc1</span>
          </div>
        )}
      </aside>
    </>
  );
};
